import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
from tree_sitter import Language, Parser
import os
from code_analyzer import CodeAnalyzer

# --- Tree-sitter Language Setup ---
# The pre-compiled library for Go and JavaScript grammars.
# This is created when the environment is set up.
LANG_LIB_PATH = os.path.join(os.path.dirname(__file__), 'build', 'languages.so')
GO_LANGUAGE = Language(LANG_LIB_PATH, 'go')
JS_LANGUAGE = Language(LANG_LIB_PATH, 'javascript')

# --- FastAPI App Initialization ---
app = FastAPI()

# Allow all origins for development purposes (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Model Loading ---
# Load the pre-trained scikit-learn model on startup.
model_pipeline = joblib.load('model.joblib')

# --- Pydantic Models for API Data Validation ---
class Code(BaseModel):
    code: str

# --- Helper Functions ---
def get_parser(code: str) -> tuple[Parser, str]:
    """Detects the language and returns the appropriate Tree-sitter parser and language identifier."""
    parser = Parser()
    # Simple heuristic to guess the language.
    if 'func main' in code or 'package main' in code or 'fmt.' in code:
        parser.set_language(GO_LANGUAGE)
        return parser, 'go'
    else:
        # Default to JavaScript if Go is not detected
        parser.set_language(JS_LANGUAGE)
        return parser, 'javascript'

async def walk_tree(cursor, websocket: WebSocket):
    """Recursively walks the syntax tree and sends node info over the WebSocket."""
    # This ensures we don't get stuck in an infinite loop on huge files
    max_depth = 100 
    
    nodes_to_visit = [(cursor.node, 0)]
    
    while nodes_to_visit:
        node, depth = nodes_to_visit.pop(0)

        if depth > max_depth:
            continue
            
        # **CRITICAL CHANGE**: Send node type AND line numbers
        await websocket.send_json({
            "type": node.type,
            "startLine": node.start_point[0] + 1, # Use 1-based indexing for lines
            "endLine": node.end_point[0] + 1
        })
        
        # Add children to the list to be visited
        for child in reversed(node.children):
            nodes_to_visit.insert(0, (child, depth + 1))
        
        await asyncio.sleep(0.005) # Small delay to prevent blocking

# --- API Endpoints ---
@app.post("/classify")
async def classify_code(code: Code):
    """Receives code and returns a predicted genre using the ML model."""
    prediction = model_pipeline.predict([code.code])
    probabilities = model_pipeline.predict_proba([code.code])
    confidence = probabilities.max()
    return {"genre": prediction[0], "confidence": confidence}

@app.websocket("/ws/visualizer")
async def websocket_visualizer(websocket: WebSocket):
    """Handles real-time code parsing and streams syntax tree nodes and error information."""
    await websocket.accept()
    print("INFO:     WebSocket connection opened")
    try:
        data = await websocket.receive_json()
        code = data.get('code', '')
        print(f"INFO:     Received code to analyze:\n{code[:200]}...")
        
        parser, language_type = get_parser(code)
        if not parser:
            await websocket.send_json({"error": "Language not supported or detected"})
            return
            
        # Initialize code analyzer
        analyzer = CodeAnalyzer()
        
        # Analyze code for issues
        issues = analyzer.analyze_code(code, language_type)
        
        # Send any detected issues first
        for issue in issues:
            musical_params = analyzer.get_musical_mapping(issue)
            await websocket.send_json({
                "isError": True,
                "type": issue["type"],
                "message": issue["message"],
                "line": issue["line"],
                "severity": issue["severity"],
                "note": musical_params["note"],
                "duration": musical_params["duration"],
                "velocity": musical_params["velocity"],
                "timbre": musical_params["timbre"]
            })
            await asyncio.sleep(0.005)
        
        # Proceed with syntax tree analysis
        tree = parser.parse(bytes(code, "utf8"))
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
