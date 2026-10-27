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

### ✅ Phase 3: Resume Ingestion + RAG Pipeline
- **Section-Aware Resume Chunking**:
  - Splits resumes into semantic passages (`Experience`, `Projects`, `Skills`, `Education`) with text windowing.
  - Stores chunked passages in the `resume_chunks` table linked to candidate resumes.
- **Vector Embeddings with `pgvector`**:
  - Generates 768-dimension dense vector representations via Gemini API (`text-embedding-004`).
  - Includes offline fallback generator to guarantee local and Docker development without crashes.
- **Semantic Vector Retrieval Function**:
  - Vector cosine distance search (`<=>` operator) retrieving the top matching resume chunks for any technical topic.
  - `POST /api/resumes/:id/search` allowing real-time testing of vector retrieval with similarity scores.
- **Interactive RAG Search Visualizer**:
  - In-app visualizer modal to query resume chunks directly from PostgreSQL in real time.

### ✅ Phase 4: Mock Interview Room & Dynamic Conversational Turns
- **Live Mock Interview Room (`/interview/[id]`)**:
  - Dynamic route presenting the current active question, turn counter (e.g. Turn 2 of 5), category badge, and difficulty indicator.
  - Responsive text-based answer workspace with word/character counter.
  - Code Editor workspace with language selection for technical/coding problems.
  - Text-to-Speech (TTS) audio hook to read questions aloud.
  - Architectural plug-in indicators & hooks for Audio/Video STT (Whisper / Web Speech API) and Camera streams.
  - Transcript history drawer displaying all completed Q&A turns in chronological order.
  - Completed session celebration screen.
- **Turn-by-Turn Dynamic Gemini Generation**:
  - `POST /api/interviews/:id/respond`: Records candidate response in `responses` table, evaluates turn context, and triggers Gemini (`gemini-2.5-flash`) to generate the next logical follow-up question conditioned on resume context and conversation history.
  - Automatically advances turns until the target number of questions is reached, transitioning the session to `completed`.
  - `POST /api/interviews/:id/start`, `GET /api/interviews/:id/turns`, and `POST /api/interviews/:id/complete`.

### ✅ Phase 5: Coding Round (Monaco Editor & Judge0 Integration)
- **Monaco Code Editor Embedded in Interview Room**:
  - Full-featured Monaco editor (`vs-dark` theme, font configuration, line numbers, automatic layout).
  - Multi-language support: JavaScript (Node.js), TypeScript, Python 3, Java (OpenJDK), C++ (GCC), Go.
  - Per-language starter templates and live reset to problem starter snippet.
- **Judge0 API Integration & Sandboxed Fallback**:
  - `POST /api/code/run`: Submits code to Judge0 CE (RapidAPI or public endpoint) against stdin and test cases.
  - Resilient local sandbox runner for JavaScript/TypeScript and simulated execution when Judge0 API key is not configured or offline.
  - `GET /api/code/languages`: Dynamic endpoint returning supported Judge0 language IDs, syntax modes, and boilerplates.
- **Batch Test Cases Runner & Verification UI**:
  - Dynamic algorithmic questions generated with 1–3 test cases persisted in `interview_questions.test_cases` (JSONB).
  - Interactive Test Cases panel in interview room:
    - Test Cases tab: individual case selector, input, expected output, actual output, status badge (Accepted, Wrong Answer, Runtime Error), execution time, and memory.
    - Custom Stdin tab: execute code against arbitrary candidate-provided inputs.
    - Execution Output tab: direct console stdout, stderr, and compiler diagnostics.
  - Run Code action allows candidates to test and verify their solution before submitting to the interviewer.
  - Response submissions record code, language, and execution results directly into the `responses` table.

### ✅ Phase 6: Evaluation, Scoring Rubrics & Performance Report
- **Gemini-Powered Bar Raiser Evaluator (`evaluation.service.ts`)**:
  - Full transcript analysis across questions, candidate answers, code submissions, and execution diagnostics.
  - **3-Pillar Rubric**:
    - *Technical Accuracy & Depth* (0–100)
    - *Communication & STAR Structure* (0–100)
    - *Overall Weighted Readiness Score* (0–100)
  - Qualitative assessments:
    - *Readiness Level*: "Strong Hire", "Hire", "Leaning Hire", "Needs Preparation".
    - *Demonstrated Strengths*: 3–5 evidence-backed bullet points.
    - *Areas for Growth*: 3–5 constructive technical and communication improvements.
    - *Targeted Recommendations*: Concrete study topics and design patterns.
    - *Per-Answer Breakdown*: Turn-by-turn question analysis with score, what went well, missed points, and ideal response elements.
  - Zero-crash fallback heuristic evaluation when offline.
- **Dedicated Performance Report Page (`/interview/[id]/feedback`)**:
  - Scorecard cards with readiness badges and gradient progress bars.
  - Executive summary from Gemini.
  - Strengths and growth areas 2-column grid.
  - Turn-by-turn collapsible accordion showing question, user answer, code submission, and ideal answer snippets.
  - Printable / Save PDF option.
- **Dashboard & Room Integration**:
  - Session history cards on candidate dashboard feature a "Feedback" button for completed sessions.
  - Interview room completion celebration screen features a direct link to the full evaluation report.

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
| `GEMINI_API_KEY` | Google Gemini API Key for Embeddings & Questions | Get from [Google AI Studio](https://aistudio.google.com) |
| `JUDGE0_API_KEY` | *(Required for Judge0 code execution)* Judge0 API Key | RapidAPI or self-hosted Judge0 |

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

## 📡 API Reference

### Auth (`/api/auth`)
* `POST /api/auth/register` — Create candidate account
* `POST /api/auth/login` — Sign in and receive JWT tokens
* `POST /api/auth/refresh` — Refresh access token
* `GET /api/auth/me` — Authenticated profile (Bearer Token)
* `GET /api/health` — PostgreSQL and Redis connectivity status

### Resumes & RAG (`/api/resumes`)
* `GET /api/resumes` — List candidate's uploaded resumes and detected skills
* `POST /api/resumes/upload` — Upload PDF/TXT resume, chunk into passages, and index vector embeddings in pgvector
* `POST /api/resumes/:id/search` — Perform cosine vector similarity search against resume chunks (`{ query: string, limit?: number }`)
* `DELETE /api/resumes/:id` — Delete a resume and its indexed chunks

### Interview Session & Live Room (`/api/interviews`)
* `GET /api/interviews` — List candidate's past and scheduled interview sessions
* `POST /api/interviews` — Schedule a new interview session and auto-generate questions via RAG
* `GET /api/interviews/:id` — Retrieve details for a specific interview session
* `POST /api/interviews/:id/start` — Start/resume interview session and retrieve active question
* `GET /api/interviews/:id/turns` — Retrieve chronological Q&A transcript history
* `POST /api/interviews/:id/respond` — Submit candidate response and dynamically generate next Gemini question
* `POST /api/interviews/:id/complete` — Conclude interview session early or on completion
* `POST /api/interviews/:id/generate-questions` — Regenerate tailored questions with Gemini & RAG
* `GET /api/interviews/:id/questions` — Retrieve generated questions for an interview session
