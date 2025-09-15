import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AudioCacheManager } from '@/lib/audio/cache';
import { Question } from '@/types/models';

// Mock ElevenLabs TTS
vi.mock('@/lib/elevenlabs/tts', () => ({
  generateSpeechWithRetry: vi.fn(() => Promise.resolve('mock-audio-url')),
  getCachedAudio: vi.fn(() => null),
  setCachedAudio: vi.fn()
}));

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(global.URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mock-audio-url')
});

Object.defineProperty(global.URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn()
});

describe('AudioCacheManager', () => {
  let cacheManager: AudioCacheManager;

  beforeEach(() => {
    vi.clearAllMocks();
    cacheManager = new AudioCacheManager();
  });

  afterEach(() => {
    cacheManager.clearCache();
    vi.restoreAllMocks();
  });

  describe('Basic Cache Operations', () => {
    it('stores and retrieves cached audio', () => {
      const text = 'Hello world';
      const audioUrl = 'mock-audio-url';
      const size = 1000;

      cacheManager.setCachedAudio(text, audioUrl, size);
      const retrieved = cacheManager.getCachedAudio(text);

      expect(retrieved).toBe(audioUrl);
    });

    it('returns null for non-cached audio', () => {
      const result = cacheManager.getCachedAudio('Non-existent text');
      expect(result).toBe(null);
    });

    it('removes cache entries correctly', () => {
      const text = 'Hello world';
      const audioUrl = 'mock-audio-url';

      cacheManager.setCachedAudio(text, audioUrl, 1000);
      expect(cacheManager.getCachedAudio(text)).toBe(audioUrl);

      cacheManager.removeCacheEntry(text);
      expect(cacheManager.getCachedAudio(text)).toBe(null);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(audioUrl);
    });

    it('clears all cache entries', () => {
      cacheManager.setCachedAudio('text1', 'url1', 1000);
      cacheManager.setCachedAudio('text2', 'url2', 1000);

      expect(cacheManager.getCacheStats().entries).toBe(2);

      cacheManager.clearCache();

      expect(cacheManager.getCacheStats().entries).toBe(0);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('url1');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('url2');
    });
  });

  describe('Cache Statistics', () => {
    it('tracks cache statistics correctly', () => {
      expect(cacheManager.getCacheStats()).toEqual({
        entries: 0,
        sizeBytes: 0,
        sizeMB: 0
      });

      cacheManager.setCachedAudio('text1', 'url1', 1000);
      cacheManager.setCachedAudio('text2', 'url2', 2000);

      const stats = cacheManager.getCacheStats();
      expect(stats.entries).toBe(2);
      expect(stats.sizeBytes).toBe(3000);
      expect(stats.sizeMB).toBe(0);
    });

    it('calculates MB correctly for larger sizes', () => {
      const largeSizeMB = 5 * 1024 * 1024; // 5MB
      cacheManager.setCachedAudio('large-text', 'large-url', largeSizeMB);

      const stats = cacheManager.getCacheStats();
      expect(stats.sizeMB).toBe(5);
    });
  });

  describe('Cache Cleanup', () => {
    it('removes oldest entries when exceeding entry limit', () => {
      // Mock the maxEntries to a smaller number for testing
      const originalMaxEntries = (cacheManager as any).maxEntries;
      (cacheManager as any).maxEntries = 2;

      cacheManager.setCachedAudio('text1', 'url1', 1000);
      cacheManager.setCachedAudio('text2', 'url2', 1000);
      
      // This should trigger cleanup
      cacheManager.setCachedAudio('text3', 'url3', 1000);

      expect(cacheManager.getCacheStats().entries).toBe(2);
      expect(cacheManager.getCachedAudio('text1')).toBe(null); // Oldest should be removed
      expect(cacheManager.getCachedAudio('text2')).toBe('url2');
      expect(cacheManager.getCachedAudio('text3')).toBe('url3');

      // Restore original value
      (cacheManager as any).maxEntries = originalMaxEntries;
    });

    it('removes entries when exceeding size limit', () => {
      // Mock the maxCacheSize to a smaller number for testing
      const originalMaxSize = (cacheManager as any).maxCacheSize;
      (cacheManager as any).maxCacheSize = 2500; // 2.5KB

      cacheManager.setCachedAudio('text1', 'url1', 1000);
      cacheManager.setCachedAudio('text2', 'url2', 1000);
      
      // This should trigger cleanup due to size
      cacheManager.setCachedAudio('text3', 'url3', 1000);

      expect(cacheManager.getCacheStats().sizeBytes).toBeLessThanOrEqual(2500);
      expect(cacheManager.getCachedAudio('text1')).toBe(null); // Should be removed

      // Restore original value
      (cacheManager as any).maxCacheSize = originalMaxSize;
    });
  });

  describe('Audio Preloading', () => {
    it('preloads audio for multiple questions', async () => {
      const { generateSpeechWithRetry } = require('@/lib/elevenlabs/tts');
      generateSpeechWithRetry.mockResolvedValue('mock-audio-url');

      const questions: Question[] = [
        { id: 'q1', text: 'Question 1', options: [], correctAnswer: 0 },
        { id: 'q2', text: 'Question 2', options: [], correctAnswer: 0 }
      ];

      const audioMap = await cacheManager.preloadQuestionAudio(questions);

      expect(audioMap.size).toBe(2);
      expect(audioMap.get('Question 1')).toBe('mock-audio-url');
      expect(audioMap.get('Question 2')).toBe('mock-audio-url');
      expect(generateSpeechWithRetry).toHaveBeenCalledTimes(2);
    });

    it('uses cached audio when available', async () => {
      const { generateSpeechWithRetry } = require('@/lib/elevenlabs/tts');
      generateSpeechWithRetry.mockResolvedValue('new-audio-url');

      // Pre-cache one question
      cacheManager.setCachedAudio('Cached question', 'cached-url', 1000);

      const questions: Question[] = [
        { id: 'q1', text: 'Cached question', options: [], correctAnswer: 0 },
        { id: 'q2', text: 'New question', options: [], correctAnswer: 0 }
      ];

      const audioMap = await cacheManager.preloadQuestionAudio(questions);

      expect(audioMap.size).toBe(2);
      expect(audioMap.get('Cached question')).toBe('cached-url');
      expect(audioMap.get('New question')).toBe('new-audio-url');
      expect(generateSpeechWithRetry).toHaveBeenCalledTimes(1); // Only for new question
    });

    it('continues with other questions when one fails', async () => {
      const { generateSpeechWithRetry } = require('@/lib/elevenlabs/tts');
      generateSpeechWithRetry
        .mockRejectedValueOnce(new Error('TTS failed'))
        .mockResolvedValueOnce('success-url');

      const questions: Question[] = [
        { id: 'q1', text: 'Failing question', options: [], correctAnswer: 0 },
        { id: 'q2', text: 'Success question', options: [], correctAnswer: 0 }
      ];

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const audioMap = await cacheManager.preloadQuestionAudio(questions);

      expect(audioMap.size).toBe(1);
      expect(audioMap.get('Success question')).toBe('success-url');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to preload audio for question: Failing question',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('respects concurrency limits', async () => {
      vi.useFakeTimers();
      
      const { generateSpeechWithRetry } = require('@/lib/elevenlabs/tts');
      let resolveCount = 0;
      generateSpeechWithRetry.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(`url-${++resolveCount}`);
          }, 100);
        });
      });

      const questions: Question[] = Array.from({ length: 5 }, (_, i) => ({
        id: `q${i}`,
        text: `Question ${i}`,
        options: [],
        correctAnswer: 0
      }));

      const preloadPromise = cacheManager.preloadQuestionAudio(questions, {
        maxConcurrent: 2,
        delayBetweenRequests: 0
      });

      // Fast-forward time
      await vi.advanceTimersByTimeAsync(500);
      
      const audioMap = await preloadPromise;

      expect(audioMap.size).toBe(5);
      expect(generateSpeechWithRetry).toHaveBeenCalledTimes(5);
      
      vi.useRealTimers();
    });

    it('retries failed requests', async () => {
      const { generateSpeechWithRetry } = require('@/lib/elevenlabs/tts');
      generateSpeechWithRetry
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockRejectedValueOnce(new Error('Second attempt failed'))
        .mockResolvedValueOnce('success-url');

      const questions: Question[] = [
        { id: 'q1', text: 'Retry question', options: [], correctAnswer: 0 }
      ];

      const audioMap = await cacheManager.preloadQuestionAudio(questions, {
        retryAttempts: 2
      });

      expect(audioMap.size).toBe(1);
      expect(audioMap.get('Retry question')).toBe('success-url');
      expect(generateSpeechWithRetry).toHaveBeenCalledTimes(3);
    });
  });

  describe('Single Audio Preloading', () => {
    it('preloads single audio successfully', async () => {
      const { generateSpeechWithRetry } = require('@/lib/elevenlabs/tts');
      generateSpeechWithRetry.mockResolvedValue('single-audio-url');

      const result = await cacheManager.preloadSingleAudio('Single question');

      expect(result).toBe('single-audio-url');
      expect(generateSpeechWithRetry).toHaveBeenCalledWith('Single question');
    });

    it('returns cached audio for single preload', async () => {
      const { generateSpeechWithRetry } = require('@/lib/elevenlabs/tts');
      
      // Pre-cache the audio
      cacheManager.setCachedAudio('Cached single', 'cached-single-url', 1000);

      const result = await cacheManager.preloadSingleAudio('Cached single');

      expect(result).toBe('cached-single-url');
      expect(generateSpeechWithRetry).not.toHaveBeenCalled();
    });

    it('handles single audio preload failure', async () => {
      const { generateSpeechWithRetry } = require('@/lib/elevenlabs/tts');
      generateSpeechWithRetry.mockRejectedValue(new Error('Single preload failed'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await cacheManager.preloadSingleAudio('Failing single');

      expect(result).toBe(null);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to preload audio for text: Failing single',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Cache Status Checks', () => {
    it('correctly identifies cached audio', () => {
      expect(cacheManager.isAudioCached('Not cached')).toBe(false);

      cacheManager.setCachedAudio('Cached text', 'cached-url', 1000);
      expect(cacheManager.isAudioCached('Cached text')).toBe(true);
    });
  });

  describe('Warm Up Cache', () => {
    it('warms up cache with common phrases', async () => {
      const { generateSpeechWithRetry } = require('@/lib/elevenlabs/tts');
      generateSpeechWithRetry.mockResolvedValue('warm-up-url');

      await cacheManager.warmUpCache();

      const stats = cacheManager.getCacheStats();
      expect(stats.entries).toBeGreaterThan(0);
      expect(generateSpeechWithRetry).toHaveBeenCalled();
    });

    it('handles warm up cache failure gracefully', async () => {
      const { generateSpeechWithRetry } = require('@/lib/elevenlabs/tts');
      generateSpeechWithRetry.mockRejectedValue(new Error('Warm up failed'));

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await cacheManager.warmUpCache();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to warm up audio cache:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});