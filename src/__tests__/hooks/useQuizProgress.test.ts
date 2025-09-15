import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useQuizProgress, useQuizProgressIndicators, useQuizSession } from '@/hooks/useQuizProgress';
import { Quiz, UserResponse } from '@/types/models';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase services
vi.mock('@/lib/firebase/firestore', () => ({
  saveQuizProgress: vi.fn(() => Promise.resolve()),
  completeQuiz: vi.fn(() => Promise.resolve()),
  updateQuiz: vi.fn(() => Promise.resolve())
}));

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { uid: 'test-user-id' }
  }))
}));

describe('useQuizProgress', () => {
  const mockQuiz: Quiz = {
    id: 'quiz-1',
    userId: 'test-user-id',
    title: 'Test Quiz',
    createdAt: Timestamp.now(),
    score: 0,
    totalQuestions: 3,
    questions: [
      { id: 'q1', text: 'Question 1', options: ['A', 'B', 'C', 'D'], correctAnswer: 0 },
      { id: 'q2', text: 'Question 2', options: ['A', 'B', 'C', 'D'], correctAnswer: 1 },
      { id: 'q3', text: 'Question 3', options: ['A', 'B', 'C', 'D'], correctAnswer: 2 }
    ],
    responses: [],
    pdfFileName: 'test.pdf',
    status: 'in_progress'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useQuizProgress(mockQuiz));

    expect(result.current.currentQuestionIndex).toBe(0);
    expect(result.current.responses).toEqual([]);
    expect(result.current.isAutoSaving).toBe(false);
    expect(result.current.lastSavedAt).toBe(null);
    expect(result.current.saveError).toBe(null);
    expect(result.current.isCompleting).toBe(false);
    expect(result.current.completionError).toBe(null);
  });

  it('initializes with existing responses', () => {
    const quizWithResponses = {
      ...mockQuiz,
      responses: [
        { questionId: 'q1', selectedAnswer: 0, isCorrect: true, responseTime: 1000 }
      ]
    };

    const { result } = renderHook(() => useQuizProgress(quizWithResponses));

    expect(result.current.currentQuestionIndex).toBe(1);
    expect(result.current.responses).toHaveLength(1);
  });

  it('adds response and updates state', async () => {
    const { result } = renderHook(() => useQuizProgress(mockQuiz));

    const response: UserResponse = {
      questionId: 'q1',
      selectedAnswer: 0,
      isCorrect: true,
      responseTime: 1000
    };

    await act(async () => {
      await result.current.addResponse(response);
    });

    expect(result.current.responses).toContain(response);
  });

  it('calls onResponseAdded callback when response is added', async () => {
    const onResponseAdded = vi.fn();
    const { result } = renderHook(() => 
      useQuizProgress(mockQuiz, { onResponseAdded })
    );

    const response: UserResponse = {
      questionId: 'q1',
      selectedAnswer: 0,
      isCorrect: true,
      responseTime: 1000
    };

    await act(async () => {
      await result.current.addResponse(response);
    });

    expect(onResponseAdded).toHaveBeenCalledWith(response);
  });

  it('navigates to next question', () => {
    const onQuestionChange = vi.fn();
    const { result } = renderHook(() => 
      useQuizProgress(mockQuiz, { onQuestionChange })
    );

    act(() => {
      result.current.nextQuestion();
    });

    expect(result.current.currentQuestionIndex).toBe(1);
    expect(onQuestionChange).toHaveBeenCalledWith(1);
  });

  it('navigates to previous question', () => {
    const quizWithProgress = {
      ...mockQuiz,
      responses: [
        { questionId: 'q1', selectedAnswer: 0, isCorrect: true, responseTime: 1000 }
      ]
    };

    const onQuestionChange = vi.fn();
    const { result } = renderHook(() => 
      useQuizProgress(quizWithProgress, { onQuestionChange })
    );

    act(() => {
      result.current.previousQuestion();
    });

    expect(result.current.currentQuestionIndex).toBe(0);
    expect(onQuestionChange).toHaveBeenCalledWith(0);
  });

  it('goes to specific question', () => {
    const onQuestionChange = vi.fn();
    const { result } = renderHook(() => 
      useQuizProgress(mockQuiz, { onQuestionChange })
    );

    act(() => {
      result.current.goToQuestion(2);
    });

    expect(result.current.currentQuestionIndex).toBe(2);
    expect(onQuestionChange).toHaveBeenCalledWith(2);
  });

  it('clamps question index to valid range', () => {
    const { result } = renderHook(() => useQuizProgress(mockQuiz));

    act(() => {
      result.current.goToQuestion(-1);
    });
    expect(result.current.currentQuestionIndex).toBe(0);

    act(() => {
      result.current.goToQuestion(10);
    });
    expect(result.current.currentQuestionIndex).toBe(2); // Max index for 3 questions
  });

  it('auto-saves progress after adding response', async () => {
    const { saveQuizProgress } = require('@/lib/firebase/firestore');
    const { result } = renderHook(() => 
      useQuizProgress(mockQuiz, { autoSaveInterval: 100 })
    );

    const response: UserResponse = {
      questionId: 'q1',
      selectedAnswer: 0,
      isCorrect: true,
      responseTime: 1000
    };

    await act(async () => {
      await result.current.addResponse(response);
    });

    // Fast-forward time to trigger auto-save
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(saveQuizProgress).toHaveBeenCalledWith('test-user-id', 'quiz-1', [response]);
  });

  it('handles auto-save errors', async () => {
    const { saveQuizProgress } = require('@/lib/firebase/firestore');
    saveQuizProgress.mockRejectedValueOnce(new Error('Save failed'));

    const onSaveError = vi.fn();
    const { result } = renderHook(() => 
      useQuizProgress(mockQuiz, { autoSaveInterval: 100, onSaveError })
    );

    const response: UserResponse = {
      questionId: 'q1',
      selectedAnswer: 0,
      isCorrect: true,
      responseTime: 1000
    };

    await act(async () => {
      await result.current.addResponse(response);
    });

    // Fast-forward time to trigger auto-save
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.saveError).toBe('Save failed');
    expect(onSaveError).toHaveBeenCalledWith('Save failed');
  });

  it('completes quiz successfully', async () => {
    const { completeQuiz } = require('@/lib/firebase/firestore');
    const onQuizCompleted = vi.fn();
    
    const { result } = renderHook(() => 
      useQuizProgress(mockQuiz, { onQuizCompleted })
    );

    // Add some responses first
    const responses: UserResponse[] = [
      { questionId: 'q1', selectedAnswer: 0, isCorrect: true, responseTime: 1000 },
      { questionId: 'q2', selectedAnswer: 1, isCorrect: true, responseTime: 1500 }
    ];

    await act(async () => {
      for (const response of responses) {
        await result.current.addResponse(response);
      }
    });

    await act(async () => {
      await result.current.completeQuiz();
    });

    expect(completeQuiz).toHaveBeenCalledWith('test-user-id', 'quiz-1', responses, 100);
    expect(onQuizCompleted).toHaveBeenCalledWith(100);
  });

  it('handles quiz completion errors', async () => {
    const { completeQuiz } = require('@/lib/firebase/firestore');
    completeQuiz.mockRejectedValueOnce(new Error('Completion failed'));

    const onCompletionError = vi.fn();
    const { result } = renderHook(() => 
      useQuizProgress(mockQuiz, { onCompletionError })
    );

    await act(async () => {
      await result.current.completeQuiz();
    });

    expect(result.current.completionError).toBe('Completion failed');
    expect(onCompletionError).toHaveBeenCalledWith('Completion failed');
  });

  it('resumes from saved progress', () => {
    const quizWithSavedProgress = {
      ...mockQuiz,
      responses: [
        { questionId: 'q1', selectedAnswer: 0, isCorrect: true, responseTime: 1000 },
        { questionId: 'q2', selectedAnswer: 1, isCorrect: false, responseTime: 1500 }
      ]
    };

    const { result } = renderHook(() => useQuizProgress(quizWithSavedProgress));

    // Start with empty state
    act(() => {
      result.current.goToQuestion(0);
    });

    // Resume from saved
    act(() => {
      result.current.resumeFromSaved();
    });

    expect(result.current.currentQuestionIndex).toBe(2);
    expect(result.current.responses).toHaveLength(2);
  });

  it('clears save error', () => {
    const { result } = renderHook(() => useQuizProgress(mockQuiz));

    // Manually set error for testing
    act(() => {
      (result.current as any).setState((prev: any) => ({ ...prev, saveError: 'Test error' }));
    });

    act(() => {
      result.current.clearSaveError();
    });

    expect(result.current.saveError).toBe(null);
  });

  it('clears completion error', () => {
    const { result } = renderHook(() => useQuizProgress(mockQuiz));

    act(() => {
      result.current.clearCompletionError();
    });

    expect(result.current.completionError).toBe(null);
  });

  it('disables auto-save when enableAutoSave is false', async () => {
    const { saveQuizProgress } = require('@/lib/firebase/firestore');
    const { result } = renderHook(() => 
      useQuizProgress(mockQuiz, { enableAutoSave: false, autoSaveInterval: 100 })
    );

    const response: UserResponse = {
      questionId: 'q1',
      selectedAnswer: 0,
      isCorrect: true,
      responseTime: 1000
    };

    await act(async () => {
      await result.current.addResponse(response);
    });

    // Fast-forward time
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(saveQuizProgress).not.toHaveBeenCalled();
  });
});

