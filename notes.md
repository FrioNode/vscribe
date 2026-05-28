```markdown
# 🎯 VIDEO TRANSCRIPTION API - MASTER TODO

> **Last updated:** Phase 1-5 complete. Starting Phase 6.

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

**Commit:** `8fdd7d6`

---

## 🔵 PHASE 2: PYTHON FASTAPI SERVICE ✅ DONE

- [x] **2.1** FastAPI server (`api/services/server.py`) - all CRUD endpoints
- [x] **2.2** File upload support with streaming
- [x] **2.3** JSON + SRT + VTT response formats
- [x] **2.4** Background tasks with instant job_id
- [x] **2.5** `requirements.txt` pinned
- [x] **2.6** Tested: 16-min video, all platforms

**Commit:** `ce461fe`

---

## 🟡 PHASE 3: NODE.JS API GATEWAY ✅ DONE

- [x] **3.1** Express + TypeScript (port 3000)
- [x] **3.2** API Key auth (X-API-Key header)
- [x] **3.3** Tiered rate limiting (free 10/hr, premium 100/hr)
- [x] **3.4** All transcription endpoints + SRT/VTT downloads
- [x] **3.5** CORS, Helmet, health check rate limited (30/min/IP)
- [x] **3.6** Tested: URL, file upload, rate limits, security

**Commit:** `db13225`

---

## 🟠 PHASE 4: QUEUE SYSTEM ✅ DONE

- [x] **4.1** Redis + BullMQ setup
- [x] **4.2** Worker with 2 concurrent jobs, 5/min rate limit
- [x] **4.3** Unique job IDs (`txr_` prefix), retry logic (3x)
- [x] **4.4** Queue stats endpoint, progress tracking

**Commit:** `7da2b23`

---

## 🟣 PHASE 5: DATABASE & AUTH ✅ DONE

- [x] **5.1** SQLite + WAL mode (migration-ready schema)
  - Tables: `pending_registrations`, `users`, `password_resets`, `api_keys`, `usage_logs`, `transcription_jobs`

- [x] **5.2** Two-step registration (OTP → verify → API key)
- [x] **5.3** Brevo mailer integration
  - Registration OTP, welcome + API key, password reset OTP
  - Password changed notification
  - New key created, key rotated notifications
  - Usage warning, limit reached alerts

- [x] **5.4** Auth endpoints
  - `POST /api/v1/auth/register` - Step 1: sends OTP
  - `POST /api/v1/auth/verify` - Step 2: creates user + API key
  - `POST /api/v1/auth/login` - Returns user info + keys
  - `POST /api/v1/auth/reset-password` - Sends reset OTP
  - `POST /api/v1/auth/reset-password/confirm` - New password

- [x] **5.5** API key management (protected)
  - `GET /api/v1/auth/keys` - List keys
  - `POST /api/v1/auth/keys` - Create new key
  - `DELETE /api/v1/auth/keys/:key` - Revoke (blocks last key)
  - `POST /api/v1/auth/keys/:key/rotate` - Rotate (revoke + new)

- [x] **5.6** Database-backed auth middleware (replaces .env keys)
- [x] **5.7** Usage logging + job tracking in DB
- [x] **5.8** Test users seeded for development

**Commit:** `1d66d00`

---

## ⚫ PHASE 6: DOCKER & DEPLOYMENT 🐳 (CURRENT)

- [ ] **6.1** Dockerfile for Python service
- [ ] **6.2** Dockerfile for Node.js API
- [ ] **6.3** `docker-compose.yml`
  - Python transcriber
  - Node.js API
  - Redis (for queue)
  - Database (SQLite volume)
- [ ] **6.4** Environment variables (`.env.example`)
- [ ] **6.5** Test full stack locally

---

## 🔴 PHASE 7: PRODUCTION READY 🚀

- [ ] **7.1** Webhook support (notify on job complete)
- [ ] **7.2** JWT for dashboard (analytics, account management)
- [ ] **7.3** Monitoring & logging (Prometheus + Grafana)
- [ ] **7.4** Premium tier features (more req/hr, priority queue)
- [ ] **7.5** Usage analytics dashboard
- [ ] **7.6** File upload re-enabled with queue
- [ ] **7.7** Concurrent transcription scaling

---

## 🎯 PROGRESS OVERVIEW

```
✅ Phase 1: Core Python Service     ████████████████████ 100%
✅ Phase 2: FastAPI Service          ████████████████████ 100%
✅ Phase 3: Node.js API Gateway      ████████████████████ 100%
✅ Phase 4: Queue System             ████████████████████ 100%
✅ Phase 5: Database & Auth          ████████████████████ 100%
⬜ Phase 6: Docker & Deployment      ░░░░░░░░░░░░░░░░░░░░   0%
⬜ Phase 7: Production Ready         ░░░░░░░░░░░░░░░░░░░░   0%
```

---

## 📁 Current File Structure

```
transcribe/
├── api/
│   ├── services/
│   │   ├── transcriber.py         ✅ Phase 1
│   │   ├── server.py              ✅ Phase 2
│   │   └── mailer.ts              ✅ Phase 5 (Brevo)
│   └── src/
│       ├── config/
│       │   └── queue.ts           ✅ Phase 4 (BullMQ)
│       ├── db/
│       │   ├── schema.sql         ✅ Phase 5
│       │   ├── init.ts            ✅ Phase 5
│       │   └── queries.ts         ✅ Phase 5
│       ├── index.ts               ✅ Phase 3/5
│       ├── middleware/
│       │   ├── apiKey.ts          ✅ Phase 5 (DB-backed)
│       │   └── rateLimit.ts       ✅ Phase 3
│       ├── routes/
│       │   ├── auth.ts            ✅ Phase 5
│       │   └── transcription.ts   ✅ Phase 4
│       └── types/
│           └── index.ts           ✅ Phase 3
├── cache/
│   └── transcriptions/            ✅ Auto-managed
├── data/
│   └── transcribe.db              ✅ SQLite (WAL)
├── worker/
│   └── transcription.worker.ts    ✅ Phase 4
├── .env                           ✅ Secrets
├── .gitignore                     ✅
├── docker-compose.yml             ⬜ Phase 6
├── nodemon.json                   ✅
├── package.json                   ✅
├── pnpm-lock.yaml                 ✅
├── requirements.txt               ✅
├── tsconfig.json                  ✅
├── test_main.py                   ✅
└── TODO.md                        ✅ This file
```

---

## 🔑 Key Decisions (Locked In)

| Decision | Choice |
|----------|--------|
| Architecture | Microservices (Python FastAPI + Node.js Express) |
| Python port | 8000 |
| Node.js port | 3000 |
| Queue | BullMQ + Redis (2 concurrent, 5/min) |
| Job IDs | `txr_` prefixed UUIDs |
| Database | SQLite + WAL (migration-ready) |
| Auth (API) | API Key in `X-API-Key` header (DB-backed) |
| Auth (Dashboard) | JWT tokens (Phase 7) |
| Email | Brevo (transactional) |
| Caching | File-based (TTL + max files, no Redis needed) |
| Model | faster-whisper base (CPU, int8) |
| Video download | yt-dlp |

---

## 🚀 Next Up: Phase 6

Dockerize all services — one `docker-compose up` to rule them all.
```