import { Timestamp } from 'firebase/firestore'
import {
  User,
  Quiz,
  Question,
  UserResponse,
  validateUser,
  validateQuestion,
  validateUserResponse,
  validateQuiz,
  createEmptyQuiz,
  calculateQuizScore,
  createUserResponse,
  completeQuiz,
  getQuizProgress,
  formatQuizDuration,
  getQuizStatusText,
  isUser,
  isQuestion,
  isUserResponse,
  isQuiz
} from '@/types/models'

describe('Data Model Validation', () => {
  describe('validateUser', () => {
    it('should validate a complete user object', () => {
      const user: User = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now()
      }
      
      expect(validateUser(user)).toBe(true)
    })

    it('should reject user with missing required fields', () => {
      const incompleteUser = {
        uid: 'user123',
        email: 'test@example.com'
        // missing createdAt and lastLoginAt
      }
      
      expect(validateUser(incompleteUser)).toBe(false)
    })

    it('should reject user with invalid field types', () => {
      const invalidUser = {
        uid: 123, // should be string
        email: 'test@example.com',
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now()
      }
      
      expect(validateUser(invalidUser)).toBe(false)
    })
  })

  describe('validateQuestion', () => {
    it('should validate a complete question object', () => {
      const question: Question = {
        id: 'q1',
        text: 'What is 2+2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1,
        audioUrl: 'https://example.com/audio.mp3'
      }
      
      expect(validateQuestion(question)).toBe(true)
    })

    it('should validate question without optional audioUrl', () => {
      const question: Omit<Question, 'audioUrl'> = {
        id: 'q1',
        text: 'What is 2+2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1
      }
      
      expect(validateQuestion(question)).toBe(true)
    })

    it('should reject question with invalid correctAnswer index', () => {
      const invalidQuestion = {
        id: 'q1',
        text: 'What is 2+2?',
        options: ['3', '4'],
        correctAnswer: 5 // out of bounds
      }
      
      expect(validateQuestion(invalidQuestion)).toBe(false)
    })

    it('should reject question with insufficient options', () => {
      const invalidQuestion = {
        id: 'q1',
        text: 'What is 2+2?',
        options: ['4'], // need at least 2 options
        correctAnswer: 0
      }
      
      expect(validateQuestion(invalidQuestion)).toBe(false)
    })
  })

  describe('validateUserResponse', () => {
    it('should validate a complete user response', () => {
      const response: UserResponse = {
        questionId: 'q1',
        selectedAnswer: 1,
        isCorrect: true,
        responseTime: 5000,
        voiceTranscript: 'four'
      }
      
      expect(validateUserResponse(response)).toBe(true)
    })

    it('should validate response without optional voiceTranscript', () => {
      const response: Omit<UserResponse, 'voiceTranscript'> = {
        questionId: 'q1',
        selectedAnswer: 1,
        isCorrect: true,
        responseTime: 5000
      }
      
      expect(validateUserResponse(response)).toBe(true)
    })

    it('should reject response with negative responseTime', () => {
      const invalidResponse = {
        questionId: 'q1',
        selectedAnswer: 1,
        isCorrect: true,
        responseTime: -1000
      }
      
      expect(validateUserResponse(invalidResponse)).toBe(false)
    })
  })

  describe('validateQuiz', () => {
    const validQuestion: Question = {
      id: 'q1',
      text: 'Test question',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 1
    }

    const validResponse: UserResponse = {
      questionId: 'q1',
      selectedAnswer: 1,
      isCorrect: true,
      responseTime: 3000
    }

    it('should validate a complete quiz object', () => {
      const quiz: Quiz = {
        id: 'quiz123',
        userId: 'user123',
        title: 'Test Quiz',
        createdAt: Timestamp.now(),
        completedAt: Timestamp.now(),
        score: 100,
        totalQuestions: 1,
        questions: [validQuestion],
        responses: [validResponse],
        pdfFileName: 'test.pdf',
        status: 'completed'
      }
      
      expect(validateQuiz(quiz)).toBe(true)
    })

    it('should reject quiz with invalid status', () => {
      const invalidQuiz = {
        id: 'quiz123',
        userId: 'user123',
        title: 'Test Quiz',
        createdAt: Timestamp.now(),
        score: 100,
        totalQuestions: 1,
        questions: [validQuestion],
        responses: [validResponse],
        pdfFileName: 'test.pdf',
        status: 'invalid_status'
      }
      
      expect(validateQuiz(invalidQuiz)).toBe(false)
    })
  })
})

