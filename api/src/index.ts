import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { transcriptionRoutes } from './routes/transcription';
import { apiKeyMiddleware } from './middleware/apiKey';
import { rateLimiter } from './middleware/rateLimit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Simple in-memory rate limiter for health endpoint
const healthChecks: Record<string, { count: number; resetTime: number }> = {};
const HEALTH_LIMIT = 30; // 30 requests per minute per IP
const HEALTH_WINDOW = 60 * 1000; // 1 minute

function healthRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = healthChecks[ip];

  // Reset window
  if (!record || now > record.resetTime) {
    healthChecks[ip] = { count: 1, resetTime: now + HEALTH_WINDOW };
    return next();
  }

  // Check limit
  if (record.count >= HEALTH_LIMIT) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Health check rate limit exceeded',
      retryAfter: Math.ceil((record.resetTime - now) / 1000)
    });
  }

  record.count++;
  next();
}

// Health check (rate limited, no auth required)
app.get('/health', healthRateLimiter, (_req: Request, res: Response) => {
  res.json({
    service: 'Video Transcription API Gateway',
    version: '1.0.0',
    status: 'healthy',
    python_service: process.env.PYTHON_SERVICE_URL
  });
});

// API Routes (with auth + rate limit)
app.use(
  '/api/v1',
  apiKeyMiddleware,
  rateLimiter,
  transcriptionRoutes
);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
  console.log(`📡 Python service: ${process.env.PYTHON_SERVICE_URL}`);
  console.log(`🛡️  Health check: ${HEALTH_LIMIT} req/min per IP`);
});

export default app;
