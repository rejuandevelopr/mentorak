import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('=== Debug Generate Quiz API Called ===')

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ No OpenAI API key')
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    console.log('File received:', {
      name: file?.name,
      size: file?.size,
      type: file?.type
    })
    console.log('User ID:', userId)

    // Basic validation
    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or user ID' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be PDF' }, { status: 400 })
    }

    // Extract text from PDF using pdf-parse
    console.log('📄 Starting PDF text extraction...')
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      console.log('✅ File converted to ArrayBuffer, size:', arrayBuffer.byteLength)
      
      const buffer = Buffer.from(arrayBuffer)
      console.log('✅ Buffer created, size:', buffer.length)
      
      // Import pdf-parse dynamically
      console.log('📦 Importing pdf-parse...')
      const pdf = (await import('pdf-parse')).default
      console.log('✅ pdf-parse imported successfully')
      
      console.log('🔍 Parsing PDF...')
      const pdfData = await pdf(buffer)
      console.log('✅ PDF parsed successfully')
      
      console.log('PDF Info:', {
        pages: pdfData.numpages,
        textLength: pdfData.text?.length || 0,
        hasText: !!pdfData.text
      })
      
      if (!pdfData.text || pdfData.text.trim().length < 50) {
        return NextResponse.json({ 
          error: 'PDF content is too short or empty',
          details: {
            textLength: pdfData.text?.length || 0,
            pages: pdfData.numpages
          }
        }, { status: 400 })
      }
      
      const extractedText = pdfData.text.trim()
      console.log('✅ Text extracted successfully, length:', extractedText.length)
      
      // Generate simple questions using OpenAI
      console.log('🤖 Generating questions with OpenAI...')
      
      const prompt = `Based on the following content, generate exactly 5 multiple-choice questions:

Content:
"""
${extractedText.slice(0, 2000)}
"""

Return ONLY a JSON array:
[
  {
    "text": "Question?",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0
  }
]`

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Generate 5 multiple-choice questions. Respond only with valid JSON array.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      console.log('✅ Got response from OpenAI')
      console.log('Response preview:', content.substring(0, 200) + '...')

      // Parse JSON
      let questions
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        const jsonString = jsonMatch ? jsonMatch[0] : content
        
        const parsedQuestions = JSON.parse(jsonString)
        
        questions = parsedQuestions.map((item: any, index: number) => ({
          id: `q_${Date.now()}_${index}`,
          text: item.text,
          options: item.options,
          correctAnswer: item.correctAnswer
        }))
        
        console.log('✅ Questions parsed:', questions.length)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        return NextResponse.json({ 
          error: 'Failed to parse OpenAI response',
          details: {
            parseError: parseError instanceof Error ? parseError.message : 'Unknown',
            rawResponse: content.substring(0, 500)
          }
        }, { status: 500 })
      }

      // Return simple success response (no Firebase operations)
      return NextResponse.json({
        success: true,
        message: 'PDF processed successfully',
        quiz: questions,
        pdfInfo: {
          name: file.name,
          size: file.size,
          pages: pdfData.numpages,
          textLength: extractedText.length
        }
      })

    } catch (pdfError) {
      console.error('PDF processing error:', pdfError)
      return NextResponse.json({ 
        error: 'Failed to process PDF',
        details: {
          error: pdfError instanceof Error ? pdfError.message : 'Unknown PDF error',
          stack: pdfError instanceof Error ? pdfError.stack : undefined
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ General Error:', error)
    return NextResponse.json({
      error: 'Unexpected error occurred',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 })
  }
}