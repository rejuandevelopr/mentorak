import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Timestamp } from 'firebase/firestore'
import DetailedQuizResult from '@/components/results/DetailedQuizResult'
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
  ChevronLeftIcon: ({ className }: { className: string }) => (
    <div data-testid="chevron-left-icon" className={className} />
  ),
  ChevronRightIcon: ({ className }: { className: string }) => (
    <div data-testid="chevron-right-icon" className={className} />
  ),
  SpeakerWaveIcon: ({ className }: { className: string }) => (
    <div data-testid="speaker-wave-icon" className={className} />
  ),
}))

// Mock AudioPlayer component
vi.mock('@/components/quiz/AudioPlayer', () => ({
  default: function MockAudioPlayer({ audioUrl, className }: { audioUrl: string; className: string }) {
    return (
      <div data-testid="audio-player" className={className}>
        Audio Player for: {audioUrl}
      </div>
    )
  }
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
  },
  {
    id: 'q3',
    text: 'What color is the sky?',
    options: ['Red', 'Blue', 'Green', 'Yellow'],
    correctAnswer: 1,
    audioUrl: 'https://example.com/audio3.mp3'
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
  },
  {
    questionId: 'q3',
    selectedAnswer: 1,
    isCorrect: true,
    responseTime: 4000
  }
]

const mockQuiz: Quiz = {
  id: 'quiz1',
  userId: 'user1',
  title: 'Mixed Knowledge Quiz',
  createdAt: Timestamp.fromDate(new Date('2024-01-15T10:00:00Z')),
  completedAt: Timestamp.fromDate(new Date('2024-01-15T10:15:00Z')),
  score: 67,
  totalQuestions: 3,
  questions: mockQuestions,
  responses: mockResponses,
  pdfFileName: 'knowledge-test.pdf',
  status: 'completed'
}

describe('DetailedQuizResult', () => {
  const mockOnRetakeQuiz = vi.fn()
  const mockOnBackToHistory = vi.fn()

  beforeEach(() => {
    mockOnRetakeQuiz.mockClear()
    mockOnBackToHistory.mockClear()
  })

  it('renders quiz summary correctly', () => {
    render(<DetailedQuizResult quiz={mockQuiz} />)
    
    expect(screen.getByText('Mixed Knowledge Quiz')).toBeInTheDocument()
    expect(screen.getByText('📄 knowledge-test.pdf')).toBeInTheDocument()
    expect(screen.getByText('67%')).toBeInTheDocument()
    expect(screen.getByText('2/3 correct')).toBeInTheDocument()
  })

  it('displays first question by default', () => {
    render(<DetailedQuizResult quiz={mockQuiz} />)
    
    expect(screen.getByText('Question 1 of 3')).toBeInTheDocument()
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
    expect(screen.getByText('A. London')).toBeInTheDocument()
    expect(screen.getByText('B. Berlin')).toBeInTheDocument()
    expect(screen.getByText('C. Paris')).toBeInTheDocument()
    expect(screen.getByText('D. Madrid')).toBeInTheDocument()
  })

  it('shows correct answer styling for correct responses', () => {
    render(<DetailedQuizResult quiz={mockQuiz} />)
    
    // First question is answered correctly
    expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument()
    expect(screen.getByText('Correct')).toBeInTheDocument()
  })

  it('navigates between questions using arrow buttons', () => {
    render(<DetailedQuizResult quiz={mockQuiz} />)
    
    // Initially on question 1
    expect(screen.getByText('Question 1 of 3')).toBeInTheDocument()
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
    
    // Click next button
    const nextButton = screen.getByTestId('chevron-right-icon').closest('button')
    fireEvent.click(nextButton!)
    
    // Should now be on question 2
    expect(screen.getByText('Question 2 of 3')).toBeInTheDocument()
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument()
    
    // Click previous button
    const prevButton = screen.getByTestId('chevron-left-icon').closest('button')
    fireEvent.click(prevButton!)
    
    // Should be back to question 1
    expect(screen.getByText('Question 1 of 3')).toBeInTheDocument()
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
  })

  it('disables navigation buttons at boundaries', () => {
    render(<DetailedQuizResult quiz={mockQuiz} />)
    
    // At first question, previous should be disabled
    const prevButton = screen.getByTestId('chevron-left-icon').closest('button')
    expect(prevButton).toBeDisabled()
    
    // Navigate to last question
    const nextButton = screen.getByTestId('chevron-right-icon').closest('button')
    fireEvent.click(nextButton!) // Go to question 2
    fireEvent.click(nextButton!) // Go to question 3
    
    // At last question, next should be disabled
    expect(nextButton).toBeDisabled()
  })

  it('shows audio player when audio button is clicked', () => {
    render(<DetailedQuizResult quiz={mockQuiz} />)
    
    // Audio button should be present for first question
    const audioButton = screen.getByTestId('speaker-wave-icon').closest('button')
    expect(audioButton).toBeInTheDocument()
    
    // Click audio button
    fireEvent.click(audioButton!)
    
    // Audio player should appear
    expect(screen.getByTestId('audio-player')).toBeInTheDocument()
    expect(screen.getByText('Audio Player for: https://example.com/audio1.mp3')).toBeInTheDocument()
  })

  it('hides audio player when audio button is clicked again', () => {
    render(<DetailedQuizResult quiz={mockQuiz} />)
    
    const audioButton = screen.getByTestId('speaker-wave-icon').closest('button')
    
    // Click to show
    fireEvent.click(audioButton!)
    expect(screen.getByTestId('audio-player')).toBeInTheDocument()
    
    // Click to hide
    fireEvent.click(audioButton!)
    expect(screen.queryByTestId('audio-player')).not.toBeInTheDocument()
  })

  it('does not show audio button for questions without audio', () => {
    render(<DetailedQuizResult quiz={mockQuiz} />)
    
    // Navigate to question 2 (no audio)
    const nextButton = screen.getByTestId('chevron-right-icon').closest('button')
    fireEvent.click(nextButton!)
    
    // Audio button should not be present
    expect(screen.queryByTestId('speaker-wave-icon')).not.toBeInTheDocument()
  })

  it('displays voice transcript when available', () => {
    render(<DetailedQuizResult quiz={mockQuiz} />)
    
    expect(screen.getByText('Voice Response:')).toBeInTheDocument()
    expect(screen.getByText('"Paris"')).toBeInTheDocument()
  })

  it('displays response time', () => {
    render(<DetailedQuizResult quiz={mockQuiz} />)
    
    expect(screen.getByText('Response Time:')).toBeInTheDocument()
    expect(screen.getByText('5s')).toBeInTheDocument()
  })

  it('does not show voice transcript section when not available', () => {
    render(<DetailedQuizResult quiz={mockQuiz} />)
    
    // Navigate to question 3 (no voice transcript)
    const nextButton = screen.getByTestId('chevron-right-icon').closest('button')
    fireEvent.click(nextButton!) // Go to question 2
    fireEvent.click(nextButton!) // Go to question 3
    
    expect(screen.queryByText('Voice Response:')).not.toBeInTheDocument()
  })

  it('shows incorrect answer styling for wrong responses', () => {
    render(<DetailedQuizResult quiz={mockQuiz} />)
    
    // Navigate to question 2 (incorrect answer)
    const nextButton = screen.getByTestId('chevron-right-icon').closest('button')
    fireEvent.click(nextButton!)
    
    expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument()
    expect(screen.getByText('Your Answer')).toBeInTheDocument()
    expect(screen.getByText('Correct')).toBeInTheDocument()
  })

  it('updates progress bar based on current question', () => {
    render(<DetailedQuizResult quiz={mockQuiz} />)
    
    // Check initial progress (33.33% for question 1 of 3)
    const progressBar = document.querySelector('.bg-blue-600')
    expect(progressBar).toHaveStyle('width: 33.333333333333336%')
    
    // Navigate to question 2
    const nextButton = screen.getByTestId('chevron-right-icon').closest('button')
    fireEvent.click(nextButton!)
    
    // Progress should be 66.67%
    expect(progressBar).toHaveStyle('width: 66.66666666666667%')
  })

  it('allows navigation via question dots', () => {
    render(<DetailedQuizResult quiz={mockQuiz} />)
    
    // Should have 3 dots for 3 questions
    const dots = document.querySelectorAll('.w-3.h-3.rounded-full.cursor-pointer')
    expect(dots).toHaveLength(3)
    
    // Click on third dot
    fireEvent.click(dots[2])
    
    // Should navigate to question 3
    expect(screen.getByText('Question 3 of 3')).toBeInTheDocument()
    expect(screen.getByText('What color is the sky?')).toBeInTheDocument()
  })

  it('calls callback functions when buttons are clicked', () => {
    render(
      <DetailedQuizResult 
        quiz={mockQuiz} 
        onRetakeQuiz={mockOnRetakeQuiz}
        onBackToHistory={mockOnBackToHistory}
      />
    )
    
    // Test retake quiz button
    const retakeButton = screen.getByText('Retake Quiz')
    fireEvent.click(retakeButton)
    expect(mockOnRetakeQuiz).toHaveBeenCalledTimes(1)
    
    // Test back to history button
    const backButton = screen.getByText('Back to History')
    fireEvent.click(backButton)
    expect(mockOnBackToHistory).toHaveBeenCalledTimes(1)
  })

  it('does not show action buttons when callbacks are not provided', () => {
    render(<DetailedQuizResult quiz={mockQuiz} />)
    
    expect(screen.queryByText('Retake Quiz')).not.toBeInTheDocument()
    expect(screen.queryByText('Back to History')).not.toBeInTheDocument()
  })

  it('handles quiz with no questions gracefully', () => {
    const emptyQuiz: Quiz = {
      ...mockQuiz,
      questions: [],
      responses: [],
      totalQuestions: 0
    }
    
    render(<DetailedQuizResult quiz={emptyQuiz} />)
    
    expect(screen.getByText('No Questions Available')).toBeInTheDocument()
    expect(screen.getByText("This quiz doesn't have any questions to review.")).toBeInTheDocument()
  })

  it('shows correct dot colors based on answer correctness', () => {
    render(<DetailedQuizResult quiz={mockQuiz} />)
    
    const dots = document.querySelectorAll('.w-3.h-3.rounded-full.cursor-pointer')
    
    // First dot should be green (correct)
    expect(dots[0]).toHaveClass('bg-green-500')
    
    // Second dot should be red (incorrect)
    expect(dots[1]).toHaveClass('bg-red-500')
    
    // Third dot should be green (correct)
    expect(dots[2]).toHaveClass('bg-green-500')
  })

  it('highlights current question dot with ring', () => {
    render(<DetailedQuizResult quiz={mockQuiz} />)
    
    const dots = document.querySelectorAll('.w-3.h-3.rounded-full.cursor-pointer')
    
    // First dot should have ring (current question)
    expect(dots[0]).toHaveClass('ring-2', 'ring-blue-500', 'ring-offset-2')
    
    // Other dots should not have ring
    expect(dots[1]).not.toHaveClass('ring-2')
    expect(dots[2]).not.toHaveClass('ring-2')
  })
})