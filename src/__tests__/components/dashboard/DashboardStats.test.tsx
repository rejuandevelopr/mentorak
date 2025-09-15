import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { useAuth } from '@/contexts/AuthContext'
import { getUserQuizzes } from '@/lib/firebase/firestore'
import { User } from 'firebase/auth'

// Mock the auth context
vi.mock('@/contexts/AuthContext')
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>

// Mock Firestore functions
vi.mock('@/lib/firebase/firestore')
const mockGetUserQuizzes = getUserQuizzes as ReturnType<typeof vi.fn>

describe('DashboardStats', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
  } as User

  const mockQuizzes = [
    {
      id: 'quiz1',
      totalQuestions: 10,
      score: 8,
      status: 'completed',
    },
    {
      id: 'quiz2',
      totalQuestions: 5,
      score: 3,
      status: 'completed',
    },
    {
      id: 'quiz3',
      totalQuestions: 8,
      score: 0,
      status: 'in_progress',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
    })
    mockGetUserQuizzes.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<DashboardStats />)

    expect(screen.getAllByRole('status')).toHaveLength(4)
    expect(screen.getAllByLabelText('Loading statistics')).toHaveLength(4)
  })

  it('calculates and displays correct stats', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
    })
    mockGetUserQuizzes.mockResolvedValue(mockQuizzes)

    render(<DashboardStats />)

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument() // Total quizzes
    })

    expect(screen.getByText('2')).toBeInTheDocument() // Completed quizzes
    expect(screen.getByText('73%')).toBeInTheDocument() // Average score (11/15 = 73%)
    expect(screen.getByText('23')).toBeInTheDocument() // Total questions
  })

  it('displays zero stats when no quizzes', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
    })
    mockGetUserQuizzes.mockResolvedValue([])

    render(<DashboardStats />)

    await waitFor(() => {
      expect(screen.getByText('Total Quizzes')).toBeInTheDocument()
    })

    // Check for specific stat values by their context
    const totalQuizzesSection = screen.getByText('Total Quizzes').closest('div')
    expect(totalQuizzesSection).toHaveTextContent('0')
    
    const completedSection = screen.getByText('Completed').closest('div')
    expect(completedSection).toHaveTextContent('0')
    
    expect(screen.getByText('0%')).toBeInTheDocument()
    
    const totalQuestionsSection = screen.getByText('Total Questions').closest('div')
    expect(totalQuestionsSection).toHaveTextContent('0')
  })

  it('displays correct labels', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
    })
    mockGetUserQuizzes.mockResolvedValue([])

    render(<DashboardStats />)

    await waitFor(() => {
      expect(screen.getByText('Total Quizzes')).toBeInTheDocument()
    })

    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Average Score')).toBeInTheDocument()
    expect(screen.getByText('Total Questions')).toBeInTheDocument()
  })

  it('does not fetch when no user', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
    })

    render(<DashboardStats />)

    expect(mockGetUserQuizzes).not.toHaveBeenCalled()
  })

  it('handles fetch errors gracefully', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
    })
    mockGetUserQuizzes.mockRejectedValue(new Error('Fetch failed'))

    render(<DashboardStats />)

    // Should still render the component with default stats
    await waitFor(() => {
      expect(screen.getByText('Total Quizzes')).toBeInTheDocument()
    })
  })
})