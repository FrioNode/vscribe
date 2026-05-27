// worker/transcription.worker.ts
import { Worker } from 'bullmq';
import axios from 'axios';

const transcriptionWorker = new Worker('transcribe', async (job) => {
  const { videoUrl, transcriptionType, webhookUrl } = job.data;
  
  // Update progress
  await job.updateProgress(10);
  
  // Call Python service
  const response = await axios.post('http://transcriber:8000/transcribe', {
    video_url: videoUrl,
    transcription_type: transcriptionType
  });
  
  await job.updateProgress(90);
  
  // Save result to database/S3
  const result = await saveTranscription(response.data);
  
  // Send webhook if provided
  if (webhookUrl) {
    await axios.post(webhookUrl, {
      jobId: job.id,
      status: 'completed',
      result
    });
  }
  
  await job.updateProgress(100);
  return result;
}, {
  connection: { host: 'redis' },
  concurrency: 5 // Process 5 jobs simultaneously
});