describe('Utility Functions', () => {
  describe('createEmptyQuiz', () => {
    it('should create a valid empty quiz', () => {
      const quiz = createEmptyQuiz('user123', 'Test Quiz', 'test.pdf')
      
      expect(quiz.userId).toBe('user123')
      expect(quiz.title).toBe('Test Quiz')
      expect(quiz.pdfFileName).toBe('test.pdf')
      expect(quiz.score).toBe(0)
      expect(quiz.totalQuestions).toBe(0)
      expect(quiz.questions).toEqual([])
      expect(quiz.responses).toEqual([])
      expect(quiz.status).toBe('in_progress')
      expect(quiz.createdAt).toHaveProperty('toMillis')
      expect(typeof quiz.createdAt.toMillis).toBe('function')
    })
  })

  describe('calculateQuizScore', () => {
    it('should calculate correct percentage score', () => {
      const responses: UserResponse[] = [
        { questionId: 'q1', selectedAnswer: 1, isCorrect: true, responseTime: 1000 },
        { questionId: 'q2', selectedAnswer: 2, isCorrect: false, responseTime: 2000 },
        { questionId: 'q3', selectedAnswer: 0, isCorrect: true, responseTime: 1500 }
      ]
      
      const score = calculateQuizScore(responses)
      expect(score).toBe(67) // 2/3 = 66.67%, rounded to 67
    })

    it('should return 0 for empty responses', () => {
      const score = calculateQuizScore([])
      expect(score).toBe(0)
    })

    it('should return 100 for all correct answers', () => {
      const responses: UserResponse[] = [
        { questionId: 'q1', selectedAnswer: 1, isCorrect: true, responseTime: 1000 },
        { questionId: 'q2', selectedAnswer: 2, isCorrect: true, responseTime: 2000 }
      ]
      
      const score = calculateQuizScore(responses)
      expect(score).toBe(100)
    })
  })

  describe('createUserResponse', () => {
    it('should create correct user response', () => {
      const response = createUserResponse('q1', 2, 2, 3000, 'answer text')
      
      expect(response.questionId).toBe('q1')
      expect(response.selectedAnswer).toBe(2)
      expect(response.isCorrect).toBe(true)
      expect(response.responseTime).toBe(3000)
      expect(response.voiceTranscript).toBe('answer text')
    })

    it('should mark incorrect answer as false', () => {
      const response = createUserResponse('q1', 1, 2, 3000)
      
      expect(response.isCorrect).toBe(false)
      expect(response.voiceTranscript).toBeUndefined()
    })
  })

  describe('completeQuiz', () => {
    it('should complete quiz with correct score and timestamp', () => {
      const originalQuiz: Quiz = {
        id: 'quiz123',
        userId: 'user123',
        title: 'Test Quiz',
        createdAt: Timestamp.now(),
        score: 0,
        totalQuestions: 2,
        questions: [],
        responses: [],
        pdfFileName: 'test.pdf',
        status: 'in_progress'
      }

      const responses: UserResponse[] = [
        { questionId: 'q1', selectedAnswer: 1, isCorrect: true, responseTime: 1000 },
        { questionId: 'q2', selectedAnswer: 2, isCorrect: false, responseTime: 2000 }
      ]

      const completedQuiz = completeQuiz(originalQuiz, responses)
      
      expect(completedQuiz.responses).toEqual(responses)
      expect(completedQuiz.score).toBe(50)
      expect(completedQuiz.status).toBe('completed')
      expect(completedQuiz.completedAt).toHaveProperty('toMillis')
      expect(typeof completedQuiz.completedAt?.toMillis).toBe('function')
    })
  })

  describe('getQuizProgress', () => {
    it('should calculate correct progress percentage', () => {
      const quiz: Quiz = {
        id: 'quiz123',
        userId: 'user123',
        title: 'Test Quiz',
        createdAt: Timestamp.now(),
        score: 0,
        totalQuestions: 4,
        questions: [],
        responses: [
          { questionId: 'q1', selectedAnswer: 1, isCorrect: true, responseTime: 1000 },
          { questionId: 'q2', selectedAnswer: 2, isCorrect: false, responseTime: 2000 }
        ],
        pdfFileName: 'test.pdf',
        status: 'in_progress'
      }
      
      const progress = getQuizProgress(quiz)
      expect(progress).toBe(50) // 2/4 = 50%
    })

    it('should return 0 for quiz with no questions', () => {
      const quiz: Quiz = {
        id: 'quiz123',
        userId: 'user123',
        title: 'Test Quiz',
        createdAt: Timestamp.now(),
        score: 0,
        totalQuestions: 0,
        questions: [],
        responses: [],
        pdfFileName: 'test.pdf',
        status: 'in_progress'
      }
      
      const progress = getQuizProgress(quiz)
      expect(progress).toBe(0)
    })
  })

  describe('formatQuizDuration', () => {
    it('should format duration in minutes and seconds', () => {
      const createdAt = Timestamp.fromMillis(1000000)
      const completedAt = Timestamp.fromMillis(1000000 + 125000) // 2m 5s later
      
      const duration = formatQuizDuration(createdAt, completedAt)
      expect(duration).toBe('2m 5s')
    })

    it('should format duration in seconds only', () => {
      const createdAt = Timestamp.fromMillis(1000000)
      const completedAt = Timestamp.fromMillis(1000000 + 30000) // 30s later
      
      const duration = formatQuizDuration(createdAt, completedAt)
      expect(duration).toBe('30s')
    })

    it('should return "In progress" for incomplete quiz', () => {
      const createdAt = Timestamp.now()
      
      const duration = formatQuizDuration(createdAt)
      expect(duration).toBe('In progress')
    })
  })

  describe('getQuizStatusText', () => {
    it('should return progress text for in-progress quiz', () => {
      const quiz: Quiz = {
        id: 'quiz123',
        userId: 'user123',
        title: 'Test Quiz',
        createdAt: Timestamp.now(),
        score: 0,
        totalQuestions: 5,
        questions: [],
        responses: [
          { questionId: 'q1', selectedAnswer: 1, isCorrect: true, responseTime: 1000 },
          { questionId: 'q2', selectedAnswer: 2, isCorrect: false, responseTime: 2000 }
        ],
        pdfFileName: 'test.pdf',
        status: 'in_progress'
      }
      
      const statusText = getQuizStatusText(quiz)
      expect(statusText).toBe('2/5 questions answered')
    })

    it('should return completion text for completed quiz', () => {
      const quiz: Quiz = {
        id: 'quiz123',
        userId: 'user123',
        title: 'Test Quiz',
        createdAt: Timestamp.now(),
        score: 85,
        totalQuestions: 5,
        questions: [],
        responses: [],
        pdfFileName: 'test.pdf',
        status: 'completed'
      }
      
      const statusText = getQuizStatusText(quiz)
      expect(statusText).toBe('Completed with 85% score')
    })
  })
})

