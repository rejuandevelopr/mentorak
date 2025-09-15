import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Navigation } from '@/components/navigation/Navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthActions } from '@/hooks/useAuthActions'
import { vi } from 'vitest'

// Mock Firebase config
vi.mock('@/lib/firebase/config', () => ({
  auth: {},
  db: {},
}))

// Mock the auth context and actions
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/hooks/useAuthActions', () => ({
  useAuthActions: vi.fn(),
}))

// Mock Next.js Link component
vi.mock('next/link', () => {
  return {
    default: ({ children, href, ...props }: any) => (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

const mockUseAuth = useAuth as any
const mockUseAuthActions = useAuthActions as any

const mockSignOutUser = vi.fn()

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuthActions.mockReturnValue({
      signOutUser: mockSignOutUser,
      loading: false,
      signUpUser: vi.fn(),
      signInUser: vi.fn(),
      error: null,
      clearError: vi.fn(),
    })
  })

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: null,
      })
    })

    it('renders login and signup links', () => {
      render(<Navigation />)
      
      expect(screen.getByText('Login')).toBeInTheDocument()
      expect(screen.getByText('Sign Up')).toBeInTheDocument()
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument()
    })

    it('renders brand logo linking to home', () => {
      render(<Navigation />)
      
      const logoLink = screen.getByText('Mentorak').closest('a')
      expect(logoLink).toHaveAttribute('href', '/')
    })
  })

  describe('when user is authenticated', () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser as any,
        loading: false,
        error: null,
      })
    })

    it('renders authenticated navigation menu', () => {
      render(<Navigation />)
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Upload PDF')).toBeInTheDocument()
      expect(screen.getByText('Quiz History')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
      
      expect(screen.queryByText('Login')).not.toBeInTheDocument()
      expect(screen.queryByText('Sign Up')).not.toBeInTheDocument()
    })

    it('renders brand logo linking to dashboard', () => {
      render(<Navigation />)
      
      const logoLink = screen.getByText('Mentorak').closest('a')
      expect(logoLink).toHaveAttribute('href', '/dashboard')
    })

    it('calls signOutUser when logout button is clicked', async () => {
      render(<Navigation />)
      
      const logoutButton = screen.getByText('Sign Out')
      fireEvent.click(logoutButton)
      
      await waitFor(() => {
        expect(mockSignOutUser).toHaveBeenCalledTimes(1)
      })
    })

    it('shows loading state during logout', () => {
      mockUseAuthActions.mockReturnValue({
        signOutUser: mockSignOutUser,
        loading: true,
        signUpUser: vi.fn(),
        signInUser: vi.fn(),
        error: null,
        clearError: vi.fn(),
      })

      render(<Navigation />)
      
      expect(screen.getByText('Signing out...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /signing out/i })).toBeDisabled()
    })
  })

  describe('mobile menu functionality', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        error: null,
      })
    })

    it('toggles mobile menu when hamburger button is clicked', () => {
      render(<Navigation />)
      
      const menuButton = screen.getByLabelText('Toggle mobile menu')
      
      // Mobile menu should not be visible initially
      expect(screen.queryByText('Login')).toBeInTheDocument() // Desktop version
      
      // Click to open mobile menu
      fireEvent.click(menuButton)
      
      // Mobile menu should now be visible (we'll see duplicate links)
      const loginLinks = screen.getAllByText('Login')
      expect(loginLinks).toHaveLength(2) // Desktop + mobile versions
    })

    it('closes mobile menu when a link is clicked', () => {
      render(<Navigation />)
      
      const menuButton = screen.getByLabelText('Toggle mobile menu')
      fireEvent.click(menuButton) // Open menu
      
      // Click a mobile menu link
      const mobileLoginLinks = screen.getAllByText('Login')
      fireEvent.click(mobileLoginLinks[1]) // Click mobile version
      
      // Menu should close (back to single login link)
      expect(screen.getAllByText('Login')).toHaveLength(1)
    })
  })

  describe('mobile menu with authenticated user', () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser as any,
        loading: false,
        error: null,
      })
    })

    it('shows authenticated mobile menu items', () => {
      render(<Navigation />)
      
      const menuButton = screen.getByLabelText('Toggle mobile menu')
      fireEvent.click(menuButton)
      
      // Should see both desktop and mobile versions
      expect(screen.getAllByText('Dashboard')).toHaveLength(2)
      expect(screen.getAllByText('Upload PDF')).toHaveLength(2)
      expect(screen.getAllByText('Quiz History')).toHaveLength(2)
      expect(screen.getAllByText('Sign Out')).toHaveLength(2)
    })

    it('calls logout and closes menu when mobile logout is clicked', async () => {
      render(<Navigation />)
      
      const menuButton = screen.getByLabelText('Toggle mobile menu')
      fireEvent.click(menuButton)
      
      const mobileLogoutButtons = screen.getAllByText('Sign Out')
      fireEvent.click(mobileLogoutButtons[1]) // Click mobile version
      
      await waitFor(() => {
        expect(mockSignOutUser).toHaveBeenCalledTimes(1)
      })
    })
  })
})