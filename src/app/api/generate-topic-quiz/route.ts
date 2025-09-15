import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createQuiz } from '@/lib/firebase/firestore'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('=== Generate Topic Quiz API Called ===')

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Parse JSON body
    const { topic, userId } = await request.json()

    console.log('Topic:', topic)
    console.log('User ID:', userId)

    // Basic validation
    if (!topic || !userId) {
      return NextResponse.json({ error: 'Missing topic or user ID' }, { status: 400 })
    }

    if (typeof topic !== 'string' || topic.trim().length < 2) {
      return NextResponse.json({ error: 'Topic must be at least 2 characters' }, { status: 400 })
    }

    const cleanTopic = topic.trim()

    // Generate questions using OpenAI
    console.log('🤖 Generating questions with OpenAI for topic:', cleanTopic)

    // Add randomness to ensure different questions each time
    const randomSeed = Math.floor(Math.random() * 10000);
    const aspectVariations = [
      'fundamentals and basic concepts',
      'practical applications and examples', 
      'advanced concepts and theory',
      'historical context and development',
      'current trends and future implications',
      'key terminology and definitions',
      'problem-solving and analysis',
      'real-world scenarios and case studies'
    ];
    const randomAspect = aspectVariations[Math.floor(Math.random() * aspectVariations.length)];

    const prompt = `Generate exactly 10 unique multiple-choice questions about "${cleanTopic}" focusing on ${randomAspect}. 

Requirements:
- Questions should be educational and test understanding of the topic
- Each question should have 4 options with only one correct answer
- Questions should range from basic to intermediate difficulty
- Cover different aspects of the topic
- Make questions specific to "${cleanTopic}", not generic
- Ensure variety and avoid repetitive patterns
- Random seed: ${randomSeed}

Return ONLY a JSON array in this format:
[
  {
    "text": "Question about ${cleanTopic}?",
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
          content: `You are an expert educator creating quiz questions about "${cleanTopic}". Generate exactly 10 unique and varied multiple-choice questions that test understanding of this specific topic. Focus on ${randomAspect}. Each time you generate questions, ensure they are different from previous generations by exploring different angles, examples, and difficulty levels. Respond only with valid JSON. Seed: ${randomSeed}`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8 + (Math.random() * 0.4), // Random temperature between 0.8-1.2
      max_tokens: 3000,
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

      // Validate and format questions with randomized options
      questions = parsedQuestions
        .filter(item => 
          item.text && 
          Array.isArray(item.options) && 
          item.options.length === 4 &&
          typeof item.correctAnswer === 'number' &&
          item.correctAnswer >= 0 && item.correctAnswer < 4
        )
        .map((item: any, index: number) => {
          // Store the correct answer text before shuffling
          const correctAnswerText = item.options[item.correctAnswer];
          
          // Create array of options with indices for shuffling
          const optionsWithIndices = item.options.map((option: string, idx: number) => ({
            text: option,
            originalIndex: idx
          }));
          
          // Shuffle the options randomly
          for (let i = optionsWithIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [optionsWithIndices[i], optionsWithIndices[j]] = [optionsWithIndices[j], optionsWithIndices[i]];
          }
          
          // Find the new index of the correct answer after shuffling
          const newCorrectAnswerIndex = optionsWithIndices.findIndex(
            option => option.originalIndex === item.correctAnswer
          );
          
          return {
            id: `q_${Date.now()}_${index}`,
            text: item.text,
            options: optionsWithIndices.map(option => option.text),
            correctAnswer: newCorrectAnswerIndex
          };
        })

      console.log('✅ Questions parsed and validated:', questions.length)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      throw new Error('Failed to parse OpenAI response')
    }

    if (!Array.isArray(questions) || questions.length < 5) {
      throw new Error('Not enough valid questions generated')
    }

    // Ensure we have exactly 10 questions
    questions = questions.slice(0, 10)

    console.log('✅ Quiz generated successfully!')

    // Return quiz immediately without saving to Firestore for speed
    return NextResponse.json({
      success: true,
      quiz: {
        id: `temp_${Date.now()}`,
        title: `Quiz: ${cleanTopic}`,
        topic: cleanTopic,
        questions: questions,
        totalQuestions: questions.length,
        status: 'ready',
        score: 0,
        responses: []
      },
      message: `Quiz about "${cleanTopic}" created successfully!`
    })

  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to generate quiz. Please try again.'
      },
      { status: 500 }
    )
  }
}