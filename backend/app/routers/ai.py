from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import asc
from app.database import get_db
from app.models.user import User
from app.models.conversation import Conversation, ConversationMember
from app.models.message import Message
from app.schemas.all_schemas import (
    AIChatRequest,
    AIChatResponse,
    AISummarizeRequest,
    AISummarizeResponse,
    AISmartReplyRequest,
    AISmartReplyResponse
)
from app.auth.security import get_current_user
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/ai", tags=["Signal AI"])

@router.post("/chat", response_model=AIChatResponse)
def chat_with_ai(
    data: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prompt = data.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    context = []
    if data.conversation_id:
        msgs = db.query(Message).filter(Message.conversation_id == data.conversation_id).order_by(Message.created_at.desc()).limit(10).all()
        for m in reversed(msgs):
            sender = db.query(User).filter(User.id == m.sender_id).first()
            context.append({
                "sender_name": sender.display_name if sender else "User",
                "content": m.content
            })

    response_text = ai_service.generate_chat_response(prompt, context)
    return AIChatResponse(response=response_text)

@router.post("/summarize", response_model=AISummarizeResponse)
def summarize_conversation(
    data: AISummarizeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify membership
    membership = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == data.conversation_id,
        ConversationMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to summarize this conversation")

    messages = db.query(Message).filter(
        Message.conversation_id == data.conversation_id
    ).order_by(asc(Message.created_at)).all()

    msg_dicts = []
    for m in messages:
        sender = db.query(User).filter(User.id == m.sender_id).first()
        msg_dicts.append({
            "sender_name": sender.display_name if sender else "User",
            "content": m.content,
            "created_at": m.created_at.isoformat()
        })

    summary_data = ai_service.summarize_conversation(msg_dicts)
    return AISummarizeResponse(
        summary=summary_data["summary"],
        key_points=summary_data["key_points"]
    )

@router.post("/smart-replies", response_model=AISmartReplyResponse)
def get_smart_replies(
    data: AISmartReplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    messages = db.query(Message).filter(
        Message.conversation_id == data.conversation_id
    ).order_by(asc(Message.created_at)).limit(15).all()

    msg_dicts = []
    for m in messages:
        sender = db.query(User).filter(User.id == m.sender_id).first()
        msg_dicts.append({
            "sender_name": sender.display_name if sender else "User",
            "content": m.content
        })

    suggestions = ai_service.generate_smart_replies(msg_dicts)
    return AISmartReplyResponse(suggestions=suggestions)
