import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
from tree_sitter import Language, Parser
import os

# --- Tree-sitter Language Setup ---
# The pre-compiled library for Go and JavaScript grammars.
# This is created when the environment is set up.
LANG_LIB_PATH = os.path.join(os.path.dirname(__file__), 'build', 'languages.so')

# Try to load languages, fallback gracefully if not available
try:
    GO_LANGUAGE = Language(LANG_LIB_PATH, 'go')
    JS_LANGUAGE = Language(LANG_LIB_PATH, 'javascript')
    TREE_SITTER_AVAILABLE = True
    print("INFO:     Tree-sitter languages loaded successfully")
except Exception as e:
    print(f"Warning: Tree-sitter languages not available: {e}")
    print("The visualization feature will use mock parsing. To fix this, install Microsoft C++ Build Tools.")
    GO_LANGUAGE = None
    JS_LANGUAGE = None
    TREE_SITTER_AVAILABLE = False

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
def get_parser(code: str) -> Parser | None:
    """Detects the language and returns the appropriate Tree-sitter parser."""
    if not TREE_SITTER_AVAILABLE:
        return None
    
    parser = Parser()
    # Simple heuristic to guess the language.
    # A more robust solution might involve more advanced detection.
    if 'func main' in code or 'package main' in code or 'fmt.' in code:
        parser.set_language(GO_LANGUAGE)
    else:
        # Default to JavaScript if Go is not detected
        parser.set_language(JS_LANGUAGE)
    return parser

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

async def mock_walk_tree(code: str, websocket: WebSocket):
    """Mock tree walker that creates fake syntax nodes for demonstration."""
    lines = code.split('\n')
    
    # Send a root program node
    await websocket.send_json({
        "type": "program",
        "startLine": 1,
        "endLine": len(lines)
    })
    await asyncio.sleep(0.01)
    
    # Analyze code and send mock nodes based on simple patterns
    for i, line in enumerate(lines, 1):
        line = line.strip()
        if not line or line.startswith('//') or line.startswith('#'):
            continue
            
        # Mock different node types based on content
        if 'function' in line or 'func ' in line:
            await websocket.send_json({
                "type": "function_declaration",
                "startLine": i,
                "endLine": i
            })
        elif 'if ' in line:
            await websocket.send_json({
                "type": "if_statement",
                "startLine": i,
                "endLine": i
            })
        elif 'for ' in line or 'while ' in line:
            await websocket.send_json({
                "type": "for_statement",
                "startLine": i,
                "endLine": i
            })
        elif '=' in line and not '==' in line:
            await websocket.send_json({
                "type": "assignment_expression",
                "startLine": i,
                "endLine": i
            })
        elif line.endswith('{') or line.endswith('}'):
            await websocket.send_json({
                "type": "block",
                "startLine": i,
                "endLine": i
            })
        else:
            await websocket.send_json({
                "type": "expression_statement",
                "startLine": i,
                "endLine": i
            })
        
        await asyncio.sleep(0.01)  # Small delay for visualization effect

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
    """Handles real-time code parsing and streams syntax tree nodes."""
    await websocket.accept()
    print("INFO:     connection open")
    try:
        data = await websocket.receive_json()
        code = data.get('code', '')
        
        parser = get_parser(code)
        if not parser:
            # Use mock tree walker when tree-sitter is not available
            await mock_walk_tree(code, websocket)
            return
            
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
