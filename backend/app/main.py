import os
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.models import *
from app.auth.security import decode_access_token
from app.websocket.connection_manager import manager
from app.seed import seed_database
from app.routers import (
    auth,
    users,
    contacts,
    conversations,
    messages,
    groups,
    ai,
    upload
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Signal Clone API",
    description="FastAPI Backend with WebSockets, SQLite, and Signal AI for Signal Clone",
    version="1.0"
)

# Startup Hook for automatic seeding
@app.on_event("startup")
def on_startup():
    try:
        seed_database()
    except Exception as e:
        print(f"Startup seed notice: {e}")

# CORS Configuration
raw_origins = os.environ.get("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()] if raw_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Uploads directory
uploads_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(uploads_path, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(contacts.router)
app.include_router(conversations.router)
app.include_router(messages.router)
app.include_router(groups.router)
app.include_router(ai.router)
app.include_router(upload.router)

@app.get("/")
def root():
    return {
        "app": "Signal Clone API",
        "version": "1.0",
        "status": "online",
        "database": "SQLite (SQLAlchemy)",
        "features": [
            "JWT Authentication",
            "Real-time WebSockets",
            "Signal AI Intelligence",
            "Group Chats & Member Management",
            "WebRTC Voice & Video Calling",
            "Reactions, Replies, Pins, and Attachments"
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        await websocket.close(code=4001)
        return

    user_id = int(payload["sub"])
    await manager.connect(user_id, websocket)

    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                event = json.loads(data_text)
            except Exception:
                continue

            event_type = event.get("type")
            event_data = event.get("data", {})

            # 1. Typing indicators
            if event_type == "typing":
                conv_id = event_data.get("conversation_id")
                is_typing = event_data.get("is_typing", True)
                if conv_id:
                    await manager.broadcast_to_conversation(
                        conv_id,
                        {
                            "type": "user_typing",
                            "data": {
                                "conversation_id": conv_id,
                                "user_id": user_id,
                                "is_typing": is_typing
                            }
                        },
                        exclude_user_id=user_id
                    )

            # 2. WebRTC Video / Voice Call Signaling
            elif event_type in [
                "call:initiate",
                "call:accept",
                "call:reject",
                "call:end",
                "call:offer",
                "call:answer",
                "call:ice_candidate"
            ]:
                target_user_id = event_data.get("target_user_id")
                if target_user_id:
                    event_data["from_user_id"] = user_id
                    await manager.send_personal_message(
                        target_user_id,
                        {"type": event_type, "data": event_data}
                    )

    except WebSocketDisconnect:
        await manager.disconnect(user_id, websocket)
    except Exception as e:
        print(f"WebSocket error for user {user_id}: {e}")
        await manager.disconnect(user_id, websocket)
