import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SignupForm } from '@/components/auth/SignupForm'

// Mock the useAuthActions hook
vi.mock('@/hooks/useAuthActions', () => ({
  useAuthActions: () => ({
    signUpUser: vi.fn(),
    loading: false,
    error: null,
    clearError: vi.fn(),
  }),
}))

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders signup form with all fields', () => {
    render(<SignupForm />)
    
    expect(screen.getByText('Create Account')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
    expect(screen.getByText('Already have an account?')).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)
    
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument()
    })
  })

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup()
    render(<SignupForm />)
    
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password')
    
    await user.type(passwordInput, 'Password123')
    await user.type(confirmPasswordInput, 'DifferentPassword123')
    
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  it('calls signUpUser with correct data on valid form submission', async () => {
    const mockSignUpUser = vi.fn()
    const { useAuthActions } = await import('@/hooks/useAuthActions')
    vi.mocked(useAuthActions).mockReturnValue({
      signUpUser: mockSignUpUser,
      loading: false,
      error: null,
      clearError: vi.fn(),
    })

    const user = userEvent.setup()
    render(<SignupForm />)
    
    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const confirmPasswordInput = screen.getByLabelText('Confirm Password')
    const submitButton = screen.getByRole('button', { name: 'Create Account' })
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'Password123')
    await user.type(confirmPasswordInput, 'Password123')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSignUpUser).toHaveBeenCalledWith('test@example.com', 'Password123')
    })
  })
})