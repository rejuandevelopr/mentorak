import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '@/app/api/generate-quiz/route'
import { NextRequest } from 'next/server'

describe('/api/generate-quiz Response Format', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.OPENAI_API_KEY = 'test-key'
  })

  afterEach(() => {
    delete process.env.OPENAI_API_KEY
  })

  it('should return JSON error response when OpenAI API key is missing', async () => {
    delete process.env.OPENAI_API_KEY

    const formData = new FormData()
    const request = new NextRequest('http://localhost:3000/api/generate-quiz', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    
    // Verify response format
    expect(response.status).toBe(500)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    
    const data = await response.json()
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('OpenAI API key is not configured')
    expect(data).not.toHaveProperty('quiz')
  })

  it('should return JSON error response when no file is provided', async () => {
    const formData = new FormData()
    const request = new NextRequest('http://localhost:3000/api/generate-quiz', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    
    // Verify response format
    expect(response.status).toBe(400)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    
    const data = await response.json()
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('No file provided')
    expect(data).not.toHaveProperty('quiz')
  })

  it('should return JSON error response for invalid request format', async () => {
    // Create a request without proper FormData
    const request = new NextRequest('http://localhost:3000/api/generate-quiz', {
      method: 'POST',
      body: 'invalid-body'
    })

    const response = await POST(request)
    
    // Verify response format
    expect(response.status).toBe(400)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    
    const data = await response.json()
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('Invalid request format. Please ensure you are uploading a valid file.')
    expect(data).not.toHaveProperty('quiz')
  })

  it('should return JSON error response for non-PDF files', async () => {
    const formData = new FormData()
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    formData.append('file', file)

    const request = new NextRequest('http://localhost:3000/api/generate-quiz', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    
    // Verify response format
    expect(response.status).toBe(400)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    
    const data = await response.json()
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('File must be a PDF document')
    expect(data).not.toHaveProperty('quiz')
  })

  it('should return JSON error response for oversized files', async () => {
    const formData = new FormData()
    // Create a file larger than 10MB (using a smaller size for test performance)
    const largeContent = new Uint8Array(11 * 1024 * 1024) // 11MB
    const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' })
    formData.append('file', file)

    const request = new NextRequest('http://localhost:3000/api/generate-quiz', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    
    // Verify response format
    expect(response.status).toBe(400)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    
    const data = await response.json()
    expect(data).toHaveProperty('error')
    expect(data.error).toBe('PDF file is too large. Maximum size is 10MB.')
    expect(data).not.toHaveProperty('quiz')
  })
})