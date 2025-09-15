'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div 
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
            role="status"
            aria-label="Loading authentication status"
          ></div>
        </div>
      )
    )
  }

  // If user is not authenticated, don't render children
  // The useEffect will handle the redirect
  if (!user) {
    return null
  }

  // User is authenticated, render the protected content
  return <>{children}</>
}

export default ProtectedRoute