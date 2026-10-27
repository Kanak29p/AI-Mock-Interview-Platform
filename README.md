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

1. Ensure PostgreSQL (with pgvector) and Redis are running locally.
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
