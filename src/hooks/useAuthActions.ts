'use client'

import { useState } from 'react'
import { signUp, signIn, signInWithGoogle, signOut } from '@/lib/firebase/auth'
import { useRouter } from 'next/navigation'

interface AuthError {
  code: string
  message: string
}

interface UseAuthActionsReturn {
  signUpUser: (email: string, password: string) => Promise<void>
  signInUser: (email: string, password: string) => Promise<void>
  signInWithGoogleUser: () => Promise<void>
  signOutUser: () => Promise<void>
  loading: boolean
  error: string | null
  clearError: () => void
}

export const useAuthActions = (): UseAuthActionsReturn => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const clearError = () => setError(null)

  const getErrorMessage = (error: any): string => {
    if (error?.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          return 'An account with this email already exists'
        case 'auth/weak-password':
          return 'Password should be at least 6 characters'
        case 'auth/invalid-email':
          return 'Please enter a valid email address'
        case 'auth/user-not-found':
          return 'No account found with this email'
        case 'auth/wrong-password':
          return 'Incorrect password'
        case 'auth/too-many-requests':
          return 'Too many failed attempts. Please try again later'
        case 'auth/popup-closed-by-user':
          return 'Sign-in was cancelled'
        case 'auth/popup-blocked':
          return 'Pop-up was blocked by your browser. Please allow pop-ups and try again'
        case 'auth/cancelled-popup-request':
          return 'Sign-in was cancelled'
        default:
          return error.message || 'An authentication error occurred'
      }
    }
    return 'An unexpected error occurred'
  }

  const signUpUser = async (email: string, password: string): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      await signUp(email, password)
      router.push('/dashboard')
    } catch (error) {
      setError(getErrorMessage(error))
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInUser = async (email: string, password: string): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch (error) {
      setError(getErrorMessage(error))
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogleUser = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      await signInWithGoogle()
      router.push('/dashboard')
    } catch (error) {
      setError(getErrorMessage(error))
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOutUser = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      setError(getErrorMessage(error))
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    signUpUser,
    signInUser,
    signInWithGoogleUser,
    signOutUser,
    loading,
    error,
    clearError,
  }
}