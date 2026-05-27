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

// Health check (no auth required)
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    service: 'Video Transcription API Gateway',
    version: '1.0.0',
    status: 'healthy',
    python_service: process.env.PYTHON_SERVICE_URL
  });
});

// API Routes (with auth)
app.use(
  '/api/v1',
  apiKeyMiddleware,  // Validate API key first
  rateLimiter,        // Then check rate limits
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
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});

export default app;
