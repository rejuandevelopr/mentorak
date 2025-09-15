import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { uploadPDFToStorage } from '@/lib/firebase/storage'
import { createQuiz } from '@/lib/firebase/firestore'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('=== Complete Generate Quiz API Called ===')

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

    // Step 1: Extract text from PDF
    console.log('📄 Step 1: Extracting text from PDF...')
    let extractedText: string
    let pdfPages: number
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      // Import pdf-parse dynamically
      const pdf = (await import('pdf-parse')).default
      const pdfData = await pdf(buffer)
      
      if (!pdfData.text || pdfData.text.trim().length < 100) {
        return NextResponse.json({ 
          error: 'PDF content is too short or empty. Please upload a PDF with more text content.' 
        }, { status: 400 })
      }
      
      extractedText = pdfData.text.trim()
      pdfPages = pdfData.numpages
      console.log('✅ Text extracted successfully:', {
        textLength: extractedText.length,
        pages: pdfPages
      })
      
    } catch (pdfError) {
      console.error('PDF extraction error:', pdfError)
      return NextResponse.json({ 
        error: 'Failed to extract text from PDF. Please ensure the PDF is not password protected and contains readable text.' 
      }, { status: 500 })
    }

    // Step 2: Generate questions with OpenAI
    console.log('🤖 Step 2: Generating questions with OpenAI...')
    let questions: any[]
    
    try {
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

      // Parse JSON with better error handling
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
        
        console.log('✅ Questions generated:', questions.length)
        
        if (questions.length < 5) {
          throw new Error(`Only generated ${questions.length} questions, need at least 5`)
        }
        
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        throw new Error('Failed to parse OpenAI response: ' + (parseError instanceof Error ? parseError.message : 'Unknown error'))
      }
      
    } catch (openaiError) {
      console.error('OpenAI error:', openaiError)
      return NextResponse.json({ 
        error: 'Failed to generate quiz questions. Please try again.' 
      }, { status: 500 })
    }

    // Step 3: Upload PDF to Firebase Storage
    console.log('📤 Step 3: Uploading PDF to Firebase Storage...')
    let downloadURL: string
    let filePath: string
    let pdfId: string
    
    try {
      const uploadResult = await uploadPDFToStorage(file, userId)
      downloadURL = uploadResult.downloadURL
      filePath = uploadResult.filePath
      
      // Save PDF metadata
      pdfId = await savePDFMetadata(userId, {
        userId,
        originalName: file.name,
        fileName: file.name,
        filePath,
        downloadURL,
        fileSize: file.size,
        contentType: file.type,
      })
      
      console.log('✅ PDF uploaded and metadata saved')
      
    } catch (firebaseError) {
      console.error('Firebase error:', firebaseError)
      return NextResponse.json({ 
        error: 'Failed to save PDF. Please try again.' 
      }, { status: 500 })
    }

    // Step 4: Create quiz in Firestore
    console.log('💾 Step 4: Creating quiz in Firestore...')
    let quizId: string
    
    try {
      const quizTitle = file.name.replace('.pdf', '').replace(/[_-]/g, ' ')
      quizId = await createQuiz(userId, {
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
      
      console.log('✅ Quiz created with ID:', quizId)
      
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ 
        error: 'Failed to save quiz. Please try again.' 
      }, { status: 500 })
    }

    // Return success response
    return NextResponse.json({
      quizId,
      quiz: questions,
      pdfId,
      downloadURL,
      message: 'Quiz created successfully!'
    })

  } catch (error) {
    console.error('❌ Unexpected Error:', error)
    return NextResponse.json({
      error: 'An unexpected error occurred. Please try again.'
    }, { status: 500 })
  }
}