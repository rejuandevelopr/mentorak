'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserQuizzes } from '@/lib/firebase/firestore'
import { Quiz } from '@/types/models'
import HistoryTable from '@/components/history/HistoryTable'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'
import Link from 'next/link'

function HistoryPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadQuizzes = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const userQuizzes = await getUserQuizzes(user.uid)
        setQuizzes(userQuizzes)
      } catch (err) {
        console.error('Error loading quiz history:', err)
        setError('Failed to load quiz history')
      } finally {
        setLoading(false)
      }
    }

    loadQuizzes()
  }, [user])

  const handleViewQuiz = (quizId: string) => {
    const quiz = quizzes.find(q => q.id === quizId)
    if (quiz?.status === 'completed') {
      router.push(`/history/${quizId}`)
    } else {
      // For in-progress quizzes, redirect to continue the quiz
      router.push(`/quiz?id=${quizId}`)
    }
  }

  if (error) {
    return (
      <AuthenticatedLayout title="Quiz History" subtitle="View your quiz history and results">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-primary mb-2">Error Loading History</h1>
          <p className="text-gray-600 mb-6">{error}</p>
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
      href="/upload"
      className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
    >
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Generate Quiz
    </Link>
  )

  return (
    <AuthenticatedLayout 
      title="Quiz History" 
      subtitle="View your quiz history and results"
      headerAction={headerAction}
    >
      <HistoryTable 
        quizzes={quizzes} 
        loading={loading} 
        onViewQuiz={handleViewQuiz} 
      />
    </AuthenticatedLayout>
  )
}

export default function ProtectedHistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryPage />
    </ProtectedRoute>
  )
}