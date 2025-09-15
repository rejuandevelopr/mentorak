import { renderHook, act } from '@testing-library/react';
import { useGracefulDegradation } from '@/hooks/useGracefulDegradation';
import { AppError, ErrorCodes } from '@/lib/errors/AppError';
import { vi } from 'vitest';

// Mock the useOnlineStatus hook
vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => ({
    isOnline: true,
  }),
}));

// Mock ErrorHandler
vi.mock('@/lib/errors/errorHandler', () => ({
  ErrorHandler: {
    handleError: vi.fn((error) => error),
    logError: vi.fn(),
  },
}));

describe('useGracefulDegradation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with all services available', () => {
    const { result } = renderHook(() => useGracefulDegradation());
    
    expect(result.current.isServiceAvailable('openai')).toBe(true);
    expect(result.current.isServiceAvailable('elevenlabs')).toBe(true);
    expect(result.current.isServiceAvailable('firebase')).toBe(true);
  });

  it('should mark service as failed after consecutive failures', () => {
    const { result } = renderHook(() => useGracefulDegradation({ maxFailures: 2 }));
    
    const error = new AppError('Service error', ErrorCodes.SERVICE_UNAVAILABLE, 'Service down');
    
    // First failure
    act(() => {
      result.current.markServiceFailure('openai', error);
    });
    expect(result.current.isServiceAvailable('openai')).toBe(true);
    
    // Second failure - should mark as unavailable
    act(() => {
      result.current.markServiceFailure('openai', error);
    });
    expect(result.current.isServiceAvailable('openai')).toBe(false);
  });

  it('should mark service as successful and reset failure count', () => {
    const { result } = renderHook(() => useGracefulDegradation({ maxFailures: 2 }));
    
    const error = new AppError('Service error', ErrorCodes.SERVICE_UNAVAILABLE, 'Service down');
    
    // Mark as failed
    act(() => {
      result.current.markServiceFailure('openai', error);
    });
    
    // Mark as successful
    act(() => {
      result.current.markServiceSuccess('openai');
    });
    
    expect(result.current.isServiceAvailable('openai')).toBe(true);
    expect(result.current.serviceStatuses.openai.consecutiveFailures).toBe(0);
  });

  it('should return appropriate degradation messages', () => {
    const { result } = renderHook(() => useGracefulDegradation({ maxFailures: 1 }));
    
    // Mark OpenAI as failed
    act(() => {
      result.current.markServiceFailure('openai');
    });
    
    const message = result.current.getDegradationMessage('openai');
    expect(message).toBe('Quiz generation is temporarily unavailable. Please try again later.');
  });

  it('should return null for available services', () => {
    const { result } = renderHook(() => useGracefulDegradation());
    
    const message = result.current.getDegradationMessage('openai');
    expect(message).toBeNull();
  });

  it('should provide fallback options for different services', () => {
    const { result } = renderHook(() => useGracefulDegradation());
    
    const openAIFallback = result.current.getFallbackOptions('openai');
    expect(openAIFallback).toEqual({
      canUploadPDF: false,
      canGenerateQuiz: false,
      canUseVoice: true, // ElevenLabs is still available
      message: 'Quiz generation is temporarily unavailable.',
    });
    
    const elevenLabsFallback = result.current.getFallbackOptions('elevenlabs');
    expect(elevenLabsFallback).toEqual({
      canUseVoice: false,
      canPlayAudio: false,
      useTextFallback: true,
      message: 'Voice features unavailable. Using text mode.',
    });
    
    const firebaseFallback = result.current.getFallbackOptions('firebase');
    expect(firebaseFallback).toEqual({
      canSaveProgress: false,
      canLoadHistory: false,
      useLocalStorage: true,
      message: 'Data sync unavailable. Progress will be stored locally.',
    });
  });

  it('should track service calls with withServiceTracking', async () => {
    const { result } = renderHook(() => useGracefulDegradation());
    
    const mockFn = vi.fn().mockResolvedValue('success');
    
    const response = await act(async () => {
      return result.current.withServiceTracking('openai', mockFn);
    });
    
    expect(response).toBe('success');
    expect(mockFn).toHaveBeenCalled();
    expect(result.current.serviceStatuses.openai.consecutiveFailures).toBe(0);
  });

  it('should handle service tracking failures', async () => {
    const { result } = renderHook(() => useGracefulDegradation({ maxFailures: 1 }));
    
    const error = new Error('Service failed');
    const mockFn = vi.fn().mockRejectedValue(error);
    
    await act(async () => {
      try {
        await result.current.withServiceTracking('openai', mockFn);
      } catch (e) {
        // Expected to throw
      }
    });
    
    expect(result.current.isServiceAvailable('openai')).toBe(false);
  });

  it('should reset service status after check interval', () => {
    const { result } = renderHook(() => useGracefulDegradation({ 
      maxFailures: 1,
      checkInterval: 60000 
    }));
    
    // Mark service as failed
    act(() => {
      result.current.markServiceFailure('openai');
    });
    expect(result.current.isServiceAvailable('openai')).toBe(false);
    
    // Fast-forward past check interval
    act(() => {
      vi.advanceTimersByTime(61000);
    });
    
    expect(result.current.isServiceAvailable('openai')).toBe(true);
  });

  it('should handle custom services', () => {
    const { result } = renderHook(() => 
      useGracefulDegradation({ services: ['custom-service'] })
    );
    
    expect(result.current.isServiceAvailable('custom-service')).toBe(true);
    
    act(() => {
      result.current.markServiceFailure('custom-service');
    });
    
    const fallback = result.current.getFallbackOptions('custom-service');
    expect(fallback).toEqual({
      isAvailable: false,
      message: 'custom-service is temporarily unavailable.',
    });
  });
});