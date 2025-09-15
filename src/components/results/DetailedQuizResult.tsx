'use client'

import React, { useState } from 'react'
import { Quiz, formatQuizDuration } from '@/types/models'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline'
import AudioPlayer from '@/components/quiz/AudioPlayer'

interface DetailedQuizResultProps {
  quiz: Quiz
  onRetakeQuiz?: () => void
  onBackToHistory?: () => void
}

export default function DetailedQuizResult({ 
  quiz, 
  onRetakeQuiz, 
  onBackToHistory 
}: DetailedQuizResultProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showAudioPlayer, setShowAudioPlayer] = useState<string | null>(null)

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const correctAnswers = quiz.responses.filter(response => response.isCorrect).length
  const currentQuestion = quiz.questions[currentQuestionIndex]
  const currentResponse = quiz.responses.find(r => r.questionId === currentQuestion?.id)
  const isCorrect = currentResponse?.isCorrect ?? false

  const handlePreviousQuestion = () => {
    setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
    setShowAudioPlayer(null)
  }

  const handleNextQuestion = () => {
    setCurrentQuestionIndex(Math.min(quiz.questions.length - 1, currentQuestionIndex + 1))
    setShowAudioPlayer(null)
  }

  const handlePlayAudio = (questionId: string) => {
    setShowAudioPlayer(showAudioPlayer === questionId ? null : questionId)
  }

  const formatDate = (timestamp: any) => {
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (quiz.questions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-gray-400 text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Available</h3>
        <p className="text-gray-600">This quiz doesn't have any questions to review.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quiz Summary Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>📄 {quiz.pdfFileName}</span>
              <span>📅 {formatDate(quiz.createdAt)}</span>
              <span>⏱️ {formatQuizDuration(quiz.createdAt, quiz.completedAt)}</span>
            </div>
          </div>
          
          <div className={`rounded-lg p-4 text-center ${getScoreBgColor(quiz.score)}`}>
            <div className={`text-3xl font-bold ${getScoreColor(quiz.score)} mb-1`}>
              {quiz.score}%
            </div>
            <div className="text-sm text-gray-700">
              {correctAnswers}/{quiz.totalQuestions} correct
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          {onBackToHistory && (
            <button
              onClick={onBackToHistory}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to History
            </button>
          )}
          {onRetakeQuiz && (
            <button
              onClick={onRetakeQuiz}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Retake Quiz
            </button>
          )}
        </div>
      </div>

      {/* Question Navigation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextQuestion}
              disabled={currentQuestionIndex === quiz.questions.length - 1}
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>

        {/* Current Question */}
        {currentQuestion && (
          <div className={`border rounded-lg p-6 ${
            isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 mt-1">
                {isCorrect ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {currentQuestion.text}
                  </h3>
                  
                  {/* Audio Control */}
                  {currentQuestion.audioUrl && (
                    <button
                      onClick={() => handlePlayAudio(currentQuestion.id)}
                      className="flex-shrink-0 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors"
                      title="Play question audio"
                    >
                      <SpeakerWaveIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* Audio Player */}
                {showAudioPlayer === currentQuestion.id && currentQuestion.audioUrl && (
                  <div className="mb-4">
                    <AudioPlayer
                      audioUrl={currentQuestion.audioUrl}
                      className="border-0 bg-transparent p-0"
                    />
                  </div>
                )}

                {/* Answer Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, optionIndex) => {
                    const isUserAnswer = currentResponse?.selectedAnswer === optionIndex
                    const isCorrectAnswer = currentQuestion.correctAnswer === optionIndex
                    
                    let optionClass = 'p-3 rounded-lg border transition-colors '
                    if (isCorrectAnswer) {
                      optionClass += 'border-green-400 bg-green-100 text-green-900'
                    } else if (isUserAnswer && !isCorrect) {
                      optionClass += 'border-red-400 bg-red-100 text-red-900'
                    } else {
                      optionClass += 'border-gray-200 bg-white text-gray-700'
                    }
                    
                    return (
                      <div key={optionIndex} className={optionClass}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                            <span>{option}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isCorrectAnswer && (
                              <span className="text-green-700 text-sm font-medium bg-green-200 px-2 py-1 rounded">
                                Correct
                              </span>
                            )}
                            {isUserAnswer && !isCorrectAnswer && (
                              <span className="text-red-700 text-sm font-medium bg-red-200 px-2 py-1 rounded">
                                Your Answer
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Response Details */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {currentResponse?.voiceTranscript && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="font-medium text-blue-900 mb-1">Voice Response:</div>
                        <div className="text-blue-800">"{currentResponse.voiceTranscript}"</div>
                      </div>
                    )}
                    
                    {currentResponse?.responseTime && (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="font-medium text-gray-900 mb-1">Response Time:</div>
                        <div className="text-gray-700">{Math.round(currentResponse.responseTime / 1000)}s</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Question Navigation Dots */}
        <div className="flex justify-center mt-6">
          <div className="flex gap-2">
            {quiz.questions.map((_, index) => {
              const response = quiz.responses.find(r => r.questionId === quiz.questions[index].id)
              const isCurrentQuestion = index === currentQuestionIndex
              const isAnsweredCorrectly = response?.isCorrect ?? false
              
              let dotClass = 'w-3 h-3 rounded-full cursor-pointer transition-all '
              if (isCurrentQuestion) {
                dotClass += 'ring-2 ring-blue-500 ring-offset-2 '
              }
              if (isAnsweredCorrectly) {
                dotClass += 'bg-green-500'
              } else if (response) {
                dotClass += 'bg-red-500'
              } else {
                dotClass += 'bg-gray-300'
              }
              
              return (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentQuestionIndex(index)
                    setShowAudioPlayer(null)
                  }}
                  className={dotClass}
                  title={`Question ${index + 1} - ${isAnsweredCorrectly ? 'Correct' : response ? 'Incorrect' : 'Not answered'}`}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}