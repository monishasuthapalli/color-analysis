from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from jedi import Script
import inspect
import sys
from typing import Any
from enum import IntEnum

app = FastAPI()

# Add CORS for Angular
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Monaco CompletionItemKind enum values
class CompletionItemKind(IntEnum):
    Method = 1
    Function = 2
    Constructor = 3
    Field = 4
    Variable = 5
    Class = 6
    Interface = 7
    Module = 8
    Property = 9
    Keyword = 14
    Snippet = 15
    Text = 17

def get_monaco_completion_items(completions, line: int, column: int):
    items = []
    
    for completion in completions:
        # Basic info
        name = completion.name
        completion_type = completion.type
        
        # Get detailed signature if available
        signature = ""
        if completion_type in ['function', 'method']:
            try:
                signature = str(completion.get_signatures()[0]) if completion.get_signatures() else ""
            except:
                signature = ""

        # Map Jedi types to Monaco kinds
        kind_map = {
            'function': CompletionItemKind.Function,
            'method': CompletionItemKind.Method,
            'class': CompletionItemKind.Class,
            'module': CompletionItemKind.Module,
            'instance': CompletionItemKind.Variable,
            'param': CompletionItemKind.Variable,
            'property': CompletionItemKind.Property,
            'keyword': CompletionItemKind.Keyword,
        }
        
        # Build rich completion item
        item = {
            # Basic properties
            "label": name,
            "kind": kind_map.get(completion_type, CompletionItemKind.Text),
            
            # Detailed information
            "detail": signature,
            "documentation": {
                "value": completion.docstring(raw=True),
                "isTrusted": True,
                "supportThemeIcons": True
            },
            
            # Source and context
            "sortText": f"{kind_map.get(completion_type, 99):02d}{name}",  # Sort by kind then name
            "filterText": name,
            
            # Module/package origin
            "detail": f"{signature}\nFrom: {completion.module_name if completion.module_name else 'built-in'}",
            
            # Insert behavior
            "insertText": name,
            "insertTextRules": 1,  # Plain text
            "range": {
                "startLineNumber": line,
                "endLineNumber": line,
                "startColumn": column,
                "endColumn": column
            },
            
            # Additional hints
            "tags": [2] if completion.deprecated else [],  # Mark deprecated items
            "commitCharacters": [".", "(", ",", "["] if completion_type in ["function", "method", "class"] else ["."],
            
            # Preselect for highly relevant items
            "preselect": completion_type in ["function", "method", "class"]
        }
        
        items.append(item)
    
    return items

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    while True:
        try:
            data = await websocket.receive_json()
            code = data["code"]
            line = data["line"]
            column = data["column"]
            
            script = Script(code)
            completions = script.complete(line, column)
            
            # Get rich completion items
            suggestions = get_monaco_completion_items(completions, line, column)
            
            await websocket.send_json({"suggestions": suggestions})
            
        except Exception as e:
            await websocket.send_json({"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
