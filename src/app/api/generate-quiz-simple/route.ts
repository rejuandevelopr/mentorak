import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { uploadPDFToStorage } from '@/lib/firebase/storage'
import { createQuiz } from '@/lib/firebase/firestore'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('=== Simple Generate Quiz API Called ===')

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ No OpenAI API key')
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    console.log('File:', file?.name, file?.size)
    console.log('User ID:', userId)

    // Basic validation
    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or user ID' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be PDF' }, { status: 400 })
    }

    // Extract text from PDF using pdf-parse
    console.log('📄 Extracting text from PDF...')
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Import pdf-parse dynamically to avoid issues
    const pdf = (await import('pdf-parse')).default
    const pdfData = await pdf(buffer)
    
    if (!pdfData.text || pdfData.text.trim().length < 100) {
      return NextResponse.json({ error: 'PDF content is too short or empty' }, { status: 400 })
    }
    
    const extractedText = pdfData.text.trim()
    console.log('✅ Text extracted, length:', extractedText.length)

    // Create a prompt with the actual PDF content
    const prompt = `Based on the following PDF content, generate exactly 10 multiple-choice questions. Each question should have 4 options with only one correct answer.

PDF Content:
"""
${extractedText.slice(0, 4000)}
"""

Requirements:
1. Questions should be based on the actual content above
2. Each question should have exactly 4 options (A, B, C, D)
3. Only one option should be correct
4. Make questions varied in difficulty
5. Cover different parts of the content

Return ONLY a JSON array in this exact format:
[
  {
    "text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]

The correctAnswer should be the index (0-3) of the correct option.`

    console.log('🤖 Calling OpenAI...')
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator. Generate exactly 10 multiple-choice questions. Respond only with valid JSON.'
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
      throw new Error('No response from OpenAI')
    }

    console.log('✅ Got response from OpenAI')

    // Parse JSON with better error handling
    let questions
    try {
      console.log('Raw OpenAI response:', content.substring(0, 500) + '...')
      
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      const jsonString = jsonMatch ? jsonMatch[0] : content
      
      const parsedQuestions = JSON.parse(jsonString)
      
      if (!Array.isArray(parsedQuestions)) {
        throw new Error('Response is not an array')
      }
      
      questions = parsedQuestions.map((item: any, index: number) => ({
        id: `q_${Date.now()}_${index}`,
        text: item.text,
        options: item.options,
        correctAnswer: item.correctAnswer
      }))
      
      console.log('✅ Parsed questions:', questions.length)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Full OpenAI response:', content)
      throw new Error('Failed to parse OpenAI response: ' + (parseError instanceof Error ? parseError.message : 'Unknown error'))
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('No valid questions generated')
    }

    // Validate we have exactly 10 questions
    if (questions.length !== 10) {
      console.warn(`Expected 10 questions, got ${questions.length}`)
      // If we have fewer than 10, that's still okay, but log it
      if (questions.length < 5) {
        throw new Error(`Only generated ${questions.length} questions, need at least 5`)
      }
    }

    console.log('✅ Questions parsed:', questions.length)

    // Upload to Firebase Storage
    console.log('📤 Uploading to Firebase...')
    const { downloadURL, filePath } = await uploadPDFToStorage(file, userId)
    
    // Save PDF metadata
    const pdfId = await savePDFMetadata(userId, {
      userId,
      originalName: file.name,
      fileName: file.name,
      filePath,
      downloadURL,
      fileSize: file.size,
      contentType: file.type,
    })

    // Create quiz
    const quizTitle = file.name.replace('.pdf', '').replace(/[_-]/g, ' ')
    const quizId = await createQuiz(userId, {
      title: quizTitle,
      pdfFileName: file.name,
      pdfFilePath: filePath,
      pdfDownloadURL: downloadURL,
      pdfId: pdfId,
      questions: questions,
      totalQuestions: questions.length,
      status: 'in_progress',
      score: 0,
      responses: [],
    })

    console.log('✅ Quiz created:', quizId)

    return NextResponse.json({
      quizId,
      quiz: questions,
      pdfId,
      downloadURL
    })

  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}