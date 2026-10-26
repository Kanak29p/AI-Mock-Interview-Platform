# 🎙️ AI Mock Interview Platform

An intelligent, full-stack AI Mock Interview platform designed to help candidates prepare for real-world engineering interviews through conversational AI, speech-to-text, resume-tailored questions via RAG, coding challenges with sandbox execution, and deep performance analytics.

---

## 🛠️ Target Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, Next.js 16 (App Router), TypeScript, Tailwind CSS, Framer Motion | Modern, responsive interview room, landing page, and candidate dashboard |
| **Backend** | Node.js, Express.js, TypeScript | RESTful API, authentication, interview orchestration, and service coordination |
| **Auth** | JWT (JSON Web Tokens) with access + refresh token lifecycle, bcryptjs | Secure user authentication and session management |
| **Database** | PostgreSQL 16 + **`pgvector`** extension | Relational state management + 768-dim vector embeddings for resume RAG |
| **Cache / Session** | Redis 7 | Refresh token blacklisting, session caching, and rate limiting |
| **AI Engine** | Google Gemini API (`gemini-2.5-flash` / `text-embedding-004`) | Question generation, dynamic conversational evaluation, and resume embedding |
| **Code Sandbox** | Judge0 API | Isolated code execution for live coding rounds |
| **DevOps** | Docker & Docker Compose | Multi-container setup for local and production parity |

---

## 🚀 Progress & Roadmap

### ✅ Phase 1: Backend Foundation
- Express.js + TypeScript server with Helmet, CORS, Morgan logger, and centralized error handling.
- PostgreSQL + `pgvector` schema (`users`, `resumes`, `interview_sessions`, `interview_questions`, `responses`, `feedback`).
- JWT authentication endpoints (`register`, `login`, `refresh`, `me`).
- Dockerized setup (`postgres` with pgvector, `redis`, and `backend`).
- Real API wiring in `/login` and `/signup` without touching visual styling.

### ✅ Phase 2: Candidate Dashboard & Interview Setup
- **Protected Candidate Dashboard (`/dashboard`)**:
  - Token-validated route with automatic redirect to `/login` if unauthenticated.
  - Candidate profile header with logout functionality.
  - Overview metrics (Total Sessions, Average Score, Synced Resumes, Active Track).
  - Empty and populated states for past interview sessions.
- **Resume Management & Parsing**:
  - `POST /api/resumes/upload` using Multer & PDF-Parse.
  - Automatic engineering skill keywords extraction (React, Node, TypeScript, Docker, etc.).
  - Resume manager tab for uploading and deleting resumes.
- **"Start New Interview" Flow**:
  - Interactive multi-step modal to configure target role, seniority level (`junior`, `intermediate`, `senior`, `lead`), and interview type (`technical`, `behavioral`, `coding`).
  - Selection of attached resume for RAG question tailoring.
  - Creation of session via `POST /api/interviews`.

### ⏳ Coming in Phase 3: AI Interview Room & Live Session Engine
- Real-time conversational interview loop with Google Gemini API.
- Question generation conditioned on candidate resume context via RAG.
- Speech-to-Text (STT) and candidate voice response capture.

---

## ⚙️ Environment Variables

Copy `.env.example` into your environment:

```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `CORS_ORIGIN` | Allowed frontend origin for CORS | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Base URL used by frontend API client | `http://localhost:5000` |
| `DB_HOST` | PostgreSQL host | `localhost` (or `postgres` in Docker) |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `postgres` |
| `DB_NAME` | PostgreSQL database name | `mock_interview_db` |
| `DATABASE_URL` | Full PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/mock_interview_db` |
| `REDIS_HOST` | Redis host | `localhost` (or `redis` in Docker) |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_URL` | Full Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key for signing access tokens | Minimum 32 characters random string |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens | Minimum 32 characters random string |
| `JWT_EXPIRES_IN` | Access token lifespan | `1h` |
| `JWT_REFRESH_EXPIRES_IN`| Refresh token lifespan | `7d` |
| `GEMINI_API_KEY` | *(Required for Phase 3)* Google Gemini API Key | Get from [Google AI Studio](https://aistudio.google.com) |
| `JUDGE0_API_KEY` | *(Required for Phase 4)* Judge0 API Key | RapidAPI or self-hosted Judge0 |

---

## 🏃 Running the Application

### Option A: Using Docker Compose (Recommended)

1. Ensure **Docker Desktop** is running.
2. From the project root:
   ```bash
   docker compose up --build -d
   ```
3. Run the frontend:
   ```bash
   cd frontend
   npm run dev
   ```
4. Navigate to [http://localhost:3000](http://localhost:3000).

---

### Option B: Running Locally without Docker

1. Ensure PostgreSQL and Redis are running locally.
2. In `backend/`:
   ```bash
   npm run migrate    # Apply database schema
   npm run dev        # Starts backend on http://localhost:5000
   ```
3. In `frontend/`:
   ```bash
   npm run dev        # Starts Next.js on http://localhost:3000
   ```

---

## 📡 API Reference

### Auth (`/api/auth`)
* `POST /api/auth/register` — Create candidate account
* `POST /api/auth/login` — Sign in and receive JWT tokens
* `POST /api/auth/refresh` — Refresh access token
* `GET /api/auth/me` — Authenticated profile (Bearer Token)
* `GET /api/health` — PostgreSQL and Redis connectivity status

### Resumes (`/api/resumes`)
* `GET /api/resumes` — List candidate's uploaded resumes and detected skills
* `POST /api/resumes/upload` — Upload PDF/TXT resume (multipart/form-data)
* `DELETE /api/resumes/:id` — Delete a resume

### Interviews (`/api/interviews`)
* `GET /api/interviews` — List candidate's past and scheduled interview sessions
* `POST /api/interviews` — Schedule a new interview session (`roleTitle`, `difficulty`, `interviewType`, `resumeId`)
* `GET /api/interviews/:id` — Retrieve details for a specific interview session
