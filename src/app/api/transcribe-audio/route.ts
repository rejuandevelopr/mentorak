import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured', code: 'INVALID_API_KEY' },
        { status: 500 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const language = formData.get('language') as string || 'en'
    const temperature = parseFloat(formData.get('temperature') as string || '0')

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided', code: 'INVALID_AUDIO' },
        { status: 400 }
      )
    }

    // Validate file size
    const maxSize = 25 * 1024 * 1024 // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Audio file is too large. Maximum size is 25MB.', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      )
    }

    // Transcribe audio using OpenAI Whisper
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language,
      temperature,
      response_format: 'text'
    })

    if (!response || typeof response !== 'string') {
      return NextResponse.json(
        { error: 'No transcription received from OpenAI', code: 'NO_RESPONSE' },
        { status: 500 }
      )
    }

    const transcript = response.trim()
    
    if (transcript.length === 0) {
      return NextResponse.json(
        { error: 'No speech detected in audio', code: 'NO_SPEECH_DETECTED' },
        { status: 400 }
      )
    }

    return NextResponse.json({ transcript })

  } catch (error: any) {
    console.error('Audio transcription error:', error)

    // Handle OpenAI API errors
    if (error.status) {
      switch (error.status) {
        case 429:
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.', code: 'RATE_LIMIT' },
            { status: 429 }
          )
        case 401:
          return NextResponse.json(
            { error: 'Invalid API key configuration', code: 'INVALID_API_KEY' },
            { status: 500 }
          )
        case 413:
          return NextResponse.json(
            { error: 'Audio file is too large', code: 'FILE_TOO_LARGE' },
            { status: 400 }
          )
        default:
          return NextResponse.json(
            { error: `OpenAI API error: ${error.message}`, code: 'API_ERROR' },
            { status: error.status }
          )
      }
    }

    return NextResponse.json(
      { error: 'Failed to transcribe audio', code: 'NETWORK_ERROR' },
      { status: 500 }
    )
  }
}