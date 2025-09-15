import { POST } from '@/app/api/generate-quiz/route'
import { NextRequest } from 'next/server'

// Mock the dependencies
vi.mock('@/lib/openai/mcq-generator', () => ({
  generateMCQsFromText: vi.fn()
}))

vi.mock('pdf-parse', () => ({
  default: vi.fn()
}))

describe('/api/generate-quiz', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.OPENAI_API_KEY = 'test-key'
  })

  afterEach(() => {
    delete process.env.OPENAI_API_KEY
  })

  it('should return error when OpenAI API key is missing', async () => {
    delete process.env.OPENAI_API_KEY

    const formData = new FormData()
    const request = new NextRequest('http://localhost:3000/api/generate-quiz', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('OpenAI API key is not configured')
  })

  it('should return error when no file is provided', async () => {
    const formData = new FormData()
    const request = new NextRequest('http://localhost:3000/api/generate-quiz', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('No file provided')
  })

  it('should return error when file is not a PDF', async () => {
    const formData = new FormData()
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    formData.append('file', file)

    const request = new NextRequest('http://localhost:3000/api/generate-quiz', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('File must be a PDF document')
  }, 10000)

  it('should return error when PDF file is too large', async () => {
    const formData = new FormData()
    // Create a file larger than 10MB
    const largeContent = 'x'.repeat(11 * 1024 * 1024)
    const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' })
    formData.append('file', file)

    const request = new NextRequest('http://localhost:3000/api/generate-quiz', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('PDF file is too large. Maximum size is 10MB.')
  }, 10000)

  it('should have proper Content-Type header for all responses', async () => {
    const formData = new FormData()
    const request = new NextRequest('http://localhost:3000/api/generate-quiz', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request)
    
    expect(response.headers.get('Content-Type')).toBe('application/json')
  })
})