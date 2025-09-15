import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { RecentQuizzes } from '@/components/dashboard/RecentQuizzes'
import { useAuth } from '@/contexts/AuthContext'
import { getUserQuizzes } from '@/lib/firebase/firestore'
import { User } from 'firebase/auth'

// Mock the auth context
vi.mock('@/contexts/AuthContext')
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>

// Mock Firestore functions
vi.mock('@/lib/firebase/firestore')
const mockGetUserQuizzes = getUserQuizzes as ReturnType<typeof vi.fn>

describe('RecentQuizzes', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
  } as User

  const mockQuizzes = [
    {
      id: 'quiz1',
      title: 'Math Quiz',
      createdAt: { toDate: () => new Date('2024-01-15') },
      totalQuestions: 10,
      score: 8,
      status: 'completed',
      pdfFileName: 'math.pdf',
    },
    {
      id: 'quiz2',
      title: 'Science Quiz',
      createdAt: { toDate: () => new Date('2024-01-14') },
      totalQuestions: 5,
      score: 3,
      status: 'completed',
      pdfFileName: 'science.pdf',
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

    render(<RecentQuizzes />)

    expect(screen.getByText('Recent Quizzes')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByLabelText('Loading recent quizzes')).toBeInTheDocument()
  })

  it('renders empty state when no quizzes', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
    })
    mockGetUserQuizzes.mockResolvedValue([])

    render(<RecentQuizzes />)

    await waitFor(() => {
      expect(screen.getByText('No quizzes yet')).toBeInTheDocument()
    })

    expect(screen.getByText('Upload your first PDF to get started!')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /upload pdf/i })).toHaveAttribute('href', '/upload')
  })

  it('renders quiz list when quizzes exist', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
    })
    mockGetUserQuizzes.mockResolvedValue(mockQuizzes)

    render(<RecentQuizzes />)

    await waitFor(() => {
      expect(screen.getByText('Math Quiz')).toBeInTheDocument()
    })

    expect(screen.getByText('Science Quiz')).toBeInTheDocument()
    expect(screen.getByText('10 questions')).toBeInTheDocument()
    expect(screen.getByText('8/10 (80%)')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view all/i })).toHaveAttribute('href', '/history')
  })

  it('renders error state when fetch fails', async () => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
    })
    mockGetUserQuizzes.mockRejectedValue(new Error('Fetch failed'))

    render(<RecentQuizzes />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load quiz history')).toBeInTheDocument()
    })
  })

  it('does not fetch when no user', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
    })

    render(<RecentQuizzes />)

    expect(mockGetUserQuizzes).not.toHaveBeenCalled()
  })

  it('limits to 5 most recent quizzes', async () => {
    const manyQuizzes = Array.from({ length: 10 }, (_, i) => ({
      id: `quiz${i}`,
      title: `Quiz ${i}`,
      createdAt: { toDate: () => new Date() },
      totalQuestions: 5,
      score: 3,
      status: 'completed',
      pdfFileName: `quiz${i}.pdf`,
    }))

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
    })
    mockGetUserQuizzes.mockResolvedValue(manyQuizzes)

    render(<RecentQuizzes />)

    await waitFor(() => {
      expect(screen.getByText('Quiz 0')).toBeInTheDocument()
    })

    // Should only show first 5 quizzes
    expect(screen.getByText('Quiz 4')).toBeInTheDocument()
    expect(screen.queryByText('Quiz 5')).not.toBeInTheDocument()
  })
})