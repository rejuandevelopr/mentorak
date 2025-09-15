import { describe, it, expect } from 'vitest'
import { createJSONResponse, createQuizSuccessResponse, createErrorResponse } from '@/lib/utils/api-response'

describe('API Response Utilities', () => {
  it('should create JSON response with proper Content-Type header', async () => {
    const response = createJSONResponse({ test: 'data' }, 200)
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    
    const data = await response.json()
    expect(data).toEqual({ test: 'data' })
  })

  it('should create quiz success response with correct format', async () => {
    const mockQuiz = [
      { question: 'Test question', options: ['A', 'B', 'C', 'D'], correctAnswer: 0 }
    ]
    
    const response = createQuizSuccessResponse(mockQuiz)
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    
    const data = await response.json()
    expect(data).toEqual({ quiz: mockQuiz })
  })

  it('should create error response with correct format', async () => {
    const errorMessage = 'Test error message'
    
    const response = createErrorResponse(errorMessage, 400)
    
    expect(response.status).toBe(400)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    
    const data = await response.json()
    expect(data).toEqual({ error: errorMessage })
  })

  it('should default to status 500 for error responses when no status provided', async () => {
    const response = createErrorResponse('Test error')
    
    expect(response.status).toBe(500)
    expect(response.headers.get('Content-Type')).toBe('application/json')
  })

  it('should default to status 200 for JSON responses when no status provided', async () => {
    const response = createJSONResponse({ data: 'test' })
    
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
  })
})