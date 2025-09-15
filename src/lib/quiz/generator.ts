import { extractTextFromPDF, estimateQuestionCount } from '../pdf/extractor';
import { PDFExtractionError } from '@/types/pdf';
import { generateMCQsWithRetry, MCQGenerationOptions } from '../openai/mcq-generator';
import { createQuiz } from '../firebase/firestore';
import { Quiz, Question } from '../../types/models';
import { AppError, ErrorCodes } from '@/lib/errors/AppError';
import { ErrorHandler, createError } from '@/lib/errors/errorHandler';
import { Timestamp } from 'firebase/firestore';

export interface QuizGenerationOptions extends MCQGenerationOptions {
  userId: string;
  customTitle?: string;
}

export interface QuizGenerationResult {
  quizId: string;
  quiz: Quiz;
  questions: Question[];
}

export async function generateQuizFromPDF(
  file: File,
  options: QuizGenerationOptions
): Promise<QuizGenerationResult> {
  const { userId, customTitle, ...mcqOptions } = options;

  try {
    // Step 1: Extract text from PDF
    let extractionResult;
    try {
      extractionResult = await extractTextFromPDF(file);
    } catch (error) {
      if (error instanceof PDFExtractionError) {
        throw createError.fileUpload(
          `PDF processing failed: ${error.message}`,
          'Failed to process the PDF file. Please ensure it contains readable text.',
          { fileName: file.name, fileSize: file.size }
        );
      }
      throw ErrorHandler.handleError(error, { operation: 'extractPDF', fileName: file.name });
    }

    // Step 2: Determine optimal number of questions if not specified
    const numberOfQuestions = mcqOptions.numberOfQuestions || 
      estimateQuestionCount(extractionResult.text);

    // Step 3: Generate MCQs from extracted text
    let questions: Question[];
    try {
      questions = await generateMCQsWithRetry(extractionResult.text, {
        ...mcqOptions,
        numberOfQuestions
      });
    } catch (error) {
      if (error instanceof AppError && error.code === ErrorCodes.MCQ_GENERATION_FAILED) {
        throw error; // Re-throw AppError as is
      }
      throw ErrorHandler.handleError(error, { 
        operation: 'generateMCQs', 
        textLength: extractionResult.text.length,
        numberOfQuestions 
      });
    }

    // Step 4: Create quiz object
    const quiz: Omit<Quiz, 'id'> = {
      userId,
      title: customTitle || extractionResult.title || file.name.replace('.pdf', ''),
      createdAt: Timestamp.now(),
      score: 0,
      totalQuestions: questions.length,
      questions,
      responses: [],
      pdfFileName: file.name,
      status: 'in_progress'
    };

    // Step 5: Save quiz to Firestore
    let quizId: string;
    try {
      quizId = await createQuiz(userId, quiz);
    } catch (error) {
      throw ErrorHandler.handleError(error, { 
        operation: 'saveQuiz', 
        userId, 
        quizTitle: quiz.title 
      });
    }

    return {
      quizId,
      quiz: { ...quiz, id: quizId },
      questions
    };

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    // Handle unexpected errors
    const appError = ErrorHandler.handleError(error, {
      operation: 'generateQuizFromPDF',
      fileName: file.name,
      userId: options.userId
    });
    ErrorHandler.logError(appError);
    throw appError;
  }
}

// Progress tracking for long-running operations
export interface QuizGenerationProgress {
  step: 'extracting' | 'generating' | 'saving' | 'complete';
  message: string;
  progress: number; // 0-100
}

export async function generateQuizFromPDFWithProgress(
  file: File,
  options: QuizGenerationOptions,
  onProgress?: (progress: QuizGenerationProgress) => void
): Promise<QuizGenerationResult> {
  const updateProgress = (step: QuizGenerationProgress['step'], message: string, progress: number) => {
    if (onProgress) {
      onProgress({ step, message, progress });
    }
  };

  try {
    // Step 1: Extract text from PDF
    updateProgress('extracting', 'Extracting text from PDF...', 10);
    const extractionResult = await extractTextFromPDF(file);
    updateProgress('extracting', 'PDF text extracted successfully', 30);

    // Step 2: Generate MCQs
    updateProgress('generating', 'Generating quiz questions...', 40);
    const numberOfQuestions = options.numberOfQuestions || 
      estimateQuestionCount(extractionResult.text);

    const questions = await generateMCQsWithRetry(extractionResult.text, {
      ...options,
      numberOfQuestions
    });
    updateProgress('generating', 'Questions generated successfully', 70);

    // Step 3: Save to database
    updateProgress('saving', 'Saving quiz to database...', 80);
    const quiz: Omit<Quiz, 'id'> = {
      userId: options.userId,
      title: options.customTitle || extractionResult.title || file.name.replace('.pdf', ''),
      createdAt: Timestamp.now(),
      score: 0,
      totalQuestions: questions.length,
      questions,
      responses: [],
      pdfFileName: file.name,
      status: 'in_progress'
    };

    const quizId = await createQuiz(options.userId, quiz);
    updateProgress('complete', 'Quiz created successfully!', 100);

    return {
      quizId,
      quiz: { ...quiz, id: quizId },
      questions
    };

  } catch (error) {
    // Re-throw with appropriate error handling using new error system
    if (error instanceof PDFExtractionError) {
      throw createError.fileUpload(
        `PDF processing failed: ${error.message}`,
        'Failed to process the PDF file. Please ensure it contains readable text.',
        { fileName: file.name }
      );
    }
    
    if (error instanceof AppError) {
      throw error; // Re-throw AppError as is
    }

    const appError = ErrorHandler.handleError(error, {
      operation: 'generateQuizFromPDFWithProgress',
      fileName: file.name,
      userId: options.userId
    });
    ErrorHandler.logError(appError);
    throw appError;
  }
}

// Utility function to validate generation options
export function validateQuizGenerationOptions(options: QuizGenerationOptions): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!options.userId || typeof options.userId !== 'string') {
    errors.push('User ID is required');
  }

  if (options.numberOfQuestions && (options.numberOfQuestions < 1 || options.numberOfQuestions > 20)) {
    errors.push('Number of questions must be between 1 and 20');
  }

  if (options.difficulty && !['easy', 'medium', 'hard'].includes(options.difficulty)) {
    errors.push('Difficulty must be easy, medium, or hard');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}