from datetime import datetime, timedelta
from app.database import SessionLocal, engine, Base
from app.models import (
    User,
    Contact,
    Conversation,
    ConversationMember,
    Message,
    MessageReaction,
    Attachment
)
from app.auth.security import get_password_hash

def seed_database():
    # Re-create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if users already seeded
        if db.query(User).count() > 0:
            print("Database already contains data, skipping seed.")
            return

        print("Seeding database with realistic Signal Clone data...")

        default_pw = get_password_hash("password123")

        # 1. Create Users
        john = User(
            username="john",
            phone="+1 (555) 019-2834",
            display_name="John Doe",
            password_hash=default_pw,
            avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
            bio="Software Engineer & Privacy Advocate 🛡️",
            is_online=True
        )

        sarah = User(
            username="sarah",
            phone="+1 (555) 012-7492",
            display_name="Sarah Connor",
            password_hash=default_pw,
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
            bio="Security Specialist. Always encrypted.",
            is_online=True
        )

        alex = User(
            username="alex",
            phone="+1 (555) 018-9321",
            display_name="Alex Mercer",
            password_hash=default_pw,
            avatar_url="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
            bio="Designer & photographer 📷",
            is_online=False,
            last_seen=datetime.utcnow() - timedelta(minutes=15)
        )

        signal_ai = User(
            username="signal_ai",
            phone="+1 (000) 000-0000",
            display_name="Signal AI",
            password_hash=default_pw,
            avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=SignalAI&backgroundColor=1d4ed8",
            bio="Your embedded Signal AI intelligence assistant. Ask me anything!",
            is_online=True
        )

        db.add_all([john, sarah, alex, signal_ai])
        db.commit()
        db.refresh(john)
        db.refresh(sarah)
        db.refresh(alex)
        db.refresh(signal_ai)

        # 2. Add Contacts
        contacts = [
            Contact(user_id=john.id, contact_user_id=sarah.id, nickname="Sarah"),
            Contact(user_id=john.id, contact_user_id=alex.id, nickname="Alex"),
            Contact(user_id=john.id, contact_user_id=signal_ai.id, nickname="Signal AI"),
            Contact(user_id=sarah.id, contact_user_id=john.id, nickname="John"),
            Contact(user_id=alex.id, contact_user_id=john.id, nickname="John"),
        ]
        db.add_all(contacts)
        db.commit()

        # 3. Create Conversations
        # A. 1-on-1: John & Sarah
        conv_john_sarah = Conversation(
            is_group=False,
            created_by=john.id
        )
        db.add(conv_john_sarah)
        db.commit()
        db.refresh(conv_john_sarah)

        m_js1 = ConversationMember(conversation_id=conv_john_sarah.id, user_id=john.id, role="member", is_pinned=True)
        m_js2 = ConversationMember(conversation_id=conv_john_sarah.id, user_id=sarah.id, role="member")
        db.add_all([m_js1, m_js2])

        # Messages for John & Sarah
        t0 = datetime.utcnow() - timedelta(hours=2)
        msgs_js = [
            Message(
                conversation_id=conv_john_sarah.id,
                sender_id=sarah.id,
                content="Hey John! Did you review the new privacy architecture update?",
                status="read",
                created_at=t0
            ),
            Message(
                conversation_id=conv_john_sarah.id,
                sender_id=john.id,
                content="Yes! The SQLite local persistence and WebSocket signaling look super fast.",
                status="read",
                created_at=t0 + timedelta(minutes=5)
            ),
            Message(
                conversation_id=conv_john_sarah.id,
                sender_id=sarah.id,
                content="Awesome! We also added WebRTC video and voice call streaming with real microphone and camera controls. 📹🎙️",
                status="read",
                created_at=t0 + timedelta(minutes=10)
            ),
            Message(
                conversation_id=conv_john_sarah.id,
                sender_id=john.id,
                content="Let's test the video call feature soon. The dark navy Signal design looks so sleek!",
                status="read",
                created_at=t0 + timedelta(minutes=12)
            ),
            Message(
                conversation_id=conv_john_sarah.id,
                sender_id=sarah.id,
                content="Ready whenever you are! Just tap the camera icon in the top right. 🚀",
                status="read",
                created_at=t0 + timedelta(minutes=15)
            )
        ]
        db.add_all(msgs_js)
        db.commit()

        # Add reaction to the last message
        db.refresh(msgs_js[-1])
        db.add(MessageReaction(message_id=msgs_js[-1].id, user_id=john.id, emoji="👍"))
        db.commit()

        # B. Group: College Friends
        group_college = Conversation(
            is_group=True,
            title="College Friends",
            description="Official group for campus updates, projects, and weekend hangouts! 🎓",
            avatar_url="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&auto=format&fit=crop&q=80",
            created_by=john.id
        )
        db.add(group_college)
        db.commit()
        db.refresh(group_college)

        gm1 = ConversationMember(conversation_id=group_college.id, user_id=john.id, role="admin", is_pinned=True)
        gm2 = ConversationMember(conversation_id=group_college.id, user_id=sarah.id, role="member")
        gm3 = ConversationMember(conversation_id=group_college.id, user_id=alex.id, role="member")
        db.add_all([gm1, gm2, gm3])

        t_group = datetime.utcnow() - timedelta(hours=5)
        msgs_group = [
            Message(
                conversation_id=group_college.id,
                sender_id=john.id,
                content="John Doe created the group \"College Friends\"",
                message_type="system",
                status="sent",
                created_at=t_group
            ),
            Message(
                conversation_id=group_college.id,
                sender_id=alex.id,
                content="Hey everyone! Who is up for coffee before the robotics seminar? ☕",
                status="read",
                created_at=t_group + timedelta(minutes=20)
            ),
            Message(
                conversation_id=group_college.id,
                sender_id=sarah.id,
                content="Count me in! I just finished the machine learning submission.",
                status="read",
                created_at=t_group + timedelta(minutes=25)
            ),
            Message(
                conversation_id=group_college.id,
                sender_id=john.id,
                content="Great! Meeting at 4:30 PM by the library courtyard. Don't forget to review the slides.",
                status="sent",
                created_at=t_group + timedelta(minutes=30)
            )
        ]
        db.add_all(msgs_group)
        db.commit()

        # Add reactions to group messages
        db.refresh(msgs_group[2])
        db.add_all([
            MessageReaction(message_id=msgs_group[2].id, user_id=john.id, emoji="🔥"),
            MessageReaction(message_id=msgs_group[2].id, user_id=alex.id, emoji="🎉")
        ])
        db.commit()

        # C. 1-on-1: John & Signal AI
        conv_ai = Conversation(
            is_group=False,
            created_by=john.id
        )
        db.add(conv_ai)
        db.commit()
        db.refresh(conv_ai)

        m_ai1 = ConversationMember(conversation_id=conv_ai.id, user_id=john.id, role="member", is_pinned=False)
        m_ai2 = ConversationMember(conversation_id=conv_ai.id, user_id=signal_ai.id, role="member")
        db.add_all([m_ai1, m_ai2])

        t_ai = datetime.utcnow() - timedelta(hours=1)
        msgs_ai = [
            Message(
                conversation_id=conv_ai.id,
                sender_id=signal_ai.id,
                content="Welcome to Signal Clone V1.0! 🛡️ I am Signal AI, your intelligent chat companion. I can help summarize discussions, draft messages, suggest smart replies, and more. How can I help you today?",
                status="read",
                created_at=t_ai
            )
        ]
        db.add_all(msgs_ai)
        db.commit()

        print("Database seeding completed successfully!")

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
