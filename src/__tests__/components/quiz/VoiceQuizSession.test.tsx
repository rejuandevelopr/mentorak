import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import VoiceQuizSession from '@/components/quiz/VoiceQuizSession';
import { Quiz, Question, UserResponse } from '@/types/models';
import { Timestamp } from 'firebase/firestore';

// Mock the voice recording hook
vi.mock('@/hooks/useVoiceRecording', () => ({
  useVoiceRecording: vi.fn(() => ({
    isRecording: false,
    isProcessing: false,
    isSupported: true,
    error: null,
    transcript: null,
    audioLevel: 0,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    clearTranscript: vi.fn(),
    clearError: vi.fn()
  }))
}));

// Mock ElevenLabs TTS
vi.mock('@/lib/elevenlabs/tts', () => ({
  generateSpeechWithRetry: vi.fn(() => Promise.resolve('mock-audio-url')),
  getCachedAudio: vi.fn(() => null),
  setCachedAudio: vi.fn()
}));

// Mock HTML Audio element
const mockAudio = {
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
  src: '',
  currentTime: 0,
  duration: 0
};

Object.defineProperty(window, 'HTMLAudioElement', {
  writable: true,
  value: vi.fn(() => mockAudio)
});

// Mock URL.createObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mock-audio-url')
});

