import json
from typing import Dict, List, Set, Optional
from datetime import datetime
from fastapi import WebSocket
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.models.conversation import ConversationMember

class ConnectionManager:
    def __init__(self):
        # Map user_id -> list of active WebSockets (allows multiple tabs/devices)
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Track active user ids
        self.online_users: Set[int] = set()

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        self.online_users.add(user_id)

        # Mark user online in database
        self._set_user_online_status(user_id, True)

        # Broadcast presence change
        await self.broadcast_presence(user_id, True)

    async def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                self.online_users.discard(user_id)
                self._set_user_online_status(user_id, False)
                await self.broadcast_presence(user_id, False)

    def _set_user_online_status(self, user_id: int, is_online: bool):
        db: Session = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.is_online = is_online
                user.last_seen = datetime.utcnow()
                db.commit()
        except Exception as e:
            print(f"Error setting online status: {e}")
            db.rollback()
        finally:
            db.close()

    async def send_personal_message(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            dead_sockets = []
            for ws in self.active_connections[user_id]:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception:
                    dead_sockets.append(ws)
            for ws in dead_sockets:
                self.active_connections[user_id].remove(ws)

    async def broadcast_to_conversation(self, conversation_id: int, message: dict, exclude_user_id: Optional[int] = None):
        db: Session = SessionLocal()
        try:
            members = db.query(ConversationMember).filter(ConversationMember.conversation_id == conversation_id).all()
            for member in members:
                if exclude_user_id and member.user_id == exclude_user_id:
                    continue
                await self.send_personal_message(member.user_id, message)
        finally:
            db.close()

    async def broadcast_presence(self, user_id: int, is_online: bool):
        payload = {
            "type": "presence_update",
            "data": {
                "user_id": user_id,
                "is_online": is_online,
                "last_seen": datetime.utcnow().isoformat()
            }
        }
        # Broadcast to all online users
        for uid in list(self.online_users):
            if uid != user_id:
                await self.send_personal_message(uid, payload)

manager = ConnectionManager()
