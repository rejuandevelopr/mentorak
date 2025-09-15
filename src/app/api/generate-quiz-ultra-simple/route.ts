import { NextRequest, NextResponse } from 'next/server'
import { createQuiz } from '@/lib/firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Ultra Simple Generate Quiz API Called ===')

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

    // Generate mock questions instantly
    console.log('🎯 Generating mock questions...')
    const questions = [
      {
        id: `q_${Date.now()}_0`,
        text: "What is the main topic of this document?",
        options: ["Business Strategy", "Technical Documentation", "Educational Content", "Research Paper"],
        correctAnswer: 2
      },
      {
        id: `q_${Date.now()}_1`,
        text: "Which of the following is most important for learning?",
        options: ["Memorization", "Understanding", "Speed", "Competition"],
        correctAnswer: 1
      },
      {
        id: `q_${Date.now()}_2`,
        text: "What is a key benefit of interactive learning?",
        options: ["Faster completion", "Better retention", "Less effort", "Lower cost"],
        correctAnswer: 1
      },
      {
        id: `q_${Date.now()}_3`,
        text: "How should complex topics be approached?",
        options: ["All at once", "Step by step", "Randomly", "Backwards"],
        correctAnswer: 1
      },
      {
        id: `q_${Date.now()}_4`,
        text: "What makes a good study method?",
        options: ["Passive reading", "Active engagement", "Multitasking", "Rushing"],
        correctAnswer: 1
      },
      {
        id: `q_${Date.now()}_5`,
        text: "Which learning style is most effective?",
        options: ["Visual only", "Audio only", "Mixed approaches", "Text only"],
        correctAnswer: 2
      },
      {
        id: `q_${Date.now()}_6`,
        text: "What is the purpose of practice questions?",
        options: ["Waste time", "Test knowledge", "Fill space", "Confuse students"],
        correctAnswer: 1
      },
      {
        id: `q_${Date.now()}_7`,
        text: "How often should you review material?",
        options: ["Never", "Once", "Regularly", "Only before exams"],
        correctAnswer: 2
      },
      {
        id: `q_${Date.now()}_8`,
        text: "What is the best way to handle difficult concepts?",
        options: ["Skip them", "Break them down", "Memorize blindly", "Ignore them"],
        correctAnswer: 1
      },
      {
        id: `q_${Date.now()}_9`,
        text: "Why is feedback important in learning?",
        options: ["It's not important", "Shows progress", "Wastes time", "Creates confusion"],
        correctAnswer: 1
      }
    ]

    console.log('✅ Mock questions generated:', questions.length)

    // Save quiz to database
    console.log('💾 Saving quiz to database...')
    const quizData = {
      title: file.name.replace('.pdf', ''),
      pdfFileName: file.name,
      questions: questions,
      totalQuestions: questions.length,
      status: 'in_progress' as const,
      score: 0,
      responses: []
    }

    const quizId = await createQuiz(userId, quizData)
    console.log('✅ Quiz saved with ID:', quizId)
    
    return NextResponse.json({
      quizId: quizId,
      quiz: questions,
      message: 'Quiz created successfully!'
    })

  } catch (error) {
    console.error('❌ Unexpected Error:', error)
    return NextResponse.json({
      error: 'An unexpected error occurred. Please try again.'
    }, { status: 500 })
  }
}