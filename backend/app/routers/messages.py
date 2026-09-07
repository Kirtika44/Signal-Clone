from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import asc
from app.database import get_db
from app.models.user import User
from app.models.conversation import Conversation, ConversationMember
from app.models.message import Message
from app.models.reaction import MessageReaction
from app.models.attachment import Attachment
from app.schemas.all_schemas import (
    MessageCreate,
    MessageEdit,
    MessageReactionCreate,
    MessageResponse,
    ReactionResponse,
    AttachmentResponse
)
from app.auth.security import get_current_user
from app.websocket.connection_manager import manager

router = APIRouter(prefix="/api/messages", tags=["Messages"])

def build_message_response(msg: Message, db: Session) -> MessageResponse:
    sender = db.query(User).filter(User.id == msg.sender_id).first()

    # Reply preview
    reply_content = None
    reply_sender = None
    if msg.reply_to_id:
        replied_msg = db.query(Message).filter(Message.id == msg.reply_to_id).first()
        if replied_msg:
            reply_content = replied_msg.content
            r_sender = db.query(User).filter(User.id == replied_msg.sender_id).first()
            reply_sender = r_sender.display_name if r_sender else "User"

    # Reactions
    reactions = db.query(MessageReaction).filter(MessageReaction.message_id == msg.id).all()
    reactions_resp = []
    for r in reactions:
        u = db.query(User).filter(User.id == r.user_id).first()
        reactions_resp.append(ReactionResponse(
            id=r.id,
            user_id=r.user_id,
            emoji=r.emoji,
            created_at=r.created_at,
            username=u.display_name if u else "User"
        ))

    # Attachments
    attachments = db.query(Attachment).filter(Attachment.message_id == msg.id).all()
    attachments_resp = [
        AttachmentResponse(
            id=a.id,
            file_url=a.file_url,
            file_name=a.file_name,
            file_size=a.file_size,
            mime_type=a.mime_type
        )
        for a in attachments
    ]

    return MessageResponse(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        sender_name=sender.display_name if sender else "User",
        sender_avatar=sender.avatar_url if sender else None,
        content=msg.content,
        message_type=msg.message_type,
        reply_to_id=msg.reply_to_id,
        reply_to_content=reply_content,
        reply_to_sender=reply_sender,
        is_edited=msg.is_edited,
        is_pinned=msg.is_pinned,
        status=msg.status,
        created_at=msg.created_at,
        updated_at=msg.updated_at,
        reactions=reactions_resp,
        attachments=attachments_resp
    )

@router.get("/{conversation_id}", response_model=List[MessageResponse])
def get_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify membership
    membership = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to view messages in this conversation")

    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(asc(Message.created_at)).all()

    return [build_message_response(m, db) for m in messages]

@router.post("", response_model=MessageResponse)
async def send_message(
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check membership
    membership = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == data.conversation_id,
        ConversationMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="You are not a member of this conversation")

    msg = Message(
        conversation_id=data.conversation_id,
        sender_id=current_user.id,
        content=data.content.strip(),
        message_type=data.message_type,
        reply_to_id=data.reply_to_id,
        status="sent"
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Attachments if any
    if data.attachment_urls:
        for att in data.attachment_urls:
            attachment_obj = Attachment(
                message_id=msg.id,
                file_url=att.get("url", ""),
                file_name=att.get("name", "attachment"),
                file_size=att.get("size", 0),
                mime_type=att.get("type", "application/octet-stream")
            )
            db.add(attachment_obj)
        db.commit()
        db.refresh(msg)

    # Update conversation timestamp
    conv = db.query(Conversation).filter(Conversation.id == data.conversation_id).first()
    if conv:
        conv.updated_at = datetime.utcnow()
        db.commit()

    resp = build_message_response(msg, db)

    # Broadcast to all conversation members via WebSocket
    await manager.broadcast_to_conversation(data.conversation_id, {
        "type": "new_message",
        "data": resp.dict()
    })

    return resp

@router.patch("/{message_id}", response_model=MessageResponse)
async def edit_message(
    message_id: int,
    data: MessageEdit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot edit someone else's message")

    msg.content = data.content.strip()
    msg.is_edited = True
    msg.updated_at = datetime.utcnow()
    db.commit()

    resp = build_message_response(msg, db)
    await manager.broadcast_to_conversation(msg.conversation_id, {
        "type": "message_edited",
        "data": resp.dict()
    })

    return resp

@router.delete("/{message_id}")
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    conv_id = msg.conversation_id

    # Allow sender or admin
    is_sender = (msg.sender_id == current_user.id)
    membership = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv_id,
        ConversationMember.user_id == current_user.id
    ).first()
    is_admin = (membership and membership.role == "admin")

    if not is_sender and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this message")

    db.delete(msg)
    db.commit()

    await manager.broadcast_to_conversation(conv_id, {
        "type": "message_deleted",
        "data": {"message_id": message_id, "conversation_id": conv_id}
    })

    return {"success": True, "message": "Message deleted"}

@router.post("/{message_id}/reactions", response_model=MessageResponse)
async def toggle_reaction(
    message_id: int,
    data: MessageReactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    existing = db.query(MessageReaction).filter(
        MessageReaction.message_id == message_id,
        MessageReaction.user_id == current_user.id,
        MessageReaction.emoji == data.emoji
    ).first()

    if existing:
        db.delete(existing)
    else:
        new_reaction = MessageReaction(
            message_id=message_id,
            user_id=current_user.id,
            emoji=data.emoji
        )
        db.add(new_reaction)

    db.commit()

    resp = build_message_response(msg, db)
    await manager.broadcast_to_conversation(msg.conversation_id, {
        "type": "reaction_updated",
        "data": resp.dict()
    })

    return resp

@router.post("/{message_id}/pin", response_model=MessageResponse)
async def toggle_pin_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    msg.is_pinned = not msg.is_pinned
    db.commit()

    resp = build_message_response(msg, db)
    await manager.broadcast_to_conversation(msg.conversation_id, {
        "type": "message_pinned",
        "data": resp.dict()
    })

    return resp

@router.post("/{conversation_id}/read")
async def mark_messages_read(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Mark messages not from current user as 'read'
    unread_messages = db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != current_user.id,
        Message.status != "read"
    ).all()

    for m in unread_messages:
        m.status = "read"

    db.commit()

    await manager.broadcast_to_conversation(conversation_id, {
        "type": "messages_read",
        "data": {
            "conversation_id": conversation_id,
            "read_by_user_id": current_user.id
        }
    })

    return {"success": True, "marked_count": len(unread_messages)}
