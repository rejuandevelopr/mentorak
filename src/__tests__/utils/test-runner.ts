import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { setupFirebaseTestEnvironment, cleanupFirebaseTestEnvironment } from './firebase-test-utils'
import { resetAllMocks } from './api-mocks'

// Global test setup
beforeAll(async () => {
  // Setup Firebase emulator environment for integration tests
  if (process.env.VITEST_INTEGRATION) {
    await setupFirebaseTestEnvironment()
  }
})

afterAll(async () => {
  // Cleanup Firebase emulator environment
  if (process.env.VITEST_INTEGRATION) {
    await cleanupFirebaseTestEnvironment()
  }
})

beforeEach(() => {
  // Reset all mocks before each test
  resetAllMocks()
  
  // Clear localStorage
  if (typeof window !== 'undefined') {
    window.localStorage.clear()
    window.sessionStorage.clear()
  }
})

afterEach(() => {
  // Additional cleanup after each test if needed
})

// Helper to run tests with Firebase emulator
export const withFirebaseEmulator = (testFn: () => void | Promise<void>) => {
  return async () => {
    if (!process.env.VITEST_INTEGRATION) {
      await setupFirebaseTestEnvironment()
    }
    
    try {
      await testFn()
    } finally {
      if (!process.env.VITEST_INTEGRATION) {
        await cleanupFirebaseTestEnvironment()
      }
    }
  }
}

// Helper to skip tests in CI if needed
export const skipInCI = (condition: boolean = process.env.CI === 'true') => {
  return condition ? 'skip' : 'run'
}