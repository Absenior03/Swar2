import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
from tree_sitter import Language, Parser
import os

# --- Tree-sitter Language Setup ---
LANG_LIB_PATH = os.path.join(os.path.dirname(__file__), 'build', 'languages.so')
GO_LANGUAGE = Language(LANG_LIB_PATH, 'go')
JS_LANGUAGE = Language(LANG_LIB_PATH, 'javascript')

# --- FastAPI App Initialization ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# --- Model Loading ---
model_pipeline = joblib.load('model.joblib')

# --- Pydantic Models ---
class Code(BaseModel):
    code: str

# --- Helper Functions ---
def get_parser(code: str) -> Parser | None:
    parser = Parser()
    # Simple language detection based on keywords
    if 'func main' in code or 'package main' in code or 'fmt.' in code:
        parser.set_language(GO_LANGUAGE)
    else:
        # Default to JavaScript
        parser.set_language(JS_LANGUAGE)
    return parser

async def walk_tree(cursor, websocket: WebSocket):
    """
    Recursively walks the syntax tree and sends node info.
    **MODIFIED to NOT halt on error.**
    """
    nodes_to_visit = [(cursor.node, 0)]
    max_depth = 100 
    
    while nodes_to_visit:
        node, depth = nodes_to_visit.pop(0)

        if depth > max_depth:
            continue
            
        node_type = "syntax_error" if node.type == 'ERROR' or node.is_missing else node.type

        await websocket.send_json({
            "type": node_type,
            "startLine": node.start_point[0] + 1,
            "endLine": node.end_point[0] + 1
        })
        
        # **LOGIC CHANGE**: We no longer stop the traversal when an error is found.
        # This allows the frontend to receive all nodes, both valid and invalid.

        for child in reversed(node.children):
            nodes_to_visit.insert(0, (child, depth + 1))
        
        await asyncio.sleep(0.005)

# --- API Endpoints ---
@app.post("/classify")
async def classify_code(code: Code):
    prediction = model_pipeline.predict([code.code])
    probabilities = model_pipeline.predict_proba([code.code])
    confidence = probabilities.max()
    return {"genre": prediction[0], "confidence": confidence}

@app.websocket("/ws/visualizer")
async def websocket_visualizer(websocket: WebSocket):
    await websocket.accept()
    print("INFO:     connection open")
    try:
        data = await websocket.receive_json()
        code_text = data.get('code', '')
        
        parser = get_parser(code_text)
        if not parser:
            await websocket.send_json({"error": "Language not supported"})
            return
            
        tree = parser.parse(bytes(code_text, "utf8"))
        cursor = tree.walk()
        await walk_tree(cursor, websocket)

    except WebSocketDisconnect:
        print("INFO:     connection closed")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if websocket.client_state.name != 'DISCONNECTED':
            await websocket.close()
        print("INFO:     connection closed")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
