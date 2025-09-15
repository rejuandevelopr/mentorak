import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '@/app/api/generate-quiz/route'
import { NextRequest } from 'next/server'

describe('/api/generate-quiz Minimal Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.OPENAI_API_KEY = 'test-key'
  })

  afterEach(() => {
    delete process.env.OPENAI_API_KEY
  })

  it('should handle missing OpenAI API key correctly', async () => {
    delete process.env.OPENAI_API_KEY

    const request = new NextRequest('http://localhost:3000/api/generate-quiz', {
      method: 'POST',
      body: new FormData()
    })

    const response = await POST(request)
    
    expect(response.status).toBe(500)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    
    const data = await response.json()
    expect(data).toEqual({ error: 'OpenAI API key is not configured' })
  })

  it('should handle empty FormData correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate-quiz', {
      method: 'POST',
      body: new FormData()
    })

    const response = await POST(request)
    
    expect(response.status).toBe(400)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    
    const data = await response.json()
    expect(data).toEqual({ error: 'No file provided' })
  })
})