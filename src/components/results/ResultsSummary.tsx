'use client'

import React from 'react'
import { Quiz, Question, UserResponse } from '@/types/models'
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

interface ResultsSummaryProps {
  quiz: Quiz
  onRetakeQuiz?: () => void
}

export default function ResultsSummary({ quiz, onRetakeQuiz }: ResultsSummaryProps) {
  const [showDetails, setShowDetails] = useState(false)

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
  const totalQuestions = quiz.totalQuestions
  const percentage = quiz.score

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Results</h2>
        <h3 className="text-lg text-gray-600">{quiz.title}</h3>
      </div>

      {/* Score Display */}
      <div className={`rounded-lg p-6 mb-6 ${getScoreBgColor(percentage)}`}>
        <div className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor(percentage)} mb-2`}>
            {percentage}%
          </div>
          <div className="text-gray-700">
            {correctAnswers} out of {totalQuestions} questions correct
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          {showDetails ? 'Hide Details' : 'Show Question Details'}
        </button>
        {onRetakeQuiz && (
          <button
            onClick={onRetakeQuiz}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Retake Quiz
          </button>
        )}
      </div>

      {/* Question Details */}
      {showDetails && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Question Breakdown</h4>
          {quiz.questions.map((question, index) => {
            const response = quiz.responses.find(r => r.questionId === question.id)
            const isCorrect = response?.isCorrect ?? false
            const userAnswer = response?.selectedAnswer ?? -1
            
            return (
              <div
                key={question.id}
                className={`border rounded-lg p-4 ${
                  isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {isCorrect ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 mb-2">
                      Question {index + 1}
                    </h5>
                    <p className="text-gray-700 mb-3">{question.text}</p>
                    
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => {
                        const isUserAnswer = userAnswer === optionIndex
                        const isCorrectAnswer = question.correctAnswer === optionIndex
                        
                        let optionClass = 'p-2 rounded border '
                        if (isCorrectAnswer) {
                          optionClass += 'border-green-300 bg-green-100 text-green-800'
                        } else if (isUserAnswer && !isCorrect) {
                          optionClass += 'border-red-300 bg-red-100 text-red-800'
                        } else {
                          optionClass += 'border-gray-200 bg-gray-50 text-gray-700'
                        }
                        
                        return (
                          <div key={optionIndex} className={optionClass}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              <span>{option}</span>
                              {isCorrectAnswer && (
                                <span className="ml-auto text-green-600 text-sm font-medium">
                                  Correct Answer
                                </span>
                              )}
                              {isUserAnswer && !isCorrectAnswer && (
                                <span className="ml-auto text-red-600 text-sm font-medium">
                                  Your Answer
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {response?.voiceTranscript && (
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Voice Response:</span> "{response.voiceTranscript}"
                        </p>
                      </div>
                    )}
                    
                    {response?.responseTime && (
                      <div className="mt-2 text-sm text-gray-500">
                        Response time: {Math.round(response.responseTime / 1000)}s
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}