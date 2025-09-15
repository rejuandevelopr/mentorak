import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { User } from 'firebase/auth'
import { vi } from 'vitest'

// Mock user for testing
const mockUser: User = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
  providerData: [],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: vi.fn(),
  getIdToken: vi.fn().mockResolvedValue('mock-id-token'),
  getIdTokenResult: vi.fn(),
  reload: vi.fn(),
  toJSON: vi.fn(),
  phoneNumber: null,
  photoURL: null,
  providerId: 'firebase',
} as User

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: User | null
  initialAuthState?: 'loading' | 'authenticated' | 'unauthenticated'
}

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { user = mockUser, initialAuthState = 'authenticated', ...renderOptions } = options

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    // Create a mock AuthContext Provider
    const AuthContext = React.createContext({
      user: initialAuthState === 'authenticated' ? user : null,
      loading: initialAuthState === 'loading',
      error: null,
    })

    return (
      <AuthContext.Provider value={{
        user: initialAuthState === 'authenticated' ? user : null,
        loading: initialAuthState === 'loading',
        error: null,
      }}>
        {children}
      </AuthContext.Provider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Helper to render with unauthenticated state
export const renderUnauthenticated = (ui: ReactElement, options: RenderOptions = {}) => {
  return customRender(ui, { ...options, initialAuthState: 'unauthenticated', user: null })
}

// Helper to render with loading state
export const renderLoading = (ui: ReactElement, options: RenderOptions = {}) => {
  return customRender(ui, { ...options, initialAuthState: 'loading', user: null })
}

// Helper to render with authenticated state (default)
export const renderAuthenticated = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  return customRender(ui, { ...options, initialAuthState: 'authenticated' })
}

// Wait for async operations to complete
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock router push function
export const mockRouterPush = vi.fn()
export const mockRouterReplace = vi.fn()
export const mockRouterBack = vi.fn()

// Mock router object
export const mockRouter = {
  push: mockRouterPush,
  replace: mockRouterReplace,
  back: mockRouterBack,
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
}

// Helper to create mock file
export const createMockFile = (name = 'test.pdf', type = 'application/pdf', size = 1024) => {
  const file = new File(['mock content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

// Helper to create mock audio blob
export const createMockAudioBlob = () => {
  return new Blob(['mock audio data'], { type: 'audio/wav' })
}

// Helper to simulate file drop event
export const createFileDropEvent = (files: File[]) => {
  return {
    dataTransfer: {
      files,
      items: files.map(file => ({
        kind: 'file',
        type: file.type,
        getAsFile: () => file,
      })),
      types: ['Files'],
    },
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  }
}

// Helper to simulate drag events
export const createDragEvent = (type: string) => {
  return {
    type,
    dataTransfer: {
      files: [],
      items: [],
      types: [],
    },
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  }
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { customRender as render }
export { mockUser }