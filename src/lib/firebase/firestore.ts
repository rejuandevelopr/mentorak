import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  FirestoreError,
  DocumentData,
  QueryDocumentSnapshot,
  limit,
} from 'firebase/firestore'
import { db } from './config'
import { Quiz, Question, UserResponse, User, validateQuiz } from '@/types/models'

// Custom error types for better error handling
export class FirestoreServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'FirestoreServiceError'
  }
}

// Helper function to handle Firestore errors
const handleFirestoreError = (error: unknown, operation: string): never => {
  if (error instanceof FirestoreError) {
    switch (error.code) {
      case 'permission-denied':
        throw new FirestoreServiceError(
          `Permission denied for ${operation}`,
          'PERMISSION_DENIED',
          error
        )
      case 'not-found':
        throw new FirestoreServiceError(
          `Document not found for ${operation}`,
          'NOT_FOUND',
          error
        )
      case 'unavailable':
        throw new FirestoreServiceError(
          `Firestore service unavailable for ${operation}`,
          'SERVICE_UNAVAILABLE',
          error
        )
      case 'unauthenticated':
        throw new FirestoreServiceError(
          `User not authenticated for ${operation}`,
          'UNAUTHENTICATED',
          error
        )
      default:
        throw new FirestoreServiceError(
          `Firestore error during ${operation}: ${error.message}`,
          error.code,
          error
        )
    }
  }
  
  throw new FirestoreServiceError(
    `Unknown error during ${operation}`,
    'UNKNOWN_ERROR',
    error
  )
}

// Helper function to convert Firestore document to Quiz
const documentToQuiz = (doc: QueryDocumentSnapshot<DocumentData>): Quiz => {
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
  } as Quiz
}

// Validation helper
const validateQuizData = (quiz: Partial<Quiz>, operation: string): void => {
  if (operation === 'create') {
    if (!quiz.title || typeof quiz.title !== 'string') {
      throw new FirestoreServiceError('Quiz title is required', 'INVALID_DATA')
    }
    if (!quiz.topic || typeof quiz.topic !== 'string') {
      throw new FirestoreServiceError('Quiz topic is required', 'INVALID_DATA')
    }
  }
}

// Quiz operations
export const createQuiz = async (userId: string, quiz: Partial<Quiz>): Promise<string> => {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new FirestoreServiceError('Valid user ID is required', 'INVALID_USER_ID')
    }

    validateQuizData(quiz, 'create')

    const quizData = {
      ...quiz,
      userId,
      createdAt: Timestamp.now(),
      status: 'in_progress' as const,
      score: quiz.score || 0,
      totalQuestions: quiz.totalQuestions || 0,
      questions: quiz.questions || [],
      responses: quiz.responses || [],
    }
    
    const docRef = await addDoc(collection(db, 'users', userId, 'quizzes'), quizData)
    return docRef.id
  } catch (error) {
    if (error instanceof FirestoreServiceError) {
      throw error
    }
    throw handleFirestoreError(error, 'create quiz')
  }
}

export const updateQuiz = async (userId: string, quizId: string, updates: Partial<Quiz>): Promise<void> => {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new FirestoreServiceError('Valid user ID is required', 'INVALID_USER_ID')
    }
    if (!quizId || typeof quizId !== 'string') {
      throw new FirestoreServiceError('Valid quiz ID is required', 'INVALID_QUIZ_ID')
    }

    // Remove id from updates to avoid Firestore error
    const { id, ...safeUpdates } = updates
    
    const quizRef = doc(db, 'users', userId, 'quizzes', quizId)
    await updateDoc(quizRef, safeUpdates)
  } catch (error) {
    if (error instanceof FirestoreServiceError) {
      throw error
    }
    throw handleFirestoreError(error, 'update quiz')
  }
}

export const getUserQuizzes = async (userId: string, limitCount?: number): Promise<Quiz[]> => {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new FirestoreServiceError('Valid user ID is required', 'INVALID_USER_ID')
    }

    const quizzesRef = collection(db, 'users', userId, 'quizzes')
    let q = query(quizzesRef, orderBy('createdAt', 'desc'))
    
    if (limitCount && limitCount > 0) {
      q = query(q, limit(limitCount))
    }
    
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(documentToQuiz)
  } catch (error) {
    if (error instanceof FirestoreServiceError) {
      throw error
    }
    throw handleFirestoreError(error, 'get user quizzes')
  }
}

