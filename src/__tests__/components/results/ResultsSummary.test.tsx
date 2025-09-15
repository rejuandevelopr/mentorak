import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Timestamp } from 'firebase/firestore'
import ResultsSummary from '@/components/results/ResultsSummary'
import { Quiz, Question, UserResponse } from '@/types/models'
import { vi } from 'vitest'

// Mock Heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  CheckCircleIcon: ({ className }: { className: string }) => (
    <div data-testid="check-circle-icon" className={className} />
  ),
  XCircleIcon: ({ className }: { className: string }) => (
    <div data-testid="x-circle-icon" className={className} />
  ),
  ArrowPathIcon: ({ className }: { className: string }) => (
    <div data-testid="arrow-path-icon" className={className} />
  ),
}))

const mockQuestions: Question[] = [
  {
    id: 'q1',
    text: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 2,
    audioUrl: 'https://example.com/audio1.mp3'
  },
  {
    id: 'q2',
    text: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 1,
  }
]

const mockResponses: UserResponse[] = [
  {
    questionId: 'q1',
    selectedAnswer: 2,
    isCorrect: true,
    responseTime: 5000,
    voiceTranscript: 'Paris'
  },
  {
    questionId: 'q2',
    selectedAnswer: 0,
    isCorrect: false,
    responseTime: 3000,
    voiceTranscript: 'Three'
  }
]

const mockQuiz: Quiz = {
  id: 'quiz1',
  userId: 'user1',
  title: 'Geography and Math Quiz',
  createdAt: Timestamp.now(),
  completedAt: Timestamp.now(),
  score: 50,
  totalQuestions: 2,
  questions: mockQuestions,
  responses: mockResponses,
  pdfFileName: 'test.pdf',
  status: 'completed'
}

describe('ResultsSummary', () => {
  it('renders quiz title and score correctly', () => {
    render(<ResultsSummary quiz={mockQuiz} />)
    
    expect(screen.getByText('Quiz Results')).toBeInTheDocument()
    expect(screen.getByText('Geography and Math Quiz')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('1 out of 2 questions correct')).toBeInTheDocument()
  })

  it('applies correct color classes based on score', () => {
    // Test high score (green)
    const highScoreQuiz = { ...mockQuiz, score: 85 }
    const { rerender } = render(<ResultsSummary quiz={highScoreQuiz} />)
    expect(screen.getByText('85%')).toHaveClass('text-green-600')

    // Test medium score (yellow)
    const mediumScoreQuiz = { ...mockQuiz, score: 65 }
    rerender(<ResultsSummary quiz={mediumScoreQuiz} />)
    expect(screen.getByText('65%')).toHaveClass('text-yellow-600')

    // Test low score (red)
    const lowScoreQuiz = { ...mockQuiz, score: 45 }
    rerender(<ResultsSummary quiz={lowScoreQuiz} />)
    expect(screen.getByText('45%')).toHaveClass('text-red-600')
  })

  it('shows and hides question details when button is clicked', () => {
    render(<ResultsSummary quiz={mockQuiz} />)
    
    // Initially details should be hidden
    expect(screen.queryByText('Question Breakdown')).not.toBeInTheDocument()
    expect(screen.queryByText('What is the capital of France?')).not.toBeInTheDocument()
    
    // Click show details button
    fireEvent.click(screen.getByText('Show Question Details'))
    
    // Details should now be visible
    expect(screen.getByText('Question Breakdown')).toBeInTheDocument()
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument()
    
    // Button text should change
    expect(screen.getByText('Hide Details')).toBeInTheDocument()
    
    // Click hide details button
    fireEvent.click(screen.getByText('Hide Details'))
    
    // Details should be hidden again
    expect(screen.queryByText('Question Breakdown')).not.toBeInTheDocument()
  })

  it('displays question details with correct styling', () => {
    render(<ResultsSummary quiz={mockQuiz} />)
    
    // Show details
    fireEvent.click(screen.getByText('Show Question Details'))
    
    // Check first question (correct answer)
    expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument()
    expect(screen.getByText('Question 1')).toBeInTheDocument()
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
    
    // Check options are displayed
    expect(screen.getByText('London')).toBeInTheDocument()
    expect(screen.getByText('Berlin')).toBeInTheDocument()
    expect(screen.getByText('Paris')).toBeInTheDocument()
    expect(screen.getByText('Madrid')).toBeInTheDocument()
    
    // Check correct answer indicator
    expect(screen.getAllByText('Correct Answer')).toHaveLength(2) // One for each question
    
    // Check voice transcript
    expect(screen.getAllByText('Voice Response:')).toHaveLength(2)
    expect(screen.getByText('"Paris"')).toBeInTheDocument()
    
    // Check response time
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('displays incorrect answers with proper styling', () => {
    render(<ResultsSummary quiz={mockQuiz} />)
    
    // Show details
    fireEvent.click(screen.getByText('Show Question Details'))
    
    // Check second question (incorrect answer)
    expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument()
    expect(screen.getByText('Question 2')).toBeInTheDocument()
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument()
    
    // Check that both "Your Answer" and "Correct Answer" are shown
    expect(screen.getByText('Your Answer')).toBeInTheDocument()
    expect(screen.getAllByText('Correct Answer')).toHaveLength(2) // One for each question
  })

  it('calls onRetakeQuiz when retake button is clicked', () => {
    const mockOnRetakeQuiz = vi.fn()
    render(<ResultsSummary quiz={mockQuiz} onRetakeQuiz={mockOnRetakeQuiz} />)
    
    const retakeButton = screen.getByText('Retake Quiz')
    fireEvent.click(retakeButton)
    
    expect(mockOnRetakeQuiz).toHaveBeenCalledTimes(1)
  })

  it('does not show retake button when onRetakeQuiz is not provided', () => {
    render(<ResultsSummary quiz={mockQuiz} />)
    
    expect(screen.queryByText('Retake Quiz')).not.toBeInTheDocument()
  })

  it('handles quiz with no responses gracefully', () => {
    const emptyQuiz: Quiz = {
      ...mockQuiz,
      responses: [],
      score: 0,
      totalQuestions: 2
    }
    
    render(<ResultsSummary quiz={emptyQuiz} />)
    
    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByText('0 out of 2 questions correct')).toBeInTheDocument()
  })

  it('handles questions without voice transcripts', () => {
    const quizWithoutTranscripts: Quiz = {
      ...mockQuiz,
      responses: [
        {
          questionId: 'q1',
          selectedAnswer: 2,
          isCorrect: true,
          responseTime: 5000
        }
      ]
    }
    
    render(<ResultsSummary quiz={quizWithoutTranscripts} />)
    
    // Show details
    fireEvent.click(screen.getByText('Show Question Details'))
    
    // Voice transcript section should not be present
    expect(screen.queryByText('Voice Response:')).not.toBeInTheDocument()
  })

  it('handles questions without response times', () => {
    const quizWithoutResponseTimes: Quiz = {
      ...mockQuiz,
      responses: [
        {
          questionId: 'q1',
          selectedAnswer: 2,
          isCorrect: true,
          responseTime: 0
        }
      ]
    }
    
    render(<ResultsSummary quiz={quizWithoutResponseTimes} />)
    
    // Show details
    fireEvent.click(screen.getByText('Show Question Details'))
    
    // Response time should not be shown for 0 response time
    expect(screen.queryByText('Response time:')).not.toBeInTheDocument()
  })
})