'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getUserQuizzes } from '@/lib/firebase/firestore'
import { Quiz } from '@/types/models'

export const RecentQuizzes: React.FC = () => {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!user) return

      try {
        setLoading(true)
        const userQuizzes = await getUserQuizzes(user.uid)
        // Show only the 5 most recent quizzes
        setQuizzes(userQuizzes.slice(0, 5))
      } catch (err) {
        console.error('Error fetching quizzes:', err)
        setError('Failed to load quiz history')
      } finally {
        setLoading(false)
      }
    }

    fetchQuizzes()
  }, [user])

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown'
    
    // Handle Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-accent'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Quizzes</h2>
        <div className="space-y-3" role="status" aria-label="Loading recent quizzes">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Quizzes</h2>
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Quizzes</h2>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-primary mb-2">No quizzes yet</h3>
          <p className="text-gray-600 mb-4">Upload your first PDF to get started!</p>
          <Link
            href="/upload"
            className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md text-sm font-medium transition-colors"
          >
            Upload PDF
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-primary">Recent Quizzes</h2>
        <Link
          href="/history"
          className="text-sm text-accent hover:text-accent/80 font-medium"
        >
          View all
        </Link>
      </div>
      
      <div className="space-y-3">
        {quizzes.map((quiz) => (
          <Link
            key={quiz.id}
            href={`/history/${quiz.id}`}
            className="block p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-primary truncate">
                  {quiz.title || quiz.pdfFileName || 'Untitled Quiz'}
                </h3>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <span>{formatDate(quiz.createdAt)}</span>
                  <span className="mx-2">•</span>
                  <span>{quiz.totalQuestions} questions</span>
                  {quiz.status === 'completed' && (
                    <>
                      <span className="mx-2">•</span>
                      <span className={getScoreColor(quiz.score, quiz.totalQuestions)}>
                        {quiz.score}/{quiz.totalQuestions} ({Math.round((quiz.score / quiz.totalQuestions) * 100)}%)
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center ml-4">
                {quiz.status === 'completed' ? (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                ) : (
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}