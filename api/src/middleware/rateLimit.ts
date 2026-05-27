// api/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Different limits based on API key tier
    const tier = req.user.tier;
    return tier === 'premium' ? 100 : 10;
  },
  keyGenerator: (req) => req.headers['x-api-key']
});