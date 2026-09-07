import urllib.request
import json

# 1. Login
req = urllib.request.Request(
    'http://127.0.0.1:8000/api/auth/login',
    data=json.dumps({'login': 'john', 'password': 'password123'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    token = data['access_token']
    print('1. Login Success: User =', data['user']['display_name'])

# 2. Get Me
req2 = urllib.request.Request(
    'http://127.0.0.1:8000/api/auth/me',
    headers={'Authorization': f'Bearer {token}'}
)
with urllib.request.urlopen(req2) as resp:
    me = json.loads(resp.read().decode('utf-8'))
    print('2. Me verified:', me['username'])

# 3. Conversations
req3 = urllib.request.Request(
    'http://127.0.0.1:8000/api/conversations',
    headers={'Authorization': f'Bearer {token}'}
)
with urllib.request.urlopen(req3) as resp:
    convs = json.loads(resp.read().decode('utf-8'))
    print('3. Conversations fetched count:', len(convs))
    for c in convs:
        print('   Chat:', c['title'], 'is_group =', c['is_group'], 'members =', len(c['members']))

# 4. Messages in first chat
first_id = convs[0]['id']
req4 = urllib.request.Request(
    f'http://127.0.0.1:8000/api/messages/{first_id}',
    headers={'Authorization': f'Bearer {token}'}
)
with urllib.request.urlopen(req4) as resp:
    msgs = json.loads(resp.read().decode('utf-8'))
    print(f'4. Messages in Chat {first_id} count:', len(msgs))

print('ALL FULL-STACK USER FLOWS FUNCTIONING PROPERLY!')
