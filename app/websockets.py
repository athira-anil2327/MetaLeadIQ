import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List

logger = logging.getLogger("metaleadiq.websockets")

router = APIRouter(tags=["websockets"])

class ConnectionManager:
    def __init__(self):
        # Store all currently open WebSocket tunnels
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket Client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket Client disconnected. Total active: {len(self.active_connections)}")

    async def broadcast_json(self, message: dict):
        """
        Send a JSON payload to every connected client (React dashboards).
        """
        # Create a copy of the list to avoid modification during iteration
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send message to client. Disconnecting: {e}")
                self.disconnect(connection)

# Create a singleton instance to be imported and used anywhere in the app
manager = ConnectionManager()

@router.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    The endpoint the React frontend will hit to open the tunnel.
    """
    await manager.connect(websocket)
    try:
        while True:
            # We only expect the server to push to the client right now.
            # But we must hold the connection open, so we listen indefinitely.
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
