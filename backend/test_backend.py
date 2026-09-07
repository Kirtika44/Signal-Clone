from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# 1. Health
res = client.get("/health")
assert res.status_code == 200, res.text
print("Health OK")

# 2. Login
res = client.post("/api/auth/login", json={"login": "john", "password": "password123"})
assert res.status_code == 200, res.text
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("Login OK, Token acquired")

# 3. Me
res = client.get("/api/auth/me", headers=headers)
assert res.status_code == 200, res.text
print("Auth Me OK:", res.json()["display_name"])

# 4. Conversations
res = client.get("/api/conversations", headers=headers)
assert res.status_code == 200, res.text
convs = res.json()
print(f"Conversations count: {len(convs)}")

# 5. Messages
conv_id = convs[0]["id"]
res = client.get(f"/api/messages/{conv_id}", headers=headers)
assert res.status_code == 200, res.text
msgs = res.json()
print(f"Messages in conv {conv_id}: {len(msgs)}")

# 6. Send Message
res = client.post("/api/messages", json={"conversation_id": conv_id, "content": "Automated test ping!"}, headers=headers)
assert res.status_code == 200, res.text
print("Send Message OK:", res.json()["content"])

# 7. AI Chat
res = client.post("/api/ai/chat", json={"prompt": "Hello Signal AI!", "conversation_id": conv_id}, headers=headers)
assert res.status_code == 200, res.text
print("AI Chat OK:", res.json()["response"][:50])

# 8. AI Summarize
res = client.post("/api/ai/summarize", json={"conversation_id": conv_id}, headers=headers)
assert res.status_code == 200, res.text
print("AI Summarize OK:", res.json()["summary"][:50])

print("ALL BACKEND CHECKS PASSED!")
