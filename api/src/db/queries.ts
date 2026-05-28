import db from './init';
import { randomBytes } from 'crypto';

// ── Pending Registrations ────────────────
export const savePendingRegistration = (email: string, hashedPassword: string, otp: string, expiresInMinutes = 10) => {
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  return db.prepare('INSERT OR REPLACE INTO pending_registrations (email, password, otp, expires_at) VALUES (?, ?, ?, ?)').run(email, hashedPassword, otp, expiresAt);
};

export const getPendingRegistration = (email: string) =>
  db.prepare('SELECT * FROM pending_registrations WHERE email = ? AND expires_at > ?').get(email, Date.now()) as any;

export const deletePendingRegistration = (email: string) =>
  db.prepare('DELETE FROM pending_registrations WHERE email = ?').run(email);

// ── Users ────────────────────────────────
export const getUserByEmail = (email: string) =>
  db.prepare('SELECT * FROM users WHERE email = ? AND active = 1').get(email) as any;

export const getUserById = (id: number) =>
  db.prepare('SELECT * FROM users WHERE id = ? AND active = 1').get(id) as any;

export const createUser = (email: string, hashedPassword: string) =>
  db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hashedPassword).lastInsertRowid as number;

export const updateUserPassword = (email: string, hashedPassword: string) =>
  db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, email);

// ── Password Resets ──────────────────────
export const savePasswordResetOTP = (email: string, otp: string, expiresInMinutes = 10) => {
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  return db.prepare('INSERT OR REPLACE INTO password_resets (email, otp, expires_at) VALUES (?, ?, ?)').run(email, otp, expiresAt);
};

export const verifyPasswordResetOTP = (email: string, otp: string): boolean => {
  const record = db.prepare('SELECT * FROM password_resets WHERE email = ? AND otp = ? AND expires_at > ?').get(email, otp, Date.now());
  if (record) {
    db.prepare('DELETE FROM password_resets WHERE email = ?').run(email);
    return true;
  }
  return false;
};

// ── API Keys ─────────────────────────────
export const getApiKey = (key: string) =>
  db.prepare(`
    SELECT k.*, u.email, u.plan as user_plan, u.active as user_active
    FROM api_keys k JOIN users u ON k.user_id = u.id
    WHERE k.key = ? AND k.active = 1
  `).get(key) as any;

export const generateApiKey = () => 'txr_' + randomBytes(16).toString('hex');

export const createApiKey = (userId: number, label = 'Default', plan = 'free') => {
  const key = generateApiKey();
  const limitHr = plan === 'premium' ? 100 : plan === 'enterprise' ? 1000 : 10;
  db.prepare('INSERT INTO api_keys (key, user_id, plan, limit_hr, label) VALUES (?, ?, ?, ?, ?)').run(key, userId, plan, limitHr, label);
  return key;
};

export const getUserApiKeys = (userId: number) =>
  db.prepare('SELECT key, plan, limit_hr, label, last_used, created_at FROM api_keys WHERE user_id = ? AND active = 1').all(userId);

export const updateKeyLastUsed = (key: string) =>
  db.prepare('UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE key = ?').run(key);

export const revokeApiKey = (key: string, userId: number) =>
  db.prepare('UPDATE api_keys SET active = 0, rotated_at = CURRENT_TIMESTAMP WHERE key = ? AND user_id = ?').run(key, userId);

export const rotateApiKey = (oldKey: string, userId: number, label?: string) => {
  const existing = db.prepare('SELECT * FROM api_keys WHERE key = ? AND user_id = ? AND active = 1').get(oldKey, userId) as any;
  if (!existing) return null;
  
  revokeApiKey(oldKey, userId);
  return createApiKey(userId, label || existing.label, existing.plan);
};

// ── Usage Logging ─────────────────────────
export const logUsage = (userId: number, apiKey: string, endpoint: string, source: string, jobId: string, status: string, ip: string) =>
  db.prepare('INSERT INTO usage_logs (user_id, api_key, endpoint, source, job_id, status, ip) VALUES (?, ?, ?, ?, ?, ?, ?)').run(userId, apiKey, endpoint, source || '', jobId || '', status, ip || '');

export const getUsageStats = (userId: number, hours = 24) =>
  db.prepare(`
    SELECT COUNT(*) as total, SUM(CASE WHEN status = 'ok' THEN 1 ELSE 0 END) as success
    FROM usage_logs WHERE user_id = ? AND created_at > datetime('now', '-' || ? || ' hours')
  `).get(userId, hours) as any;

// ── Transcription Jobs ────────────────────
export const createJobRecord = (jobId: string, userId: number, apiKey: string, source: string, format: string) =>
  db.prepare('INSERT INTO transcription_jobs (id, user_id, api_key, source, format) VALUES (?, ?, ?, ?, ?)').run(jobId, userId, apiKey, source, format);

export const updateJobStatus = (jobId: string, status: string, result?: string, error?: string) =>
  status === 'completed'
    ? db.prepare('UPDATE transcription_jobs SET status = ?, result = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, result || null, jobId)
    : db.prepare('UPDATE transcription_jobs SET status = ?, error = ? WHERE id = ?').run(status, error || null, jobId);

export const getJobRecord = (jobId: string) =>
  db.prepare('SELECT * FROM transcription_jobs WHERE id = ?').get(jobId);

export const getUserJobs = (userId: number, limit = 20) =>
  db.prepare('SELECT * FROM transcription_jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit);
