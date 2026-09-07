import traceback
from app.database import SessionLocal
from app.models.user import User
from app.routers.conversations import get_user_conversations

db = SessionLocal()
john = db.query(User).filter(User.username == "john").first()
sarah = db.query(User).filter(User.username == "sarah").first()
alex = db.query(User).filter(User.username == "alex").first()

for u in [john, sarah, alex]:
    try:
        convs = get_user_conversations(u, db)
        print(f"User {u.username}: {len(convs)} conversations")
        for c in convs:
            print(f"  - Conv {c.id}: title={c.title}, last_msg={c.last_message.content if c.last_message else None}")
    except Exception as e:
        print(f"FAILED for {u.username}: {e}")
        traceback.print_exc()

db.close()
