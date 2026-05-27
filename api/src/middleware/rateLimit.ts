import { Request, Response, NextFunction } from 'express';

const requestCounts: Record<string, { count: number; resetTime: number }> = {};

const TIER_LIMITS: Record<string, number> = {
  free: 10,
  premium: 100,
};

const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.user?.apiKey;
  const tier = req.user?.tier || 'free';
  const limit = TIER_LIMITS[tier] || 10;

  if (!apiKey) return next();

  const now = Date.now();
  const userRequests = requestCounts[apiKey];

  if (!userRequests || now > userRequests.resetTime) {
    requestCounts[apiKey] = { count: 1, resetTime: now + WINDOW_MS };
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', limit - 1);
    return next();
  }

  if (userRequests.count >= limit) {
    const retryAfter = Math.ceil((userRequests.resetTime - now) / 1000);
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `You've used ${userRequests.count}/${limit} requests this hour`,
      retryAfter: `${retryAfter} seconds`,
      tier: tier,
      limit: limit,
      remaining: 0
    });
  }

  userRequests.count++;
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', limit - userRequests.count);
  next();
}
