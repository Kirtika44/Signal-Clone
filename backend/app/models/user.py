from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=True)
    display_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    bio = Column(String, default="Hey there! I am using Signal Clone.")
    theme = Column(String, default="dark-navy")
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    messages = relationship("Message", back_populates="sender", cascade="all, delete-orphan")
    memberships = relationship("ConversationMember", back_populates="user", cascade="all, delete-orphan")
    contacts = relationship("Contact", foreign_keys="Contact.user_id", back_populates="user", cascade="all, delete-orphan")
