// api/src/routes/transcription.ts
import { FastifyInstance } from 'fastify';
import { transcriptionQueue } from '../services/queue';

export async function transcriptionRoutes(app: FastifyInstance) {
  // Submit transcription job
  app.post('/api/transcribe', async (request, reply) => {
    const { videoUrl, transcriptionType, apiKey } = request.body;
    
    // Validate API key
    const user = await validateApiKey(apiKey);
    
    // Add to queue
    const job = await transcriptionQueue.add('transcribe', {
      videoUrl,
      transcriptionType: transcriptionType, // 'word-by-word' or 'timeline'
      userId: user.id,
      webhookUrl: request.body.webhookUrl
    });
    
    return { 
      jobId: job.id,
      status: 'queued',
      estimatedTime: '2-5 minutes'
    };
  });
  
  // Check job status
  app.get('/api/transcribe/:jobId/status', async (request, reply) => {
    const job = await transcriptionQueue.getJob(request.params.jobId);
    return {
      status: await job.getState(),
      progress: job.progress
    };
  });
}