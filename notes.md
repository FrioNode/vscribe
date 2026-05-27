```markdown
# 🎯 VIDEO TRANSCRIPTION API - MASTER TODO

> **Last updated:** Phase 1 & 2 complete. Starting Phase 3.

---

## 🟢 PHASE 1: CORE PYTHON SERVICE ✅ DONE

- [x] **1.1** `transcriber.py` class with clean separation
- [x] **1.2** Download → extract audio → transcribe pipeline
- [x] **1.3** Word-by-word + Timeline (SRT/VTT) formats
- [x] **1.4** File-based caching with TTL + max files cleanup
- [x] **1.5** Progress callbacks & error handling
- [x] **1.6** Lazy model loading (loads once, reused)
- [x] **1.7** Tested platforms: FB ✅ | IG ✅ | TikTok ✅ | YT ✅

### Phase 1 Performance Summary

| Feature | Status | Performance |
|---------|--------|-------------|
| Video download | ✅ | Facebook, IG, TikTok, YouTube |
| Audio extraction | ✅ | Automatic via yt-dlp |
| Word-by-word | ✅ | Full transcript |
| Timeline + SRT/VTT | ✅ | Subtitle-ready |
| File caching | ✅ | 0.4ms response, ~40KB per file |
| Cache speedup | ✅ | 393,000x faster on repeat requests |
| TTL cleanup | ✅ | 7 day expiry + 100 file max |
| RAM usage | ✅ | Near-zero for cache (file-based) |
| WSL compatible | ✅ | 16GB RAM, no issues |

**Commit:** `8fdd7d6 Phase 1: Video transcriber with file caching`

---

## 🔵 PHASE 2: PYTHON FASTAPI SERVICE ✅ DONE

- [x] **2.1** Set up FastAPI server (`api/services/server.py`)
  - `POST /transcribe` - accepts video URL + format choice
  - `GET /transcribe/{job_id}` - get result (instant if cached)
  - `GET /transcribe/{job_id}/srt` - SRT download
  - `GET /transcribe/{job_id}/vtt` - VTT download
  - `GET /cache/stats` - cache statistics
  - `DELETE /cache` - clear cache
  - `GET /jobs` - list active jobs
  - `DELETE /jobs` - cleanup completed jobs

- [x] **2.2** File upload support
  - `POST /transcribe/upload` - accept video files directly
  - Handles large files with streaming upload
  - Auto-cleanup of temp files

- [x] **2.3** Response formats
  - JSON (word-by-word text)
  - JSON (timeline segments)
  - Raw SRT download
  - Raw VTT download

- [x] **2.4** Background tasks
  - Long transcriptions run in background
  - Return job ID immediately
  - Poll for status/results
  - Progress tracking (0-100%)

- [x] **2.5** `requirements.txt` created
  - `faster-whisper`, `yt-dlp`, `fastapi`, `uvicorn`, `python-multipart`

- [x] **2.6** Tested: 16-minute video transcribed flawlessly

**Commit:** `ce461fe Phase 1-2: Core transcriber + FastAPI server`

---

## 🟡 PHASE 3: NODE.JS API GATEWAY 🟢 (CURRENT)

- [ ] **3.1** Initialize Node.js project
  - Express.js or Fastify
  - TypeScript setup
  - Project structure (`api/src/`)

- [ ] **3.2** API Key system
  - User registration endpoint
  - API key generation
  - Key validation middleware (`middleware/rateLimit.ts`)

- [ ] **3.3** Rate limiting
  - Tiered limits (free: 10/hr, premium: 100/hr)
  - Per-API-key tracking

- [ ] **3.4** Endpoints
  - `POST /api/v1/transcribe` - submit job (URL or file)
  - `GET /api/v1/transcribe/:id` - get result
  - `GET /api/v1/transcribe/:id/status` - check progress

- [ ] **3.5** API documentation
  - Swagger/OpenAPI auto-generated docs

---

## 🟠 PHASE 4: QUEUE SYSTEM 🔄

- [ ] **4.1** Set up Redis
  - Docker container or local install
  - Connection config

- [ ] **4.2** BullMQ queue setup
  - `worker/transcription.worker.ts` - process jobs
  - Job priorities (premium users first?)
  - Retry logic for failed jobs

- [ ] **4.3** Job lifecycle
  - Submitted → Downloading → Transcribing → Completed
  - Real-time progress via WebSocket or polling
  - Failure handling & automatic retries

---

## 🟣 PHASE 5: STORAGE & DATABASE 💾

- [ ] **5.1** Database setup
  - **Start:** SQLite + WAL mode (zero setup)
  - **Migrate later:** PostgreSQL via SQLAlchemy
  - Tables: `users`, `jobs`, `api_usage`

- [ ] **5.2** SQLAlchemy models (migration-ready)
  - Easy switch from SQLite → PostgreSQL

- [ ] **5.3** File storage
  - Temp audio cleanup after transcription
  - Optional: S3/MinIO for persistent storage

---

## ⚫ PHASE 6: DOCKER & DEPLOYMENT 🐳

- [ ] **6.1** Dockerfile for Python service
- [ ] **6.2** Dockerfile for Node.js API
- [ ] **6.3** `docker-compose.yml` (already created)
  - Python transcriber
  - Node.js API
  - Redis (for queue)
  - Database (SQLite or PostgreSQL)
- [ ] **6.4** Environment variables (`.env`)
- [ ] **6.5** Test full stack locally

---

## 🔴 PHASE 7: PRODUCTION READY 🚀

- [ ] **7.1** Webhook support
  - Notify user when job completes
- [ ] **7.2** Authentication
  - API Key for CLI/scripts
  - JWT for dashboard (analytics, account management)
- [ ] **7.3** Monitoring & logging
- [ ] **7.4** Rate limit bypass for premium tiers
- [ ] **7.5** Usage analytics dashboard
- [ ] **7.6** Multi-user support
- [ ] **7.7** Concurrent transcription jobs

---

## 🎯 PROGRESS OVERVIEW

```
✅ Phase 1: Core Python Service     ████████████████████ 100%
✅ Phase 2: FastAPI Service          ████████████████████ 100%
⬜ Phase 3: Node.js API Gateway      ░░░░░░░░░░░░░░░░░░░░   0%
⬜ Phase 4: Queue System             ░░░░░░░░░░░░░░░░░░░░   0%
⬜ Phase 5: Storage & Database       ░░░░░░░░░░░░░░░░░░░░   0%
⬜ Phase 6: Docker & Deployment      ░░░░░░░░░░░░░░░░░░░░   0%
⬜ Phase 7: Production Ready         ░░░░░░░░░░░░░░░░░░░░   0%
```

---

## 📁 Current File Structure

```
transcribe/
├── api/
│   ├── services/
│   │   ├── transcriber.py      ✅ Phase 1
│   │   └── server.py           ✅ Phase 2
│   └── src/
│       ├── middleware/
│       │   └── rateLimit.ts    ⬜ Phase 3
│       └── routes/
│           └── transcription.ts ⬜ Phase 3
├── cache/
│   └── transcriptions/         ✅ 10 cached files
├── worker/
│   └── transcription.worker.ts ⬜ Phase 4
├── docker-compose.yml          ⬜ Phase 6
├── requirements.txt            ✅
├── test_main.py                ✅ Test suite
├── TODO.md                     ✅ This file
└── .gitignore                  ✅
```

---

## 🔑 Key Decisions (Locked In)

| Decision | Choice |
|----------|--------|
| Architecture | Microservices (Python + Node.js) |
| Input types | URLs + File upload |
| Auth (CLI) | API Key in header |
| Auth (Dashboard) | JWT tokens |
| Database | SQLite + WAL (migration-ready for PostgreSQL) |
| Caching | File-based (TTL + max files, no Redis needed) |
| Model | faster-whisper base (CPU, int8) |
| Video download | yt-dlp |

---

## 🚀 Next Up: Phase 3

Initialize Node.js API Gateway with TypeScript, API key auth, and rate limiting.
```