export const getQuizById = async (userId: string, quizId: string): Promise<Quiz | null> => {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new FirestoreServiceError('Valid user ID is required', 'INVALID_USER_ID')
    }
    if (!quizId || typeof quizId !== 'string') {
      throw new FirestoreServiceError('Valid quiz ID is required', 'INVALID_QUIZ_ID')
    }

    const quizRef = doc(db, 'users', userId, 'quizzes', quizId)
    const docSnap = await getDoc(quizRef)
    
    if (docSnap.exists()) {
      return documentToQuiz(docSnap as QueryDocumentSnapshot<DocumentData>)
    } else {
      return null
    }
  } catch (error) {
    if (error instanceof FirestoreServiceError) {
      throw error
    }
    throw handleFirestoreError(error, 'get quiz by ID')
  }
}

// Additional utility functions for quiz management
export const getRecentQuizzes = async (userId: string, count: number = 5): Promise<Quiz[]> => {
  return getUserQuizzes(userId, count)
}

export const getCompletedQuizzes = async (userId: string): Promise<Quiz[]> => {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new FirestoreServiceError('Valid user ID is required', 'INVALID_USER_ID')
    }

    const quizzesRef = collection(db, 'users', userId, 'quizzes')
    const q = query(
      quizzesRef, 
      where('status', '==', 'completed'),
      orderBy('completedAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(documentToQuiz)
  } catch (error) {
    if (error instanceof FirestoreServiceError) {
      throw error
    }
    throw handleFirestoreError(error, 'get completed quizzes')
  }
}

export const getInProgressQuizzes = async (userId: string): Promise<Quiz[]> => {
  try {
    if (!userId || typeof userId !== 'string') {
      throw new FirestoreServiceError('Valid user ID is required', 'INVALID_USER_ID')
    }

    const quizzesRef = collection(db, 'users', userId, 'quizzes')
    const q = query(
      quizzesRef, 
      where('status', '==', 'in_progress'),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(documentToQuiz)
  } catch (error) {
    if (error instanceof FirestoreServiceError) {
      throw error
    }
    throw handleFirestoreError(error, 'get in-progress quizzes')
  }
}

// User statistics
export const getUserQuizStats = async (userId: string): Promise<{
  totalQuizzes: number
  completedQuizzes: number
  averageScore: number
  totalQuestionsAnswered: number
}> => {
  try {
    const allQuizzes = await getUserQuizzes(userId)
    const completedQuizzes = allQuizzes.filter(quiz => quiz.status === 'completed')
    
    const totalQuestionsAnswered = completedQuizzes.reduce(
      (sum, quiz) => sum + quiz.responses.length, 
      0
    )
    
    const averageScore = completedQuizzes.length > 0
      ? Math.round(completedQuizzes.reduce((sum, quiz) => sum + quiz.score, 0) / completedQuizzes.length)
      : 0

    return {
      totalQuizzes: allQuizzes.length,
      completedQuizzes: completedQuizzes.length,
      averageScore,
      totalQuestionsAnswered,
    }
  } catch (error) {
    if (error instanceof FirestoreServiceError) {
      throw error
    }
    throw handleFirestoreError(error, 'get user quiz stats')
  }
}

// Batch operations for better performance
export const saveQuizProgress = async (
  userId: string, 
  quizId: string, 
  responses: UserResponse[]
): Promise<void> => {
  try {
    const updates: Partial<Quiz> = {
      responses,
      // Don't update score until quiz is completed
    }
    
    await updateQuiz(userId, quizId, updates)
  } catch (error) {
    if (error instanceof FirestoreServiceError) {
      throw error
    }
    throw handleFirestoreError(error, 'save quiz progress')
  }
}

export const completeQuiz = async (
  userId: string, 
  quizId: string, 
  responses: UserResponse[],
  finalScore: number
): Promise<void> => {
  try {
    const updates: Partial<Quiz> = {
      responses,
      score: finalScore,
      status: 'completed' as const,
      completedAt: Timestamp.now(),
    }
    
    await updateQuiz(userId, quizId, updates)
  } catch (error) {
    if (error instanceof FirestoreServiceError) {
      throw error
    }
    throw handleFirestoreError(error, 'complete quiz')
  }
}

