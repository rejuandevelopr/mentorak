import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';

// Mock OpenAI voice service
vi.mock('@/lib/openai/voice', () => ({
  transcribeAudioWithRetry: vi.fn(() => Promise.resolve('test transcript')),
  isAudioRecordingSupported: vi.fn(() => true),
  getSupportedAudioFormats: vi.fn(() => ['audio/webm'])
}));

// Mock MediaRecorder
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  ondataavailable: null as ((event: any) => void) | null,
  onstop: null as (() => void) | null,
  state: 'inactive'
};

const mockMediaStream = {
  getTracks: vi.fn(() => [{ stop: vi.fn() }])
};

const mockAudioContext = {
  createMediaStreamSource: vi.fn(() => ({
    connect: vi.fn()
  })),
  createAnalyser: vi.fn(() => ({
    fftSize: 256,
    frequencyBinCount: 128,
    getByteFrequencyData: vi.fn((array) => {
      // Simulate audio data
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.random() * 255;
      }
    })
  })),
  close: vi.fn(() => Promise.resolve())
};

// Mock browser APIs
Object.defineProperty(global, 'MediaRecorder', {
  writable: true,
  value: vi.fn(() => mockMediaRecorder)
});

Object.defineProperty(global.MediaRecorder, 'isTypeSupported', {
  writable: true,
  value: vi.fn(() => true)
});

Object.defineProperty(global, 'AudioContext', {
  writable: true,
  value: vi.fn(() => mockAudioContext)
});

Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(() => Promise.resolve(mockMediaStream))
  }
});

Object.defineProperty(global, 'Blob', {
  writable: true,
  value: vi.fn(() => ({ size: 1000 }))
});

describe('useVoiceRecording', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useVoiceRecording());

    expect(result.current.isRecording).toBe(false);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.isSupported).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.transcript).toBe(null);
    expect(result.current.audioLevel).toBe(0);
  });

  it('provides recording control functions', () => {
    const { result } = renderHook(() => useVoiceRecording());

    expect(typeof result.current.startRecording).toBe('function');
    expect(typeof result.current.stopRecording).toBe('function');
    expect(typeof result.current.clearTranscript).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('starts recording successfully', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000
      }
    });
    expect(mockMediaRecorder.start).toHaveBeenCalledWith(100);
    expect(result.current.isRecording).toBe(true);
  });

  it('handles getUserMedia error', async () => {
    const mockError = new Error('Permission denied');
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useVoiceRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.error).toBe('Permission denied');
    expect(result.current.isRecording).toBe(false);
  });

  it('stops recording and processes audio', async () => {
    const { transcribeAudioWithRetry } = require('@/lib/openai/voice');
    transcribeAudioWithRetry.mockResolvedValueOnce('test transcript');

    const { result } = renderHook(() => useVoiceRecording());

    // Start recording first
    await act(async () => {
      await result.current.startRecording();
    });

    // Simulate MediaRecorder stop event
    await act(async () => {
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop();
      }
    });

    expect(result.current.isProcessing).toBe(true);

    // Wait for transcription to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(transcribeAudioWithRetry).toHaveBeenCalled();
    expect(result.current.transcript).toBe('test transcript');
    expect(result.current.isProcessing).toBe(false);
  });

  it('handles transcription error', async () => {
    const { transcribeAudioWithRetry } = require('@/lib/openai/voice');
    transcribeAudioWithRetry.mockRejectedValueOnce(new Error('Transcription failed'));

    const { result } = renderHook(() => useVoiceRecording());

    // Start recording first
    await act(async () => {
      await result.current.startRecording();
    });

    // Simulate MediaRecorder stop event
    await act(async () => {
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop();
      }
    });

    // Wait for transcription to fail
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('Transcription failed');
    expect(result.current.isProcessing).toBe(false);
  });

  it('calls onTranscript callback when transcript is available', async () => {
    const onTranscript = vi.fn();
    const { transcribeAudioWithRetry } = require('@/lib/openai/voice');
    transcribeAudioWithRetry.mockResolvedValueOnce('test transcript');

    const { result } = renderHook(() => useVoiceRecording({ onTranscript }));

    // Start recording
    await act(async () => {
      await result.current.startRecording();
    });

    // Simulate MediaRecorder stop event
    await act(async () => {
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop();
      }
    });

    // Wait for transcription
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(onTranscript).toHaveBeenCalledWith('test transcript');
  });

  it('calls onError callback when error occurs', async () => {
    const onError = vi.fn();
    const mockError = new Error('Permission denied');
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useVoiceRecording({ onError }));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(onError).toHaveBeenCalledWith('Permission denied');
  });

  it('auto-stops recording after max time', async () => {
    const { result } = renderHook(() => useVoiceRecording({ maxRecordingTime: 1000 }));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockMediaRecorder.stop).toHaveBeenCalled();
  });

  it('clears transcript when clearTranscript is called', () => {
    const { result } = renderHook(() => useVoiceRecording());

    // Set initial transcript
    act(() => {
      result.current.clearTranscript();
    });

    expect(result.current.transcript).toBe(null);
  });

  it('clears error when clearError is called', () => {
    const { result } = renderHook(() => useVoiceRecording());

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('prevents starting recording when already recording', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    // Start recording
    await act(async () => {
      await result.current.startRecording();
    });

    const initialCallCount = vi.mocked(navigator.mediaDevices.getUserMedia).mock.calls.length;

    // Try to start again
    await act(async () => {
      await result.current.startRecording();
    });

    // Should not call getUserMedia again
    expect(vi.mocked(navigator.mediaDevices.getUserMedia).mock.calls.length).toBe(initialCallCount);
  });

  it('prevents starting recording when processing', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    // Manually set processing state
    await act(async () => {
      await result.current.startRecording();
    });

    // Simulate processing state
    await act(async () => {
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop();
      }
    });

    const initialCallCount = vi.mocked(navigator.mediaDevices.getUserMedia).mock.calls.length;

    // Try to start while processing
    await act(async () => {
      await result.current.startRecording();
    });

    expect(vi.mocked(navigator.mediaDevices.getUserMedia).mock.calls.length).toBe(initialCallCount);
  });

  it('handles unsupported browser', () => {
    const { isAudioRecordingSupported } = require('@/lib/openai/voice');
    isAudioRecordingSupported.mockReturnValueOnce(false);

    const { result } = renderHook(() => useVoiceRecording());

    expect(result.current.isSupported).toBe(false);
  });

  it('shows error when trying to record on unsupported browser', async () => {
    const { isAudioRecordingSupported } = require('@/lib/openai/voice');
    isAudioRecordingSupported.mockReturnValue(false);

    const { result } = renderHook(() => useVoiceRecording());

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.error).toBe('Voice recording is not supported in this browser');
  });
});