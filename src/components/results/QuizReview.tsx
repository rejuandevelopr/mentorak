'use client';

import React from 'react';
import { Quiz, UserResponse } from '@/types/models';

interface QuizReviewProps {
  quiz: Quiz;
  responses: UserResponse[];
  className?: string;
}

export default function QuizReview({ quiz, responses, className = '' }: QuizReviewProps) {
  const getResponseForQuestion = (questionId: string) => {
    return responses.find(response => response.questionId === questionId);
  };

  const correctAnswers = responses.filter(response => response.isCorrect).length;
  const totalQuestions = quiz.questions.length;
  const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Overall Score */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="text-center">
          <div className="text-4xl font-bold mb-2">
            <span className={scorePercentage >= 70 ? 'text-green-600' : scorePercentage >= 50 ? 'text-yellow-600' : 'text-red-600'}>
              {scorePercentage}%
            </span>
          </div>
          <div className="text-lg text-gray-600 mb-4">
            You got {correctAnswers} out of {totalQuestions} questions correct
          </div>
          <div className="flex justify-center items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <span>{correctAnswers} Correct</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
              <span>{totalQuestions - correctAnswers} Incorrect</span>
            </div>
          </div>
        </div>
      </div>

      {/* Question Review */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Question Review</h2>
        
        {quiz.questions.map((question, index) => {
          const response = getResponseForQuestion(question.id);
          const isCorrect = response?.isCorrect ?? false;
          const userAnswer = response?.selectedAnswer ?? -1;
          const correctAnswer = question.correctAnswer;

          return (
            <div key={question.id} className="bg-white rounded-lg shadow-lg p-6">
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-lg font-semibold text-gray-700 mr-3">
                      Question {index + 1}
                    </span>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isCorrect 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </div>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-4">
                    {question.text}
                  </h3>
                </div>
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                {question.options.map((option, optionIndex) => {
                  const isUserAnswer = userAnswer === optionIndex;
                  const isCorrectAnswer = correctAnswer === optionIndex;
                  
                  let optionClass = 'p-4 border rounded-lg ';
                  let iconElement = null;
                  
                  if (isCorrectAnswer && isUserAnswer) {
                    // User selected correct answer
                    optionClass += 'bg-green-50 border-green-300';
                    iconElement = (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    );
                  } else if (isCorrectAnswer && !isUserAnswer) {
                    // Correct answer but user didn't select it
                    optionClass += 'bg-green-50 border-green-300';
                    iconElement = (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    );
                  } else if (!isCorrectAnswer && isUserAnswer) {
                    // User selected wrong answer
                    optionClass += 'bg-red-50 border-red-300';
                    iconElement = (
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    );
                  } else {
                    // Neither selected nor correct
                    optionClass += 'bg-gray-50 border-gray-200';
                  }

                  return (
                    <div key={optionIndex} className={optionClass}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <span className="font-semibold text-gray-700 mr-3">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          <span className="text-gray-900">{option}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isUserAnswer && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Your Answer
                            </span>
                          )}
                          {isCorrectAnswer && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Correct Answer
                            </span>
                          )}
                          {iconElement}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Voice Transcript */}
              {response?.voiceTranscript && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">You said:</div>
                  <div className="text-sm font-medium text-gray-900">"{response.voiceTranscript}"</div>
                </div>
              )}

              {/* Response Time */}
              {response && (
                <div className="mt-3 text-sm text-gray-500">
                  Response time: {Math.round(response.responseTime / 1000)}s
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{scorePercentage}%</div>
            <div className="text-sm text-gray-600">Overall Score</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length / 1000)}s
            </div>
            <div className="text-sm text-gray-600">Avg. Response Time</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {responses.filter(r => r.voiceTranscript).length}
            </div>
            <div className="text-sm text-gray-600">Voice Responses</div>
          </div>
        </div>
      </div>
    </div>
  );
}