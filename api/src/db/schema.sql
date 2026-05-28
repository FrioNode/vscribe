PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- ── Pending registrations (Step 1: before OTP) ──
CREATE TABLE IF NOT EXISTS pending_registrations (
    email       TEXT PRIMARY KEY,
    password    TEXT NOT NULL,
    otp         TEXT NOT NULL,
    expires_at  INTEGER NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Verified users (Step 2: after OTP) ──
CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    plan        TEXT DEFAULT 'free' CHECK(plan IN ('free', 'premium', 'enterprise')),
    active      INTEGER DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Password reset tokens ──
CREATE TABLE IF NOT EXISTS password_resets (
    email       TEXT PRIMARY KEY,
    otp         TEXT NOT NULL,
    expires_at  INTEGER NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── API Keys ──
CREATE TABLE IF NOT EXISTS api_keys (
    key         TEXT PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan        TEXT DEFAULT 'free',
    limit_hr    INTEGER DEFAULT 10,
    active      INTEGER DEFAULT 1,
    label       TEXT,
    last_used   DATETIME,
    rotated_at  DATETIME,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Usage logs ──
CREATE TABLE IF NOT EXISTS usage_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    api_key     TEXT NOT NULL,
    endpoint    TEXT NOT NULL,
    source      TEXT,
    job_id      TEXT,
    status      TEXT DEFAULT 'ok',
    ip          TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Transcription jobs ──
CREATE TABLE IF NOT EXISTS transcription_jobs (
    id          TEXT PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    api_key     TEXT NOT NULL,
    source      TEXT NOT NULL,
    format      TEXT DEFAULT 'word_by_word',
    status      TEXT DEFAULT 'queued',
    result      TEXT,
    error       TEXT,
    duration    REAL,
    language    TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_keys_user    ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_key    ON usage_logs(api_key);
CREATE INDEX IF NOT EXISTS idx_usage_time   ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_user    ON transcription_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status  ON transcription_jobs(status);
