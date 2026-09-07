# 🚀 Signal Clone - Production Deployment Guide

This guide provides step-by-step instructions for deploying the **Signal Clone** application to production.

---

## Architecture Overview

- **Frontend (Next.js 14 + React 18 + Tailwind CSS)**:
  - Deployed to **[Vercel](https://vercel.com)**.
  - Handles static rendering, UI state, camera/mic preview, and WebSockets client.
- **Backend (FastAPI + WebSockets + SQLite / PostgreSQL)**:
  - Deployed to **[Render](https://render.com)**, **[Railway](https://railway.app)**, or **[Fly.io](https://fly.io)**.
  - Maintains persistent WebSocket connections for real-time messaging, typing indicators, and WebRTC signaling.

---

## Part 1: Deploying the Backend (Render or Railway)

Because real-time messaging relies on long-lived WebSockets, deploy your backend first so you have its live URL.

### Option A: Deploy to Render (Recommended & Free)
1. Push this repository to GitHub or GitLab.
2. Sign in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Name**: `signal-clone-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add **Environment Variables**:
   - `JWT_SECRET_KEY`: *(Click generate or enter a 32+ character random string)*
   - `ALLOWED_ORIGINS`: `*` *(or your future Vercel domain)*
   - `DATABASE_URL`: `sqlite:///./signal.db` *(or your PostgreSQL URL)*
7. Click **Create Web Service**.
8. Note your backend URL (e.g., `https://signal-clone-backend.onrender.com`).

### Option B: Deploy with Docker (Railway / Fly.io)
A production-ready `Dockerfile` is included in `backend/`:
```bash
cd backend
docker build -t signal-clone-backend .
docker run -p 8000:8000 -e JWT_SECRET_KEY=your_secret signal-clone-backend
```

---

## Part 2: Deploying the Frontend (Vercel)

1. Sign in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. In the Project Configuration:
   - **Framework Preset**: Next.js
   - **Root Directory**: Click `Edit` and select `frontend`.
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
5. Expand **Environment Variables** and add:
   - `NEXT_PUBLIC_API_URL`: `https://signal-clone-backend.onrender.com` (Your Render backend URL without trailing slash)
   - `NEXT_PUBLIC_WS_URL`: `wss://signal-clone-backend.onrender.com` (Your Render backend WebSocket URL)
6. Click **Deploy**.
7. Vercel will build and assign you a live production domain (e.g. `https://signal-clone.vercel.app`).

---

## Part 3: Verify Your Production Deployment

1. Open your Vercel URL in your browser.
2. The welcome landing page should load instantly with dark Signal aesthetic.
3. Click **Demo John** to log in, or register a new user ID.
4. Try:
   - Starting a chat or group using **Discover People**.
   - Testing camera & microphone in **Settings -> Hardware Test**.
   - Changing chat wallpapers via the **Palette** icon in the chat header.
   - Sending real-time messages and media attachments.

---

## Local Development Checklist

To run locally without setting environment variables:
1. Backend:
   ```bash
   cd backend
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```
2. Frontend:
   ```bash
   cd frontend
   npm run dev
   ```
   Open `http://localhost:3000`. The frontend will automatically detect `localhost:8000` for API and WebSockets.
