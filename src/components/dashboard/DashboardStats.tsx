'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getUserQuizzes } from '@/lib/firebase/firestore'
import { Quiz } from '@/types/models'

interface Stats {
  totalQuizzes: number
  completedQuizzes: number
  averageScore: number
  totalQuestions: number
}

export const DashboardStats: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
    totalQuestions: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const calculateStats = async () => {
      if (!user) return

      try {
        setLoading(true)
        const quizzes = await getUserQuizzes(user.uid)
        
        const completedQuizzes = quizzes.filter(quiz => quiz.status === 'completed')
        const totalScore = completedQuizzes.reduce((sum, quiz) => sum + quiz.score, 0)
        const totalPossibleScore = completedQuizzes.reduce((sum, quiz) => sum + quiz.totalQuestions, 0)
        const totalQuestions = quizzes.reduce((sum, quiz) => sum + quiz.totalQuestions, 0)

        setStats({
          totalQuizzes: quizzes.length,
          completedQuizzes: completedQuizzes.length,
          averageScore: totalPossibleScore > 0 ? (totalScore / totalPossibleScore) * 100 : 0,
          totalQuestions,
        })
      } catch (error) {
        console.error('Error calculating stats:', error)
      } finally {
        setLoading(false)
      }
    }

    calculateStats()
  }, [user])

  const statItems = [
    {
      label: 'Total Quizzes',
      value: stats.totalQuizzes,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Completed',
      value: stats.completedQuizzes,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Average Score',
      value: `${Math.round(stats.averageScore)}%`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: stats.averageScore >= 70 ? 'text-green-600' : stats.averageScore >= 50 ? 'text-yellow-600' : 'text-red-600',
      bgColor: stats.averageScore >= 70 ? 'bg-green-100' : stats.averageScore >= 50 ? 'bg-yellow-100' : 'bg-red-100',
    },
    {
      label: 'Total Questions',
      value: stats.totalQuestions,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse" role="status" aria-label="Loading statistics">
              <div className="w-8 h-8 bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-6 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statItems.map((item, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${item.bgColor} ${item.color}`}>
              {item.icon}
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              <p className="text-sm text-gray-600">{item.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}