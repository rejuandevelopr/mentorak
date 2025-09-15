import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { User } from 'firebase/auth'

// Mock the auth context
vi.mock('@/contexts/AuthContext')
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>

// Mock the child components
vi.mock('@/components/dashboard/WelcomeSection', () => ({
  WelcomeSection: ({ user }: { user: User }) => (
    <div data-testid="welcome-section">Welcome {user.email}</div>
  ),
}))

vi.mock('@/components/dashboard/QuickActions', () => ({
  QuickActions: () => <div data-testid="quick-actions">Quick Actions</div>,
}))

describe('DashboardLayout', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
  } as User

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading spinner when loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      error: null,
    })

    render(<DashboardLayout />)

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
  })

  it('renders nothing when no user and not loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
    })

    const { container } = render(<DashboardLayout />)

    expect(container.firstChild).toBeNull()
  })

  it('renders dashboard content when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
    })

    render(<DashboardLayout />)

    expect(screen.getByTestId('welcome-section')).toBeInTheDocument()
    expect(screen.getByTestId('quick-actions')).toBeInTheDocument()
    expect(screen.getByText('Welcome test@example.com')).toBeInTheDocument()
  })

  it('has proper layout structure', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
    })

    render(<DashboardLayout />)

    const container = screen.getByTestId('welcome-section').closest('.max-w-7xl')
    expect(container).toHaveClass('mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-8')
  })
})