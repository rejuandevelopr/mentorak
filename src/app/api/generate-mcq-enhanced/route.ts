import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key is not configured',
          code: 'API_KEY_INVALID',
          userMessage: 'Enhanced quiz generation service is not properly configured. Please contact support.'
        },
        { status: 500 }
      );
    }

    const { prompt, numberOfQuestions = 10, attempt = 1 } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        {
          error: 'Prompt is required',
          code: 'INVALID_INPUT',
          userMessage: 'Generation prompt is required.'
        },
        { status: 400 }
      );
    }

    // Adjust model and parameters based on attempt
    const modelConfig = getModelConfigForAttempt(attempt);
    
    console.log(`🤖 Enhanced MCQ Generation - Attempt ${attempt}`, {
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      numberOfQuestions
    });

    const response = await openai.chat.completions.create({
      model: modelConfig.model,
      messages: [
        {
          role: 'system',
          content: modelConfig.systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.maxTokens,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        {
          error: 'No response received from OpenAI',
          code: 'MCQ_GENERATION_FAILED',
          userMessage: 'Failed to generate quiz questions. Please try again.'
        },
        { status: 500 }
      );
    }

    // Parse and validate the JSON response
    const questions = parseAndValidateEnhancedResponse(content, numberOfQuestions);
    
    console.log(`✅ Enhanced MCQ Generation Success - Attempt ${attempt}`, {
      questionsGenerated: questions.length,
      expectedQuestions: numberOfQuestions
    });
    
    return NextResponse.json({ questions });

  } catch (error: any) {
    console.error('Enhanced MCQ generation error:', error);

    // Handle OpenAI API specific errors
    if (error.status) {
      switch (error.status) {
        case 401:
          return NextResponse.json(
            {
              error: 'OpenAI API key is invalid',
              code: 'API_KEY_INVALID',
              userMessage: 'Enhanced quiz generation service authentication failed. Please contact support.'
            },
            { status: 500 }
          );
        case 429:
          return NextResponse.json(
            {
              error: 'OpenAI API rate limit exceeded',
              code: 'RATE_LIMIT',
              userMessage: 'Enhanced quiz generation service is temporarily busy. Please try again in a moment.'
            },
            { status: 429 }
          );
        case 402:
          return NextResponse.json(
            {
              error: 'OpenAI API quota exceeded',
              code: 'API_QUOTA_EXCEEDED',
              userMessage: 'Enhanced quiz generation service quota exceeded. Please contact support.'
            },
            { status: 402 }
          );
        default:
          return NextResponse.json(
            {
              error: `OpenAI API error: ${error.message}`,
              code: 'MCQ_GENERATION_FAILED',
              userMessage: 'Failed to generate enhanced quiz questions. Please try again.'
            },
            { status: error.status }
          );
      }
    }

    return NextResponse.json(
      {
        error: 'Unexpected error during enhanced MCQ generation',
        code: 'MCQ_GENERATION_FAILED',
        userMessage: 'Failed to generate enhanced quiz questions. Please try again.'
      },
      { status: 500 }
    );
  }
}

/**
 * Get model configuration based on attempt number
 */
function getModelConfigForAttempt(attempt: number) {
  switch (attempt) {
    case 1:
      return {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 3000,
        systemPrompt: 'You are an expert educator who creates high-quality, content-specific multiple-choice questions. You excel at generating questions that can only be answered by someone who has read the specific provided content. Always respond with valid JSON format only.'
      };
    case 2:
      return {
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 3000,
        systemPrompt: 'You are a meticulous quiz creator focused on content specificity. Your questions must reference specific facts, concepts, or details from the provided text. Avoid any generic questions that could be answered without reading the content. Respond with valid JSON only.'
      };
    case 3:
    default:
      return {
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 3000,
        systemPrompt: 'You are a specialized content-based question generator. Every question you create must be directly answerable only from the specific text provided. Focus on testing comprehension of the actual content, not general knowledge. Return valid JSON only.'
      };
  }
}

/**
 * Parse and validate enhanced MCQ response
 */
function parseAndValidateEnhancedResponse(content: string, expectedCount: number): any[] {
  let parsedQuestions;
  
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const jsonString = jsonMatch ? jsonMatch[0] : content;
    parsedQuestions = JSON.parse(jsonString);
  } catch (parseError) {
    console.error('Enhanced MCQ JSON parse error:', parseError);
    console.error('Response content:', content.substring(0, 500));
    throw new Error('Invalid JSON response from enhanced MCQ generation');
  }

  // Validate response structure
  if (!Array.isArray(parsedQuestions)) {
    throw new Error('Enhanced MCQ response is not an array');
  }

  // Validate and transform questions
  const validQuestions = validateAndTransformEnhancedQuestions(parsedQuestions);
  
  if (validQuestions.length === 0) {
    throw new Error('No valid questions were generated from enhanced MCQ response');
  }

  // For enhanced generation, we're more flexible with count to allow for quality filtering
  if (validQuestions.length < Math.floor(expectedCount * 0.5)) {
    throw new Error(`Generated only ${validQuestions.length} valid questions, expected at least ${Math.floor(expectedCount * 0.5)}`);
  }

  return validQuestions;
}

/**
 * Validate and transform enhanced question data
 */
function validateAndTransformEnhancedQuestions(parsedData: any[]): any[] {
  const validQuestions: any[] = [];

  for (let i = 0; i < parsedData.length; i++) {
    const item = parsedData[i];
    
    // Enhanced validation for content-specific questions
    if (
      typeof item.text === 'string' &&
      item.text.trim().length > 10 &&
      Array.isArray(item.options) &&
      item.options.length === 4 &&
      typeof item.correctAnswer === 'number' &&
      item.correctAnswer >= 0 &&
      item.correctAnswer < 4 &&
      item.options.every((opt: any) => typeof opt === 'string' && opt.trim().length > 0)
    ) {
      // Additional quality checks
      const questionText = item.text.trim();
      const options = item.options.map((opt: string) => opt.trim());
      
      // Check for minimum question quality
      if (questionText.length >= 15 && options.every(opt => opt.length >= 2)) {
        validQuestions.push({
          id: `enhanced_q_${Date.now()}_${i}`,
          text: questionText,
          options: options,
          correctAnswer: item.correctAnswer,
          metadata: {
            generationType: 'enhanced',
            validationPassed: true,
            generatedAt: new Date().toISOString()
          }
        });
      } else {
        console.warn(`Enhanced question quality check failed at index ${i}:`, {
          textLength: questionText.length,
          optionLengths: options.map(opt => opt.length)
        });
      }
    } else {
      console.warn(`Enhanced question structure validation failed at index ${i}:`, item);
    }
  }

  return validQuestions;
}