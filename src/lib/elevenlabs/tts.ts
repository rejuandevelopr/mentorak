export class TTSError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'TTSError';
  }
}

export interface TTSOptions {
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

const DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam voice
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export async function generateSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<string> {
  const {
    voiceId = DEFAULT_VOICE_ID,
    stability = 0.5,
    similarityBoost = 0.75,
    style = 0,
    useSpeakerBoost = true
  } = options;

  if (!text || text.trim().length === 0) {
    throw new TTSError(
      'Text content is required for speech generation',
      'EMPTY_TEXT'
    );
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    throw new TTSError(
      'ElevenLabs API key is not configured',
      'MISSING_API_KEY'
    );
  }

  // Check text length (ElevenLabs has limits)
  if (text.length > 5000) {
    throw new TTSError(
      'Text is too long. Maximum length is 5000 characters.',
      'TEXT_TOO_LONG'
    );
  }

  try {
    const voiceSettings: VoiceSettings = {
      stability,
      similarity_boost: similarityBoost,
      style,
      use_speaker_boost: useSpeakerBoost
    };

    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: voiceSettings,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Unknown error occurred';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail?.message || errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      if (response.status === 401) {
        throw new TTSError(
          'Invalid ElevenLabs API key',
          'INVALID_API_KEY'
        );
      }
      if (response.status === 429) {
        throw new TTSError(
          'Rate limit exceeded. Please try again later.',
          'RATE_LIMIT'
        );
      }
      if (response.status === 422) {
        throw new TTSError(
          'Invalid request parameters',
          'INVALID_PARAMETERS'
        );
      }
      
      throw new TTSError(
        `ElevenLabs API error: ${errorMessage}`,
        'API_ERROR'
      );
    }

    const audioBuffer = await response.arrayBuffer();
    
    if (audioBuffer.byteLength === 0) {
      throw new TTSError(
        'No audio data received from ElevenLabs',
        'NO_AUDIO_DATA'
      );
    }

    // Convert ArrayBuffer to Blob and create URL
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);

    return audioUrl;

  } catch (error) {
    if (error instanceof TTSError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new TTSError(
        'Failed to connect to ElevenLabs. Please check your internet connection.',
        'NETWORK_ERROR'
      );
    }

    throw new TTSError(
      'Failed to generate speech. Please try again.',
      'UNKNOWN_ERROR'
    );
  }
}

export async function generateSpeechWithRetry(
  text: string,
  options: TTSOptions = {},
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generateSpeech(text, options);
    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof TTSError && error.code === 'RATE_LIMIT') {
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

// Cache management for audio URLs
const audioCache = new Map<string, string>();

export function getCachedAudio(text: string): string | null {
  return audioCache.get(text) || null;
}

export function setCachedAudio(text: string, audioUrl: string): void {
  audioCache.set(text, audioUrl);
  
  // Clean up old cache entries if cache gets too large
  if (audioCache.size > 100) {
    const firstKey = audioCache.keys().next().value;
    if (firstKey) {
      const oldUrl = audioCache.get(firstKey);
      if (oldUrl) {
        URL.revokeObjectURL(oldUrl);
      }
      audioCache.delete(firstKey);
    }
  }
}

export function clearAudioCache(): void {
  // Revoke all object URLs to free memory
  audioCache.forEach(url => URL.revokeObjectURL(url));
  audioCache.clear();
}

// Utility function to preload audio for better UX
export async function preloadQuestionAudio(
  questions: Array<{ text: string }>,
  options: TTSOptions = {}
): Promise<Map<string, string>> {
  const audioMap = new Map<string, string>();
  
  for (const question of questions) {
    try {
      // Check cache first
      const cachedUrl = getCachedAudio(question.text);
      if (cachedUrl) {
        audioMap.set(question.text, cachedUrl);
        continue;
      }
      
      // Generate new audio
      const audioUrl = await generateSpeech(question.text, options);
      setCachedAudio(question.text, audioUrl);
      audioMap.set(question.text, audioUrl);
      
      // Add small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.warn(`Failed to preload audio for question: ${question.text}`, error);
      // Continue with other questions even if one fails
    }
  }
  
  return audioMap;
}