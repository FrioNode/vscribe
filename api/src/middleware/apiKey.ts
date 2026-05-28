import { Request, Response, NextFunction } from 'express';
import { getApiKey, updateKeyLastUsed } from '../db/queries';

interface KeyRecord {
  user_id: number;
  user_plan: string;
  email: string;
  limit_hr: number;
  user_active: number;
  verified: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        apiKey: string;
        tier: string;
        email: string;
        limitHr: number;
      };
    }
  }
}

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Add your API key to the X-API-Key header',
      hint: 'Get your free key at /api/v1/auth/register'
    });
  }

  const keyRecord = getApiKey(apiKey) as KeyRecord | undefined;

  if (!keyRecord) {
    return res.status(403).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid or has been revoked'
    });
  }

  if (!keyRecord.user_active) {
    return res.status(403).json({
      error: 'Account suspended',
      message: 'Your account has been deactivated'
    });
  }

  req.user = {
    userId: keyRecord.user_id,
    apiKey,
    tier: keyRecord.user_plan,
    email: keyRecord.email,
    limitHr: keyRecord.limit_hr
  };

  updateKeyLastUsed(apiKey);

  next();
}
