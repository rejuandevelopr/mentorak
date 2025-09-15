import { Question } from '../../types/models';
import { AppError, ErrorCodes } from '@/lib/errors/AppError';
import { withAPIRetry } from '../utils/retry';

export interface MCQGenerationOptions {
  numberOfQuestions?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionTypes?: string[];
}

export async function generateMCQsFromText(
  text: string, 
  options: MCQGenerationOptions = {}
): Promise<Question[]> {
  const {
    numberOfQuestions = 5,
    difficulty = 'medium',
    questionTypes = ['factual', 'conceptual', 'analytical']
  } = options;

  // Validate input text
  if (!text || text.trim().length < 100) {
    throw new AppError(
      'Text content is too short to generate meaningful questions',
      ErrorCodes.INVALID_INPUT,
      'The PDF content is too short to generate quiz questions. Please upload a document with more content.',
      'medium'
    );
  }

  try {
    // Send to server-side API endpoint
    const response = await fetch('/api/generate-mcq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        numberOfQuestions,
        difficulty,
        questionTypes
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new AppError(
        errorData.error || 'MCQ generation failed',
        errorData.code || ErrorCodes.MCQ_GENERATION_FAILED,
        errorData.userMessage || 'Failed to generate quiz questions. Please try again.',
        'high'
      );
    }

    const result = await response.json();
    return result.questions;

  } catch (error) {
    // Re-throw AppError instances
    if (error instanceof AppError) {
      throw error;
    }

    // Handle unexpected errors
    console.error('MCQ generation error:', error);
    throw new AppError(
      `Unexpected error during MCQ generation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ErrorCodes.MCQ_GENERATION_FAILED,
      'Failed to generate quiz questions. Please try again.',
      'high',
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

function createMCQPrompt(
  text: string, 
  numberOfQuestions: number, 
  difficulty: string, 
  questionTypes: string[]
): string {
  return `
Based on the following text content, generate ${numberOfQuestions} multiple-choice questions at ${difficulty} difficulty level.

Include a mix of these question types: ${questionTypes.join(', ')}.

Text content:
"""
${text}
"""

Requirements:
1. Each question should have exactly 4 options (A, B, C, D)
2. Only one option should be correct
3. Questions should be clear and unambiguous
4. Incorrect options should be plausible but clearly wrong
5. Cover different parts of the content
6. Avoid questions that can be answered without reading the content

Respond with a JSON array in this exact format:
[
  {
    "text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]

The correctAnswer should be the index (0-3) of the correct option in the options array.
`;
}

/**
 * Parse and validate OpenAI response to ensure it contains valid MCQ data
 */
function parseAndValidateResponse(content: string, expectedCount: number): Question[] {
  let parsedQuestions;
  
  try {
    parsedQuestions = JSON.parse(content);
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Response content:', content);
    throw new AppError(
      'Invalid JSON response from OpenAI',
      ErrorCodes.MCQ_GENERATION_FAILED,
      'Received invalid response from quiz generation service. Please try again.',
      'high',
      { responseContent: content.substring(0, 500) }
    );
  }

  // Validate response structure
  if (!Array.isArray(parsedQuestions)) {
    throw new AppError(
      'OpenAI response is not an array',
      ErrorCodes.MCQ_GENERATION_FAILED,
      'Received unexpected response format from quiz generation service. Please try again.',
      'high',
      { responseType: typeof parsedQuestions }
    );
  }

  // Validate and transform questions
  const validQuestions = validateAndTransformQuestions(parsedQuestions);
  
  if (validQuestions.length === 0) {
    throw new AppError(
      'No valid questions were generated from OpenAI response',
      ErrorCodes.MCQ_GENERATION_FAILED,
      'Failed to generate valid quiz questions. Please try again with different content.',
      'high',
      { originalCount: parsedQuestions.length }
    );
  }

  // Ensure we have exactly the expected number of questions
  if (validQuestions.length !== expectedCount) {
    throw new AppError(
      `Generated ${validQuestions.length} questions instead of ${expectedCount}`,
      ErrorCodes.MCQ_GENERATION_FAILED,
      `Failed to generate exactly ${expectedCount} questions. Please try again.`,
      'medium',
      { expected: expectedCount, actual: validQuestions.length }
    );
  }

  return validQuestions;
}

/**
 * Validate and transform raw question data into Question objects
 */
function validateAndTransformQuestions(parsedData: any[]): Question[] {
  const validQuestions: Question[] = [];

  for (let i = 0; i < parsedData.length; i++) {
    const item = parsedData[i];
    
    // Validate question structure
    if (
      typeof item.text === 'string' &&
      Array.isArray(item.options) &&
      item.options.length === 4 &&
      typeof item.correctAnswer === 'number' &&
      item.correctAnswer >= 0 &&
      item.correctAnswer < 4 &&
      item.options.every((opt: any) => typeof opt === 'string')
    ) {
      validQuestions.push({
        id: `q_${Date.now()}_${i}`,
        text: item.text.trim(),
        options: item.options.map((opt: string) => opt.trim()),
        correctAnswer: item.correctAnswer
      });
    } else {
      console.warn(`Invalid question structure at index ${i}:`, item);
    }
  }

  return validQuestions;
}

// OpenAI error handling is now done server-side

/**
 * Generate MCQs with automatic retry logic for transient failures
 */
export async function generateMCQsWithRetry(
  text: string,
  options: MCQGenerationOptions = {},
  maxRetries: number = 3
): Promise<Question[]> {
  return withAPIRetry(
    () => generateMCQsFromText(text, options),
    { 
      maxAttempts: maxRetries,
      retryOn: [
        ErrorCodes.RATE_LIMIT, 
        ErrorCodes.SERVICE_UNAVAILABLE, 
        ErrorCodes.NETWORK_ERROR,
        ErrorCodes.TIMEOUT,
        ErrorCodes.CONNECTION_ERROR
      ],
      onRetry: (attempt, error) => {
        console.log(`MCQ generation retry attempt ${attempt} due to: ${error.message}`);
      }
    }
  );
}