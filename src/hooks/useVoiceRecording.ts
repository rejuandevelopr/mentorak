import { useState, useRef, useCallback, useEffect } from 'react';
import { transcribeAudioWithRetry, isAudioRecordingSupported, getSupportedAudioFormats } from '@/lib/openai/voice';

export interface VoiceRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  isSupported: boolean;
  error: string | null;
  transcript: string | null;
  audioLevel: number;
}

export interface VoiceRecordingActions {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearTranscript: () => void;
  clearError: () => void;
}

export interface UseVoiceRecordingOptions {
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
  maxRecordingTime?: number; // in milliseconds
  silenceThreshold?: number; // audio level threshold for silence detection
  silenceTimeout?: number; // auto-stop after silence (in milliseconds)
}

export function useVoiceRecording(
  options: UseVoiceRecordingOptions = {}
): VoiceRecordingState & VoiceRecordingActions {
  const {
    onTranscript,
    onError,
    maxRecordingTime = 30000, // 30 seconds default
    silenceThreshold = 0.01,
    silenceTimeout = 3000 // 3 seconds of silence
  } = options;

  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isProcessing: false,
    isSupported: isAudioRecordingSupported(),
    error: null,
    transcript: null,
    audioLevel: 0
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Audio level monitoring
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate RMS (Root Mean Square) for audio level
    const rms = Math.sqrt(
      dataArray.reduce((sum, value) => sum + value * value, 0) / dataArray.length
    ) / 255;

    setState(prev => ({ ...prev, audioLevel: rms }));

    // Silence detection
    if (rms < silenceThreshold && state.isRecording) {
      if (!silenceTimeoutRef.current) {
        silenceTimeoutRef.current = setTimeout(() => {
          stopRecording();
        }, silenceTimeout);
      }
    } else if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (state.isRecording) {
      animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
    }
  }, [state.isRecording, silenceThreshold, silenceTimeout]);

  const startRecording = useCallback(async () => {
    if (!state.isSupported) {
      const error = 'Voice recording is not supported in this browser';
      setState(prev => ({ ...prev, error }));
      onError?.(error);
      return;
    }

    if (state.isRecording || state.isProcessing) {
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null, transcript: null }));

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      streamRef.current = stream;

      // Set up audio analysis
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Set up MediaRecorder
      const supportedFormats = getSupportedAudioFormats();
      const mimeType = supportedFormats[0] || 'audio/webm';
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 16000
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        setState(prev => ({ ...prev, isRecording: false, isProcessing: true }));

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          
          if (audioBlob.size === 0) {
            throw new Error('No audio data recorded');
          }

          const transcript = await transcribeAudioWithRetry(audioBlob);
          
          setState(prev => ({ 
            ...prev, 
            transcript, 
            isProcessing: false,
            audioLevel: 0
          }));
          
          onTranscript?.(transcript);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to transcribe audio';
          setState(prev => ({ 
            ...prev, 
            error: errorMessage, 
            isProcessing: false,
            audioLevel: 0
          }));
          onError?.(errorMessage);
        }
      };

      // Start recording
      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setState(prev => ({ ...prev, isRecording: true }));

      // Start audio level monitoring
      monitorAudioLevel();

      // Set maximum recording time
      recordingTimeoutRef.current = setTimeout(() => {
        stopRecording();
      }, maxRecordingTime);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [state.isSupported, state.isRecording, state.isProcessing, onTranscript, onError, maxRecordingTime, monitorAudioLevel]);

  const stopRecording = useCallback(async () => {
    if (!state.isRecording || !mediaRecorderRef.current) {
      return;
    }

    // Clear timeouts
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop recording
    mediaRecorderRef.current.stop();

    // Clean up media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clean up audio context
    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
  }, [state.isRecording]);

  const clearTranscript = useCallback(() => {
    setState(prev => ({ ...prev, transcript: null }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    clearTranscript,
    clearError
  };
}