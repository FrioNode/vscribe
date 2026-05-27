import { Request, Response, NextFunction } from 'express';

// Load from environment variables
const VALID_API_KEYS: Record<string, { tier: string; email: string }> = {
  [process.env.API_KEY_FREE || 'test-key-free-123']: {
    tier: 'free',
    email: 'free@test.com'
  },
  [process.env.API_KEY_PREMIUM || 'test-key-premium-456']: {
    tier: 'premium',
    email: 'premium@test.com'
  },
};

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        apiKey: string;
        tier: string;
        email: string;
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
      hint: 'Get your free key at /api/v1/register'
    });
  }

  const user = VALID_API_KEYS[apiKey];

  if (!user) {
    return res.status(403).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }

  // Attach user info to request
  req.user = {
    apiKey,
    tier: user.tier,
    email: user.email
  };

  next();
}
