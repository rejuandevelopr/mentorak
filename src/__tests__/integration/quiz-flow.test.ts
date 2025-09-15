import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { renderAuthenticated } from '../utils/test-utils'
import { resetAllMocks, mockOpenAI } from '../utils/api-mocks'
import { createTestQuiz, createTestQuestion } from '../utils/firebase-test-utils'

// Mock quiz components for integration testing
const MockPDFUploader = ({ onUpload }: { onUpload: (file: File) => void }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
    }
  }

  return React.createElement('div', { 'data-testid': 'pdf-uploader' },
    React.createElement('input', {
      type: 'file',
      accept: '.pdf',
      onChange: handleFileChange,
      'data-testid': 'file-input'
    }),
    React.createElement('div', { 'data-testid': 'upload-area' }, 'Drop PDF here or click to upload')
  )
}

const MockQuizSession = ({ questions, onComplete }: { 
  questions: any[], 
  onComplete: (results: any) => void 
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [answers, setAnswers] = React.useState<number[]>([])

  const currentQuestion = questions[currentIndex]

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers, answerIndex]
    setAnswers(newAnswers)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // Quiz completed
      const score = newAnswers.reduce((acc, answer, idx) => {
        return acc + (answer === questions[idx].correctAnswer ? 1 : 0)
      }, 0)
      
      onComplete({
        score,
        totalQuestions: questions.length,
        answers: newAnswers
      })
    }
  }

  if (!currentQuestion) {
    return React.createElement('div', { 'data-testid': 'quiz-completed' }, 'Quiz Completed!')
  }

  return React.createElement('div', { 'data-testid': 'quiz-session' },
    React.createElement('div', { 'data-testid': 'progress' }, 
      `Question ${currentIndex + 1} of ${questions.length}`
    ),
    React.createElement('h2', { 'data-testid': 'question-text' }, currentQuestion.text),
    React.createElement('div', { 'data-testid': 'options' },
      ...currentQuestion.options.map((option: string, index: number) =>
        React.createElement('button', {
          key: index,
          onClick: () => handleAnswer(index),
          'data-testid': `option-${index}`
        }, option)
      )
    )
  )
}

const MockQuizResults = ({ results }: { results: any }) => {
  const percentage = Math.round((results.score / results.totalQuestions) * 100)

  return React.createElement('div', { 'data-testid': 'quiz-results' },
    React.createElement('h2', null, 'Quiz Results'),
    React.createElement('div', { 'data-testid': 'score' }, 
      `Score: ${results.score}/${results.totalQuestions} (${percentage}%)`
    ),
    React.createElement('button', { 'data-testid': 'retake-button' }, 'Retake Quiz'),
    React.createElement('button', { 'data-testid': 'view-history-button' }, 'View History')
  )
}

