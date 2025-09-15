import { vi, describe, it, expect, beforeEach } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import { Quiz, Question, UserResponse } from '@/types/models'

// Mock Firebase functions
vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ 
      toMillis: () => Date.now(),
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0 
    })),
    fromMillis: vi.fn((millis: number) => ({ 
      toMillis: () => millis,
      seconds: Math.floor(millis / 1000),
      nanoseconds: 0 
    })),
  },
}))

vi.mock('@/lib/firebase/config', () => ({
  db: { name: 'mock-db' },
}))

// Import after mocking
import {
  createQuiz,
  updateQuiz,
  getUserQuizzes,
  getQuizById,
  FirestoreServiceError,
} from '@/lib/firebase/firestore'
import * as firestore from 'firebase/firestore'

describe('Firestore Service', () => {
  const mockUserId = 'user123'
  const mockQuizId = 'quiz456'
  
  const mockQuestion: Question = {
    id: 'q1',
    text: 'What is 2+2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: 1,
  }

  const mockResponse: UserResponse = {
    questionId: 'q1',
    selectedAnswer: 1,
    isCorrect: true,
    responseTime: 3000,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock implementations
    vi.mocked(firestore.collection).mockReturnValue({ name: 'mock-collection' } as any)
    vi.mocked(firestore.doc).mockReturnValue({ name: 'mock-doc' } as any)
    vi.mocked(firestore.query).mockReturnValue({ name: 'mock-query' } as any)
    vi.mocked(firestore.where).mockReturnValue({ name: 'mock-where' } as any)
    vi.mocked(firestore.orderBy).mockReturnValue({ name: 'mock-orderby' } as any)
    vi.mocked(firestore.limit).mockReturnValue({ name: 'mock-limit' } as any)
  })

  describe('createQuiz', () => {
    it('should create a new quiz successfully', async () => {
      const mockDocRef = { id: mockQuizId }
      vi.mocked(firestore.addDoc).mockResolvedValue(mockDocRef as any)

      const quizData = {
        title: 'Test Quiz',
        pdfFileName: 'test.pdf',
        questions: [mockQuestion],
      }

      const result = await createQuiz(mockUserId, quizData)

      expect(result).toBe(mockQuizId)
      expect(firestore.addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'Test Quiz',
          pdfFileName: 'test.pdf',
          userId: mockUserId,
          status: 'in_progress',
          score: 0,
          totalQuestions: 0,
          questions: [mockQuestion],
          responses: [],
        })
      )
    })

    it('should throw error for invalid user ID', async () => {
      await expect(createQuiz('', { title: 'Test' })).rejects.toThrow(
        FirestoreServiceError
      )
      await expect(createQuiz('', { title: 'Test' })).rejects.toThrow(
        'Valid user ID is required'
      )
    })

    it('should throw error for missing title', async () => {
      await expect(createQuiz(mockUserId, { pdfFileName: 'test.pdf' })).rejects.toThrow(
        FirestoreServiceError
      )
      await expect(createQuiz(mockUserId, { pdfFileName: 'test.pdf' })).rejects.toThrow(
        'Quiz title is required'
      )
    })

    it('should throw error for missing PDF filename', async () => {
      await expect(createQuiz(mockUserId, { title: 'Test Quiz' })).rejects.toThrow(
        FirestoreServiceError
      )
      await expect(createQuiz(mockUserId, { title: 'Test Quiz' })).rejects.toThrow(
        'PDF filename is required'
      )
    })
  })

  describe('updateQuiz', () => {
    it('should update quiz successfully', async () => {
      vi.mocked(firestore.updateDoc).mockResolvedValue(undefined)

      const updates = { score: 85, status: 'completed' as const }
      await updateQuiz(mockUserId, mockQuizId, updates)

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        updates
      )
    })

    it('should remove id from updates', async () => {
      vi.mocked(firestore.updateDoc).mockResolvedValue(undefined)

      const updates = { id: 'should-be-removed', score: 85 }
      await updateQuiz(mockUserId, mockQuizId, updates)

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        { score: 85 }
      )
    })

    it('should throw error for invalid user ID', async () => {
      await expect(updateQuiz('', mockQuizId, {})).rejects.toThrow(
        'Valid user ID is required'
      )
    })

    it('should throw error for invalid quiz ID', async () => {
      await expect(updateQuiz(mockUserId, '', {})).rejects.toThrow(
        'Valid quiz ID is required'
      )
    })
  })

  describe('getUserQuizzes', () => {
    it('should get user quizzes successfully', async () => {
      const mockDocs = [
        {
          id: mockQuizId,
          data: () => ({ 
            userId: mockUserId,
            title: 'Test Quiz',
            score: 100,
            totalQuestions: 1,
            questions: [mockQuestion],
            responses: [mockResponse],
            pdfFileName: 'test.pdf',
            status: 'completed',
          }),
        },
      ]
      vi.mocked(firestore.getDocs).mockResolvedValue({ docs: mockDocs } as any)

      const result = await getUserQuizzes(mockUserId)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(mockQuizId)
      expect(firestore.query).toHaveBeenCalled()
      expect(firestore.orderBy).toHaveBeenCalledWith('createdAt', 'desc')
    })

    it('should throw error for invalid user ID', async () => {
      await expect(getUserQuizzes('')).rejects.toThrow(
        'Valid user ID is required'
      )
    })
  })

  describe('getQuizById', () => {
    it('should get quiz by ID successfully', async () => {
      const mockDocSnap = {
        exists: () => true,
        id: mockQuizId,
        data: () => ({ 
          userId: mockUserId,
          title: 'Test Quiz',
          score: 100,
          totalQuestions: 1,
          questions: [mockQuestion],
          responses: [mockResponse],
          pdfFileName: 'test.pdf',
          status: 'completed',
        }),
      }
      vi.mocked(firestore.getDoc).mockResolvedValue(mockDocSnap as any)

      const result = await getQuizById(mockUserId, mockQuizId)

      expect(result).not.toBeNull()
      expect(result?.id).toBe(mockQuizId)
    })

    it('should return null for non-existent quiz', async () => {
      const mockDocSnap = {
        exists: () => false,
      }
      vi.mocked(firestore.getDoc).mockResolvedValue(mockDocSnap as any)

      const result = await getQuizById(mockUserId, mockQuizId)

      expect(result).toBeNull()
    })

    it('should throw error for invalid user ID', async () => {
      await expect(getQuizById('', mockQuizId)).rejects.toThrow(
        'Valid user ID is required'
      )
    })

    it('should throw error for invalid quiz ID', async () => {
      await expect(getQuizById(mockUserId, '')).rejects.toThrow(
        'Valid quiz ID is required'
      )
    })
  })
})