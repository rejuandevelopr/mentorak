import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Basic Upload Test ===')

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    console.log('File info:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      lastModified: file?.lastModified
    })
    console.log('User ID:', userId)

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'No user ID provided' }, { status: 400 })
    }

    // Test basic file operations
    try {
      console.log('Testing arrayBuffer conversion...')
      const arrayBuffer = await file.arrayBuffer()
      console.log('✅ ArrayBuffer created, size:', arrayBuffer.byteLength)

      const buffer = Buffer.from(arrayBuffer)
      console.log('✅ Buffer created, size:', buffer.length)

      // Test if it's a valid PDF by checking header
      const pdfHeader = buffer.slice(0, 4).toString()
      console.log('File header:', pdfHeader)
      
      const isPDF = pdfHeader === '%PDF'
      console.log('Is valid PDF:', isPDF)

      return NextResponse.json({
        success: true,
        message: 'File upload test successful',
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
          bufferSize: buffer.length,
          isPDF: isPDF,
          header: pdfHeader
        }
      })

    } catch (fileError) {
      console.error('File processing error:', fileError)
      return NextResponse.json({
        error: 'Failed to process file',
        details: {
          error: fileError instanceof Error ? fileError.message : 'Unknown file error',
          stack: fileError instanceof Error ? fileError.stack : undefined
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