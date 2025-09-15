'use client';

import React from 'react';

interface QuizProgressIndicatorProps {
  currentQuestion: number;
  totalQuestions: number;
  completedQuestions: boolean[];
  onQuestionJump?: (index: number) => void;
  showQuestionNumbers?: boolean;
  compact?: boolean;
}

export default function QuizProgressIndicator({
  currentQuestion,
  totalQuestions,
  completedQuestions,
  onQuestionJump,
  showQuestionNumbers = true,
  compact = false
}: QuizProgressIndicatorProps) {
  const completedCount = completedQuestions.filter(Boolean).length;
  const progressPercentage = (completedCount / totalQuestions) * 100;

  return (
    <div className={`w-full ${compact ? 'space-y-2' : 'space-y-4'}`}>
      {/* Progress Bar */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-accent h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
            style={{ width: `${progressPercentage}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
        </div>
        
        {/* Current position indicator */}
        <div 
          className="absolute top-0 w-1 h-3 bg-accent border-2 border-white rounded-full shadow-lg transition-all duration-300"
          style={{ 
            left: `${Math.max(0, Math.min(95, (currentQuestion / (totalQuestions - 1)) * 100))}%`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Progress Text */}
      <div className={`flex items-center justify-between ${compact ? 'text-xs' : 'text-sm'} text-gray-600`}>
        <span>
          Question <span className="font-semibold text-accent">{currentQuestion + 1}</span> of{' '}
          <span className="font-semibold">{totalQuestions}</span>
        </span>
        <span>
          <span className="font-semibold text-accent">{completedCount}</span> completed
          <span className="text-gray-400 ml-1">({Math.round(progressPercentage)}%)</span>
        </span>
      </div>

      {/* Question Navigation Dots */}
      {showQuestionNumbers && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {Array.from({ length: totalQuestions }, (_, index) => {
            const isCompleted = completedQuestions[index];
            const isCurrent = index === currentQuestion;
            const isUpcoming = index > currentQuestion && !isCompleted;
            
            return (
              <button
                key={index}
                onClick={() => onQuestionJump?.(index)}
                disabled={!onQuestionJump}
                className={`
                  relative w-8 h-8 rounded-full text-xs font-bold transition-all duration-200 
                  ${isCurrent 
                    ? 'bg-accent text-white shadow-lg scale-110 ring-2 ring-accent/30' 
                    : isCompleted
                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                    : isUpcoming
                    ? 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                  }
                  ${onQuestionJump ? 'cursor-pointer' : 'cursor-default'}
                  ${isCurrent ? 'animate-pulse' : ''}
                `}
                title={`Question ${index + 1}${isCompleted ? ' (Completed)' : isCurrent ? ' (Current)' : ''}`}
              >
                {isCompleted && !isCurrent ? (
                  <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
                
                {/* Current question pulse ring */}
                {isCurrent && (
                  <div className="absolute inset-0 rounded-full border-2 border-accent animate-ping opacity-75"></div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Completion Status */}
      {completedCount === totalQuestions && (
        <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">All questions completed!</span>
        </div>
      )}
    </div>
  );
}