describe('VoiceQuizSession', () => {
  const mockQuestions: Question[] = [
    {
      id: 'q1',
      text: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 2
    },
    {
      id: 'q2',
      text: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: 1
    }
  ];

  const mockQuiz: Quiz = {
    id: 'quiz1',
    userId: 'user1',
    title: 'Test Quiz',
    createdAt: Timestamp.now(),
    score: 0,
    totalQuestions: 2,
    questions: mockQuestions,
    responses: [],
    pdfFileName: 'test.pdf',
    status: 'in_progress'
  };

  const mockProps = {
    quiz: mockQuiz,
    onQuestionAnswered: vi.fn(),
    onQuizCompleted: vi.fn(),
    onProgressUpdate: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the first question correctly', () => {
    render(<VoiceQuizSession {...mockProps} />);
    
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('50% Complete')).toBeInTheDocument();
  });

  it('displays all answer options', () => {
    render(<VoiceQuizSession {...mockProps} />);
    
    expect(screen.getByText('A. London')).toBeInTheDocument();
    expect(screen.getByText('B. Berlin')).toBeInTheDocument();
    expect(screen.getByText('C. Paris')).toBeInTheDocument();
    expect(screen.getByText('D. Madrid')).toBeInTheDocument();
  });

  it('shows progress bar with correct percentage', () => {
    render(<VoiceQuizSession {...mockProps} />);
    
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  it('displays voice recording controls', () => {
    render(<VoiceQuizSession {...mockProps} />);
    
    expect(screen.getByText('Speak your answer')).toBeInTheDocument();
    expect(screen.getByText('Say "A", "B", "C", or "D", or describe your choice')).toBeInTheDocument();
    expect(screen.getByText('Click to start recording')).toBeInTheDocument();
  });

  it('shows play question button', () => {
    render(<VoiceQuizSession {...mockProps} />);
    
    const playButton = screen.getByRole('button', { name: /play question/i });
    expect(playButton).toBeInTheDocument();
  });

  it('shows text fallback option', () => {
    render(<VoiceQuizSession {...mockProps} />);
    
    const fallbackButton = screen.getByText('Use text input instead');
    expect(fallbackButton).toBeInTheDocument();
  });

  it('switches to text fallback when clicked', async () => {
    render(<VoiceQuizSession {...mockProps} />);
    
    const fallbackButton = screen.getByText('Use text input instead');
    fireEvent.click(fallbackButton);
    
    await waitFor(() => {
      expect(screen.getByText('Select your answer')).toBeInTheDocument();
      expect(screen.getByText('Click on your choice below')).toBeInTheDocument();
    });
  });

  it('handles text answer selection', async () => {
    render(<VoiceQuizSession {...mockProps} />);
    
    // Switch to text fallback
    const fallbackButton = screen.getByText('Use text input instead');
    fireEvent.click(fallbackButton);
    
    await waitFor(() => {
      const optionButton = screen.getByRole('button', { name: /C\. Paris/ });
      fireEvent.click(optionButton);
    });
    
    await waitFor(() => {
      expect(mockProps.onQuestionAnswered).toHaveBeenCalledWith(
        expect.objectContaining({
          questionId: 'q1',
          selectedAnswer: 2,
          isCorrect: true
        })
      );
    });
  });

  it('displays quiz completion when all questions answered', () => {
    const completedQuiz = {
      ...mockQuiz,
      responses: [
        {
          questionId: 'q1',
          selectedAnswer: 2,
          isCorrect: true,
          responseTime: 1000
        },
        {
          questionId: 'q2',
          selectedAnswer: 1,
          isCorrect: true,
          responseTime: 1500
        }
      ]
    };

    render(<VoiceQuizSession {...mockProps} quiz={completedQuiz} />);
    
    expect(screen.getByText('Quiz Completed!')).toBeInTheDocument();
    expect(screen.getByText('Processing your results...')).toBeInTheDocument();
  });

  it('shows unsupported browser message when voice not supported', () => {
    const { useVoiceRecording } = require('@/hooks/useVoiceRecording');
    useVoiceRecording.mockReturnValue({
      isRecording: false,
      isProcessing: false,
      isSupported: false,
      error: null,
      transcript: null,
      audioLevel: 0,
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      clearTranscript: vi.fn(),
      clearError: vi.fn()
    });

    render(<VoiceQuizSession {...mockProps} />);
    
    expect(screen.getByText(/Voice input not supported/)).toBeInTheDocument();
    expect(screen.getByText(/Your browser doesn't support voice recording/)).toBeInTheDocument();
  });

  it('displays voice recording state correctly', () => {
    const { useVoiceRecording } = require('@/hooks/useVoiceRecording');
    useVoiceRecording.mockReturnValue({
      isRecording: true,
      isProcessing: false,
      isSupported: true,
      error: null,
      transcript: null,
      audioLevel: 0.5,
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      clearTranscript: vi.fn(),
      clearError: vi.fn()
    });

    render(<VoiceQuizSession {...mockProps} />);
    
    expect(screen.getByText('Recording... Click to stop')).toBeInTheDocument();
    
    // Check if recording button has correct styling
    const recordButton = screen.getByRole('button', { name: /recording/i });
    expect(recordButton).toHaveClass('bg-red-500');
  });

  it('displays voice transcript when available', () => {
    const { useVoiceRecording } = require('@/hooks/useVoiceRecording');
    useVoiceRecording.mockReturnValue({
      isRecording: false,
      isProcessing: false,
      isSupported: true,
      error: null,
      transcript: 'The answer is C',
      audioLevel: 0,
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      clearTranscript: vi.fn(),
      clearError: vi.fn()
    });

    render(<VoiceQuizSession {...mockProps} />);
    
    expect(screen.getByText('You said:')).toBeInTheDocument();
    expect(screen.getByText('"The answer is C"')).toBeInTheDocument();
  });

  it('displays voice recording error', () => {
    const { useVoiceRecording } = require('@/hooks/useVoiceRecording');
    useVoiceRecording.mockReturnValue({
      isRecording: false,
      isProcessing: false,
      isSupported: true,
      error: 'Microphone access denied',
      transcript: null,
      audioLevel: 0,
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      clearTranscript: vi.fn(),
      clearError: vi.fn()
    });

    render(<VoiceQuizSession {...mockProps} />);
    
    expect(screen.getByText('Microphone access denied')).toBeInTheDocument();
  });

  it('calls onProgressUpdate when answer is submitted', async () => {
    render(<VoiceQuizSession {...mockProps} />);
    
    // Switch to text fallback and select answer
    const fallbackButton = screen.getByText('Use text input instead');
    fireEvent.click(fallbackButton);
    
    await waitFor(() => {
      const optionButton = screen.getByRole('button', { name: /C\. Paris/ });
      fireEvent.click(optionButton);
    });
    
    await waitFor(() => {
      expect(mockProps.onProgressUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            questionId: 'q1',
            selectedAnswer: 2,
            isCorrect: true
          })
        ])
      );
    });
  });

  it('advances to next question after answer submission', async () => {
    vi.useFakeTimers();
    
    render(<VoiceQuizSession {...mockProps} />);
    
    // Switch to text fallback and select answer
    const fallbackButton = screen.getByText('Use text input instead');
    fireEvent.click(fallbackButton);
    
    await waitFor(() => {
      const optionButton = screen.getByRole('button', { name: /C\. Paris/ });
      fireEvent.click(optionButton);
    });
    
    // Fast-forward time to trigger next question
    vi.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
      expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();
    });
    
    vi.useRealTimers();
  });

  it('calls onQuizCompleted when last question is answered', async () => {
    // Start with second question
    const quizOnLastQuestion = {
      ...mockQuiz,
      responses: [{
        questionId: 'q1',
        selectedAnswer: 2,
        isCorrect: true,
        responseTime: 1000
      }]
    };

    render(<VoiceQuizSession {...mockProps} quiz={quizOnLastQuestion} />);
    
    // The component should show the second question
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
    
    // Switch to text fallback and select answer
    const fallbackButton = screen.getByText('Use text input instead');
    fireEvent.click(fallbackButton);
    
    await waitFor(() => {
      const optionButton = screen.getByRole('button', { name: /B\. 4/ });
      fireEvent.click(optionButton);
    });
    
    await waitFor(() => {
      expect(mockProps.onQuizCompleted).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            questionId: 'q1',
            selectedAnswer: 2,
            isCorrect: true
          }),
          expect.objectContaining({
            questionId: 'q2',
            selectedAnswer: 1,
            isCorrect: true
          })
        ])
      );
    });
  });
});