import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock OpenAI first
const mockOpenAI = {
  audio: {
    transcriptions: {
      create: vi.fn()
    }
  }
};

vi.mock('openai', () => ({
  default: vi.fn(() => mockOpenAI)
}));

import { 
  transcribeAudio, 
  transcribeAudioWithRetry, 
  isAudioRecordingSupported,
  getSupportedAudioFormats,
  VoiceTranscriptionError 
} from '@/lib/openai/voice';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    OPENAI_API_KEY: 'test-api-key'
  }
}));

describe('OpenAI Voice Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('transcribeAudio', () => {
    it('successfully transcribes audio blob', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const expectedTranscription = 'Hello world';
      
      mockOpenAI.audio.transcriptions.create.mockResolvedValueOnce(expectedTranscription);

      const result = await transcribeAudio(mockBlob);

      expect(result).toBe(expectedTranscription);
      expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalledWith({
        file: expect.any(File),
        model: 'whisper-1',
        language: 'en',
        temperature: 0,
        response_format: 'text'
      });
    });

    it('throws error for empty audio blob', async () => {
      const emptyBlob = new Blob([], { type: 'audio/webm' });

      await expect(transcribeAudio(emptyBlob)).rejects.toThrow(VoiceTranscriptionError);
      await expect(transcribeAudio(emptyBlob)).rejects.toThrow('Audio blob is empty or invalid');
    });

    it('throws error for audio blob that is too large', async () => {
      // Create a mock blob that reports large size
      const largeBlob = Object.create(Blob.prototype);
      Object.defineProperty(largeBlob, 'size', { value: 26 * 1024 * 1024 }); // 26MB

      await expect(transcribeAudio(largeBlob)).rejects.toThrow(VoiceTranscriptionError);
      await expect(transcribeAudio(largeBlob)).rejects.toThrow('Audio file is too large');
    });

    it('throws error when no response received', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      
      mockOpenAI.audio.transcriptions.create.mockResolvedValueOnce(null);

      await expect(transcribeAudio(mockBlob)).rejects.toThrow(VoiceTranscriptionError);
      await expect(transcribeAudio(mockBlob)).rejects.toThrow('No transcription received from OpenAI');
    });

    it('throws error when transcription is empty', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      
      mockOpenAI.audio.transcriptions.create.mockResolvedValueOnce('   ');

      await expect(transcribeAudio(mockBlob)).rejects.toThrow(VoiceTranscriptionError);
      await expect(transcribeAudio(mockBlob)).rejects.toThrow('No speech detected in audio');
    });

    it('handles OpenAI API rate limit error', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const apiError = { status: 429, message: 'Rate limit exceeded' };
      
      mockOpenAI.audio.transcriptions.create.mockRejectedValueOnce(apiError);

      await expect(transcribeAudio(mockBlob)).rejects.toThrow(VoiceTranscriptionError);
      await expect(transcribeAudio(mockBlob)).rejects.toThrow('Rate limit exceeded');
    });

    it('handles OpenAI API authentication error', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const apiError = { status: 401, message: 'Invalid API key' };
      
      mockOpenAI.audio.transcriptions.create.mockRejectedValueOnce(apiError);

      await expect(transcribeAudio(mockBlob)).rejects.toThrow(VoiceTranscriptionError);
      await expect(transcribeAudio(mockBlob)).rejects.toThrow('Invalid API key configuration');
    });

    it('handles OpenAI API file too large error', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const apiError = { status: 413, message: 'File too large' };
      
      mockOpenAI.audio.transcriptions.create.mockRejectedValueOnce(apiError);

      await expect(transcribeAudio(mockBlob)).rejects.toThrow(VoiceTranscriptionError);
      await expect(transcribeAudio(mockBlob)).rejects.toThrow('Audio file is too large');
    });

    it('handles generic OpenAI API error', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const apiError = { status: 500, message: 'Internal server error' };
      
      mockOpenAI.audio.transcriptions.create.mockRejectedValueOnce(apiError);

      await expect(transcribeAudio(mockBlob)).rejects.toThrow(VoiceTranscriptionError);
      await expect(transcribeAudio(mockBlob)).rejects.toThrow('OpenAI API error: Internal server error');
    });

    it('handles network error', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      
      mockOpenAI.audio.transcriptions.create.mockRejectedValueOnce(new Error('Network error'));

      await expect(transcribeAudio(mockBlob)).rejects.toThrow(VoiceTranscriptionError);
      await expect(transcribeAudio(mockBlob)).rejects.toThrow('Failed to transcribe audio');
    });

    it('uses custom options when provided', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const options = {
        language: 'es',
        temperature: 0.5,
        prompt: 'Custom prompt'
      };
      
      mockOpenAI.audio.transcriptions.create.mockResolvedValueOnce('Hola mundo');

      await transcribeAudio(mockBlob, options);

      expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalledWith({
        file: expect.any(File),
        model: 'whisper-1',
        language: 'es',
        temperature: 0.5,
        response_format: 'text'
      });
    });
  });

  describe('transcribeAudioWithRetry', () => {
    it('succeeds on first attempt', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const expectedTranscription = 'Hello world';
      
      mockOpenAI.audio.transcriptions.create.mockResolvedValueOnce(expectedTranscription);

      const result = await transcribeAudioWithRetry(mockBlob);

      expect(result).toBe(expectedTranscription);
      expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalledTimes(1);
    });

    it('retries on rate limit error', async () => {
      vi.useFakeTimers();
      
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const rateLimit = { status: 429, message: 'Rate limit exceeded' };
      const expectedTranscription = 'Hello world';
      
      mockOpenAI.audio.transcriptions.create
        .mockRejectedValueOnce(rateLimit)
        .mockResolvedValueOnce(expectedTranscription);

      const resultPromise = transcribeAudioWithRetry(mockBlob);
      
      // Fast-forward through the retry delay
      await vi.advanceTimersByTimeAsync(2000);
      
      const result = await resultPromise;

      expect(result).toBe(expectedTranscription);
      expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalledTimes(2);
      
      vi.useRealTimers();
    });

    it('does not retry on non-rate-limit errors', async () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const authError = { status: 401, message: 'Invalid API key' };
      
      mockOpenAI.audio.transcriptions.create.mockRejectedValueOnce(authError);

      await expect(transcribeAudioWithRetry(mockBlob)).rejects.toThrow(VoiceTranscriptionError);
      expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalledTimes(1);
    });

    it('fails after max retries', async () => {
      vi.useFakeTimers();
      
      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });
      const rateLimit = { status: 429, message: 'Rate limit exceeded' };
      
      mockOpenAI.audio.transcriptions.create.mockRejectedValue(rateLimit);

      const resultPromise = transcribeAudioWithRetry(mockBlob, {}, 2);
      
      // Fast-forward through all retry delays
      await vi.advanceTimersByTimeAsync(10000);
      
      await expect(resultPromise).rejects.toThrow(VoiceTranscriptionError);
      expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalledTimes(2);
      
      vi.useRealTimers();
    });
  });

  describe('isAudioRecordingSupported', () => {
    it('returns true when all required APIs are available', () => {
      // Mock browser APIs
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: { getUserMedia: vi.fn() },
        configurable: true
      });
      Object.defineProperty(global, 'MediaRecorder', {
        value: vi.fn(),
        configurable: true
      });

      const result = isAudioRecordingSupported();
      expect(result).toBe(true);
    });

    it('returns false when mediaDevices is not available', () => {
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: undefined,
        configurable: true
      });

      const result = isAudioRecordingSupported();
      expect(result).toBe(false);
    });

    it('returns false when getUserMedia is not available', () => {
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: {},
        configurable: true
      });

      const result = isAudioRecordingSupported();
      expect(result).toBe(false);
    });

    it('returns false when MediaRecorder is not available', () => {
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: { getUserMedia: vi.fn() },
        configurable: true
      });
      Object.defineProperty(global, 'MediaRecorder', {
        value: undefined,
        configurable: true
      });

      const result = isAudioRecordingSupported();
      expect(result).toBe(false);
    });
  });

  describe('getSupportedAudioFormats', () => {
    it('returns supported formats', () => {
      Object.defineProperty(global, 'MediaRecorder', {
        value: {
          isTypeSupported: vi.fn((format) => format === 'audio/webm')
        },
        configurable: true
      });

      const result = getSupportedAudioFormats();
      expect(result).toEqual(['audio/webm']);
    });

    it('returns empty array when no formats are supported', () => {
      Object.defineProperty(global, 'MediaRecorder', {
        value: {
          isTypeSupported: vi.fn(() => false)
        },
        configurable: true
      });

      const result = getSupportedAudioFormats();
      expect(result).toEqual([]);
    });

    it('handles missing MediaRecorder', () => {
      Object.defineProperty(global, 'MediaRecorder', {
        value: undefined,
        configurable: true
      });

      expect(() => getSupportedAudioFormats()).toThrow();
    });
  });
});