import { Worker, Job, ConnectionOptions } from 'bullmq';
import axios from 'axios';

const PYTHON_SERVICE = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

// Same auto-detect logic
function getRedisConnection(): ConnectionOptions {
  if (process.env.UPSTASH_REDIS_URL) {
    console.log('🔗 Worker using Upstash Redis');
    return { url: process.env.UPSTASH_REDIS_URL, tls: {} };
  }
  if (process.env.REDIS_URL) {
    console.log('🔗 Worker using Redis URL');
    return {
      url: process.env.REDIS_URL,
      tls: process.env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
    };
  }
  console.log('🔗 Worker using local Redis');
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || 'node',
  };
}

interface TranscriptionJob {
  source: string;
  format: 'word_by_word' | 'timeline';
  isUrl: boolean;
  userId?: string;
  webhookUrl?: string;
}

const worker = new Worker(
  'transcription',
  async (job: Job<TranscriptionJob>) => {
    const { source, format, isUrl, webhookUrl } = job.data;
    console.log(`🎯 Processing job ${job.id}: ${source.slice(0, 50)}...`);

    await job.updateProgress(10);
    await job.log('Submitting to Python service...');

    try {
      const response = await axios.post(`${PYTHON_SERVICE}/transcribe`, {
        url: isUrl ? source : undefined,
        format,
        use_cache: true,
      }, { timeout: 600000 });

      const pythonJobId = response.data.job_id;
      await job.log(`Python job created: ${pythonJobId}`);
      await job.updateProgress(20);

      let result = null;
      let attempts = 0;
      const maxAttempts = 300;

      while (attempts < maxAttempts) {
        const statusResponse = await axios.get(`${PYTHON_SERVICE}/transcribe/${pythonJobId}`);
        const data = statusResponse.data;

        if (data.status === 'completed') {
          result = data.result;
          await job.updateProgress(100);
          await job.log('Transcription completed');
          break;
        }
        if (data.status === 'failed') {
          throw new Error(data.error || 'Transcription failed');
        }

        const progress = 20 + (data.progress * 0.7);
        await job.updateProgress(Math.round(progress));
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      if (!result) throw new Error('Transcription timed out');

      if (webhookUrl) {
        axios.post(webhookUrl, { jobId: job.id, status: 'completed', result }).catch(() => {});
      }

      return result;
    } catch (error: any) {
      await job.log(`Error: ${error.message}`);
      throw error;
    }
  },
  {
    connection: getRedisConnection(),
    concurrency: 2,
    limiter: { max: 5, duration: 60000 },
  }
);

worker.on('completed', (job) => console.log(`✅ Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`❌ Job ${job?.id} failed:`, err.message));
worker.on('progress', (job, progress) => console.log(`📊 Job ${job.id}: ${progress}%`));

console.log('👷 Transcription worker started');
console.log('   Concurrency: 2');
console.log('   Rate limit: 5/min');

export { worker };
