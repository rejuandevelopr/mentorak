'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthActions } from '@/hooks/useAuthActions'

export const Navigation: React.FC = () => {
  const { user } = useAuth()
  const { signOutUser, loading } = useAuthActions()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await signOutUser()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100/50 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link 
              href={user ? "/dashboard" : "/"} 
              className="flex-shrink-0 flex items-center"
              onClick={closeMobileMenu}
            >
              <span className="text-xl font-bold text-primary">
                Mentorak
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              // Authenticated user menu
              <>
                <Link 
                  href="/dashboard" 
                  className="text-gray-700 hover:text-primary px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-gray-50"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/history" 
                  className="text-gray-700 hover:text-primary px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-gray-50"
                >
                  Quiz History
                </Link>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    {loading ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              </>
            ) : (
              // Unauthenticated user menu
              <>
                <Link 
                  href="/login" 
                  className="text-gray-700 hover:text-primary px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 hover:text-accent focus:outline-none focus:text-accent p-2"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-100/50 bg-white/95 backdrop-blur-md">
              {user ? (
                // Authenticated mobile menu
                <>
                  <Link 
                    href="/dashboard" 
                    className="text-gray-700 hover:text-accent block px-3 py-2 rounded-md text-base font-medium transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/history" 
                    className="text-gray-700 hover:text-accent block px-3 py-2 rounded-md text-base font-medium transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Quiz History
                  </Link>
                  <div className="px-3 py-2 border-t mt-2 pt-2">
                    <div className="text-sm text-gray-600 mb-2">
                      {user.email}
                    </div>
                    <button
                      onClick={() => {
                        handleLogout()
                        closeMobileMenu()
                      }}
                      disabled={loading}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      {loading ? 'Signing out...' : 'Sign Out'}
                    </button>
                  </div>
                </>
              ) : (
                // Unauthenticated mobile menu
                <>
                  <Link 
                    href="/login" 
                    className="text-gray-700 hover:text-primary block px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200 hover:bg-gray-50"
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/signup" 
                    className="bg-primary hover:bg-primary/90 text-white block px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200 text-center shadow-md"
                    onClick={closeMobileMenu}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navigation