describe('Quiz Flow Integration', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  afterEach(() => {
    resetAllMocks()
  })

  describe('PDF Upload and Quiz Generation', () => {
    it('should handle PDF upload and generate quiz', async () => {
      const user = userEvent.setup()
      let uploadedFile: File | null = null

      const TestComponent = () => {
        const [file, setFile] = React.useState<File | null>(null)
        const [quiz, setQuiz] = React.useState<any>(null)

        const handleUpload = async (uploadedFile: File) => {
          setFile(uploadedFile)
          uploadedFile = uploadedFile

          // Simulate quiz generation
          setTimeout(() => {
            const mockQuiz = createTestQuiz({
              title: uploadedFile.name,
              questions: [
                createTestQuestion({
                  text: 'What is the main topic?',
                  options: ['Topic A', 'Topic B', 'Topic C', 'Topic D'],
                  correctAnswer: 0
                })
              ]
            })
            setQuiz(mockQuiz)
          }, 100)
        }

        if (quiz) {
          return React.createElement('div', { 'data-testid': 'quiz-generated' },
            `Quiz generated from ${file?.name}`
          )
        }

        return React.createElement(MockPDFUploader, { onUpload: handleUpload })
      }

      renderAuthenticated(React.createElement(TestComponent))

      // Upload a PDF file
      const fileInput = screen.getByTestId('file-input')
      const file = new File(['PDF content'], 'test.pdf', { type: 'application/pdf' })
      
      await user.upload(fileInput, file)

      // Wait for quiz generation
      await waitFor(() => {
        expect(screen.getByTestId('quiz-generated')).toBeInTheDocument()
      }, { timeout: 200 })

      expect(screen.getByText('Quiz generated from test.pdf')).toBeInTheDocument()
    })
  })

  describe('Quiz Taking Flow', () => {
    it('should handle complete quiz taking flow', async () => {
      const user = userEvent.setup()
      let quizResults: any = null

      const TestComponent = () => {
        const [results, setResults] = React.useState<any>(null)

        const questions = [
          createTestQuestion({
            text: 'What is 2 + 2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: 1
          }),
          createTestQuestion({
            text: 'What is the capital of France?',
            options: ['London', 'Berlin', 'Paris', 'Madrid'],
            correctAnswer: 2
          })
        ]

        const handleComplete = (results: any) => {
          setResults(results)
          quizResults = results
        }

        if (results) {
          return React.createElement(MockQuizResults, { results })
        }

        return React.createElement(MockQuizSession, { 
          questions, 
          onComplete: handleComplete 
        })
      }

      renderAuthenticated(React.createElement(TestComponent))

      // Verify quiz session is displayed
      expect(screen.getByTestId('quiz-session')).toBeInTheDocument()
      expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()
      expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument()

      // Answer first question correctly
      await user.click(screen.getByTestId('option-1')) // Answer: 4

      // Verify second question is displayed
      await waitFor(() => {
        expect(screen.getByText('Question 2 of 2')).toBeInTheDocument()
        expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
      })

      // Answer second question correctly
      await user.click(screen.getByTestId('option-2')) // Answer: Paris

      // Verify quiz results are displayed
      await waitFor(() => {
        expect(screen.getByTestId('quiz-results')).toBeInTheDocument()
      })

      expect(screen.getByText('Quiz Results')).toBeInTheDocument()
      expect(screen.getByText('Score: 2/2 (100%)')).toBeInTheDocument()
      expect(screen.getByTestId('retake-button')).toBeInTheDocument()
      expect(screen.getByTestId('view-history-button')).toBeInTheDocument()
    })

    it('should handle partial correct answers', async () => {
      const user = userEvent.setup()

      const TestComponent = () => {
        const [results, setResults] = React.useState<any>(null)

        const questions = [
          createTestQuestion({
            text: 'What is 2 + 2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: 1
          }),
          createTestQuestion({
            text: 'What is the capital of France?',
            options: ['London', 'Berlin', 'Paris', 'Madrid'],
            correctAnswer: 2
          })
        ]

        if (results) {
          return React.createElement(MockQuizResults, { results })
        }

        return React.createElement(MockQuizSession, { 
          questions, 
          onComplete: setResults 
        })
      }

      renderAuthenticated(React.createElement(TestComponent))

      // Answer first question incorrectly
      await user.click(screen.getByTestId('option-0')) // Answer: 3 (incorrect)

      // Answer second question correctly
      await user.click(screen.getByTestId('option-2')) // Answer: Paris (correct)

      // Verify quiz results show partial score
      await waitFor(() => {
        expect(screen.getByText('Score: 1/2 (50%)')).toBeInTheDocument()
      })
    })
  })

  describe('Quiz Progress and State Management', () => {
    it('should track quiz progress correctly', async () => {
      const user = userEvent.setup()

      const questions = [
        createTestQuestion({ text: 'Question 1' }),
        createTestQuestion({ text: 'Question 2' }),
        createTestQuestion({ text: 'Question 3' })
      ]

      renderAuthenticated(React.createElement(MockQuizSession, { 
        questions, 
        onComplete: () => {} 
      }))

      // Check initial progress
      expect(screen.getByText('Question 1 of 3')).toBeInTheDocument()
      expect(screen.getByText('Question 1')).toBeInTheDocument()

      // Answer first question
      await user.click(screen.getByTestId('option-0'))

      // Check progress after first answer
      await waitFor(() => {
        expect(screen.getByText('Question 2 of 3')).toBeInTheDocument()
        expect(screen.getByText('Question 2')).toBeInTheDocument()
      })

      // Answer second question
      await user.click(screen.getByTestId('option-0'))

      // Check progress after second answer
      await waitFor(() => {
        expect(screen.getByText('Question 3 of 3')).toBeInTheDocument()
        expect(screen.getByText('Question 3')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle quiz generation errors gracefully', async () => {
      // Mock OpenAI API to fail
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'))

      const TestComponent = () => {
        const [error, setError] = React.useState<string | null>(null)

        const handleUpload = async (file: File) => {
          try {
            // Simulate failed quiz generation
            await mockOpenAI.chat.completions.create({})
          } catch (err) {
            setError('Failed to generate quiz. Please try again.')
          }
        }

        if (error) {
          return React.createElement('div', { 'data-testid': 'error-message' }, error)
        }

        return React.createElement(MockPDFUploader, { onUpload: handleUpload })
      }

      const user = userEvent.setup()
      renderAuthenticated(React.createElement(TestComponent))

      // Upload a file to trigger error
      const fileInput = screen.getByTestId('file-input')
      const file = new File(['PDF content'], 'test.pdf', { type: 'application/pdf' })
      
      await user.upload(fileInput, file)

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
      })

      expect(screen.getByText('Failed to generate quiz. Please try again.')).toBeInTheDocument()
    })
  })
})