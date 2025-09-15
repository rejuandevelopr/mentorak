import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Test Upload API Called ===')

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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'No user ID provided' }, { status: 400 })
    }

    // Simple mock response
    const mockQuestions = [
      {
        id: 'q1',
        text: 'What is the main topic of this document?',
        options: ['Topic A', 'Topic B', 'Topic C', 'Topic D'],
        correctAnswer: 0
      },
      {
        id: 'q2',
        text: 'Which concept is most important?',
        options: ['Concept 1', 'Concept 2', 'Concept 3', 'Concept 4'],
        correctAnswer: 1
      }
    ]

    return NextResponse.json({
      quizId: 'test-quiz-' + Date.now(),
      quiz: mockQuestions,
      message: 'Test successful'
    })

  } catch (error) {
    console.error('Test API Error:', error)
    return NextResponse.json(
      { error: 'Test failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}