describe('useQuizProgressIndicators', () => {
  const mockQuiz: Quiz = {
    id: 'quiz-1',
    userId: 'test-user-id',
    title: 'Test Quiz',
    createdAt: Timestamp.now(),
    score: 0,
    totalQuestions: 4,
    questions: [
      { id: 'q1', text: 'Question 1', options: ['A', 'B'], correctAnswer: 0 },
      { id: 'q2', text: 'Question 2', options: ['A', 'B'], correctAnswer: 1 },
      { id: 'q3', text: 'Question 3', options: ['A', 'B'], correctAnswer: 0 },
      { id: 'q4', text: 'Question 4', options: ['A', 'B'], correctAnswer: 1 }
    ],
    responses: [],
    pdfFileName: 'test.pdf',
    status: 'in_progress'
  };

  it('calculates progress indicators correctly', () => {
    const responses: UserResponse[] = [
      { questionId: 'q1', selectedAnswer: 0, isCorrect: true, responseTime: 1000 },
      { questionId: 'q2', selectedAnswer: 0, isCorrect: false, responseTime: 1500 }
    ];

    const { result } = renderHook(() => useQuizProgressIndicators(mockQuiz, responses));

    expect(result.current.totalQuestions).toBe(4);
    expect(result.current.answeredQuestions).toBe(2);
    expect(result.current.progressPercentage).toBe(50);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.correctAnswers).toBe(1);
    expect(result.current.currentScore).toBe(50);
    expect(result.current.averageResponseTime).toBe(1250);
  });

  it('handles empty responses', () => {
    const { result } = renderHook(() => useQuizProgressIndicators(mockQuiz, []));

    expect(result.current.answeredQuestions).toBe(0);
    expect(result.current.progressPercentage).toBe(0);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.correctAnswers).toBe(0);
    expect(result.current.currentScore).toBe(0);
    expect(result.current.averageResponseTime).toBe(0);
  });

  it('identifies complete quiz', () => {
    const responses: UserResponse[] = [
      { questionId: 'q1', selectedAnswer: 0, isCorrect: true, responseTime: 1000 },
      { questionId: 'q2', selectedAnswer: 1, isCorrect: true, responseTime: 1500 },
      { questionId: 'q3', selectedAnswer: 0, isCorrect: true, responseTime: 2000 },
      { questionId: 'q4', selectedAnswer: 1, isCorrect: true, responseTime: 1200 }
    ];

    const { result } = renderHook(() => useQuizProgressIndicators(mockQuiz, responses));

    expect(result.current.isComplete).toBe(true);
    expect(result.current.progressPercentage).toBe(100);
    expect(result.current.currentScore).toBe(100);
  });
});

