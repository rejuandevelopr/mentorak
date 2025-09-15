'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import TopicInput from '@/components/quiz/TopicInput';
import QuizCard from '@/components/quiz/QuizCard';

export default function DashboardPage() {
  const { user } = useAuth();
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [isGeneratingFromInput, setIsGeneratingFromInput] = useState(false);
  const [isGeneratingFromPopular, setIsGeneratingFromPopular] = useState(false);

  const handleQuizGenerated = (quiz: any) => {
    setCurrentQuiz(quiz);
  };

  const handleInputGeneratingChange = (generating: boolean) => {
    setIsGeneratingFromInput(generating);
  };

  const handleQuizComplete = (score: number, answers: (number | null)[]) => {
    console.log('Quiz completed:', { score, answers });
    // Here you could save the results to Firestore
  };

  const handleNewTopic = () => {
    setCurrentQuiz(null);
  };

  return (
    <ProtectedRoute>
      <AuthenticatedLayout 
        title="Mentorak" 
        subtitle="Generate a quiz on any topic"
      >
        <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {!currentQuiz ? (
              <div className="space-y-8">
                {/* Welcome Section */}
                <div className="text-center py-8 sm:py-12">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-4">
                    What would you like to learn about?
                  </h1>
                  <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 px-4">
                    Enter any topic and we'll create a personalized quiz for you
                  </p>
                </div>

                {/* Topic Input */}
                <TopicInput 
                  onQuizGenerated={handleQuizGenerated}
                  onGeneratingChange={handleInputGeneratingChange}
                />

                {/* Loading State for Popular Topics */}
                {isGeneratingFromPopular && (
                  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-accent">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-accent border-t-transparent"></div>
                      <div>
                        <p className="text-primary font-medium">Generating your quiz...</p>
                        <p className="text-sm text-gray-600">Creating 10 questions for you</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Examples */}
                {!isGeneratingFromPopular && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-primary mb-4">Popular Topics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      'Photosynthesis',
                      'World War II',
                      'JavaScript',
                      'Ancient Rome',
                      'Machine Learning',
                      'Climate Change',
                      'Human Anatomy',
                      'Economics'
                    ].map((topic) => (
                      <button
                        key={topic}
                        onClick={async () => {
                          setIsGeneratingFromPopular(true);
                          
                          try {
                            const response = await fetch('/api/generate-topic-quiz', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ topic, userId: user?.uid })
                            });
                            
                            const data = await response.json();
                            
                            if (data.success) {
                              handleQuizGenerated(data.quiz);
                            } else {
                              throw new Error(data.error || 'Failed to generate quiz');
                            }
                          } catch (error) {
                            console.error('Quiz generation error:', error);
                          } finally {
                            setIsGeneratingFromPopular(false);
                          }
                        }}
                        disabled={isGeneratingFromPopular || isGeneratingFromInput}
                        className={`p-3 text-left border border-gray-200 rounded-lg transition-all ${
                          isGeneratingFromPopular || isGeneratingFromInput
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:border-accent hover:bg-secondary/50'
                        }`}
                      >
                        {isGeneratingFromPopular ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent"></div>
                            <span className="text-primary font-medium">Generating...</span>
                          </div>
                        ) : (
                          <span className="text-primary font-medium">{topic}</span>
                        )}
                      </button>
                    ))}
                  </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Back Button */}
                <button
                  onClick={handleNewTopic}
                  className="flex items-center space-x-2 text-accent hover:text-accent/80 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>New Topic</span>
                </button>

                {/* Quiz */}
                <QuizCard 
                  quiz={currentQuiz}
                  onComplete={handleQuizComplete}
                  onRestart={() => {}}
                />
              </div>
            )}
          </div>
        </div>
      </AuthenticatedLayout>
    </ProtectedRoute>
  );
}