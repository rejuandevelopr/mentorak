import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'
import { setupGlobalMocks } from './utils/api-mocks'

// Setup global API mocks
setupGlobalMocks()

// Mock Firebase config before any imports
vi.mock('@/lib/firebase/config', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
  },
  db: {},
  default: {},
}))

// Mock Firebase auth functions
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  User: vi.fn(),
}))

// Mock Firebase firestore functions
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  addDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(),
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

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}))

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => {
    return React.createElement('a', { href, ...props }, children)
  },
}))