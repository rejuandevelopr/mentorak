'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getQuizById } from '@/lib/firebase/firestore'
import { Quiz } from '@/types/models'
import QuizReview from '@/components/results/QuizReview'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'
import Link from 'next/link'

function ResultPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const quizId = searchParams.get('id')
  
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
        } else if (quizData.status !== 'completed') {
          setError('Quiz is not completed yet')
        } else {
          setQuiz(quizData)
        }
      } catch (err) {
        console.error('Error loading quiz:', err)
        setError('Failed to load quiz results')
      } finally {
        setLoading(false)
      }
    }

    loadQuiz()
  }, [user, quizId])

  const handleRetakeQuiz = () => {
    if (quiz) {
      // Navigate to upload page to create a new quiz with the same PDF
      router.push('/upload')
    }
  }

  if (loading) {
    return (
      <AuthenticatedLayout title="Quiz Results" subtitle="Loading your quiz results...">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz results...</p>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (error || !quiz) {
    return (
      <AuthenticatedLayout title="Quiz Results" subtitle="Quiz results not found">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-primary mb-2">Quiz Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The quiz you are looking for could not be found.'}
          </p>
          <Link
            href="/dashboard"
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </AuthenticatedLayout>
    )
  }

  const headerAction = (
    <Link
      href="/dashboard"
      className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Generate New Quiz
    </Link>
  )

  return (
    <AuthenticatedLayout 
      title="Quiz Results" 
      subtitle={`Results for "${quiz.title}"`}
      headerAction={headerAction}
    >
      <div className="max-w-6xl mx-auto">
        <QuizReview quiz={quiz} responses={quiz.responses} />
      </div>
    </AuthenticatedLayout>
  )
}

export default function ProtectedResultPage() {
  return (
    <ProtectedRoute>
      <ResultPage />
    </ProtectedRoute>
  )
}