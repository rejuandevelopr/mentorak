import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { uploadPDFToStorage } from '@/lib/firebase/storage'
import { createQuiz } from '@/lib/firebase/firestore'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('=== Direct Generate Quiz API Called ===')

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

    // Step 1: Upload PDF to OpenAI for processing
    console.log('📤 Step 1: Uploading PDF to OpenAI...')
    let openaiFileId: string
    let assistantId: string
    
    try {
      // Upload file to OpenAI
      const openaiFile = await openai.files.create({
        file: file,
        purpose: 'assistants'
      })
      openaiFileId = openaiFile.id
      console.log('✅ PDF uploaded to OpenAI with ID:', openaiFileId)

      // Create assistant for PDF processing
      const assistant = await openai.beta.assistants.create({
        name: "PDF Quiz Generator",
        instructions: `You are an expert educator who creates high-quality multiple-choice questions from PDF documents. 
        
        Your task is to:
        1. Read and analyze the uploaded PDF document
        2. Generate exactly 10 multiple-choice questions based on the content
        3. Each question should have exactly 4 options (A, B, C, D)
        4. Only one option should be correct
        5. Questions should cover different parts of the content
        6. Make questions at medium difficulty level
        
        Always respond with a JSON array in this exact format:
        [
          {
            "text": "Question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0
          }
        ]
        
        The correctAnswer should be the index (0-3) of the correct option.`,
        model: "gpt-4-1106-preview",
        tools: [{ type: "retrieval" }],
        file_ids: [openaiFileId]
      })
      assistantId = assistant.id
      console.log('✅ Assistant created with ID:', assistantId)

    } catch (openaiUploadError) {
      console.error('OpenAI upload error:', openaiUploadError)
      return NextResponse.json({ 
        error: 'Failed to process PDF with OpenAI. Please try again.' 
      }, { status: 500 })
    }

    // Step 2: Generate questions using the assistant
    console.log('🤖 Step 2: Generating questions...')
    let questions: any[]
    
    try {
      // Create thread and run
      const thread = await openai.beta.threads.create({
        messages: [
          {
            role: "user",
            content: "Please analyze the uploaded PDF and generate exactly 10 multiple-choice questions based on its content. Return the response as a JSON array as specified in your instructions."
          }
        ]
      })

      const run = await openai.beta.threads.runs.create(
        thread.id,
        { assistant_id: assistantId }
      )

      // Wait for completion with timeout
      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
      let attempts = 0
      const maxAttempts = 60 // 60 seconds timeout
      
      while ((runStatus.status === 'in_progress' || runStatus.status === 'queued') && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
        attempts++
        console.log(`⏳ Run status: ${runStatus.status} (${attempts}/${maxAttempts})`)
      }

      if (runStatus.status !== 'completed') {
        throw new Error(`Assistant run failed with status: ${runStatus.status}`)
      }

      // Get the response
      const messages = await openai.beta.threads.messages.list(thread.id)
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant')
      
      if (!assistantMessage || !assistantMessage.content[0] || assistantMessage.content[0].type !== 'text') {
        throw new Error('No valid response from assistant')
      }

      const responseText = assistantMessage.content[0].text.value
      console.log('✅ Got response from assistant')

      // Parse the JSON response
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/)
        const jsonString = jsonMatch ? jsonMatch[0] : responseText
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
        
        if (questions.length < 5) {
          throw new Error(`Only generated ${questions.length} questions, need at least 5`)
        }
        
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        throw new Error('Failed to parse questions from OpenAI response')
      }

    } catch (questionError) {
      console.error('Question generation error:', questionError)
      return NextResponse.json({ 
        error: 'Failed to generate quiz questions. Please try again.' 
      }, { status: 500 })
    } finally {
      // Cleanup OpenAI resources
      try {
        if (assistantId) await openai.beta.assistants.del(assistantId)
        if (openaiFileId) await openai.files.del(openaiFileId)
        console.log('✅ OpenAI resources cleaned up')
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup OpenAI resources:', cleanupError)
      }
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