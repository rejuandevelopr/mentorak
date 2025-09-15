'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getQuizById } from '@/lib/firebase/firestore'
import { Quiz } from '@/types/models'
import DetailedQuizResult from '@/components/results/DetailedQuizResult'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

function QuizDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const quizId = params.id as string
  
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadQuiz = async () => {
      if (!user || !quizId) {
        setError('Quiz ID is required')
        setLoading(false)
        return
      }

      try {
        const quizData = await getQuizById(user.uid, quizId)
        if (!quizData) {
          setError('Quiz not found')
        } else {
          setQuiz(quizData)
        }
      } catch (err) {
        console.error('Error loading quiz:', err)
        setError('Failed to load quiz details')
      } finally {
        setLoading(false)
      }
    }

    loadQuiz()
  }, [user, quizId])

  const handleBackToHistory = () => {
    router.push('/history')
  }

  const handleRetakeQuiz = () => {
    if (quiz) {
      // Navigate to upload page to create a new quiz
      router.push('/upload')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz details...</p>
        </div>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The quiz you are looking for could not be found.'}
          </p>
          <button
            onClick={handleBackToHistory}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to History
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="mb-6">
          <button
            onClick={handleBackToHistory}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to History
          </button>
        </div>

        {/* Detailed Results */}
        <DetailedQuizResult 
          quiz={quiz} 
          onRetakeQuiz={handleRetakeQuiz}
          onBackToHistory={handleBackToHistory}
        />
      </div>
    </div>
  )
}

export default function ProtectedQuizDetailPage() {
  return (
    <ProtectedRoute>
      <QuizDetailPage />
    </ProtectedRoute>
  )
}