describe('useQuizSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useQuizSession(mockQuiz));

    expect(result.current.isPaused).toBe(false);
    expect(typeof result.current.pauseSession).toBe('function');
    expect(typeof result.current.resumeSession).toBe('function');
    expect(typeof result.current.getActiveTime).toBe('function');
    expect(typeof result.current.getSessionStats).toBe('function');
  });

  it('pauses and resumes session correctly', () => {
    const { result } = renderHook(() => useQuizSession(mockQuiz));

    // Initially not paused
    expect(result.current.isPaused).toBe(false);

    // Pause session
    act(() => {
      result.current.pauseSession();
    });
    expect(result.current.isPaused).toBe(true);

    // Resume session
    act(() => {
      result.current.resumeSession();
    });
    expect(result.current.isPaused).toBe(false);
  });

  it('calculates active time correctly', () => {
    const { result } = renderHook(() => useQuizSession(mockQuiz));

    // Advance time by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    const activeTime = result.current.getActiveTime();
    expect(activeTime).toBe(5000);
  });

  it('excludes paused time from active time', () => {
    const { result } = renderHook(() => useQuizSession(mockQuiz));

    // Advance time by 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Pause for 3 seconds
    act(() => {
      result.current.pauseSession();
      vi.advanceTimersByTime(3000);
    });

    // Resume and advance 2 more seconds
    act(() => {
      result.current.resumeSession();
      vi.advanceTimersByTime(2000);
    });

    const activeTime = result.current.getActiveTime();
    expect(activeTime).toBe(4000); // 2 + 2, excluding 3 seconds of pause
  });

  it('provides correct session statistics', () => {
    const { result } = renderHook(() => useQuizSession(mockQuiz));

    // Advance time by 10 seconds
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Pause for 5 seconds
    act(() => {
      result.current.pauseSession();
      vi.advanceTimersByTime(5000);
    });

    const stats = result.current.getSessionStats();
    expect(stats.totalSessionTime).toBe(15000);
    expect(stats.activeTime).toBe(10000);
    expect(stats.pausedTime).toBe(5000);
    expect(stats.isPaused).toBe(true);
  });
});