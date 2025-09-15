import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { vi } from 'vitest'

// Mock Firebase config
vi.mock('@/lib/firebase/config', () => ({
  auth: {},
  db: {},
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockPush = vi.fn()
const mockUseRouter = useRouter as any
const mockUseAuth = useAuth as any

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
    })
  })

  it('shows loading spinner when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      error: null,
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('shows custom fallback when loading and fallback is provided', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      error: null,
    })

    const customFallback = <div>Custom Loading...</div>

    render(
      <ProtectedRoute fallback={customFallback}>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Custom Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('redirects to login when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders protected content when user is authenticated', () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
    }

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false,
      error: null,
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does not redirect when user becomes authenticated', () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
    }

    mockUseAuth.mockReturnValue({
      user: mockUser as any,
      loading: false,
      error: null,
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(mockPush).not.toHaveBeenCalled()
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})