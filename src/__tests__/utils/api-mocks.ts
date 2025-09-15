import { vi } from 'vitest'

// OpenAI API mocks
export const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify([
              {
                question: "What is the main topic of this document?",
                options: ["Option A", "Option B", "Option C", "Option D"],
                correctAnswer: 0
              }
            ])
          }
        }]
      })
    }
  },
  audio: {
    transcriptions: {
      create: vi.fn().mockResolvedValue({
        text: "Option A"
      })
    }
  }
}

// ElevenLabs API mocks
export const mockElevenLabs = {
  generate: vi.fn().mockResolvedValue({
    audio: new ArrayBuffer(1024), // Mock audio data
    url: 'https://example.com/audio.mp3'
  })
}

// PDF parser mock
export const mockPDFParse = vi.fn().mockResolvedValue({
  text: 'This is sample PDF content for testing purposes.'
})

// File reader mock
export const mockFileReader = {
  readAsArrayBuffer: vi.fn(),
  readAsText: vi.fn(),
  result: null,
  onload: null,
  onerror: null,
}

// Audio context mocks
export const mockAudioContext = {
  createMediaStreamSource: vi.fn(),
  createScriptProcessor: vi.fn(),
  createAnalyser: vi.fn(),
  close: vi.fn(),
  resume: vi.fn(),
  suspend: vi.fn(),
  state: 'running',
  sampleRate: 44100,
}

// Media recorder mocks
export const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  requestData: vi.fn(),
  state: 'inactive',
  ondataavailable: null,
  onstop: null,
  onerror: null,
}

// Web Speech API mocks
export const mockSpeechRecognition = {
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  onresult: null,
  onerror: null,
  onend: null,
}

// Mock MediaStream class
class MockMediaStream {
  constructor() {
    this.id = 'mock-stream-id'
    this.active = true
  }
  
  getTracks() { return [] }
  getAudioTracks() { return [] }
  getVideoTracks() { return [] }
  addTrack() {}
  removeTrack() {}
  clone() { return new MockMediaStream() }
}

// Setup global mocks
export const setupGlobalMocks = () => {
  // Mock OpenAI
  vi.mock('openai', () => ({
    default: vi.fn().mockImplementation(() => mockOpenAI)
  }))

  // Mock PDF parse
  vi.mock('pdf-parse', () => ({
    default: mockPDFParse
  }))

  // Mock MediaStream
  global.MediaStream = MockMediaStream as any

  // Mock File API
  global.FileReader = vi.fn().mockImplementation(() => mockFileReader)
  
  // Mock Audio API
  global.AudioContext = vi.fn().mockImplementation(() => mockAudioContext)
  global.webkitAudioContext = vi.fn().mockImplementation(() => mockAudioContext)
  
  // Mock MediaRecorder
  global.MediaRecorder = vi.fn().mockImplementation(() => mockMediaRecorder)
  
  // Mock getUserMedia
  global.navigator = global.navigator || {}
  global.navigator.mediaDevices = {
    getUserMedia: vi.fn().mockResolvedValue(new MockMediaStream()),
    enumerateDevices: vi.fn().mockResolvedValue([]),
  }

  // Mock Speech Recognition
  global.SpeechRecognition = vi.fn().mockImplementation(() => mockSpeechRecognition)
  global.webkitSpeechRecognition = vi.fn().mockImplementation(() => mockSpeechRecognition)

  // Mock fetch for API calls
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(''),
    blob: vi.fn().mockResolvedValue(new Blob()),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
  })

  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
  global.URL.revokeObjectURL = vi.fn()
}

// Reset all mocks
export const resetAllMocks = () => {
  vi.clearAllMocks()
  mockOpenAI.chat.completions.create.mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify([
          {
            question: "What is the main topic of this document?",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: 0
          }
        ])
      }
    }]
  })
  mockOpenAI.audio.transcriptions.create.mockResolvedValue({
    text: "Option A"
  })
  mockElevenLabs.generate.mockResolvedValue({
    audio: new ArrayBuffer(1024),
    url: 'https://example.com/audio.mp3'
  })
  mockPDFParse.mockResolvedValue({
    text: 'This is sample PDF content for testing purposes.'
  })
}