# Signal Clone V1.0

A high-fidelity, privacy-first **Signal Clone** built with **Next.js 14 (TypeScript)** on the frontend, **FastAPI (Python)** on the backend, **SQLite with SQLAlchemy** for relational persistence, **FastAPI WebSockets** for live messaging, and **WebRTC** for real camera and microphone voice & video calls.

---

## 📸 Visual Design Language

The entire application adopts the signature Signal dark aesthetic:
- **Dark Navy Background**: `#080e18` / `#0a101d`
- **Sleek Panels & Cards**: `#0e182b` / `#162238` with soft ambient glows
- **Signal Blue Primary Accents**: `#2563eb` with crisp hover states
- **Typography & Details**: Clean sans-serif with slate text hierarchy and subtle borders
- **Multi-Theme Support**: Signal Dark Navy (Default), Midnight OLED Black, Midnight Indigo, and Signal Light.

---

## 🚀 Key Features

1. **Signal-Style Welcome & Landing Experience**:
   - Header badge with "Signal Clone V1.0"
   - Feature highlight cards for SQLite Database and Signal AI
   - Action buttons for *Get Started* and *I already have an account*
   - 1-click Quick Demo User selector

2. **Authentication & Session Persistence**:
   - Username/phone registration, password hashing with bcrypt, display name, and avatar generator
   - JWT authentication (`pyjwt`) with automatic token refresh and session restore
   - Demo OTP verification (accepts `123456` or 6-digit codes)
   - Secure logout and local storage token management

3. **Real-Time WebSockets**:
   - Instant messaging with zero page reloads
   - Delivery status indicators: single check (sent), double check (delivered), double blue check (read)
   - Real-time typing indicators with 3-dot animation
   - Live presence updates (online / last seen)

4. **WebRTC Voice & Video Calling**:
   - Full browser camera & microphone capture (`navigator.mediaDevices.getUserMedia`)
   - Floating Picture-in-Picture (PiP) local camera stream
   - Mute microphone, toggle camera on/off, audio waveform visualizer, and call timer
   - Ringing overlay with Accept/Decline actions

5. **Signal AI Assistant**:
   - Embedded intelligence bot (`signal_ai`)
   - 1-click **AI Chat Summary**: summarizes discussions and generates action items
   - **Smart Suggestion Chips**: floating contextual 1-tap replies above the message box
   - Direct interactive queries and message drafting assistance

6. **Group Chat & Member Management**:
   - Create groups with name, description, avatar, and member selection
   - View complete member list with **Admin** badges
   - **Add Members**: invite contacts directly from group details
   - **Remove Members**: admin controls to remove participants or leave group

7. **Rich Message Interactions**:
   - Reply to messages with quoted context banner
   - Edit sent messages with `(edited)` tag
   - Delete messages for self or everyone
   - Emoji reactions bar (👍, ❤️, 😂, 😮, 😢, 🙏) with reaction counters
   - Pin important messages to chat header
   - File and image attachment uploads
   - In-chat message keyword search

8. **Settings & Customization**:
   - Theme switcher: Dark Navy, OLED Black, Midnight Indigo, Signal Light
   - Read receipts & typing indicators toggles
   - In-app notification sound preferences
   - Profile editor with custom avatar generator and bio

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | Python 3.12, FastAPI, Uvicorn, WebSockets, Passlib (Bcrypt), PyJWT |
| **Database** | SQLite, SQLAlchemy 2.0 (Relational schema, indexes, foreign keys) |
| **Media / Streams** | WebRTC MediaStream (`navigator.mediaDevices.getUserMedia`) |
| **Real-time Transport** | Native WebSocket protocol (`/ws/{token}`) |

---

## 📂 Folder Structure

```
signal-clone/
├── backend/
│   ├── app/
│   │   ├── auth/            # JWT creation, decode, password hashing
│   │   ├── models/          # SQLAlchemy models: User, Contact, Conversation, Message, Reaction, Attachment
│   │   ├── routers/         # API endpoints: auth, users, contacts, conversations, messages, groups, ai, upload
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── services/        # Signal AI service (chat, summaries, smart replies)
│   │   ├── websocket/       # Real-time connection manager and WebRTC signaling
│   │   ├── database.py      # SQLite connection & sessionmaker
│   │   ├── main.py          # FastAPI application entry point
│   │   └── seed.py          # Demo database seeder
│   ├── signal.db            # SQLite database file
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router (layout.tsx, page.tsx, globals.css)
│   │   ├── components/      # UI components: WelcomeScreen, Sidebar, ChatArea, MessageBubble, Modals...
│   │   ├── context/         # React contexts: AuthContext, ChatContext, CallContext, ThemeContext
│   │   ├── lib/             # API client, WebSocket URL, token helpers
│   │   └── types/           # TypeScript data contracts
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── run_backend.bat          # FastAPI startup script
├── run_frontend.bat         # Next.js startup script
├── start_all.bat            # Unified one-click stack launcher
└── README.md
```

---

## 🗄️ Database Schema

- **`users`**: `id`, `username`, `phone`, `display_name`, `password_hash`, `avatar_url`, `bio`, `theme`, `is_online`, `last_seen`, `created_at`.
- **`contacts`**: `id`, `user_id` (FK), `contact_user_id` (FK), `nickname`, `created_at`.
- **`conversations`**: `id`, `is_group`, `title`, `description`, `avatar_url`, `created_by` (FK), `created_at`, `updated_at`.
- **`conversation_members`**: `id`, `conversation_id` (FK), `user_id` (FK), `role` (`admin`/`member`), `is_pinned`, `joined_at`.
- **`messages`**: `id`, `conversation_id` (FK), `sender_id` (FK), `content`, `message_type` (`text`/`image`/`file`/`system`), `reply_to_id` (FK), `is_edited`, `is_pinned`, `status` (`sent`/`delivered`/`read`), `created_at`, `updated_at`.
- **`message_reactions`**: `id`, `message_id` (FK), `user_id` (FK), `emoji`, `created_at`.
- **`attachments`**: `id`, `message_id` (FK), `file_url`, `file_name`, `file_size`, `mime_type`, `created_at`.

---

## 🔑 Demo Accounts & Credentials

All demo users share the password: `password123`

| User | Username | Phone | Description |
|---|---|---|---|
| **John Doe** | `john` | `+1 (555) 019-2834` | Software Engineer & Privacy Advocate |
| **Sarah Connor** | `sarah` | `+1 (555) 012-7492` | Security Specialist |
| **Alex Mercer** | `alex` | `+1 (555) 018-9321` | Designer & photographer |
| **Signal AI** | `signal_ai` | `+1 (000) 000-0000` | Embedded Intelligence Assistant |

*Note: You can also register any new account from the Welcome Screen.*

---

## ⚡ How to Run

### Quick Start (All Servers)
Double-click or run:
```powershell
.\start_all.bat
```

### Manual Run

#### 1. Backend:
```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive Swagger API docs available at: `http://localhost:8000/docs`

#### 2. Frontend:
```powershell
cd frontend
npm run dev
```
Open browser at: `http://localhost:3000`

---

## 🔐 Security & Disclaimer Notes
- Password security is managed with salted bcrypt hashes.
- JWT tokens expire and require authenticated bearer headers.
- **Notice on E2E Encryption**: Real Signal protocol utilizes Double Ratchet and cryptographic key agreements. This clone implements full transport encryption, JWT authentication, and relational persistence, but does not claim actual cryptographic Signal-grade Double Ratchet key exchange.
