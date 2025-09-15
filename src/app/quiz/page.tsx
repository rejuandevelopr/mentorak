'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getQuizById, saveQuizProgress, completeQuiz } from '@/lib/firebase/firestore';
import { Quiz, UserResponse, calculateQuizScore } from '@/types/models';
import VoiceQuizSession from '@/components/quiz/VoiceQuizSession';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface QuizPageState {
  quiz: Quiz | null;
  isLoading: boolean;
  error: string | null;
  isCompleting: boolean;
}

export default function QuizPage() {
  return (
    <ProtectedRoute>
      <QuizPageContent />
    </ProtectedRoute>
  );
}

function QuizPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const quizId = searchParams.get('id');

  const [state, setState] = useState<QuizPageState>({
    quiz: null,
    isLoading: true,
    error: null,
    isCompleting: false
  });

  // Load quiz data
  useEffect(() => {
    async function loadQuiz() {
      if (!user || !quizId) {
        setState(prev => ({ 
          ...prev, 
          error: 'Quiz ID is required',
          isLoading: false 
        }));
        return;
      }

      try {
        const quiz = await getQuizById(user.uid, quizId);
        
        if (!quiz) {
          setState(prev => ({ 
            ...prev, 
            error: 'Quiz not found',
            isLoading: false 
          }));
          return;
        }

        // Check if quiz is already completed
        if (quiz.status === 'completed') {
          router.push(`/history/${quizId}`);
          return;
        }

        setState(prev => ({ 
          ...prev, 
          quiz,
          isLoading: false 
        }));
      } catch (error) {
        console.error('Failed to load quiz:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to load quiz. Please try again.',
          isLoading: false 
        }));
      }
    }

    loadQuiz();
  }, [user, quizId, router]);

  // Handle question answered
  const handleQuestionAnswered = async (response: UserResponse) => {
    if (!user || !state.quiz) return;

    try {
      const updatedResponses = [...(state.quiz.responses || []), response];
      
      // Update local state
      setState(prev => ({
        ...prev,
        quiz: prev.quiz ? {
          ...prev.quiz,
          responses: updatedResponses
        } : null
      }));

      // Save progress to Firestore (don't await to avoid blocking UI)
      saveQuizProgress(user.uid, state.quiz.id, updatedResponses).catch(error => {
        console.error('Failed to save quiz progress:', error);
      });
    } catch (error) {
      console.error('Failed to handle question answer:', error);
    }
  };

  // Handle quiz completion
  const handleQuizCompleted = async (finalScore: number) => {
    if (!user || !state.quiz) return;

    setState(prev => ({ ...prev, isCompleting: true }));

    try {
      // Get the current responses from the quiz state
      const responses = state.quiz.responses || [];
      
      // Complete quiz in Firestore
      await completeQuiz(user.uid, state.quiz.id, responses, finalScore);
      
      // Redirect to results page
      router.push(`/result?id=${state.quiz.id}`);
    } catch (error) {
      console.error('Failed to complete quiz:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to save quiz results. Please try again.',
        isCompleting: false 
      }));
    }
  };

  // Handle progress updates (for real-time saving)
  const handleProgressUpdate = async (responses: UserResponse[]) => {
    if (!user || !state.quiz) return;

    try {
      // Save progress in background
      await saveQuizProgress(user.uid, state.quiz.id, responses);
    } catch (error) {
      console.error('Failed to save progress:', error);
      // Don't show error to user for background saves
    }
  };

  // Loading state
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mx-auto mb-4"></div>
          <div className="text-lg font-medium text-primary">Loading quiz...</div>
          <div className="text-sm text-gray-600 mt-2">Please wait while we prepare your quiz</div>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-primary mb-2">Quiz Error</h2>
            <p className="text-gray-600 mb-6">{state.error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Completing state
  if (state.isCompleting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mx-auto mb-4"></div>
          <div className="text-lg font-medium text-primary">Completing quiz...</div>
          <div className="text-sm text-gray-600 mt-2">Saving your results</div>
        </div>
      </div>
    );
  }

  // Quiz not found
  if (!state.quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-primary mb-2">Quiz Not Found</h2>
            <p className="text-gray-600 mb-6">The quiz you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Debug Info */}
      <div className="bg-yellow-100 p-4 text-sm">
        <strong>Debug Info:</strong> Quiz ID: {state.quiz.id}, Questions: {state.quiz.questions.length}, 
        Status: {state.quiz.status}, Title: {state.quiz.title}
        <br />
        <strong>First Question:</strong> {state.quiz.questions[0]?.text || 'No questions found'}
      </div>

      {/* Minimal Header for Quiz Session */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900 mr-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-primary">{state.quiz.title}</h1>
                <p className="text-sm text-gray-600">Voice Quiz Session</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {state.quiz.questions.length} questions
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Content */}
      <div className="py-8">
        {state.quiz.questions.length > 0 ? (
          <VoiceQuizSession
            quiz={state.quiz}
            onQuestionAnswered={handleQuestionAnswered}
            onQuizCompleted={handleQuizCompleted}
            onProgressUpdate={handleProgressUpdate}
          />
        ) : (
          <div className="max-w-2xl mx-auto text-center p-8">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-xl font-bold text-red-600 mb-4">No Questions Found</h2>
              <p className="text-gray-600 mb-4">
                This quiz doesn't have any questions. This might be a data issue.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}