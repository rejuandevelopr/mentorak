import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createQuiz } from '@/lib/firebase/firestore'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('=== Generate Quiz API Called ===')

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
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

    // Step 1: Generate questions using OpenAI (simple approach)
    console.log('🤖 Step 1: Generating questions with OpenAI...')

    const prompt = `Generate exactly 10 multiple-choice questions for an educational quiz. Each question should have 4 options with only one correct answer.

Make the questions about general educational topics like:
- Learning strategies
- Study methods
- Critical thinking
- Problem solving
- Knowledge retention
- Academic skills

Return ONLY a JSON array in this format:
[
  {
    "text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]

The correctAnswer should be the index (0-3) of the correct option.`

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

    // Parse JSON
    let questions
    try {
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

      console.log('✅ Questions parsed:', questions.length)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      throw new Error('Failed to parse OpenAI response')
    }

    if (!Array.isArray(questions) || questions.length < 5) {
      throw new Error('Not enough valid questions generated')
    }

    // Step 2: Create quiz (skip Firebase Storage for now)
    console.log('� Step  2: Creating quiz...')
    const quizTitle = file.name.replace('.pdf', '').replace(/[_-]/g, ' ')
    const quizId = await createQuiz(userId, {
      title: quizTitle,
      pdfFileName: file.name,
      pdfFilePath: '', // Skip for now
      pdfDownloadURL: '', // Skip for now
      pdfId: '', // Skip for now
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
      message: 'Quiz created successfully!'
    })

  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}