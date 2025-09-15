import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '@/app/api/generate-quiz/route'
import { NextRequest } from 'next/server'

// Mock the dependencies
vi.mock('@/lib/openai/mcq-generator', () => ({
  generateMCQsWithRetry: vi.fn()
}))

vi.mock('pdf-parse', () => ({
  default: vi.fn()
}))

import { generateMCQsWithRetry } from '@/lib/openai/mcq-generator'
import pdf from 'pdf-parse'

describe('/api/generate-quiz Success Response Format', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.OPENAI_API_KEY = 'test-key'
  })

  afterEach(() => {
    delete process.env.OPENAI_API_KEY
  })

  it('should return success response in correct format when quiz generation succeeds', async () => {
    // Mock successful PDF parsing
    const mockPdfData = {
      text: 'This is a sample PDF content with enough text to generate meaningful questions. It contains information about various topics that can be used to create multiple choice questions.',
      numpages: 1,
      info: { Title: 'Test PDF' }
    }
    vi.mocked(pdf).mockResolvedValue(mockPdfData)

    // Mock successful MCQ generation
    const mockQuestions = [
      { question: 'Question 1', options: ['A', 'B', 'C', 'D'], correctAnswer: 0 },
      { question: 'Question 2', options: ['A', 'B', 'C', 'D'], correctAnswer: 1 },
      { question: 'Question 3', options: ['A', 'B', 'C', 'D'], correctAnswer: 2 },
      { question: 'Question 4', options: ['A', 'B', 'C', 'D'], correctAnswer: 3 },
      { question: 'Question 5', options: ['A', 'B', 'C', 'D'], correctAnswer: 0 }
    ]
    vi.mocked(generateMCQsWithRetry).mockResolvedValue(mockQuestions)

    // Create a valid PDF file
    const formData = new FormData()
    const file = new File(['PDF content'], 'test.pdf', { type: 'application/pdf' })
    formData.append('file', file)

    const request = new NextRequest('http://localhost:3000/api/generate-quiz', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    
    // Verify success response format
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    
    const data = await response.json()
    expect(data).toHaveProperty('quiz')
    expect(data).not.toHaveProperty('error')
    expect(data.quiz).toEqual(mockQuestions)
    expect(data.quiz).toHaveLength(5)
  })

  it('should return error response when MCQ generation fails to produce exactly 5 questions', async () => {
    // Mock successful PDF parsing
    const mockPdfData = {
      text: 'This is a sample PDF content with enough text to generate meaningful questions.',
      numpages: 1,
      info: { Title: 'Test PDF' }
    }
    vi.mocked(pdf).mockResolvedValue(mockPdfData)

    // Mock MCQ generation returning wrong number of questions
    const mockQuestions = [
      { question: 'Question 1', options: ['A', 'B', 'C', 'D'], correctAnswer: 0 },
      { question: 'Question 2', options: ['A', 'B', 'C', 'D'], correctAnswer: 1 }
    ]
    vi.mocked(generateMCQsWithRetry).mockResolvedValue(mockQuestions)

    const formData = new FormData()
    const file = new File(['PDF content'], 'test.pdf', { type: 'application/pdf' })
    formData.append('file', file)

    const request = new NextRequest('http://localhost:3000/api/generate-quiz', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    
    // Verify error response format
    expect(response.status).toBe(500)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    
    const data = await response.json()
    expect(data).toHaveProperty('error')
    expect(data).not.toHaveProperty('quiz')
    expect(data.error).toBe('Failed to generate exactly 5 questions from the PDF content')
  })
})