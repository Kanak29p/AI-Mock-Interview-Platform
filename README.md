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

## 🚀 Current Progress: Phase 1 — Backend Foundation

### What's Built in Phase 1:
1. **Express.js + TypeScript Server (`backend/`)**:
   - Production-ready modular architecture with Helmet, CORS, Morgan logger, and centralized error handling.
   - Database connection pool (`pg.Pool`) and Redis client (`ioredis`) with resilient fallbacks.
   - Comprehensive automated migration runner executing DDL on startup.
2. **PostgreSQL + `pgvector` Schema (`backend/src/db/schema.sql`)**:
   - `users`: Credentials, user role (`candidate`, `recruiter`, `student`), and token tracking.
   - `resumes`: Resume text, parsed skill tags, and 768-dimension `vector(768)` embedding for Gemini RAG.
   - `interview_sessions`: Role title, difficulty, interview type, and session lifecycle.
   - `interview_questions`: Structured questions, expected talking points, categories, and coding snippets.
   - `responses`: User transcripts, recorded audio URLs, code submissions, and execution output.
   - `feedback`: Rubric scores (technical, communication, overall), strengths, improvements, and AI summary.
3. **JWT Authentication API (`/api/auth`)**:
   - `POST /api/auth/register` — Validates inputs (Zod), hashes passwords with bcrypt, provisions user, issues access & refresh tokens.
   - `POST /api/auth/login` — Authenticates credentials, stores active session in DB/Redis, returns tokens.
   - `POST /api/auth/refresh` — Validates refresh token and issues a refreshed access token.
   - `GET /api/auth/me` — Protected route returning the active user profile via Bearer token.
   - `GET /api/health` — Healthcheck endpoint reporting status of PostgreSQL and Redis connections.
4. **Frontend API Wiring**:
   - Created typed client in `frontend/src/lib/api.ts` with local storage token helpers.
   - Replaced simulated mock delays in both `/login` and `/signup` with real backend API calls.
5. **Containerization (`docker-compose.yml`)**:
   - `postgres`: Containerized with `pgvector/pgvector:pg16` image and persistent volume.
   - `redis`: Containerized with `redis:7-alpine` and persistent volume.
   - `backend`: Multi-stage Alpine container with healthchecks and auto-migration.

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
| `GEMINI_API_KEY` | *(Required for Phase 2)* Google Gemini API Key | Get from [Google AI Studio](https://aistudio.google.com) |
| `JUDGE0_API_KEY` | *(Required for Phase 4)* Judge0 API Key | RapidAPI or self-hosted Judge0 |

---

## 🏃 Running the Application

### Option A: Using Docker Compose (Recommended)

1. Ensure **Docker Desktop** is running on your machine.
2. Run from the project root:
   ```bash
   docker compose up --build -d
   ```
3. Verify running containers:
   ```bash
   docker compose ps
   ```
4. Start the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) to view the app. Test Sign Up at `/signup` and Login at `/login`.

---

### Option B: Running Locally without Docker

1. Ensure you have a local PostgreSQL instance (with pgvector installed) and Redis running.
2. Set up the backend:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   npm run migrate    # Creates tables & vector extensions
   npm run dev        # Starts backend server on port 5000
   ```
3. Set up the frontend:
   ```bash
   cd ../frontend
   npm install
   npm run dev        # Starts Next.js on port 3000
   ```

---

## 📡 API Reference (Phase 1)

### `GET /api/health`
Checks database and Redis connectivity.
```json
{
  "status": "healthy",
  "timestamp": "2026-10-26T14:45:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### `POST /api/auth/register`
**Body:**
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "role": "candidate"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "e4b105a5-...",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "role": "candidate"
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi..."
    }
  }
}
```

### `POST /api/auth/login`
**Body:**
```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```

### `POST /api/auth/refresh`
**Body:**
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

### `GET /api/auth/me`
**Header:** `Authorization: Bearer <accessToken>`
Returns current authenticated user details.
