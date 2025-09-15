import { Timestamp } from 'firebase/firestore'

// Core data models
export interface User {
  uid: string
  email: string
  displayName?: string
  createdAt: Timestamp
  lastLoginAt: Timestamp
}

export interface Quiz {
  id: string
  userId: string
  title: string
  topic: string
  createdAt: Timestamp
  completedAt?: Timestamp
  score: number
  totalQuestions: number
  questions: Question[]
  responses: UserResponse[]
  status: 'in_progress' | 'completed'
}

export interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: number
  audioUrl?: string
}

export interface UserResponse {
  questionId: string
  selectedAnswer: number
  isCorrect: boolean
  responseTime: number
  voiceTranscript?: string
}

// Validation functions
export const validateUser = (user: Partial<User>): user is User => {
  return !!(
    user.uid &&
    typeof user.uid === 'string' &&
    user.email &&
    typeof user.email === 'string' &&
    user.createdAt &&
    user.lastLoginAt
  )
}

export const validateQuestion = (question: Partial<Question>): question is Question => {
  return !!(
    question.id &&
    typeof question.id === 'string' &&
    question.text &&
    typeof question.text === 'string' &&
    question.options &&
    Array.isArray(question.options) &&
    question.options.length >= 2 &&
    question.options.every(option => typeof option === 'string') &&
    typeof question.correctAnswer === 'number' &&
    question.correctAnswer >= 0 &&
    question.correctAnswer < question.options.length
  )
}

export const validateUserResponse = (response: Partial<UserResponse>): response is UserResponse => {
  return !!(
    response.questionId &&
    typeof response.questionId === 'string' &&
    typeof response.selectedAnswer === 'number' &&
    typeof response.isCorrect === 'boolean' &&
    typeof response.responseTime === 'number' &&
    response.responseTime >= 0
  )
}

export const validateQuiz = (quiz: Partial<Quiz>): quiz is Quiz => {
  return !!(
    quiz.id &&
    typeof quiz.id === 'string' &&
    quiz.userId &&
    typeof quiz.userId === 'string' &&
    quiz.title &&
    typeof quiz.title === 'string' &&
    quiz.topic &&
    typeof quiz.topic === 'string' &&
    quiz.createdAt &&
    typeof quiz.score === 'number' &&
    quiz.score >= 0 &&
    typeof quiz.totalQuestions === 'number' &&
    quiz.totalQuestions > 0 &&
    quiz.questions &&
    Array.isArray(quiz.questions) &&
    quiz.questions.every(validateQuestion) &&
    quiz.responses &&
    Array.isArray(quiz.responses) &&
    quiz.responses.every(validateUserResponse) &&
    quiz.status &&
    (quiz.status === 'in_progress' || quiz.status === 'completed')
  )
}

// Utility functions for data transformation
export const createEmptyQuiz = (userId: string, title: string, topic: string): Omit<Quiz, 'id'> => ({
  userId,
  title,
  topic,
  createdAt: Timestamp.now(),
  score: 0,
  totalQuestions: 0,
  questions: [],
  responses: [],
  status: 'in_progress'
})

export const calculateQuizScore = (responses: UserResponse[]): number => {
  if (responses.length === 0) return 0
  const correctAnswers = responses.filter(response => response.isCorrect).length
  return Math.round((correctAnswers / responses.length) * 100)
}

export const createUserResponse = (
  questionId: string,
  selectedAnswer: number,
  correctAnswer: number,
  responseTime: number,
  voiceTranscript?: string
): UserResponse => ({
  questionId,
  selectedAnswer,
  isCorrect: selectedAnswer === correctAnswer,
  responseTime,
  voiceTranscript
})

export const completeQuiz = (quiz: Quiz, responses: UserResponse[]): Quiz => {
  const score = calculateQuizScore(responses)
  return {
    ...quiz,
    responses,
    score,
    completedAt: Timestamp.now(),
    status: 'completed'
  }
}

export const getQuizProgress = (quiz: Quiz): number => {
  if (quiz.totalQuestions === 0) return 0
  return Math.round((quiz.responses.length / quiz.totalQuestions) * 100)
}

export const formatQuizDuration = (createdAt: Timestamp, completedAt?: Timestamp): string => {
  if (!completedAt) return 'In progress'
  
  const durationMs = completedAt.toMillis() - createdAt.toMillis()
  const minutes = Math.floor(durationMs / 60000)
  const seconds = Math.floor((durationMs % 60000) / 1000)
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

export const getQuizStatusText = (quiz: Quiz): string => {
  switch (quiz.status) {
    case 'in_progress':
      return `${quiz.responses.length}/${quiz.totalQuestions} questions answered`
    case 'completed':
      return `Completed with ${quiz.score}% score`
    default:
      return 'Unknown status'
  }
}

// Type guards for runtime type checking
export const isUser = (obj: unknown): obj is User => {
  return typeof obj === 'object' && obj !== null && validateUser(obj as Partial<User>)
}

export const isQuestion = (obj: unknown): obj is Question => {
  return typeof obj === 'object' && obj !== null && validateQuestion(obj as Partial<Question>)
}

export const isUserResponse = (obj: unknown): obj is UserResponse => {
  return typeof obj === 'object' && obj !== null && validateUserResponse(obj as Partial<UserResponse>)
}

export const isQuiz = (obj: unknown): obj is Quiz => {
  return typeof obj === 'object' && obj !== null && validateQuiz(obj as Partial<Quiz>)
}