describe('Type Guards', () => {
  describe('isUser', () => {
    it('should return true for valid user object', () => {
      const user: User = {
        uid: 'user123',
        email: 'test@example.com',
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now()
      }
      
      expect(isUser(user)).toBe(true)
    })

    it('should return false for invalid object', () => {
      const notUser = { name: 'test' }
      expect(isUser(notUser)).toBe(false)
      expect(isUser(null)).toBe(false)
      expect(isUser(undefined)).toBe(false)
      expect(isUser('string')).toBe(false)
    })
  })

  describe('isQuestion', () => {
    it('should return true for valid question object', () => {
      const question: Question = {
        id: 'q1',
        text: 'Test question',
        options: ['A', 'B', 'C'],
        correctAnswer: 1
      }
      
      expect(isQuestion(question)).toBe(true)
    })

    it('should return false for invalid object', () => {
      const notQuestion = { text: 'test' }
      expect(isQuestion(notQuestion)).toBe(false)
    })
  })

  describe('isUserResponse', () => {
    it('should return true for valid user response object', () => {
      const response: UserResponse = {
        questionId: 'q1',
        selectedAnswer: 1,
        isCorrect: true,
        responseTime: 1000
      }
      
      expect(isUserResponse(response)).toBe(true)
    })

    it('should return false for invalid object', () => {
      const notResponse = { answer: 'test' }
      expect(isUserResponse(notResponse)).toBe(false)
    })
  })

  describe('isQuiz', () => {
    it('should return true for valid quiz object', () => {
      const quiz: Quiz = {
        id: 'quiz123',
        userId: 'user123',
        title: 'Test Quiz',
        createdAt: Timestamp.now(),
        score: 100,
        totalQuestions: 1,
        questions: [{
          id: 'q1',
          text: 'Test',
          options: ['A', 'B'],
          correctAnswer: 0
        }],
        responses: [{
          questionId: 'q1',
          selectedAnswer: 0,
          isCorrect: true,
          responseTime: 1000
        }],
        pdfFileName: 'test.pdf',
        status: 'completed'
      }
      
      expect(isQuiz(quiz)).toBe(true)
    })

    it('should return false for invalid object', () => {
      const notQuiz = { title: 'test' }
      expect(isQuiz(notQuiz)).toBe(false)
    })
  })
})