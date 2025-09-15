import { describe, it, expect } from 'vitest'
import { createJSONResponse, createQuizSuccessResponse, createErrorResponse } from '@/lib/utils/api-response'

describe('API Response Format Verification', () => {
  it('should create quiz success response in exact required format', async () => {
    const mockQuiz = [
      { question: 'Test question 1', options: ['A', 'B', 'C', 'D'], correctAnswer: 0 },
      { question: 'Test question 2', options: ['A', 'B', 'C', 'D'], correctAnswer: 1 },
      { question: 'Test question 3', options: ['A', 'B', 'C', 'D'], correctAnswer: 2 },
      { question: 'Test question 4', options: ['A', 'B', 'C', 'D'], correctAnswer: 3 },
      { question: 'Test question 5', options: ['A', 'B', 'C', 'D'], correctAnswer: 0 }
    ]
    
    const response = createQuizSuccessResponse(mockQuiz)
    
    // Verify status and headers
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    
    // Verify response format matches requirement: { quiz: [...] }
    const data = await response.json()
    expect(data).toEqual({ quiz: mockQuiz })
    expect(Object.keys(data)).toEqual(['quiz'])
  })

  it('should create error response in exact required format', async () => {
    const errorMessage = 'Test error message'
    
    const response = createErrorResponse(errorMessage, 400)
    
    // Verify status and headers
    expect(response.status).toBe(400)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    
    // Verify response format matches requirement: { error: "message" }
    const data = await response.json()
    expect(data).toEqual({ error: errorMessage })
    expect(Object.keys(data)).toEqual(['error'])
  })

  it('should ensure all responses have proper Content-Type header', async () => {
    const successResponse = createQuizSuccessResponse([])
    const errorResponse = createErrorResponse('Error', 500)
    const jsonResponse = createJSONResponse({ test: 'data' })
    
    expect(successResponse.headers.get('Content-Type')).toBe('application/json')
    expect(errorResponse.headers.get('Content-Type')).toBe('application/json')
    expect(jsonResponse.headers.get('Content-Type')).toBe('application/json')
  })

  it('should verify response format consistency across different error scenarios', async () => {
    const errorScenarios = [
      { message: 'OpenAI API key is not configured', status: 500 },
      { message: 'No file provided', status: 400 },
      { message: 'File must be a PDF document', status: 400 },
      { message: 'PDF file is too large. Maximum size is 10MB.', status: 400 },
      { message: 'Failed to generate exactly 5 questions from the PDF content', status: 500 },
      { message: 'Failed to generate quiz. Please try again.', status: 500 }
    ]
    
    for (const scenario of errorScenarios) {
      const response = createErrorResponse(scenario.message, scenario.status)
      
      expect(response.status).toBe(scenario.status)
      expect(response.headers.get('Content-Type')).toBe('application/json')
      
      const data = await response.json()
      expect(data).toEqual({ error: scenario.message })
      expect(Object.keys(data)).toEqual(['error'])
    }
  })
})