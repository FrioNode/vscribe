import { Queue, ConnectionOptions } from 'bullmq';

// Auto-detect Redis connection type
function getRedisConnection(): ConnectionOptions {
  // Priority 1: Upstash / Cloud Redis URL
  if (process.env.UPSTASH_REDIS_URL) {
    console.log('🔗 Using Upstash Redis');
    return {
      url: process.env.UPSTASH_REDIS_URL,
      tls: {}, // Required for Upstash
    };
  }

  // Priority 2: Generic Redis URL
  if (process.env.REDIS_URL) {
    console.log('🔗 Using Redis URL');
    return {
      url: process.env.REDIS_URL,
      tls: process.env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
    };
  }

  // Priority 3: Local Redis (default)
  console.log('🔗 Using local Redis');
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || 'node',
  };
}

export const transcriptionQueue = new Queue('transcription', {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const PRIORITY = {
  LOW: 10,
  NORMAL: 5,
  HIGH: 1,
};
