import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Timestamp } from 'firebase/firestore'
import HistoryTable from '@/components/history/HistoryTable'
import { Quiz } from '@/types/models'
import { vi } from 'vitest'

// Mock Heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  ChevronUpIcon: ({ className }: { className: string }) => (
    <div data-testid="chevron-up-icon" className={className} />
  ),
  ChevronDownIcon: ({ className }: { className: string }) => (
    <div data-testid="chevron-down-icon" className={className} />
  ),
  MagnifyingGlassIcon: ({ className }: { className: string }) => (
    <div data-testid="magnifying-glass-icon" className={className} />
  ),
  FunnelIcon: ({ className }: { className: string }) => (
    <div data-testid="funnel-icon" className={className} />
  ),
  EyeIcon: ({ className }: { className: string }) => (
    <div data-testid="eye-icon" className={className} />
  ),
}))

const mockQuizzes: Quiz[] = [
  {
    id: 'quiz1',
    userId: 'user1',
    title: 'Math Quiz',
    createdAt: Timestamp.fromDate(new Date('2024-01-15T10:00:00Z')),
    completedAt: Timestamp.fromDate(new Date('2024-01-15T10:15:00Z')),
    score: 85,
    totalQuestions: 10,
    questions: [],
    responses: Array(8).fill(null).map((_, i) => ({
      questionId: `q${i}`,
      selectedAnswer: 0,
      isCorrect: i < 8,
      responseTime: 5000
    })),
    pdfFileName: 'math-basics.pdf',
    status: 'completed'
  },
  {
    id: 'quiz2',
    userId: 'user1',
    title: 'Science Quiz',
    createdAt: Timestamp.fromDate(new Date('2024-01-14T14:30:00Z')),
    completedAt: Timestamp.fromDate(new Date('2024-01-14T14:45:00Z')),
    score: 60,
    totalQuestions: 5,
    questions: [],
    responses: Array(3).fill(null).map((_, i) => ({
      questionId: `q${i}`,
      selectedAnswer: 0,
      isCorrect: i < 3,
      responseTime: 4000
    })),
    pdfFileName: 'science-intro.pdf',
    status: 'completed'
  },
  {
    id: 'quiz3',
    userId: 'user1',
    title: 'History Quiz',
    createdAt: Timestamp.fromDate(new Date('2024-01-13T09:00:00Z')),
    score: 0,
    totalQuestions: 8,
    questions: [],
    responses: Array(3).fill(null).map((_, i) => ({
      questionId: `q${i}`,
      selectedAnswer: 0,
      isCorrect: false,
      responseTime: 3000
    })),
    pdfFileName: 'world-history.pdf',
    status: 'in_progress'
  }
]

