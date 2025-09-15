'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { useAuthActions } from '@/hooks/useAuthActions'
import { GoogleSignInButton } from './GoogleSignInButton'
import Link from 'next/link'

interface LoginFormData {
  email: string
  password: string
}

export const LoginForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>()

  const { signInUser, signInWithGoogleUser, loading, error, clearError } = useAuthActions()

  const onSubmit = async (data: LoginFormData) => {
    clearError()
    try {
      await signInUser(data.email, data.password)
    } catch (error) {
      // Error is handled by useAuthActions hook
    }
  }

  const handleGoogleSignIn = async () => {
    clearError()
    try {
      await signInWithGoogleUser()
    } catch (error) {
      // Error is handled by useAuthActions hook
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-3xl"></div>
      
      <div className="relative z-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-primary mb-3">Sign In</h2>
          <p className="text-gray-600">Enter your credentials to access your account</p>
        </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address',
              },
            })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-gray-50/50 hover:bg-white"
            placeholder="Enter your email address"
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-500 flex items-center">
              <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-gray-50/50 hover:bg-white"
            placeholder="Enter your password"
          />
          {errors.password && (
            <p className="mt-2 text-sm text-red-500 flex items-center">
              <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
              {errors.password.message}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-accent text-white py-4 px-6 rounded-xl font-semibold hover:from-primary/90 hover:to-accent/90 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              Signing In...
            </div>
          ) : (
            'Sign In to Your Account'
          )}
        </button>
      </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <GoogleSignInButton
              onClick={handleGoogleSignIn}
              loading={loading}
              text="Sign in with Google"
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary hover:text-accent font-semibold transition-colors duration-200">
              Create free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}