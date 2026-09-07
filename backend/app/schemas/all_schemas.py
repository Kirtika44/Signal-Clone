from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    display_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None

class UserRegister(BaseModel):
    username: str
    password: str
    display_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

class UserLogin(BaseModel):
    login: str  # username or phone
    password: str

class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    theme: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    display_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    theme: Optional[str] = "dark-navy"
    is_online: bool = False
    last_seen: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Contact Schemas ---
class ContactAdd(BaseModel):
    contact_username_or_phone: str
    nickname: Optional[str] = None

class ContactResponse(BaseModel):
    id: int
    user_id: int
    contact_user_id: int
    nickname: Optional[str] = None
    contact_user: UserResponse

    class Config:
        from_attributes = True

# --- Reaction & Attachment Schemas ---
class ReactionResponse(BaseModel):
    id: int
    user_id: int
    emoji: str
    created_at: datetime
    username: Optional[str] = None

    class Config:
        from_attributes = True

class AttachmentResponse(BaseModel):
    id: int
    file_url: str
    file_name: str
    file_size: int
    mime_type: Optional[str] = None

    class Config:
        from_attributes = True

# --- Message Schemas ---
class MessageCreate(BaseModel):
    conversation_id: int
    content: str
    message_type: str = "text"
    reply_to_id: Optional[int] = None
    attachment_urls: Optional[List[dict]] = None

class MessageEdit(BaseModel):
    content: str

class MessageReactionCreate(BaseModel):
    emoji: str

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender_name: Optional[str] = None
    sender_avatar: Optional[str] = None
    content: str
    message_type: str = "text"
    reply_to_id: Optional[int] = None
    reply_to_content: Optional[str] = None
    reply_to_sender: Optional[str] = None
    is_edited: bool = False
    is_pinned: bool = False
    status: str = "sent"
    created_at: datetime
    updated_at: datetime
    reactions: List[ReactionResponse] = []
    attachments: List[AttachmentResponse] = []

    class Config:
        from_attributes = True

# --- Conversation & Group Schemas ---
class ConversationMemberResponse(BaseModel):
    id: int
    user_id: int
    role: str = "member"
    is_pinned: bool = False
    joined_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True

class ConversationCreateDirect(BaseModel):
    recipient_user_id: int

class ConversationCreateGroup(BaseModel):
    title: str
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    member_ids: List[int]

class GroupMemberAdd(BaseModel):
    user_ids: List[int]

class ConversationResponse(BaseModel):
    id: int
    is_group: bool
    title: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
    is_pinned: bool = False
    members: List[ConversationMemberResponse] = []

    class Config:
        from_attributes = True

# --- Signal AI Schemas ---
class AIChatRequest(BaseModel):
    prompt: str
    conversation_id: Optional[int] = None

class AIChatResponse(BaseModel):
    response: str
    model: str = "Signal AI (Embedded Intelligence)"

class AISummarizeRequest(BaseModel):
    conversation_id: int

class AISummarizeResponse(BaseModel):
    summary: str
    key_points: List[str]

class AISmartReplyRequest(BaseModel):
    conversation_id: int

class AISmartReplyResponse(BaseModel):
    suggestions: List[str]
