# api/services/server.py
"""
FastAPI server wrapping the VideoTranscriber service.
Run with: uvicorn api.services.server:app --reload --port 8000
"""

import os
import sys
import tempfile
from typing import Optional
from enum import Enum

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

# Add parent to path so we can import transcriber
sys.path.insert(0, os.path.dirname(__file__))
from transcriber import VideoTranscriber, TranscriptionType, JobStatus

# ============================================================
# App Setup
# ============================================================

app = FastAPI(
    title="Video Transcription API",
    description="Transcribe videos from URLs or file uploads. Returns word-by-word or timeline formats.",
    version="1.0.0"
)

# Allow CORS (for Node.js API and dashboard)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Lock down in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Single transcriber instance (model loaded once, reused)
transcriber = VideoTranscriber(
    model_size=os.getenv("WHISPER_MODEL", "base"),
    cache_max_age_days=int(os.getenv("CACHE_MAX_AGE_DAYS", "7")),
    cache_max_files=int(os.getenv("CACHE_MAX_FILES", "100"))
)

# In-memory job tracking (for background tasks)
jobs = {}

# ============================================================
# Models
# ============================================================

class TranscriptionFormat(str, Enum):
    word_by_word = "word_by_word"
    timeline = "timeline"

class TranscribeRequest(BaseModel):
    url: HttpUrl
    format: TranscriptionFormat = TranscriptionFormat.word_by_word
    use_cache: bool = True

class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int = 0
    result: Optional[dict] = None
    error: Optional[str] = None

class CacheStatsResponse(BaseModel):
    cache_dir: str
    file_count: int
    total_size_mb: float
    max_files: int
    max_age_days: int

# ============================================================
# Endpoints
# ============================================================

@app.get("/")
async def root():
    """Health check"""
    return {
        "service": "Video Transcription API",
        "version": "1.0.0",
        "status": "healthy",
        "model": transcriber.model_size
    }


@app.post("/transcribe", response_model=JobStatusResponse)
async def transcribe_url(request: TranscribeRequest, background_tasks: BackgroundTasks):
    """
    Submit a video URL for transcription.
    Returns job_id IMMEDIATELY. Poll /transcribe/{job_id} for results.
    """
    import uuid
    
    # Create job IMMEDIATELY
    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "status": JobStatus.DOWNLOADING.value,
        "progress": 0,
        "result": None,
        "error": None
    }
    
    def progress_callback(status: JobStatus, percent: int):
        jobs[job_id]["status"] = status.value
        jobs[job_id]["progress"] = percent
    
    def run_transcription():
        try:
            result = transcriber.transcribe(
                source=str(request.url),
                transcription_type=TranscriptionType(request.format.value),
                is_url=True,
                progress_callback=progress_callback,
                use_cache=request.use_cache
            )
            
            if result.error:
                jobs[job_id]["status"] = JobStatus.FAILED.value
                jobs[job_id]["error"] = result.error
            else:
                jobs[job_id]["status"] = JobStatus.COMPLETED.value
                jobs[job_id]["progress"] = 100
                jobs[job_id]["result"] = _result_to_dict(result)
        except Exception as e:
            jobs[job_id]["status"] = JobStatus.FAILED.value
            jobs[job_id]["error"] = str(e)
    
    # ALWAYS run in background (even cache hits are fast)
    background_tasks.add_task(run_transcription)
    
    # Return job_id INSTANTLY
    return JobStatusResponse(
        job_id=job_id,
        status=JobStatus.DOWNLOADING.value,
        progress=0
    )
    
    # Run transcription in background
    def run_transcription():
        try:
            result = transcriber.transcribe(
                source=str(request.url),
                transcription_type=TranscriptionType(request.format.value),
                is_url=True,
                progress_callback=progress_callback,
                use_cache=request.use_cache
            )
            
            if result.error:
                jobs[job_id]["status"] = JobStatus.FAILED.value
                jobs[job_id]["error"] = result.error
            else:
                jobs[job_id]["status"] = JobStatus.COMPLETED.value
                jobs[job_id]["progress"] = 100
                jobs[job_id]["result"] = _result_to_dict(result)
        except Exception as e:
            jobs[job_id]["status"] = JobStatus.FAILED.value
            jobs[job_id]["error"] = str(e)
    
    background_tasks.add_task(run_transcription)
    
    return JobStatusResponse(
        job_id=job_id,
        status=JobStatus.DOWNLOADING.value,
        progress=0
    )


