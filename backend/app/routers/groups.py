from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.conversation import Conversation, ConversationMember
from app.models.message import Message
from app.schemas.all_schemas import (
    ConversationCreateGroup,
    ConversationResponse,
    GroupMemberAdd,
    UserResponse
)
from app.auth.security import get_current_user
from app.routers.conversations import build_conversation_response
from app.websocket.connection_manager import manager

router = APIRouter(prefix="/api/groups", tags=["Groups"])

@router.post("", response_model=ConversationResponse)
async def create_group(
    data: ConversationCreateGroup,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    title = data.title.strip()
    if not title:
        raise HTTPException(status_code=400, detail="Group title cannot be empty")

    avatar_url = data.avatar_url or f"https://api.dicebear.com/7.x/identicon/svg?seed={title}"

    group = Conversation(
        is_group=True,
        title=title,
        description=data.description.strip() if data.description else None,
        avatar_url=avatar_url,
        created_by=current_user.id
    )
    db.add(group)
    db.commit()
    db.refresh(group)

    # Add creator as admin
    creator_member = ConversationMember(
        conversation_id=group.id,
        user_id=current_user.id,
        role="admin"
    )
    db.add(creator_member)

    # Add other initial members
    unique_member_ids = set(data.member_ids)
    unique_member_ids.discard(current_user.id)

    for uid in unique_member_ids:
        u = db.query(User).filter(User.id == uid).first()
        if u:
            db.add(ConversationMember(
                conversation_id=group.id,
                user_id=uid,
                role="member"
            ))

    # Add a system message announcing group creation
    sys_msg = Message(
        conversation_id=group.id,
        sender_id=current_user.id,
        content=f"{current_user.display_name} created the group \"{title}\"",
        message_type="system",
        status="sent"
    )
    db.add(sys_msg)

    db.commit()

    resp = build_conversation_response(group, current_user.id, db)

    # Notify all members via WebSocket
    for m in resp.members:
        await manager.send_personal_message(m.user_id, {
            "type": "conversation_created",
            "data": resp.dict()
        })

    return resp

@router.post("/{group_id}/members")
async def add_group_members(
    group_id: int,
    data: GroupMemberAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(Conversation).filter(Conversation.id == group_id, Conversation.is_group == True).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Verify current user is a member
    current_membership = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == group_id,
        ConversationMember.user_id == current_user.id
    ).first()
    if not current_membership:
        raise HTTPException(status_code=403, detail="You are not a member of this group")

    added_names = []
    for uid in data.user_ids:
        # Check if already a member
        existing = db.query(ConversationMember).filter(
            ConversationMember.conversation_id == group_id,
            ConversationMember.user_id == uid
        ).first()
        if not existing:
            target_user = db.query(User).filter(User.id == uid).first()
            if target_user:
                new_member = ConversationMember(
                    conversation_id=group_id,
                    user_id=uid,
                    role="member"
                )
                db.add(new_member)
                added_names.append(target_user.display_name)

    if added_names:
        # Add system message
        sys_msg = Message(
            conversation_id=group_id,
            sender_id=current_user.id,
            content=f"{current_user.display_name} added {', '.join(added_names)} to the group",
            message_type="system",
            status="sent"
        )
        db.add(sys_msg)
        group.updated_at = datetime.utcnow()
        db.commit()

        # Broadcast update
        resp = build_conversation_response(group, current_user.id, db)
        await manager.broadcast_to_conversation(group_id, {
            "type": "group_members_updated",
            "data": resp.dict()
        })

    return {"success": True, "added": added_names}

@router.delete("/{group_id}/members/{user_id}")
async def remove_group_member(
    group_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(Conversation).filter(Conversation.id == group_id, Conversation.is_group == True).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Check caller membership
    caller_membership = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == group_id,
        ConversationMember.user_id == current_user.id
    ).first()
    if not caller_membership:
        raise HTTPException(status_code=403, detail="You are not a member of this group")

    target_membership = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == group_id,
        ConversationMember.user_id == user_id
    ).first()
    if not target_membership:
        raise HTTPException(status_code=404, detail="Target user is not a member of this group")

    # Only admin can remove others, but users can remove themselves (leave)
    is_self_removal = (current_user.id == user_id)
    if not is_self_removal and caller_membership.role != "admin":
        raise HTTPException(status_code=403, detail="Only group admins can remove other members")

    target_user = db.query(User).filter(User.id == user_id).first()
    target_name = target_user.display_name if target_user else "User"

    db.delete(target_membership)

    # Post system message
    if is_self_removal:
        action_text = f"{target_name} left the group"
    else:
        action_text = f"{current_user.display_name} removed {target_name} from the group"

    sys_msg = Message(
        conversation_id=group_id,
        sender_id=current_user.id,
        content=action_text,
        message_type="system",
        status="sent"
    )
    db.add(sys_msg)
    group.updated_at = datetime.utcnow()
    db.commit()

    # Broadcast update
    resp = build_conversation_response(group, current_user.id, db)
    await manager.broadcast_to_conversation(group_id, {
        "type": "group_members_updated",
        "data": resp.dict()
    })
    # Also notify the removed user
    await manager.send_personal_message(user_id, {
        "type": "removed_from_group",
        "data": {"group_id": group_id}
    })

    return {"success": True, "message": action_text}

@router.patch("/{group_id}")
async def update_group_info(
    group_id: int,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(Conversation).filter(Conversation.id == group_id, Conversation.is_group == True).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    membership = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == group_id,
        ConversationMember.user_id == current_user.id
    ).first()
    if not membership or membership.role != "admin":
        raise HTTPException(status_code=403, detail="Only group admins can edit group info")

    if "title" in payload and payload["title"].strip():
        group.title = payload["title"].strip()
    if "description" in payload:
        group.description = payload["description"].strip()
    if "avatar_url" in payload:
        group.avatar_url = payload["avatar_url"].strip()

    group.updated_at = datetime.utcnow()
    db.commit()

    resp = build_conversation_response(group, current_user.id, db)
    await manager.broadcast_to_conversation(group_id, {
        "type": "group_info_updated",
        "data": resp.dict()
    })
    return resp
