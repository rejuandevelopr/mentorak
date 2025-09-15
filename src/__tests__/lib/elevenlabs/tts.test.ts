import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  generateSpeech, 
  generateSpeechWithRetry,
  getCachedAudio,
  setCachedAudio,
  clearAudioCache,
  preloadQuestionAudio,
  TTSError 
} from '@/lib/elevenlabs/tts';

// Mock fetch
global.fetch = vi.fn();

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(global.URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mock-audio-url')
});

Object.defineProperty(global.URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn()
});

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv, ELEVENLABS_API_KEY: 'test-api-key' };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('ElevenLabs TTS Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAudioCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateSpeech', () => {
    it('successfully generates speech from text', async () => {
      const mockArrayBuffer = new ArrayBuffer(1000);
      const mockResponse = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
      };
      
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

      const result = await generateSpeech('Hello world');

      expect(result).toBe('mock-audio-url');
      expect(fetch).toHaveBeenCalledWith(
        'https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB',
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': 'test-api-key',
          },
          body: JSON.stringify({
            text: 'Hello world',
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0,
              use_speaker_boost: true
            }
          })
        }
      );
    });

    it('throws error for empty text', async () => {
      await expect(generateSpeech('')).rejects.toThrow(TTSError);
      await expect(generateSpeech('')).rejects.toThrow('Text content is required');
    });

    it('throws error for text that is too long', async () => {
      const longText = 'a'.repeat(5001);
      
      await expect(generateSpeech(longText)).rejects.toThrow(TTSError);
      await expect(generateSpeech(longText)).rejects.toThrow('Text is too long');
    });

    it('throws error when API key is missing', async () => {
      vi.doMock('process', () => ({
        env: {}
      }));

      await expect(generateSpeech('Hello world')).rejects.toThrow(TTSError);
      await expect(generateSpeech('Hello world')).rejects.toThrow('ElevenLabs API key is not configured');
    });

    it('handles API authentication error', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue('{"message": "Invalid API key"}')
      };
      
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

      await expect(generateSpeech('Hello world')).rejects.toThrow(TTSError);
      await expect(generateSpeech('Hello world')).rejects.toThrow('Invalid ElevenLabs API key');
    });

    it('handles API rate limit error', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        text: vi.fn().mockResolvedValue('{"message": "Rate limit exceeded"}')
      };
      
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

      await expect(generateSpeech('Hello world')).rejects.toThrow(TTSError);
      await expect(generateSpeech('Hello world')).rejects.toThrow('Rate limit exceeded');
    });

    it('handles API validation error', async () => {
      const mockResponse = {
        ok: false,
        status: 422,
        text: vi.fn().mockResolvedValue('{"message": "Invalid parameters"}')
      };
      
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

      await expect(generateSpeech('Hello world')).rejects.toThrow(TTSError);
      await expect(generateSpeech('Hello world')).rejects.toThrow('Invalid request parameters');
    });

    it('handles generic API error', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('{"message": "Internal server error"}')
      };
      
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

      await expect(generateSpeech('Hello world')).rejects.toThrow(TTSError);
      await expect(generateSpeech('Hello world')).rejects.toThrow('ElevenLabs API error: Internal server error');
    });

    it('handles empty audio response', async () => {
      const mockResponse = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
      };
      
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

      await expect(generateSpeech('Hello world')).rejects.toThrow(TTSError);
      await expect(generateSpeech('Hello world')).rejects.toThrow('No audio data received');
    });

    it('handles network error', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new TypeError('fetch failed'));

      await expect(generateSpeech('Hello world')).rejects.toThrow(TTSError);
      await expect(generateSpeech('Hello world')).rejects.toThrow('Failed to connect to ElevenLabs');
    });

    it('uses custom voice options', async () => {
      const mockArrayBuffer = new ArrayBuffer(1000);
      const mockResponse = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
      };
      
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

      const options = {
        voiceId: 'custom-voice-id',
        stability: 0.8,
        similarityBoost: 0.9,
        style: 0.5,
        useSpeakerBoost: false
      };

      await generateSpeech('Hello world', options);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.elevenlabs.io/v1/text-to-speech/custom-voice-id',
        expect.objectContaining({
          body: JSON.stringify({
            text: 'Hello world',
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.8,
              similarity_boost: 0.9,
              style: 0.5,
              use_speaker_boost: false
            }
          })
        })
      );
    });
  });

  describe('generateSpeechWithRetry', () => {
    it('succeeds on first attempt', async () => {
      const mockArrayBuffer = new ArrayBuffer(1000);
      const mockResponse = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
      };
      
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

      const result = await generateSpeechWithRetry('Hello world');

      expect(result).toBe('mock-audio-url');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('retries on rate limit error', async () => {
      vi.useFakeTimers();
      
      const rateLimitResponse = {
        ok: false,
        status: 429,
        text: vi.fn().mockResolvedValue('{"message": "Rate limit exceeded"}')
      };
      
      const successResponse = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1000))
      };
      
      vi.mocked(fetch)
        .mockResolvedValueOnce(rateLimitResponse as any)
        .mockResolvedValueOnce(successResponse as any);

      const resultPromise = generateSpeechWithRetry('Hello world');
      
      // Fast-forward through the retry delay
      await vi.advanceTimersByTimeAsync(2000);
      
      const result = await resultPromise;

      expect(result).toBe('mock-audio-url');
      expect(fetch).toHaveBeenCalledTimes(2);
      
      vi.useRealTimers();
    });

    it('does not retry on non-rate-limit errors', async () => {
      const authErrorResponse = {
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue('{"message": "Invalid API key"}')
      };
      
      vi.mocked(fetch).mockResolvedValueOnce(authErrorResponse as any);

      await expect(generateSpeechWithRetry('Hello world')).rejects.toThrow(TTSError);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('fails after max retries', async () => {
      vi.useFakeTimers();
      
      const rateLimitResponse = {
        ok: false,
        status: 429,
        text: vi.fn().mockResolvedValue('{"message": "Rate limit exceeded"}')
      };
      
      vi.mocked(fetch).mockResolvedValue(rateLimitResponse as any);

      const resultPromise = generateSpeechWithRetry('Hello world', {}, 2);
      
      // Fast-forward through all retry delays
      await vi.advanceTimersByTimeAsync(10000);
      
      await expect(resultPromise).rejects.toThrow(TTSError);
      expect(fetch).toHaveBeenCalledTimes(2);
      
      vi.useRealTimers();
    });
  });

  describe('Audio Cache', () => {
    it('stores and retrieves cached audio', () => {
      const text = 'Hello world';
      const audioUrl = 'mock-audio-url';

      setCachedAudio(text, audioUrl);
      const retrieved = getCachedAudio(text);

      expect(retrieved).toBe(audioUrl);
    });

    it('returns null for non-cached audio', () => {
      const result = getCachedAudio('Non-existent text');
      expect(result).toBe(null);
    });

    it('clears cache and revokes URLs', () => {
      setCachedAudio('text1', 'url1');
      setCachedAudio('text2', 'url2');

      clearAudioCache();

      expect(getCachedAudio('text1')).toBe(null);
      expect(getCachedAudio('text2')).toBe(null);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('url1');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('url2');
    });

    it('manages cache size by removing old entries', () => {
      // Fill cache beyond limit
      for (let i = 0; i < 102; i++) {
        setCachedAudio(`text${i}`, `url${i}`);
      }

      // First entry should be removed
      expect(getCachedAudio('text0')).toBe(null);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('url0');
      
      // Recent entries should still exist
      expect(getCachedAudio('text101')).toBe('url101');
    });
  });

  describe('preloadQuestionAudio', () => {
    it('preloads audio for all questions', async () => {
      const questions = [
        { text: 'Question 1' },
        { text: 'Question 2' }
      ];

      const mockArrayBuffer = new ArrayBuffer(1000);
      const mockResponse = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
      };
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await preloadQuestionAudio(questions);

      expect(result.size).toBe(2);
      expect(result.get('Question 1')).toBe('mock-audio-url');
      expect(result.get('Question 2')).toBe('mock-audio-url');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('uses cached audio when available', async () => {
      const questions = [
        { text: 'Cached question' },
        { text: 'New question' }
      ];

      // Pre-cache one question
      setCachedAudio('Cached question', 'cached-url');

      const mockArrayBuffer = new ArrayBuffer(1000);
      const mockResponse = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
      };
      
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

      const result = await preloadQuestionAudio(questions);

      expect(result.size).toBe(2);
      expect(result.get('Cached question')).toBe('cached-url');
      expect(result.get('New question')).toBe('mock-audio-url');
      expect(fetch).toHaveBeenCalledTimes(1); // Only for new question
    });

    it('continues with other questions when one fails', async () => {
      const questions = [
        { text: 'Question 1' },
        { text: 'Question 2' }
      ];

      const errorResponse = {
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('{"message": "Server error"}')
      };

      const successResponse = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1000))
      };
      
      vi.mocked(fetch)
        .mockResolvedValueOnce(errorResponse as any)
        .mockResolvedValueOnce(successResponse as any);

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await preloadQuestionAudio(questions);

      expect(result.size).toBe(1);
      expect(result.get('Question 2')).toBe('mock-audio-url');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to preload audio for question: Question 1',
        expect.any(TTSError)
      );

      consoleSpy.mockRestore();
    });

    it('adds delay between requests', async () => {
      vi.useFakeTimers();
      
      const questions = [
        { text: 'Question 1' },
        { text: 'Question 2' }
      ];

      const mockArrayBuffer = new ArrayBuffer(1000);
      const mockResponse = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
      };
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const resultPromise = preloadQuestionAudio(questions);
      
      // Fast-forward through delays
      await vi.advanceTimersByTimeAsync(200);
      
      await resultPromise;

      expect(fetch).toHaveBeenCalledTimes(2);
      
      vi.useRealTimers();
    });
  });
});