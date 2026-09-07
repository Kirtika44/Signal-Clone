from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.user import User
from app.models.conversation import Conversation, ConversationMember
from app.models.message import Message
from app.schemas.all_schemas import (
    ConversationResponse,
    ConversationMemberResponse,
    ConversationCreateDirect,
    MessageResponse,
    UserResponse
)
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/conversations", tags=["Conversations"])

def build_conversation_response(conv: Conversation, user_id: int, db: Session) -> ConversationResponse:
    # Get current user's membership
    current_membership = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conv.id,
        ConversationMember.user_id == user_id
    ).first()

    is_pinned = current_membership.is_pinned if current_membership else False

    # Get members
    memberships = db.query(ConversationMember).filter(ConversationMember.conversation_id == conv.id).all()
    members_resp = []
    other_user = None

    for m in memberships:
        u = db.query(User).filter(User.id == m.user_id).first()
        if u:
            if u.id != user_id and not other_user:
                other_user = u
            members_resp.append(ConversationMemberResponse(
                id=m.id,
                user_id=m.user_id,
                role=m.role,
                is_pinned=m.is_pinned,
                joined_at=m.joined_at,
                user=UserResponse.from_orm(u)
            ))

    # Determine title & avatar for 1-on-1
    title = conv.title
    avatar_url = conv.avatar_url
    if not conv.is_group and other_user:
        title = other_user.display_name
        avatar_url = other_user.avatar_url

    # Get last message
    last_msg = db.query(Message).filter(Message.conversation_id == conv.id).order_by(desc(Message.created_at)).first()
    last_msg_resp = None
    if last_msg:
        sender = db.query(User).filter(User.id == last_msg.sender_id).first()
        last_msg_resp = MessageResponse(
            id=last_msg.id,
            conversation_id=last_msg.conversation_id,
            sender_id=last_msg.sender_id,
            sender_name=sender.display_name if sender else "User",
            sender_avatar=sender.avatar_url if sender else None,
            content=last_msg.content,
            message_type=last_msg.message_type,
            reply_to_id=last_msg.reply_to_id,
            is_edited=last_msg.is_edited,
            is_pinned=last_msg.is_pinned,
            status=last_msg.status,
            created_at=last_msg.created_at,
            updated_at=last_msg.updated_at,
            reactions=[],
            attachments=[]
        )

    # Unread count (messages not sent by current user and status != 'read')
    unread_count = db.query(Message).filter(
        Message.conversation_id == conv.id,
        Message.sender_id != user_id,
        Message.status != "read"
    ).count()

    return ConversationResponse(
        id=conv.id,
        is_group=conv.is_group,
        title=title or "Chat",
        description=conv.description,
        avatar_url=avatar_url,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        last_message=last_msg_resp,
        unread_count=unread_count,
        is_pinned=is_pinned,
        members=members_resp
    )

@router.get("", response_model=List[ConversationResponse])
def get_user_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Find all conversations the user is part of
    memberships = db.query(ConversationMember).filter(ConversationMember.user_id == current_user.id).all()
    conv_ids = [m.conversation_id for m in memberships]

    conversations = db.query(Conversation).filter(Conversation.id.in_(conv_ids)).order_by(desc(Conversation.updated_at)).all()

    results = [build_conversation_response(c, current_user.id, db) for c in conversations]

    # Sort pinned to top, then by updated_at
    results.sort(key=lambda x: (not x.is_pinned, -(x.last_message.created_at.timestamp() if x.last_message else x.updated_at.timestamp())))
    return results

@router.post("/direct", response_model=ConversationResponse)
def create_or_get_direct_conversation(
    data: ConversationCreateDirect,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_user = db.query(User).filter(User.id == data.recipient_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Recipient user not found")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot create conversation with yourself")

    # Check if a 1-on-1 conversation already exists between these two users
    user_convs = db.query(ConversationMember.conversation_id).filter(
        ConversationMember.user_id == current_user.id
    ).subquery()

    existing_conv_member = db.query(ConversationMember).filter(
        ConversationMember.user_id == target_user.id,
        ConversationMember.conversation_id.in_(user_convs)
    ).all()

    for m in existing_conv_member:
        conv = db.query(Conversation).filter(Conversation.id == m.conversation_id, Conversation.is_group == False).first()
        if conv:
            return build_conversation_response(conv, current_user.id, db)

    # Create new 1-on-1 conversation
    new_conv = Conversation(
        is_group=False,
        created_by=current_user.id
    )
    db.add(new_conv)
    db.commit()
    db.refresh(new_conv)

    # Add both users as members
    m1 = ConversationMember(conversation_id=new_conv.id, user_id=current_user.id, role="member")
    m2 = ConversationMember(conversation_id=new_conv.id, user_id=target_user.id, role="member")
    db.add_all([m1, m2])
    db.commit()

    return build_conversation_response(new_conv, current_user.id, db)

@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
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
        raise HTTPException(status_code=403, detail="Not a member of this conversation")

    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return build_conversation_response(conv, current_user.id, db)

@router.post("/{conversation_id}/pin")
def toggle_pin_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    membership = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Conversation membership not found")

    membership.is_pinned = not membership.is_pinned
    db.commit()
    return {"success": True, "is_pinned": membership.is_pinned}
