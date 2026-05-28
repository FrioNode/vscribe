import { Queue } from 'bullmq';

// BullMQ creates its own Redis connection internally
// No need to create a separate Redis instance
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || 'node',
};

export const transcriptionQueue = new Queue('transcription', {
  connection: redisOptions,
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
