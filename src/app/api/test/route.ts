import { NextRequest, NextResponse } from 'next/server'
import { createJSONResponse, createErrorResponse } from '@/lib/utils/api-response'

export async function GET() {
  return createJSONResponse({ 
    message: 'API is working',
    timestamp: new Date().toISOString(),
    env: {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasFirebase: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return createJSONResponse({ 
      message: 'POST endpoint working',
      receivedData: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error'
    return createErrorResponse(`Failed to parse JSON: ${details}`, 400)
  }
}