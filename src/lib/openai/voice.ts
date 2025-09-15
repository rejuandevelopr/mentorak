// OpenAI client is now handled server-side only

export class VoiceTranscriptionError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'VoiceTranscriptionError';
  }
}

export interface TranscriptionOptions {
  language?: string;
  prompt?: string;
  temperature?: number;
}

export async function transcribeAudio(
  audioBlob: Blob,
  options: TranscriptionOptions = {}
): Promise<string> {
  if (!audioBlob || audioBlob.size === 0) {
    throw new VoiceTranscriptionError(
      'Audio blob is empty or invalid',
      'INVALID_AUDIO'
    );
  }

  // Check if audio blob is too large (25MB limit for Whisper)
  const maxSize = 25 * 1024 * 1024; // 25MB
  if (audioBlob.size > maxSize) {
    throw new VoiceTranscriptionError(
      'Audio file is too large. Maximum size is 25MB.',
      'FILE_TOO_LARGE'
    );
  }

  try {
    // Send to server-side API endpoint
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    formData.append('language', options.language || 'en');
    formData.append('temperature', String(options.temperature || 0));

    const response = await fetch('/api/transcribe-audio', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new VoiceTranscriptionError(
        errorData.error || 'Transcription failed',
        errorData.code || 'API_ERROR'
      );
    }

    const result = await response.json();
    return result.transcript;

  } catch (error) {
    if (error instanceof VoiceTranscriptionError) {
      throw error;
    }

    // Handle network errors
    throw new VoiceTranscriptionError(
      'Failed to transcribe audio. Please check your internet connection.',
      'NETWORK_ERROR'
    );
  }
}

export async function transcribeAudioWithRetry(
  audioBlob: Blob,
  options: TranscriptionOptions = {},
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await transcribeAudio(audioBlob, options);
    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof VoiceTranscriptionError && error.code === 'RATE_LIMIT') {
        if (attempt < maxRetries) {
          // Exponential backoff: wait 2^attempt seconds
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      // For non-rate-limit errors, don't retry
      throw error;
    }
  }

  throw lastError!;
}

// Utility function to check if browser supports audio recording
export function isAudioRecordingSupported(): boolean {
  return !!(
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    typeof window !== 'undefined' &&
    window.MediaRecorder
  );
}

// Utility function to get supported audio formats
export function getSupportedAudioFormats(): string[] {
  const formats = ['audio/webm', 'audio/mp4', 'audio/ogg'];
  return formats.filter(format => MediaRecorder.isTypeSupported(format));
}