@app.post("/transcribe/upload", response_model=JobStatusResponse)
async def transcribe_upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    format: str = Form("word_by_word"),
    use_cache: bool = Form(True)
):
    """Upload a video file. Returns job_id IMMEDIATELY."""
    import uuid
    
    # Create job ID IMMEDIATELY
    job_id = str(uuid.uuid4())
    
    # Save uploaded file to temp location
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}")
    content = await file.read()
    temp_file.write(content)
    temp_file.close()
    
    jobs[job_id] = {
        "status": JobStatus.DOWNLOADING.value,
        "progress": 0,
        "result": None,
        "error": None,
        "temp_file": temp_file.name
    }
    
    def progress_callback(status: JobStatus, percent: int):
        jobs[job_id]["status"] = status.value
        jobs[job_id]["progress"] = percent
    
    def run_transcription():
        try:
            result = transcriber.transcribe(
                source=temp_file.name,
                transcription_type=TranscriptionType(format),
                is_url=False,
                progress_callback=progress_callback,
                use_cache=use_cache
            )
            
            if result.error:
                jobs[job_id]["status"] = JobStatus.FAILED.value
                jobs[job_id]["error"] = result.error
            else:
                jobs[job_id]["status"] = JobStatus.COMPLETED.value
                jobs[job_id]["progress"] = 100
                jobs[job_id]["result"] = _result_to_dict(result)
            
            # Cleanup temp file
            if os.path.exists(temp_file.name):
                os.remove(temp_file.name)
        except Exception as e:
            jobs[job_id]["status"] = JobStatus.FAILED.value
            jobs[job_id]["error"] = str(e)
    
    background_tasks.add_task(run_transcription)
    
    # Return job_id INSTANTLY
    return JobStatusResponse(
        job_id=job_id,
        status=JobStatus.DOWNLOADING.value,
        progress=0
    )


@app.get("/transcribe/{job_id}", response_model=JobStatusResponse)
async def get_transcription(job_id: str):
    """
    Get transcription result by job ID.
    Poll this endpoint until status is `completed` or `failed`.
    """
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return JobStatusResponse(
        job_id=job_id,
        status=job["status"],
        progress=job.get("progress", 0),
        result=job.get("result"),
        error=job.get("error")
    )


@app.get("/transcribe/{job_id}/srt")
async def get_transcription_srt(job_id: str):
    """Get transcription as SRT file download"""
    job = jobs.get(job_id)
    if not job or not job.get("result"):
        raise HTTPException(status_code=404, detail="Result not found")
    
    srt = job["result"].get("srt", "")
    return PlainTextResponse(content=srt, media_type="text/plain")


@app.get("/transcribe/{job_id}/vtt")
async def get_transcription_vtt(job_id: str):
    """Get transcription as VTT file download"""
    job = jobs.get(job_id)
    if not job or not job.get("result"):
        raise HTTPException(status_code=404, detail="Result not found")
    
    vtt = job["result"].get("vtt", "")
    return PlainTextResponse(content=vtt, media_type="text/plain")


@app.get("/cache/stats", response_model=CacheStatsResponse)
async def get_cache_stats():
    """Get cache statistics"""
    stats = transcriber.get_cache_stats()
    return CacheStatsResponse(**stats)


@app.delete("/cache")
async def clear_cache():
    """Clear all cached transcriptions"""
    import shutil
    cache_dir = transcriber.cache_dir
    if os.path.exists(cache_dir):
        shutil.rmtree(cache_dir)
        os.makedirs(cache_dir)
    return {"message": "Cache cleared", "cache_dir": cache_dir}


@app.get("/jobs")
async def list_jobs():
    """List all active jobs (for debugging)"""
    return {
        "total": len(jobs),
        "jobs": {
            job_id: {
                "status": job["status"],
                "progress": job.get("progress", 0)
            }
            for job_id, job in jobs.items()
        }
    }


@app.delete("/jobs")
async def cleanup_jobs():
    """Clean up completed/failed jobs from memory"""
    to_remove = [
        job_id for job_id, job in jobs.items()
        if job["status"] in [JobStatus.COMPLETED.value, JobStatus.FAILED.value]
    ]
    for job_id in to_remove:
        del jobs[job_id]
    return {"removed": len(to_remove), "remaining": len(jobs)}


# ============================================================
# Helpers
# ============================================================

def _result_to_dict(result) -> dict:
    """Convert TranscriptionResult to JSON-serializable dict"""
    data = {
        "type": result.type.value,
        "language": result.language,
        "duration": result.duration,
        "title": result.title,
    }
    
    if result.full_text:
        data["full_text"] = result.full_text
    
    if result.segments:
        data["segments"] = [
            {"start": s.start, "end": s.end, "text": s.text}
            for s in result.segments
        ]
    
    if result.srt:
        data["srt"] = result.srt
    
    if result.vtt:
        data["vtt"] = result.vtt
    
    return data


# ============================================================
# Run directly
# ============================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)