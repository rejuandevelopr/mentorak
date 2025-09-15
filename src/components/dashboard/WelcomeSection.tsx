'use client'

import React from 'react'
import { User } from 'firebase/auth'

interface WelcomeSectionProps {
  user: User
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ user }) => {
  const getDisplayName = () => {
    if (user.displayName) {
      return user.displayName
    }
    if (user.email) {
      return user.email.split('@')[0]
    }
    return 'User'
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {getDisplayName()}!
          </h1>
          <p className="text-gray-600 mt-1">
            Ready to turn your PDFs into interactive voice quizzes?
          </p>
        </div>
        <div className="hidden sm:block">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}