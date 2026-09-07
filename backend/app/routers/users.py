from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.blocked_user import BlockedUser
from app.schemas.all_schemas import UserResponse, UserProfileUpdate
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/discover", response_model=List[UserResponse])
def discover_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns available users on the platform so any newly created ID can immediately
    discover, add to groups, and message people.
    """
    users = db.query(User).filter(User.id != current_user.id).order_by(User.created_at.desc()).limit(50).all()
    return [UserResponse.from_orm(u) for u in users]

@router.get("/search", response_model=List[UserResponse])
def search_users(
    q: str = Query("", description="Search term"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query_str = q.strip().lower()
    if not query_str:
        users = db.query(User).filter(User.id != current_user.id).limit(20).all()
        return [UserResponse.from_orm(u) for u in users]

    query = f"%{query_str}%"
    users = db.query(User).filter(
        User.id != current_user.id,
        (User.username.ilike(query) | User.display_name.ilike(query) | User.phone.ilike(query))
    ).limit(20).all()
    return [UserResponse.from_orm(u) for u in users]

@router.get("/blocked")
def get_blocked_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    blocked = db.query(BlockedUser).filter(BlockedUser.user_id == current_user.id).all()
    return [b.blocked_user_id for b in blocked]

@router.post("/{user_id}/block")
def block_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(BlockedUser).filter(
        BlockedUser.user_id == current_user.id,
        BlockedUser.blocked_user_id == user_id
    ).first()

    if not existing:
        bu = BlockedUser(user_id=current_user.id, blocked_user_id=user_id)
        db.add(bu)
        db.commit()

    return {"success": True, "message": f"Blocked {target_user.display_name}", "blocked_user_id": user_id}

@router.post("/{user_id}/unblock")
def unblock_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(BlockedUser).filter(
        BlockedUser.user_id == current_user.id,
        BlockedUser.blocked_user_id == user_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()

    return {"success": True, "message": "User unblocked", "unblocked_user_id": user_id}

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.from_orm(user)

@router.patch("/profile", response_model=UserResponse)
def update_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.display_name is not None:
        current_user.display_name = data.display_name.strip()
    if data.bio is not None:
        current_user.bio = data.bio.strip()
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    if data.phone is not None:
        current_user.phone = data.phone.strip()
    if data.theme is not None:
        current_user.theme = data.theme

    db.commit()
    db.refresh(current_user)
    return UserResponse.from_orm(current_user)
