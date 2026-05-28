import { Router, Request, Response } from 'express';
import { transcriptionQueue, PRIORITY } from '../config/queue';
import { randomUUID } from 'crypto';

const router = Router();

// Helper to generate unique, human-readable job IDs
const generateJobId = (): string => {
  return `txr_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
};

// POST /api/v1/transcribe - URL
router.post('/transcribe', async (req: Request, res: Response) => {
  try {
    const { url, format = 'word_by_word', webhook_url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`📥 Queueing URL: ${url.slice(0, 50)}...`);

    const priority = req.user?.tier === 'premium' ? PRIORITY.HIGH : PRIORITY.NORMAL;
    const jobId = generateJobId();

    const job = await transcriptionQueue.add('transcribe-url', {
      source: url,
      format,
      isUrl: true,
      userId: req.user?.apiKey,
      webhookUrl: webhook_url,
    }, {
      priority,
      jobId,  // Explicit unique job ID
      removeOnComplete: {
        age: 3600, // Auto-cleanup after 1 hour
      },
      removeOnFail: {
        age: 86400, // Keep failures for 24 hours for debugging
      },
    });

    console.log(`✅ Queued as: ${job.id}`);

    return res.status(202).json({
      message: 'Transcription queued',
      job_id: job.id,
      status: 'queued',
      _links: {
        status: `/api/v1/transcribe/${job.id}`,
        result: `/api/v1/transcribe/${job.id}/result`,
      }
    });
  } catch (error: any) {
    console.error('❌ Queue error:', error.message);
    return res.status(502).json({ error: 'Queue service error', message: error.message });
  }
});

// GET /api/v1/transcribe/:jobId
router.get('/transcribe/:jobId', async (req: Request, res: Response) => {
  try {
    const jobId = req.params.jobId as string;
    const job = await transcriptionQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    const progress = job.progress;

    return res.json({
      job_id: job.id,
      status: state,
      progress: progress,
      result: state === 'completed' ? job.returnvalue : null,
      error: state === 'failed' ? job.failedReason : null,
      attempts: job.attemptsMade,
    });
  } catch (error: any) {
    return res.status(502).json({ error: 'Service error' });
  }
});

// GET /api/v1/transcribe/:jobId/result
router.get('/transcribe/:jobId/result', async (req: Request, res: Response) => {
  try {
    const jobId = req.params.jobId as string;
    const job = await transcriptionQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    if (state !== 'completed') {
      return res.status(202).json({
        message: 'Still processing',
        status: state,
        progress: job.progress,
      });
    }

    return res.json(job.returnvalue);
  } catch (error: any) {
    return res.status(502).json({ error: 'Service error' });
  }
});

// GET /api/v1/queue/stats
router.get('/queue/stats', async (_req: Request, res: Response) => {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      transcriptionQueue.getWaitingCount(),
      transcriptionQueue.getActiveCount(),
      transcriptionQueue.getCompletedCount(),
      transcriptionQueue.getFailedCount(),
      transcriptionQueue.getDelayedCount(),
    ]);

    return res.json({
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    });
  } catch (error: any) {
    return res.status(502).json({ error: 'Service error', message: error.message });
  }
});

export { router as transcriptionRoutes };