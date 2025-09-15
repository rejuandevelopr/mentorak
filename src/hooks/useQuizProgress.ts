import { useState, useEffect, useCallback, useRef } from 'react';
import { Quiz, UserResponse, calculateQuizScore, completeQuiz as completeQuizModel } from '@/types/models';
import { saveQuizProgress, completeQuiz, updateQuiz } from '@/lib/firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

export interface QuizProgressState {
  currentQuestionIndex: number;
  responses: UserResponse[];
  isAutoSaving: boolean;
  lastSavedAt: Date | null;
  saveError: string | null;
  isCompleting: boolean;
  completionError: string | null;
}

export interface QuizProgressActions {
  addResponse: (response: UserResponse) => Promise<void>;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  completeQuiz: () => Promise<void>;
  resumeFromSaved: () => void;
  clearSaveError: () => void;
  clearCompletionError: () => void;
}

export interface UseQuizProgressOptions {
  autoSaveInterval?: number; // milliseconds
  enableAutoSave?: boolean;
  onQuestionChange?: (questionIndex: number) => void;
  onResponseAdded?: (response: UserResponse) => void;
  onQuizCompleted?: (finalScore: number) => void;
  onSaveError?: (error: string) => void;
  onCompletionError?: (error: string) => void;
}

export function useQuizProgress(
  quiz: Quiz,
  options: UseQuizProgressOptions = {}
): QuizProgressState & QuizProgressActions {
  const {
    autoSaveInterval = 5000, // 5 seconds
    enableAutoSave = true,
    onQuestionChange,
    onResponseAdded,
    onQuizCompleted,
    onSaveError,
    onCompletionError
  } = options;

  const { user } = useAuth();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<UserResponse[]>([]);

  const [state, setState] = useState<QuizProgressState>({
    currentQuestionIndex: quiz.responses?.length || 0,
    responses: quiz.responses || [],
    isAutoSaving: false,
    lastSavedAt: null,
    saveError: null,
    isCompleting: false,
    completionError: null
  });

  // Auto-save functionality
  const performAutoSave = useCallback(async (responses: UserResponse[]) => {
    if (!user || !enableAutoSave || quiz.status === 'completed') {
      return;
    }

    // Check if responses have changed since last save
    if (JSON.stringify(responses) === JSON.stringify(lastSaveRef.current)) {
      return;
    }

    setState(prev => ({ ...prev, isAutoSaving: true, saveError: null }));

    try {
      await saveQuizProgress(user.uid, quiz.id, responses);
      lastSaveRef.current = [...responses];
      setState(prev => ({ 
        ...prev, 
        isAutoSaving: false, 
        lastSavedAt: new Date() 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save progress';
      setState(prev => ({ 
        ...prev, 
        isAutoSaving: false, 
        saveError: errorMessage 
      }));
      onSaveError?.(errorMessage);
    }
  }, [user, enableAutoSave, quiz.id, quiz.status, onSaveError]);

  // Schedule auto-save
  const scheduleAutoSave = useCallback((responses: UserResponse[]) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave(responses);
    }, autoSaveInterval);
  }, [performAutoSave, autoSaveInterval]);

  // Add response and trigger auto-save
  const addResponse = useCallback(async (response: UserResponse) => {
    const newResponses = [...state.responses, response];
    
    setState(prev => ({
      ...prev,
      responses: newResponses
    }));

    onResponseAdded?.(response);

    // Schedule auto-save
    if (enableAutoSave) {
      scheduleAutoSave(newResponses);
    }
  }, [state.responses, onResponseAdded, enableAutoSave, scheduleAutoSave]);

  // Navigation functions
  const nextQuestion = useCallback(() => {
    const nextIndex = Math.min(state.currentQuestionIndex + 1, quiz.questions.length - 1);
    setState(prev => ({ ...prev, currentQuestionIndex: nextIndex }));
    onQuestionChange?.(nextIndex);
  }, [state.currentQuestionIndex, quiz.questions.length, onQuestionChange]);

  const previousQuestion = useCallback(() => {
    const prevIndex = Math.max(state.currentQuestionIndex - 1, 0);
    setState(prev => ({ ...prev, currentQuestionIndex: prevIndex }));
    onQuestionChange?.(prevIndex);
  }, [state.currentQuestionIndex, onQuestionChange]);

  const goToQuestion = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, quiz.questions.length - 1));
    setState(prev => ({ ...prev, currentQuestionIndex: clampedIndex }));
    onQuestionChange?.(clampedIndex);
  }, [quiz.questions.length, onQuestionChange]);

  // Complete quiz
  const completeQuizAction = useCallback(async () => {
    if (!user || state.isCompleting) {
      return;
    }

    setState(prev => ({ ...prev, isCompleting: true, completionError: null }));

    try {
      // Cancel any pending auto-save
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }

      // Calculate final score
      const finalScore = calculateQuizScore(state.responses);

      // Complete quiz in Firestore
      await completeQuiz(user.uid, quiz.id, state.responses, finalScore);

      setState(prev => ({ ...prev, isCompleting: false }));
      onQuizCompleted?.(finalScore);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete quiz';
      setState(prev => ({ 
        ...prev, 
        isCompleting: false, 
        completionError: errorMessage 
      }));
      onCompletionError?.(errorMessage);
    }
  }, [user, state.isCompleting, state.responses, quiz.id, onQuizCompleted, onCompletionError]);

  // Resume from saved progress
  const resumeFromSaved = useCallback(() => {
    const savedResponses = quiz.responses || [];
    setState(prev => ({
      ...prev,
      currentQuestionIndex: savedResponses.length,
      responses: savedResponses
    }));
    lastSaveRef.current = [...savedResponses];
  }, [quiz.responses]);

  // Error clearing functions
  const clearSaveError = useCallback(() => {
    setState(prev => ({ ...prev, saveError: null }));
  }, []);

  const clearCompletionError = useCallback(() => {
    setState(prev => ({ ...prev, completionError: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Perform final save when responses change (immediate save for important changes)
  useEffect(() => {
    if (state.responses.length > 0 && enableAutoSave) {
      // Immediate save for the last question or when quiz is about to be completed
      const isLastQuestion = state.responses.length === quiz.questions.length;
      if (isLastQuestion) {
        performAutoSave(state.responses);
      }
    }
  }, [state.responses, enableAutoSave, quiz.questions.length, performAutoSave]);

  // Auto-save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (state.responses.length > 0 && enableAutoSave) {
        // Use sendBeacon for reliable saving on page unload
        const data = JSON.stringify({
          userId: user?.uid,
          quizId: quiz.id,
          responses: state.responses
        });
        
        // This is a simplified approach - in a real app you'd need a dedicated endpoint
        navigator.sendBeacon('/api/save-quiz-progress', data);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [state.responses, enableAutoSave, user?.uid, quiz.id]);

  return {
    ...state,
    addResponse,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    completeQuiz: completeQuizAction,
    resumeFromSaved,
    clearSaveError,
    clearCompletionError
  };
}

// Utility hook for quiz progress indicators
export function useQuizProgressIndicators(quiz: Quiz, currentResponses: UserResponse[]) {
  const totalQuestions = quiz.questions.length;
  const answeredQuestions = currentResponses.length;
  const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  const isComplete = answeredQuestions === totalQuestions;
  
  const correctAnswers = currentResponses.filter(response => response.isCorrect).length;
  const currentScore = answeredQuestions > 0 ? Math.round((correctAnswers / answeredQuestions) * 100) : 0;
  
  const averageResponseTime = answeredQuestions > 0 
    ? currentResponses.reduce((sum, response) => sum + response.responseTime, 0) / answeredQuestions
    : 0;

  return {
    totalQuestions,
    answeredQuestions,
    progressPercentage,
    isComplete,
    correctAnswers,
    currentScore,
    averageResponseTime: Math.round(averageResponseTime)
  };
}

// Hook for managing quiz session state (pause/resume)
export function useQuizSession(quiz: Quiz) {
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [pausedTime, setPausedTime] = useState(0);
  const pauseStartRef = useRef<number | null>(null);

  const pauseSession = useCallback(() => {
    if (!isPaused) {
      setIsPaused(true);
      pauseStartRef.current = Date.now();
    }
  }, [isPaused]);

  const resumeSession = useCallback(() => {
    if (isPaused && pauseStartRef.current) {
      const pauseDuration = Date.now() - pauseStartRef.current;
      setPausedTime(prev => prev + pauseDuration);
      setIsPaused(false);
      pauseStartRef.current = null;
    }
  }, [isPaused]);

  const getActiveTime = useCallback(() => {
    const currentTime = Date.now();
    const totalTime = currentTime - sessionStartTime;
    const currentPauseTime = isPaused && pauseStartRef.current 
      ? currentTime - pauseStartRef.current 
      : 0;
    return totalTime - pausedTime - currentPauseTime;
  }, [sessionStartTime, pausedTime, isPaused]);

  const getSessionStats = useCallback(() => {
    const activeTime = getActiveTime();
    return {
      totalSessionTime: Date.now() - sessionStartTime,
      activeTime,
      pausedTime: pausedTime + (isPaused && pauseStartRef.current ? Date.now() - pauseStartRef.current : 0),
      isPaused
    };
  }, [sessionStartTime, pausedTime, isPaused, getActiveTime]);

  return {
    isPaused,
    pauseSession,
    resumeSession,
    getActiveTime,
    getSessionStats
  };
}