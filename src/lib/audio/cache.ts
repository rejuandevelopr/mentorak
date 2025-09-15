import { generateSpeechWithRetry, getCachedAudio, setCachedAudio } from '@/lib/elevenlabs/tts';
import { Question } from '@/types/models';

export interface AudioCacheEntry {
  url: string;
  timestamp: number;
  size: number;
}

export interface AudioPreloadOptions {
  maxConcurrent?: number;
  delayBetweenRequests?: number;
  retryAttempts?: number;
}

export class AudioCacheManager {
  private cache = new Map<string, AudioCacheEntry>();
  private readonly maxCacheSize = 50 * 1024 * 1024; // 50MB
  private readonly maxEntries = 100;
  private currentCacheSize = 0;

  constructor() {
    // Clean up on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.clearCache();
      });
    }
  }

  /**
   * Get cached audio URL for text
   */
  getCachedAudio(text: string): string | null {
    const entry = this.cache.get(text);
    if (entry) {
      // Update timestamp for LRU
      entry.timestamp = Date.now();
      return entry.url;
    }
    return getCachedAudio(text);
  }

  /**
   * Cache audio URL for text
   */
  setCachedAudio(text: string, url: string, size: number = 0): void {
    // Remove old entry if exists
    this.removeCacheEntry(text);

    // Add new entry
    const entry: AudioCacheEntry = {
      url,
      timestamp: Date.now(),
      size
    };

    this.cache.set(text, entry);
    this.currentCacheSize += size;
    setCachedAudio(text, url);

    // Clean up if cache is too large
    this.cleanupCache();
  }

  /**
   * Remove specific cache entry
   */
  removeCacheEntry(text: string): void {
    const entry = this.cache.get(text);
    if (entry) {
      URL.revokeObjectURL(entry.url);
      this.currentCacheSize -= entry.size;
      this.cache.delete(text);
    }
  }

  /**
   * Clean up cache based on size and entry limits
   */
  private cleanupCache(): void {
    // Remove entries if we exceed limits
    while (
      this.cache.size > this.maxEntries ||
      this.currentCacheSize > this.maxCacheSize
    ) {
      // Find oldest entry (LRU)
      let oldestKey = '';
      let oldestTimestamp = Date.now();

      for (const [key, entry] of this.cache.entries()) {
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.removeCacheEntry(oldestKey);
      } else {
        break; // Safety break
      }
    }
  }

  /**
   * Clear all cached audio
   */
  clearCache(): void {
    for (const [key] of this.cache.entries()) {
      this.removeCacheEntry(key);
    }
    this.cache.clear();
    this.currentCacheSize = 0;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    entries: number;
    sizeBytes: number;
    sizeMB: number;
  } {
    return {
      entries: this.cache.size,
      sizeBytes: this.currentCacheSize,
      sizeMB: Math.round((this.currentCacheSize / (1024 * 1024)) * 100) / 100
    };
  }

  /**
   * Preload audio for multiple questions
   */
  async preloadQuestionAudio(
    questions: Question[],
    options: AudioPreloadOptions = {}
  ): Promise<Map<string, string>> {
    const {
      maxConcurrent = 3,
      delayBetweenRequests = 200,
      retryAttempts = 2
    } = options;

    const audioMap = new Map<string, string>();
    const semaphore = new Semaphore(maxConcurrent);

    const preloadPromises = questions.map(async (question) => {
      return semaphore.acquire(async () => {
        try {
          // Check cache first
          let audioUrl = this.getCachedAudio(question.text);
          
          if (!audioUrl) {
            // Generate new audio with retry
            let attempts = 0;
            while (attempts <= retryAttempts) {
              try {
                audioUrl = await generateSpeechWithRetry(question.text);
                
                // Estimate size (rough approximation)
                const estimatedSize = question.text.length * 100; // ~100 bytes per character
                this.setCachedAudio(question.text, audioUrl, estimatedSize);
                break;
              } catch (error) {
                attempts++;
                if (attempts > retryAttempts) {
                  throw error;
                }
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
              }
            }
          }

          if (audioUrl) {
            audioMap.set(question.text, audioUrl);
          }

          // Add delay between requests to avoid rate limiting
          if (delayBetweenRequests > 0) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
          }
        } catch (error) {
          console.warn(`Failed to preload audio for question: ${question.text}`, error);
          // Continue with other questions
        }
      });
    });

    await Promise.all(preloadPromises);
    return audioMap;
  }

  /**
   * Preload audio for a single question
   */
  async preloadSingleAudio(text: string): Promise<string | null> {
    try {
      // Check cache first
      let audioUrl = this.getCachedAudio(text);
      
      if (!audioUrl) {
        // Generate new audio
        audioUrl = await generateSpeechWithRetry(text);
        
        // Estimate size
        const estimatedSize = text.length * 100;
        this.setCachedAudio(text, audioUrl, estimatedSize);
      }

      return audioUrl;
    } catch (error) {
      console.error(`Failed to preload audio for text: ${text}`, error);
      return null;
    }
  }

  /**
   * Check if audio is cached
   */
  isAudioCached(text: string): boolean {
    return this.cache.has(text) || getCachedAudio(text) !== null;
  }

  /**
   * Warm up cache with common phrases
   */
  async warmUpCache(): Promise<void> {
    const commonPhrases = [
      'Correct!',
      'Incorrect. The correct answer is',
      'Great job!',
      'Try again.',
      'Quiz completed!',
      'Loading next question...',
      'Please select an answer.',
      'Time\'s up!'
    ];

    try {
      await this.preloadQuestionAudio(
        commonPhrases.map(text => ({ id: '', text, options: [], correctAnswer: 0 })),
        { maxConcurrent: 2, delayBetweenRequests: 500 }
      );
    } catch (error) {
      console.warn('Failed to warm up audio cache:', error);
    }
  }
}

/**
 * Simple semaphore implementation for controlling concurrency
 */
class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const tryAcquire = () => {
        if (this.permits > 0) {
          this.permits--;
          task()
            .then(resolve)
            .catch(reject)
            .finally(() => {
              this.permits++;
              if (this.waitQueue.length > 0) {
                const next = this.waitQueue.shift();
                next?.();
              }
            });
        } else {
          this.waitQueue.push(tryAcquire);
        }
      };

      tryAcquire();
    });
  }
}

// Global cache manager instance
export const audioCache = new AudioCacheManager();

// Utility functions
export const preloadQuizAudio = async (
  questions: Question[],
  options?: AudioPreloadOptions
): Promise<Map<string, string>> => {
  return audioCache.preloadQuestionAudio(questions, options);
};

export const getQuestionAudio = async (question: Question): Promise<string | null> => {
  return audioCache.preloadSingleAudio(question.text);
};

export const isQuestionAudioCached = (question: Question): boolean => {
  return audioCache.isAudioCached(question.text);
};

export const clearQuizAudioCache = (): void => {
  audioCache.clearCache();
};

export const getAudioCacheStats = () => {
  return audioCache.getCacheStats();
};