describe('HistoryTable', () => {
  const mockOnViewQuiz = vi.fn()

  beforeEach(() => {
    mockOnViewQuiz.mockClear()
  })

  it('renders quiz history table with correct data', () => {
    render(<HistoryTable quizzes={mockQuizzes} onViewQuiz={mockOnViewQuiz} />)
    
    expect(screen.getByText('Quiz History')).toBeInTheDocument()
    expect(screen.getByText('Math Quiz')).toBeInTheDocument()
    expect(screen.getByText('Science Quiz')).toBeInTheDocument()
    expect(screen.getByText('History Quiz')).toBeInTheDocument()
    
    // Check PDF filenames
    expect(screen.getByText('math-basics.pdf')).toBeInTheDocument()
    expect(screen.getByText('science-intro.pdf')).toBeInTheDocument()
    expect(screen.getByText('world-history.pdf')).toBeInTheDocument()
  })

  it('displays correct status badges', () => {
    render(<HistoryTable quizzes={mockQuizzes} onViewQuiz={mockOnViewQuiz} />)
    
    const completedBadges = screen.getAllByText('Completed')
    const inProgressBadges = screen.getAllByText('In Progress')
    
    expect(completedBadges).toHaveLength(2)
    expect(inProgressBadges).toHaveLength(1)
  })

  it('displays scores with correct colors', () => {
    render(<HistoryTable quizzes={mockQuizzes} onViewQuiz={mockOnViewQuiz} />)
    
    const highScore = screen.getByText('85%')
    const mediumScore = screen.getByText('60%')
    
    expect(highScore).toHaveClass('text-green-600')
    expect(mediumScore).toHaveClass('text-yellow-600')
    
    // In-progress quiz should show dash
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('shows question progress correctly', () => {
    render(<HistoryTable quizzes={mockQuizzes} onViewQuiz={mockOnViewQuiz} />)
    
    expect(screen.getByText('8/10')).toBeInTheDocument() // Math quiz
    expect(screen.getByText('3/5')).toBeInTheDocument()  // Science quiz
    expect(screen.getByText('3/8')).toBeInTheDocument()  // History quiz
  })

  it('calls onViewQuiz when view button is clicked', () => {
    render(<HistoryTable quizzes={mockQuizzes} onViewQuiz={mockOnViewQuiz} />)
    
    const viewButtons = screen.getAllByText('View')
    fireEvent.click(viewButtons[0])
    
    expect(mockOnViewQuiz).toHaveBeenCalledWith('quiz1')
  })

  it('filters quizzes by search term', async () => {
    render(<HistoryTable quizzes={mockQuizzes} onViewQuiz={mockOnViewQuiz} />)
    
    const searchInput = screen.getByPlaceholderText('Search quizzes...')
    fireEvent.change(searchInput, { target: { value: 'Math' } })
    
    await waitFor(() => {
      expect(screen.getByText('Math Quiz')).toBeInTheDocument()
      expect(screen.queryByText('Science Quiz')).not.toBeInTheDocument()
      expect(screen.queryByText('History Quiz')).not.toBeInTheDocument()
    })
  })

  it('filters quizzes by PDF filename', async () => {
    render(<HistoryTable quizzes={mockQuizzes} onViewQuiz={mockOnViewQuiz} />)
    
    const searchInput = screen.getByPlaceholderText('Search quizzes...')
    fireEvent.change(searchInput, { target: { value: 'science-intro' } })
    
    await waitFor(() => {
      expect(screen.getByText('Science Quiz')).toBeInTheDocument()
      expect(screen.queryByText('Math Quiz')).not.toBeInTheDocument()
      expect(screen.queryByText('History Quiz')).not.toBeInTheDocument()
    })
  })

  it('filters quizzes by status', async () => {
    render(<HistoryTable quizzes={mockQuizzes} onViewQuiz={mockOnViewQuiz} />)
    
    const statusFilter = screen.getByDisplayValue('All Status')
    fireEvent.change(statusFilter, { target: { value: 'completed' } })
    
    await waitFor(() => {
      expect(screen.getByText('Math Quiz')).toBeInTheDocument()
      expect(screen.getByText('Science Quiz')).toBeInTheDocument()
      expect(screen.queryByText('History Quiz')).not.toBeInTheDocument()
    })
  })

  it('sorts quizzes by title', async () => {
    render(<HistoryTable quizzes={mockQuizzes} onViewQuiz={mockOnViewQuiz} />)
    
    const titleHeader = screen.getByText('Quiz Title')
    fireEvent.click(titleHeader)
    
    await waitFor(() => {
      const rows = screen.getAllByRole('row')
      // Skip header row, check first data row
      expect(rows[1]).toHaveTextContent('Science Quiz') // Alphabetically last when desc
    })
  })

  it('sorts quizzes by score', async () => {
    render(<HistoryTable quizzes={mockQuizzes} onViewQuiz={mockOnViewQuiz} />)
    
    const scoreHeader = screen.getByText('Score')
    fireEvent.click(scoreHeader)
    
    await waitFor(() => {
      const rows = screen.getAllByRole('row')
      // Should show highest score first (85%)
      expect(rows[1]).toHaveTextContent('85%')
    })
  })

  it('shows loading state', () => {
    render(<HistoryTable quizzes={[]} loading={true} onViewQuiz={mockOnViewQuiz} />)
    
    expect(screen.getByRole('generic')).toHaveClass('animate-pulse')
  })

  it('shows empty state when no quizzes', () => {
    render(<HistoryTable quizzes={[]} onViewQuiz={mockOnViewQuiz} />)
    
    expect(screen.getByText('No quizzes yet')).toBeInTheDocument()
    expect(screen.getByText('Upload your first PDF to create a quiz and start learning!')).toBeInTheDocument()
    expect(screen.getByText('Create Your First Quiz')).toBeInTheDocument()
  })

  it('handles pagination correctly', async () => {
    // Create more quizzes to test pagination
    const manyQuizzes = Array(25).fill(null).map((_, i) => ({
      ...mockQuizzes[0],
      id: `quiz${i}`,
      title: `Quiz ${i + 1}`,
      createdAt: Timestamp.fromDate(new Date(`2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`))
    }))
    
    render(<HistoryTable quizzes={manyQuizzes} onViewQuiz={mockOnViewQuiz} />)
    
    // Should show pagination controls
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    expect(screen.getByText('Previous')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
    
    // Click next page
    fireEvent.click(screen.getByText('Next'))
    
    await waitFor(() => {
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    })
  })

  it('disables pagination buttons appropriately', () => {
    render(<HistoryTable quizzes={mockQuizzes} onViewQuiz={mockOnViewQuiz} />)
    
    // With only 3 quizzes, no pagination should be shown
    expect(screen.queryByText('Previous')).not.toBeInTheDocument()
    expect(screen.queryByText('Next')).not.toBeInTheDocument()
  })

  it('shows correct duration formatting', () => {
    render(<HistoryTable quizzes={mockQuizzes} onViewQuiz={mockOnViewQuiz} />)
    
    // Math quiz: 15 minutes
    expect(screen.getByText('15m 0s')).toBeInTheDocument()
    
    // Science quiz: 15 minutes  
    expect(screen.getByText('15m 0s')).toBeInTheDocument()
    
    // History quiz: in progress
    expect(screen.getByText('In progress')).toBeInTheDocument()
  })

  it('combines search and filter correctly', async () => {
    render(<HistoryTable quizzes={mockQuizzes} onViewQuiz={mockOnViewQuiz} />)
    
    // Search for "Quiz" and filter by completed
    const searchInput = screen.getByPlaceholderText('Search quizzes...')
    fireEvent.change(searchInput, { target: { value: 'Quiz' } })
    
    const statusFilter = screen.getByDisplayValue('All Status')
    fireEvent.change(statusFilter, { target: { value: 'completed' } })
    
    await waitFor(() => {
      expect(screen.getByText('Math Quiz')).toBeInTheDocument()
      expect(screen.getByText('Science Quiz')).toBeInTheDocument()
      expect(screen.queryByText('History Quiz')).not.toBeInTheDocument() // Filtered out by status
    })
  })
})