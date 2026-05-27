import { Router, Request, Response } from 'express';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';

const router = Router();
const PYTHON_SERVICE = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

// Multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

// POST /api/v1/transcribe - URL
router.post('/transcribe', async (req: Request, res: Response) => {
  console.log('📥 POST /transcribe (URL)');
  
  try {
    const { url, format = 'word_by_word', use_cache = true } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const response = await axios.post(`${PYTHON_SERVICE}/transcribe`, { url, format, use_cache });
    const data = response.data;
    console.log('✅ Job created:', data.job_id);

    return res.status(202).json({
      message: 'Transcription job submitted',
      job_id: data.job_id,
      status: data.status,
      _links: {
        status: `/api/v1/transcribe/${data.job_id}`,
        result: `/api/v1/transcribe/${data.job_id}/result`,
        srt: `/api/v1/transcribe/${data.job_id}/srt`,
        vtt: `/api/v1/transcribe/${data.job_id}/vtt`
      }
    });
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return res.status(502).json({ error: 'Service error', message: error.message });
  }
});

// POST /api/v1/transcribe/upload - File
router.post('/transcribe/upload', upload.single('file'), async (req: Request, res: Response) => {
  console.log('📥 POST /transcribe/upload (File)');
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`   File: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

    const format = req.body.format || 'word_by_word';
    
    // Build form data for Python service
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    formData.append('format', format);

    const response = await axios.post(
      `${PYTHON_SERVICE}/transcribe/upload`,
      formData,
      { headers: formData.getHeaders() }
    );

    const data = response.data;
    console.log('✅ Job created:', data.job_id);

    return res.status(202).json({
      message: 'File uploaded and transcription started',
      job_id: data.job_id,
      filename: req.file.originalname,
      size: req.file.size,
      _links: {
        status: `/api/v1/transcribe/${data.job_id}`,
        result: `/api/v1/transcribe/${data.job_id}/result`
      }
    });
  } catch (error: any) {
    console.error('❌ Upload error:', error.message);
    return res.status(502).json({ error: 'Upload service error', message: error.message });
  }
});

// GET /api/v1/transcribe/:jobId
router.get('/transcribe/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const response = await axios.get(`${PYTHON_SERVICE}/transcribe/${jobId}`);
    return res.json(response.data);
  } catch (error: any) {
    return res.status(404).json({ error: 'Job not found' });
  }
});

// GET /api/v1/transcribe/:jobId/result
router.get('/transcribe/:jobId/result', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const response = await axios.get(`${PYTHON_SERVICE}/transcribe/${jobId}`);
    const data = response.data;
    if (data.status !== 'completed') {
      return res.status(202).json({ message: 'Still processing', status: data.status });
    }
    return res.json(data.result);
  } catch (error: any) {
    return res.status(502).json({ error: 'Service error' });
  }
});

// GET /api/v1/transcribe/:jobId/srt
router.get('/transcribe/:jobId/srt', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const response = await axios.get(`${PYTHON_SERVICE}/transcribe/${jobId}/srt`);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="transcript_${jobId}.srt"`);
    return res.send(response.data);
  } catch (error: any) {
    return res.status(502).json({ error: 'Service error' });
  }
});

// GET /api/v1/transcribe/:jobId/vtt
router.get('/transcribe/:jobId/vtt', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const response = await axios.get(`${PYTHON_SERVICE}/transcribe/${jobId}/vtt`);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="transcript_${jobId}.vtt"`);
    return res.send(response.data);
  } catch (error: any) {
    return res.status(502).json({ error: 'Service error' });
  }
});

// GET /api/v1/cache/stats
router.get('/cache/stats', async (_req: Request, res: Response) => {
  try {
    const response = await axios.get(`${PYTHON_SERVICE}/cache/stats`);
    return res.json(response.data);
  } catch (error: any) {
    return res.status(502).json({ error: 'Service error' });
  }
});

export { router as transcriptionRoutes };
