'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface TopicInputProps {
  onQuizGenerated: (quiz: any) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

export default function TopicInput({ onQuizGenerated, onGeneratingChange }: TopicInputProps) {
  const { user } = useAuth();
  const [topic, setTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to generate quizzes');
      return;
    }

    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    if (topic.trim().length < 2) {
      setError('Topic must be at least 2 characters');
      return;
    }

    setError(null);
    setIsGenerating(true);
    onGeneratingChange?.(true);

    try {
      console.log('🚀 Starting quiz generation for topic:', topic.trim());
      
      const response = await fetch('/api/generate-topic-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          userId: user.uid,
        }),
      });

      console.log('📡 API Response status:', response.status);
      const data = await response.json();
      console.log('📄 API Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to generate quiz');
      }

      if (data.success && data.quiz) {
        console.log('✅ Quiz generated successfully:', data.quiz.title);
        onQuizGenerated(data.quiz);
        setTopic(''); // Clear input after successful generation
      } else {
        throw new Error('Invalid response format');
      }

    } catch (err) {
      console.error('❌ Quiz generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
    } finally {
      setIsGenerating(false);
      onGeneratingChange?.(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = Math.min(element.scrollHeight, 200) + 'px';
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTopic(e.target.value);
    adjustTextareaHeight(e.target);
  };

  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, [topic]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="flex items-end space-x-2 sm:space-x-3 p-3 sm:p-4 bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={topic}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter a topic to generate a quiz (e.g., Photosynthesis, World War II, JavaScript...)"
                disabled={isGenerating}
                rows={1}
                className="w-full px-0 py-2 text-base sm:text-lg border-0 focus:outline-none focus:ring-0 placeholder-gray-500 disabled:opacity-50 resize-none overflow-hidden bg-transparent"
                maxLength={500}
                style={{ minHeight: '28px', maxHeight: '200px' }}
              />
            </div>
            <button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                console.log('🔘 Send button clicked, topic:', topic.trim());
                handleSubmit(e);
              }}
              disabled={isGenerating || !topic.trim()}
              className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 ${
                isGenerating || !topic.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-accent text-white hover:bg-accent/90 shadow-sm hover:shadow-md'
              }`}
              title={isGenerating ? 'Generating...' : 'Generate Quiz'}
            >
              {isGenerating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-accent">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-accent border-t-transparent"></div>
              <div>
                <p className="text-primary font-medium">Generating your quiz...</p>
                <p className="text-sm text-gray-600">Creating 10 questions about "{topic.trim()}"</p>
              </div>
            </div>
          </div>
        )}

        {!isGenerating && (
          <div className="text-center text-sm text-gray-500 px-4">
            <p>Enter any topic and we'll generate a 10-question multiple choice quiz for you!</p>
            <p className="mt-1 hidden sm:block">Examples: "Machine Learning", "Ancient Rome", "Cooking Basics", "Photography"</p>
          </div>
        )}
      </form>
    </div>
  );
}