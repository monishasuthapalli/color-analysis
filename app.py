from fastapi import FastAPI, WebSocket
from jedi import Script
import uvicorn

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    while True:
        try:
            # Receive code and cursor position
            data = await websocket.receive_json()
            code = data["code"]
            line = data["line"]
            column = data["column"]
            
            # Get completions from Jedi
            script = Script(code)
            completions = script.complete(line, column)
            
            # Format suggestions
            suggestions = [
                {
                    "name": c.name,
                    "type": c.type,
                    "docstring": c.docstring()
                }
                for c in completions
            ]
            
            # Send back to client
            await websocket.send_json({"suggestions": suggestions})
            
        except Exception as e:
            await websocket.send_json({"error": str(e)})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
