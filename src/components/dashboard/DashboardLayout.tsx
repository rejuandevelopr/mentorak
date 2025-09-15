'use client'

import React from 'react'
import Link from 'next/link'
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout'
import { RecentQuizzes } from './RecentQuizzes'

export const DashboardLayout: React.FC = () => {
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
    <AuthenticatedLayout title="Quizzes" headerAction={headerAction}>
      <RecentQuizzes />
    </AuthenticatedLayout>
  )
}