'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Quiz, Question, UserResponse, createUserResponse } from '@/types/models';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useQuizProgress } from '@/hooks/useQuizProgress';
import { generateSpeechWithRetry, getCachedAudio, setCachedAudio } from '@/lib/elevenlabs/tts';
import QuizProgressIndicator from './QuizProgressIndicator';
import AudioPlayer from './AudioPlayer';

interface VoiceQuizSessionProps {
  quiz: Quiz;
  onQuestionAnswered?: (response: UserResponse) => void;
  onQuizCompleted?: (finalScore: number) => void;
  onProgressUpdate?: (responses: UserResponse[]) => void;
  className?: string;
  showProgressIndicator?: boolean;
  autoSaveEnabled?: boolean;
}

interface QuizSessionState {
  isLoadingAudio: boolean;
  audioError: string | null;
  showTextFallback: boolean;
  textAnswer: string;
  questionStartTime: number;
  currentAudioUrl: string | null;
}

export default function VoiceQuizSession({
  quiz,
  onQuestionAnswered,
  onQuizCompleted,
  onProgressUpdate,
  className = '',
  showProgressIndicator = true,
  autoSaveEnabled = true
}: VoiceQuizSessionProps) {
  const [state, setState] = useState<QuizSessionState>({
    isLoadingAudio: false,
    audioError: null,
    showTextFallback: false,
    textAnswer: '',
    questionStartTime: Date.now(),
    currentAudioUrl: null
  });

  // Use quiz progress management
  const quizProgress = useQuizProgress(quiz, {
    enableAutoSave: autoSaveEnabled,
    onResponseAdded: (response) => {
      onQuestionAnswered?.(response);
      onProgressUpdate?.(quizProgress.responses);
    },
    onQuizCompleted: (finalScore) => {
      onQuizCompleted?.(finalScore);
    },
    onQuestionChange: () => {
      setState(prev => ({ 
        ...prev, 
        questionStartTime: Date.now(),
        showTextFallback: false,
        textAnswer: '',
        audioError: null
      }));
    }
  });

  const currentQuestion = quiz.questions[quizProgress.currentQuestionIndex];
  const isLastQuestion = quizProgress.currentQuestionIndex === quiz.questions.length - 1;

  const voiceRecording = useVoiceRecording({
    onTranscript: handleVoiceAnswer,
    onError: (error) => {
      console.error('Voice recording error:', error);
      setState(prev => ({ ...prev, showTextFallback: true }));
    },
    maxRecordingTime: 10000, // 10 seconds
    silenceTimeout: 2000 // 2 seconds of silence
  });

  // Load question audio
  const loadQuestionAudio = useCallback(async (question: Question) => {
    if (!question) return;

    setState(prev => ({ ...prev, isLoadingAudio: true, audioError: null }));

    try {
      // Check cache first
      let audioUrl = getCachedAudio(question.text);
      
      if (!audioUrl) {
        // Generate new audio
        audioUrl = await generateSpeechWithRetry(question.text);
        setCachedAudio(question.text, audioUrl);
      }

      setState(prev => ({ ...prev, currentAudioUrl: audioUrl }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load audio';
      setState(prev => ({ 
        ...prev, 
        audioError: errorMessage,
        showTextFallback: true 
      }));
    } finally {
      setState(prev => ({ ...prev, isLoadingAudio: false }));
    }
  }, []);

  // Handle voice answer
  function handleVoiceAnswer(transcript: string) {
    if (!transcript || !currentQuestion) return;

    // Simple answer matching - look for A, B, C, D or option text
    const selectedAnswer = parseAnswerFromTranscript(transcript, currentQuestion);
    
    if (selectedAnswer !== -1) {
      submitAnswer(selectedAnswer, transcript);
    } else {
      // If we can't parse the answer, show text fallback
      setState(prev => ({ 
        ...prev, 
        showTextFallback: true,
        textAnswer: transcript 
      }));
    }
  }

  // Parse answer from voice transcript
  function parseAnswerFromTranscript(transcript: string, question: Question): number {
    const lowerTranscript = transcript.toLowerCase().trim();
    
    // Look for letter answers (A, B, C, D)
    const letterMatch = lowerTranscript.match(/\b([abcd])\b/);
    if (letterMatch) {
      const letter = letterMatch[1];
      return letter.charCodeAt(0) - 'a'.charCodeAt(0);
    }

    // Look for number answers (1, 2, 3, 4)
    const numberMatch = lowerTranscript.match(/\b([1234])\b/);
    if (numberMatch) {
      return parseInt(numberMatch[1]) - 1;
    }

    // Look for partial matches with option text
    for (let i = 0; i < question.options.length; i++) {
      const option = question.options[i].toLowerCase();
      const words = option.split(' ').filter(word => word.length > 3); // Only significant words
      
      if (words.some(word => lowerTranscript.includes(word))) {
        return i;
      }
    }

    return -1; // No match found
  }

  // Submit answer
  const submitAnswer = useCallback(async (selectedAnswer: number, voiceTranscript?: string) => {
    if (!currentQuestion) return;

    const responseTime = Date.now() - state.questionStartTime;
    const response = createUserResponse(
      currentQuestion.id,
      selectedAnswer,
      currentQuestion.correctAnswer,
      responseTime,
      voiceTranscript
    );

    setState(prev => ({
      ...prev,
      showTextFallback: false,
      textAnswer: ''
    }));

    // Add response using quiz progress hook
    await quizProgress.addResponse(response);

    // Move to next question or complete quiz
    if (isLastQuestion) {
      // Complete quiz after a brief delay
      setTimeout(async () => {
        await quizProgress.completeQuiz();
      }, 1500);
    } else {
      // Move to next question after a brief pause
      setTimeout(() => {
        quizProgress.nextQuestion();
      }, 1500);
    }
  }, [currentQuestion, state.questionStartTime, isLastQuestion, quizProgress]);

  // Handle text fallback answer
  const handleTextAnswer = (selectedAnswer: number) => {
    submitAnswer(selectedAnswer, state.textAnswer || undefined);
  };

  // Load question audio when question changes
  useEffect(() => {
    if (currentQuestion) {
      loadQuestionAudio(currentQuestion);
    }
  }, [currentQuestion, loadQuestionAudio]);

  // Show completion state
  if (!currentQuestion || quizProgress.isCompleting) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-4">
            {quizProgress.isCompleting ? 'Completing Quiz...' : 'Quiz Completed!'}
          </div>
          <div className="text-gray-600">
            {quizProgress.isCompleting ? 'Saving your results...' : 'Processing your results...'}
          </div>
          {quizProgress.isCompleting && (
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent mx-auto mt-4"></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>


      {/* Auto-save Status */}
      {quizProgress.isAutoSaving && (
        <div className="mb-4 p-2 bg-blue-100 border border-blue-300 rounded-lg">
          <div className="flex items-center text-blue-800 text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
            Saving progress...
          </div>
        </div>
      )}

      {/* Save Error */}
      {quizProgress.saveError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-red-700 text-sm">
              Failed to save progress: {quizProgress.saveError}
            </div>
            <button
              onClick={quizProgress.clearSaveError}
              className="text-red-600 hover:text-red-800 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Completion Error */}
      {quizProgress.completionError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-red-700 text-sm">
              Failed to complete quiz: {quizProgress.completionError}
            </div>
            <div className="flex gap-2">
              <button
                onClick={quizProgress.completeQuiz}
                className="text-red-600 hover:text-red-800 text-sm underline"
              >
                Retry
              </button>
              <button
                onClick={quizProgress.clearCompletionError}
                className="text-red-600 hover:text-red-800 text-sm underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Card */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {currentQuestion.text}
        </h2>

        {/* Audio Player */}
        <div className="mb-6">
          <AudioPlayer
            audioUrl={state.currentAudioUrl || undefined}
            isLoading={state.isLoadingAudio}
            autoPlay={true}
            onError={(error) => {
              setState(prev => ({ 
                ...prev, 
                audioError: error,
                showTextFallback: true 
              }));
            }}
          />
          
          {state.audioError && (
            <div className="mt-2 text-red-600 text-sm">
              Audio unavailable: {state.audioError}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="grid gap-3 mb-6">
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center">
                <span className="font-semibold text-blue-600 mr-3">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span className="text-gray-900">{option}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Voice Input Section */}
        {!state.showTextFallback ? (
          <div className="border-t pt-6">
            <div className="text-center">
              <div className="mb-4">
                <div className="text-lg font-medium text-gray-900 mb-2">
                  Speak your answer
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  Say "A", "B", "C", or "D", or describe your choice
                </div>
              </div>

              {/* Voice Recording Button */}
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={voiceRecording.isRecording ? voiceRecording.stopRecording : voiceRecording.startRecording}
                  disabled={voiceRecording.isProcessing || !voiceRecording.isSupported}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white font-semibold transition-all ${
                    voiceRecording.isRecording
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-green-500 hover:bg-green-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {voiceRecording.isProcessing ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
                  ) : voiceRecording.isRecording ? (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v4a4 4 0 008 0V6a4 4 0 00-4-4zM6 6a4 4 0 118 0v4a4 4 0 11-8 0V6z" clipRule="evenodd" />
                      <path d="M3 10a1 1 0 011-1h1a1 1 0 110 2H4a1 1 0 01-1-1zM15 10a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Audio Level Indicator */}
                {voiceRecording.isRecording && (
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-100"
                      style={{ width: `${Math.min(voiceRecording.audioLevel * 100, 100)}%` }}
                    />
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  {voiceRecording.isRecording ? 'Recording... Click to stop' : 
                   voiceRecording.isProcessing ? 'Processing your answer...' :
                   'Click to start recording'}
                </div>

                {/* Transcript Display */}
                {voiceRecording.transcript && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">You said:</div>
                    <div className="font-medium text-gray-900">"{voiceRecording.transcript}"</div>
                  </div>
                )}

                {/* Error Display */}
                {voiceRecording.error && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                    <div className="text-sm text-red-700">{voiceRecording.error}</div>
                  </div>
                )}

                {/* Fallback Button */}
                <button
                  onClick={() => setState(prev => ({ ...prev, showTextFallback: true }))}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Use text input instead
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Text Fallback Section */
          <div className="border-t pt-6">
            <div className="text-center">
              <div className="mb-4">
                <div className="text-lg font-medium text-gray-900 mb-2">
                  Select your answer
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  Click on your choice below
                </div>
              </div>

              <div className="grid gap-2 max-w-md mx-auto">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleTextAnswer(index)}
                    className="p-3 text-left border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <span className="font-semibold text-blue-600 mr-2">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setState(prev => ({ ...prev, showTextFallback: false }))}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Try voice input again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Support Message */}
      {!voiceRecording.isSupported && (
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4">
          <div className="text-yellow-800">
            <strong>Voice input not supported:</strong> Your browser doesn't support voice recording. 
            You can still take the quiz using text input.
          </div>
        </div>
      )}
    </div>
  );
}