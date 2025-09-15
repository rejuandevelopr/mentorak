'use client';

import React, { useState } from 'react';
import QuizProgressIndicator from './QuizProgressIndicator';
import QuizReview from '../results/QuizReview';
import { UserResponse, createUserResponse } from '@/types/models';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

interface Quiz {
  id: string;
  title: string;
  topic?: string;
  questions: Question[];
  totalQuestions: number;
}

interface QuizCardProps {
  quiz: Quiz;
  onComplete?: (score: number, answers: (number | null)[]) => void;
  onRestart?: () => void;
}

export default function QuizCard({ quiz, onComplete, onRestart }: QuizCardProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(quiz.questions.length).fill(null)
  );
  const [isComplete, setIsComplete] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleQuestionJump = (questionIndex: number) => {
    setCurrentQuestion(questionIndex);
  };

  const handleFinishQuiz = () => {
    const score = calculateScore();
    setIsComplete(true);
    setShowResults(true);
    onComplete?.(score, answers);
  };

  const createUserResponses = (): UserResponse[] => {
    return quiz.questions.map((question, index) => {
      const selectedAnswer = answers[index] ?? -1;
      return createUserResponse(
        question.id,
        selectedAnswer,
        question.correctAnswer,
        0, // No timing data in this simple version
        undefined // No voice transcript
      );
    }).filter(response => response.selectedAnswer !== -1);
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer !== null && answer === quiz.questions[index].correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setAnswers(new Array(quiz.questions.length).fill(null));
    setIsComplete(false);
    setShowResults(false);
    onRestart?.();
  };

  const completedCount = answers.filter(answer => answer !== null).length;
  const allQuestionsAnswered = completedCount === quiz.questions.length;

  if (showResults) {
    const userResponses = createUserResponses();
    const quizWithResponses = {
      ...quiz,
      responses: userResponses,
      score: calculateScore(),
      status: 'completed' as const
    };
    
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 font-medium transition-all"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 border border-accent text-accent rounded-lg hover:bg-secondary font-medium transition-all"
          >
            New Topic
          </button>
        </div>

        {/* Detailed Results */}
        <QuizReview 
          quiz={quizWithResponses}
          responses={userResponses}
        />
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-2xl font-bold text-primary mb-2">{quiz.title}</h2>
        <p className="text-gray-600 mb-4">
          Question {currentQuestion + 1} of {quiz.questions.length}
        </p>
        
        {/* Simple progress text */}
        <div className="text-sm text-gray-600">
          Progress: {completedCount} of {quiz.questions.length} questions answered
        </div>
      </div>

      {/* Current Question */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-primary mb-4">
            {currentQ.text}
          </h3>
        </div>

        <div className="space-y-3 mb-6 sm:mb-8">
          {currentQ.options.map((option, optionIndex) => (
            <button
              key={optionIndex}
              onClick={() => handleAnswerSelect(currentQuestion, optionIndex)}
              className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                answers[currentQuestion] === optionIndex
                  ? 'border-accent bg-secondary'
                  : 'border-gray-200 hover:border-accent/50 hover:bg-secondary/50'
              }`}
            >
              <div className="flex items-center">
                <span className="font-semibold text-accent mr-3 min-w-[24px]">
                  {String.fromCharCode(65 + optionIndex)}.
                </span>
                <span className="text-primary">{option}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentQuestion === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-accent text-white hover:bg-accent/90'
            }`}
          >
            ← Previous
          </button>

          <div className="text-sm text-gray-600 order-first sm:order-none">
            {completedCount} of {quiz.questions.length} answered
          </div>

          {currentQuestion === quiz.questions.length - 1 ? (
            allQuestionsAnswered ? (
              <button
                onClick={handleFinishQuiz}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all"
              >
                Finish Quiz
              </button>
            ) : (
              <div className="text-sm text-gray-500">
                Answer all questions to finish
              </div>
            )
          ) : (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 font-medium transition-all"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}