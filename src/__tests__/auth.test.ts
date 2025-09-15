import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signUp, signIn, signOut, getCurrentUser } from '@/lib/firebase/auth'

// Mock Firebase auth
vi.mock('@/lib/firebase/config', () => ({
  auth: {
    currentUser: null,
  },
}))

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}))

describe('Firebase Auth Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signUp', () => {
    it('should call createUserWithEmailAndPassword with correct parameters', async () => {
      const { createUserWithEmailAndPassword } = await import('firebase/auth')
      const mockUserCredential = { user: { uid: 'test-uid', email: 'test@example.com' } }
      
      vi.mocked(createUserWithEmailAndPassword).mockResolvedValue(mockUserCredential as any)

      const result = await signUp('test@example.com', 'password123')

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      )
      expect(result).toBe(mockUserCredential)
    })

    it('should throw error when signup fails', async () => {
      const { createUserWithEmailAndPassword } = await import('firebase/auth')
      const mockError = new Error('Signup failed')
      
      vi.mocked(createUserWithEmailAndPassword).mockRejectedValue(mockError)

      await expect(signUp('test@example.com', 'password123')).rejects.toThrow('Signup failed')
    })
  })

  describe('signIn', () => {
    it('should call signInWithEmailAndPassword with correct parameters', async () => {
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      const mockUserCredential = { user: { uid: 'test-uid', email: 'test@example.com' } }
      
      vi.mocked(signInWithEmailAndPassword).mockResolvedValue(mockUserCredential as any)

      const result = await signIn('test@example.com', 'password123')

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      )
      expect(result).toBe(mockUserCredential)
    })
  })

  describe('getCurrentUser', () => {
    it('should return current user from auth', () => {
      const mockUser = { uid: 'test-uid', email: 'test@example.com' }
      const { auth } = require('@/lib/firebase/config')
      auth.currentUser = mockUser

      const result = getCurrentUser()

      expect(result).toBe(mockUser)
    })

    it('should return null when no user is authenticated', () => {
      const { auth } = require('@/lib/firebase/config')
      auth.currentUser = null

      const result = getCurrentUser()

      expect(result).toBeNull()
    })
  })
})