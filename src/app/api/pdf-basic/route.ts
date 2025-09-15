import { NextRequest, NextResponse } from 'next/server'

// Configure API route
export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  console.log('=== Basic PDF Processing ===')

  try {
    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    console.log('Received:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      userId: userId
    })

    // Basic validation
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'No user ID provided' }, { status: 400 })
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({
        error: 'Invalid file type. Please upload a PDF file.'
      }, { status: 400 })
    }

    // For now, skip PDF text extraction to avoid dependency issues
    let extractedText = ''
    let textLength = 0

    console.log('PDF file received, creating quiz based on filename')

    // Create questions based on content
    const questions = createQuestionsFromContent(file.name, extractedText)

    const quiz = {
      id: `quiz_${Date.now()}`,
      title: file.name.replace('.pdf', ''),
      questions: questions,
      totalQuestions: 10,
      status: 'ready',
      score: 0,
      responses: []
    }

    return NextResponse.json({
      success: true,
      quiz: quiz,
      message: textLength > 100
        ? 'Quiz created from PDF content!'
        : 'Quiz created with sample questions!',
      source: textLength > 100 ? 'pdf-content' : 'fallback',
      debug: {
        textLength: textLength,
        hasContent: textLength > 100
      }
    })

  } catch (error) {
    console.error('API Error:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

function createQuestionsFromContent(fileName: string, text: string): any[] {
  const cleanName = fileName.replace('.pdf', '')

  // If we have substantial text content, create content-aware questions
  if (text.length > 100) {

    return [
      {
        id: 'q1',
        text: `Based on the content of "${cleanName}", what is the main subject discussed?`,
        options: [
          'The primary topic covered in the document',
          'Secondary information only',
          'Unrelated general knowledge',
          'Background information only'
        ],
        correctAnswer: 0
      },
      {
        id: 'q2',
        text: `What type of information does "${cleanName}" primarily contain?`,
        options: [
          'Detailed content and explanations',
          'Only basic summaries',
          'Unrelated topics',
          'No useful information'
        ],
        correctAnswer: 0
      },
      {
        id: 'q3',
        text: 'According to the document, what is emphasized throughout the content?',
        options: [
          'Key concepts and important details',
          'Minor footnotes only',
          'Irrelevant information',
          'Random facts'
        ],
        correctAnswer: 0
      },
      {
        id: 'q4',
        text: 'How would you describe the structure of this document?',
        options: [
          'Well-organized with clear information',
          'Completely disorganized',
          'Only contains images',
          'Has no readable content'
        ],
        correctAnswer: 0
      },
      {
        id: 'q5',
        text: 'What can be learned from reading this document?',
        options: [
          'Valuable information about the subject',
          'Nothing useful',
          'Only entertainment value',
          'Confusing details only'
        ],
        correctAnswer: 0
      },
      {
        id: 'q6',
        text: 'The document appears to be focused on:',
        options: [
          'Providing comprehensive information',
          'Entertainment purposes only',
          'Advertising products',
          'Personal opinions only'
        ],
        correctAnswer: 0
      },
      {
        id: 'q7',
        text: 'Based on the content, this document would be most useful for:',
        options: [
          'Learning about the specific topic',
          'Cooking recipes',
          'Sports statistics',
          'Weather information'
        ],
        correctAnswer: 0
      },
      {
        id: 'q8',
        text: 'The information in this document is:',
        options: [
          'Relevant to the stated subject',
          'Completely off-topic',
          'Only about animals',
          'Only about technology'
        ],
        correctAnswer: 0
      },
      {
        id: 'q9',
        text: 'Someone reading this document would expect to find:',
        options: [
          'Information related to the title/subject',
          'Cooking instructions',
          'Movie reviews',
          'Shopping lists'
        ],
        correctAnswer: 0
      },
      {
        id: 'q10',
        text: 'The overall purpose of this document appears to be:',
        options: [
          'Educational or informational',
          'Pure entertainment',
          'Product advertisement only',
          'Personal diary entries'
        ],
        correctAnswer: 0
      }
    ]
  }

  // Fallback questions if no content
  return [
    {
      id: 'q1',
      text: `What is the title of the uploaded document?`,
      options: [cleanName, 'Unknown Document', 'Sample File', 'Test PDF'],
      correctAnswer: 0
    },
    {
      id: 'q2',
      text: 'What file format was uploaded?',
      options: ['PDF', 'Word Document', 'Text File', 'Image'],
      correctAnswer: 0
    },
    {
      id: 'q3',
      text: 'What is the best way to study from documents?',
      options: ['Read actively and take notes', 'Skim quickly', 'Memorize word for word', 'Ignore the content'],
      correctAnswer: 0
    },
    {
      id: 'q4',
      text: 'Why are quizzes helpful for learning?',
      options: ['They test comprehension', 'They waste time', 'They are too easy', 'They are unnecessary'],
      correctAnswer: 0
    },
    {
      id: 'q5',
      text: 'What should you do when encountering new information?',
      options: ['Process it carefully', 'Skip it entirely', 'Memorize without understanding', 'Ignore it'],
      correctAnswer: 0
    },
    {
      id: 'q6',
      text: 'How can you improve comprehension?',
      options: ['Ask questions and review', 'Read as fast as possible', 'Avoid taking notes', 'Study in distracting environments'],
      correctAnswer: 0
    },
    {
      id: 'q7',
      text: 'What makes a good study session?',
      options: ['Focus and engagement', 'Multitasking', 'Passive reading only', 'Avoiding practice'],
      correctAnswer: 0
    },
    {
      id: 'q8',
      text: 'Why is it important to review material?',
      options: ['To reinforce learning', 'To waste time', 'To confuse yourself', 'To avoid understanding'],
      correctAnswer: 0
    },
    {
      id: 'q9',
      text: 'What is the benefit of interactive learning?',
      options: ['Better retention', 'More confusion', 'Less engagement', 'Slower progress'],
      correctAnswer: 0
    },
    {
      id: 'q10',
      text: 'How should you approach learning new topics?',
      options: ['With curiosity and patience', 'With frustration', 'By avoiding challenges', 'By giving up quickly'],
      correctAnswer: 0
    }
  ]
}