import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, setDoc, getDoc, collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore'

let testEnv: RulesTestEnvironment

export const setupFirebaseTestEnvironment = async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'mentorak-test',
    firestore: {
      rules: `
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /users/{userId} {
              allow read, write: if request.auth != null && request.auth.uid == userId;
              
              match /quizzes/{quizId} {
                allow read, write: if request.auth != null && request.auth.uid == userId;
              }
            }
          }
        }
      `,
      host: 'localhost',
      port: 8080,
    },
    auth: {
      host: 'localhost',
      port: 9099,
    },
  })
}

export const cleanupFirebaseTestEnvironment = async () => {
  if (testEnv) {
    await testEnv.cleanup()
  }
}

export const getTestFirestore = (uid?: string) => {
  if (!testEnv) {
    throw new Error('Test environment not initialized. Call setupFirebaseTestEnvironment first.')
  }
  
  return uid 
    ? testEnv.authenticatedContext(uid).firestore()
    : testEnv.unauthenticatedContext().firestore()
}

export const getTestAuth = () => {
  if (!testEnv) {
    throw new Error('Test environment not initialized. Call setupFirebaseTestEnvironment first.')
  }
  
  return testEnv.auth()
}

// Test data factories
export const createTestUser = (overrides = {}) => ({
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  createdAt: new Date(),
  lastLoginAt: new Date(),
  ...overrides,
})

export const createTestQuiz = (overrides = {}) => ({
  id: 'test-quiz-123',
  userId: 'test-user-123',
  title: 'Test Quiz',
  createdAt: new Date(),
  completedAt: new Date(),
  score: 8,
  totalQuestions: 10,
  questions: [
    {
      id: 'q1',
      text: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: 1,
    },
    {
      id: 'q2',
      text: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 2,
    },
  ],
  responses: [
    {
      questionId: 'q1',
      selectedAnswer: 1,
      isCorrect: true,
      responseTime: 5000,
    },
    {
      questionId: 'q2',
      selectedAnswer: 2,
      isCorrect: true,
      responseTime: 3000,
    },
  ],
  pdfFileName: 'test.pdf',
  status: 'completed' as const,
  ...overrides,
})

export const createTestQuestion = (overrides = {}) => ({
  id: 'test-question-123',
  text: 'Sample question?',
  options: ['Option A', 'Option B', 'Option C', 'Option D'],
  correctAnswer: 0,
  audioUrl: 'https://example.com/audio.mp3',
  ...overrides,
})

export const createTestUserResponse = (overrides = {}) => ({
  questionId: 'test-question-123',
  selectedAnswer: 0,
  isCorrect: true,
  responseTime: 5000,
  voiceTranscript: 'Option A',
  ...overrides,
})