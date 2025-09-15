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
        { 
          error: 'OpenAI API key is not configured',
          code: 'API_KEY_INVALID',
          userMessage: 'Quiz generation service is not properly configured. Please contact support.'
        },
        { status: 500 }
      )
    }

    // Parse request body
    const { text, numberOfQuestions = 5, difficulty = 'medium', questionTypes = ['factual', 'conceptual', 'analytical'] } = await request.json()

    // Validate input text
    if (!text || text.trim().length < 100) {
      return NextResponse.json(
        {
          error: 'Text content is too short to generate meaningful questions',
          code: 'INVALID_INPUT',
          userMessage: 'The PDF content is too short to generate quiz questions. Please upload a document with more content.'
        },
        { status: 400 }
      )
    }

    const prompt = createMCQPrompt(text, numberOfQuestions, difficulty, questionTypes)
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator who creates high-quality multiple-choice questions from educational content. Always respond with valid JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        {
          error: 'No response received from OpenAI',
          code: 'MCQ_GENERATION_FAILED',
          userMessage: 'Failed to generate quiz questions. Please try again.'
        },
        { status: 500 }
      )
    }

    // Parse and validate the JSON response
    const questions = parseAndValidateResponse(content, numberOfQuestions)
    
    return NextResponse.json({ questions })

  } catch (error: any) {
    console.error('MCQ generation error:', error)

    // Handle OpenAI API specific errors
    if (error.status) {
      switch (error.status) {
        case 401:
          return NextResponse.json(
            {
              error: 'OpenAI API key is invalid',
              code: 'API_KEY_INVALID',
              userMessage: 'Quiz generation service authentication failed. Please contact support.'
            },
            { status: 500 }
          )
        case 429:
          return NextResponse.json(
            {
              error: 'OpenAI API rate limit exceeded',
              code: 'RATE_LIMIT',
              userMessage: 'Quiz generation service is temporarily busy. Please try again in a moment.'
            },
            { status: 429 }
          )
        case 402:
          return NextResponse.json(
            {
              error: 'OpenAI API quota exceeded',
              code: 'API_QUOTA_EXCEEDED',
              userMessage: 'Quiz generation service quota exceeded. Please contact support.'
            },
            { status: 402 }
          )
        case 503:
        case 502:
        case 500:
          return NextResponse.json(
            {
              error: 'OpenAI API service unavailable',
              code: 'SERVICE_UNAVAILABLE',
              userMessage: 'Quiz generation service is temporarily unavailable. Please try again later.'
            },
            { status: 503 }
          )
        default:
          return NextResponse.json(
            {
              error: `OpenAI API error: ${error.message}`,
              code: 'MCQ_GENERATION_FAILED',
              userMessage: 'Failed to generate quiz questions. Please try again.'
            },
            { status: error.status }
          )
      }
    }

    return NextResponse.json(
      {
        error: 'Unexpected error during MCQ generation',
        code: 'MCQ_GENERATION_FAILED',
        userMessage: 'Failed to generate quiz questions. Please try again.'
      },
      { status: 500 }
    )
  }
}

function createMCQPrompt(
  text: string, 
  numberOfQuestions: number, 
  difficulty: string, 
  questionTypes: string[]
): string {
  return `
Based on the following text content, generate ${numberOfQuestions} multiple-choice questions at ${difficulty} difficulty level.

Include a mix of these question types: ${questionTypes.join(', ')}.

Text content:
"""
${text}
"""

Requirements:
1. Each question should have exactly 4 options (A, B, C, D)
2. Only one option should be correct
3. Questions should be clear and unambiguous
4. Incorrect options should be plausible but clearly wrong
5. Cover different parts of the content
6. Avoid questions that can be answered without reading the content

Respond with a JSON array in this exact format:
[
  {
    "text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]

The correctAnswer should be the index (0-3) of the correct option in the options array.
`
}

function parseAndValidateResponse(content: string, expectedCount: number): any[] {
  let parsedQuestions
  
  try {
    parsedQuestions = JSON.parse(content)
  } catch (parseError) {
    console.error('JSON parse error:', parseError)
    console.error('Response content:', content)
    throw new Error('Invalid JSON response from OpenAI')
  }

  // Validate response structure
  if (!Array.isArray(parsedQuestions)) {
    throw new Error('OpenAI response is not an array')
  }

  // Validate and transform questions
  const validQuestions = validateAndTransformQuestions(parsedQuestions)
  
  if (validQuestions.length === 0) {
    throw new Error('No valid questions were generated from OpenAI response')
  }

  // Ensure we have exactly the expected number of questions
  if (validQuestions.length !== expectedCount) {
    throw new Error(`Generated ${validQuestions.length} questions instead of ${expectedCount}`)
  }

  return validQuestions
}

function validateAndTransformQuestions(parsedData: any[]): any[] {
  const validQuestions: any[] = []

  for (let i = 0; i < parsedData.length; i++) {
    const item = parsedData[i]
    
    // Validate question structure
    if (
      typeof item.text === 'string' &&
      Array.isArray(item.options) &&
      item.options.length === 4 &&
      typeof item.correctAnswer === 'number' &&
      item.correctAnswer >= 0 &&
      item.correctAnswer < 4 &&
      item.options.every((opt: any) => typeof opt === 'string')
    ) {
      validQuestions.push({
        id: `q_${Date.now()}_${i}`,
        text: item.text.trim(),
        options: item.options.map((opt: string) => opt.trim()),
        correctAnswer: item.correctAnswer
      })
    } else {
      console.warn(`Invalid question structure at index ${i}:`, item)
    }
  }

  return validQuestions
}