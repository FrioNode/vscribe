export interface TranscriptionRequest {
  url?: string;
  format?: 'word_by_word' | 'timeline';
  use_cache?: boolean;
}

export interface TranscriptionResponse {
  job_id: string;
  status: string;
  progress: number;
  result?: TranscriptionResult;
  error?: string;
}

export interface TranscriptionResult {
  type: string;
  language: string;
  duration: number;
  title?: string;
  full_text?: string;
  segments?: TimelineSegment[];
  srt?: string;
  vtt?: string;
}

export interface TimelineSegment {
  start: number;
  end: number;
  text: string;
}

export interface ApiUser {
  id: string;
  email: string;
  apiKey: string;
  tier: 'free' | 'premium';
  requestCount: number;
  createdAt: Date;
}

export interface CacheStats {
  cache_dir: string;
  file_count: number;
  total_size_mb: number;
  max_files: number;
  max_age_days: number;
}
