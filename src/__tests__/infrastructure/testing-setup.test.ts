import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { renderAuthenticated, renderUnauthenticated, renderLoading, mockUser } from '../utils/test-utils'
import { setupGlobalMocks, resetAllMocks, mockOpenAI, mockElevenLabs } from '../utils/api-mocks'
import { createTestUser, createTestQuiz } from '../utils/firebase-test-utils'

// Simple test component
const TestComponent = () => {
  return React.createElement('div', { 'data-testid': 'test-component' }, 'Test Component')
}

describe('Testing Infrastructure', () => {
  describe('Test Utils', () => {
    it('should render components with authenticated state', () => {
      renderAuthenticated(React.createElement(TestComponent))
      expect(screen.getByTestId('test-component')).toBeInTheDocument()
    })

    it('should render components with unauthenticated state', () => {
      renderUnauthenticated(React.createElement(TestComponent))
      expect(screen.getByTestId('test-component')).toBeInTheDocument()
    })

    it('should render components with loading state', () => {
      renderLoading(React.createElement(TestComponent))
      expect(screen.getByTestId('test-component')).toBeInTheDocument()
    })

    it('should provide mock user data', () => {
      expect(mockUser).toHaveProperty('uid', 'test-user-123')
      expect(mockUser).toHaveProperty('email', 'test@example.com')
      expect(mockUser).toHaveProperty('displayName', 'Test User')
    })
  })

  describe('API Mocks', () => {
    it('should mock OpenAI API calls', async () => {
      const response = await mockOpenAI.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'test' }],
      })

      expect(response.choices[0].message.content).toBeDefined()
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled()
    })

    it('should mock OpenAI Whisper API calls', async () => {
      const response = await mockOpenAI.audio.transcriptions.create({
        file: new File([''], 'test.wav'),
        model: 'whisper-1',
      })

      expect(response.text).toBe('Option A')
      expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalled()
    })

    it('should mock ElevenLabs API calls', async () => {
      const response = await mockElevenLabs.generate('test text')

      expect(response.audio).toBeInstanceOf(ArrayBuffer)
      expect(response.url).toBe('https://example.com/audio.mp3')
      expect(mockElevenLabs.generate).toHaveBeenCalledWith('test text')
    })

    it('should reset mocks properly', () => {
      // Reset mocks first to ensure clean state
      resetAllMocks()
      
      // Call a mock function
      mockOpenAI.chat.completions.create({})
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1)

      // Reset mocks again
      resetAllMocks()
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(0)
    })
  })

  describe('Firebase Test Utils', () => {
    it('should create test user data', () => {
      const user = createTestUser()
      
      expect(user).toHaveProperty('uid', 'test-user-123')
      expect(user).toHaveProperty('email', 'test@example.com')
      expect(user).toHaveProperty('displayName', 'Test User')
      expect(user).toHaveProperty('createdAt')
      expect(user).toHaveProperty('lastLoginAt')
    })

    it('should create test user with overrides', () => {
      const user = createTestUser({ 
        uid: 'custom-uid',
        email: 'custom@example.com' 
      })
      
      expect(user.uid).toBe('custom-uid')
      expect(user.email).toBe('custom@example.com')
      expect(user.displayName).toBe('Test User') // Default value
    })

    it('should create test quiz data', () => {
      const quiz = createTestQuiz()
      
      expect(quiz).toHaveProperty('id', 'test-quiz-123')
      expect(quiz).toHaveProperty('userId', 'test-user-123')
      expect(quiz).toHaveProperty('title', 'Test Quiz')
      expect(quiz).toHaveProperty('score', 8)
      expect(quiz).toHaveProperty('totalQuestions', 10)
      expect(quiz.questions).toHaveLength(2)
      expect(quiz.responses).toHaveLength(2)
      expect(quiz.status).toBe('completed')
    })

    it('should create test quiz with overrides', () => {
      const quiz = createTestQuiz({
        title: 'Custom Quiz',
        score: 5,
        totalQuestions: 5,
      })
      
      expect(quiz.title).toBe('Custom Quiz')
      expect(quiz.score).toBe(5)
      expect(quiz.totalQuestions).toBe(5)
      expect(quiz.id).toBe('test-quiz-123') // Default value
    })
  })

  describe('Global Mocks', () => {
    it('should mock FileReader', () => {
      expect(global.FileReader).toBeDefined()
      const reader = new FileReader()
      expect(reader.readAsArrayBuffer).toBeDefined()
      expect(reader.readAsText).toBeDefined()
    })

    it('should mock AudioContext', () => {
      expect(global.AudioContext).toBeDefined()
      const context = new AudioContext()
      expect(context.createMediaStreamSource).toBeDefined()
      expect(context.createScriptProcessor).toBeDefined()
      expect(context.state).toBe('running')
    })

    it('should mock MediaRecorder', () => {
      expect(global.MediaRecorder).toBeDefined()
      const recorder = new MediaRecorder(new MediaStream())
      expect(recorder.start).toBeDefined()
      expect(recorder.stop).toBeDefined()
      expect(recorder.state).toBe('inactive')
    })

    it('should mock getUserMedia', async () => {
      expect(global.navigator.mediaDevices.getUserMedia).toBeDefined()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      expect(stream).toBeInstanceOf(MediaStream)
    })

    it('should mock SpeechRecognition', () => {
      expect(global.SpeechRecognition).toBeDefined()
      const recognition = new SpeechRecognition()
      expect(recognition.start).toBeDefined()
      expect(recognition.stop).toBeDefined()
    })

    it('should mock fetch', async () => {
      const response = await fetch('https://api.example.com/test')
      expect(response.ok).toBe(true)
      expect(response.json).toBeDefined()
      expect(response.text).toBeDefined()
    })

    it('should mock URL methods', () => {
      expect(global.URL.createObjectURL).toBeDefined()
      expect(global.URL.revokeObjectURL).toBeDefined()
      
      const url = URL.createObjectURL(new Blob())
      expect(url).toBe('blob:mock-url')
    })
  })

  describe('Environment Setup', () => {
    it('should have jsdom environment', () => {
      expect(typeof window).toBe('object')
      expect(typeof document).toBe('object')
      expect(typeof localStorage).toBe('object')
    })

    it('should have testing library matchers', () => {
      const element = document.createElement('div')
      element.textContent = 'test'
      document.body.appendChild(element)
      
      expect(element).toBeInTheDocument()
      expect(element).toHaveTextContent('test')
    })

    it('should have vitest globals', () => {
      expect(typeof describe).toBe('function')
      expect(typeof it).toBe('function')
      expect(typeof expect).toBe('function')
      expect(typeof vi).toBe('object')
    })
  })
})