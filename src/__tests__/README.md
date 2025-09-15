# Testing Documentation

This document provides an overview of the comprehensive testing suite implemented for the Mentorak v2 application.

## Testing Infrastructure

### Test Framework
- **Vitest**: Modern test runner with excellent TypeScript support
- **React Testing Library**: Component testing utilities
- **Playwright**: End-to-end testing framework
- **Firebase Emulator**: Local Firebase testing environment

### Test Categories

#### 1. Unit Tests
- **Location**: `src/__tests__/`
- **Purpose**: Test individual functions, hooks, and components in isolation
- **Coverage**: Utility functions, custom hooks, error handling, data models

#### 2. Component Tests
- **Location**: `src/__tests__/components/`
- **Purpose**: Test React components with proper rendering and user interactions
- **Coverage**: UI components, forms, navigation, dashboard elements

#### 3. Integration Tests
- **Location**: `src/__tests__/integration/`
- **Purpose**: Test complete user flows and component interactions
- **Coverage**: Authentication flow, quiz generation, voice interactions

#### 4. End-to-End Tests
- **Location**: `src/__tests__/e2e/`
- **Purpose**: Test complete application workflows in a real browser
- **Coverage**: Landing page, user journeys, responsive design

## Test Utilities

### Firebase Test Utils (`firebase-test-utils.ts`)
- Firebase emulator setup and teardown
- Test data factories for users, quizzes, and questions
- Mock Firestore operations

### API Mocks (`api-mocks.ts`)
- OpenAI API mocking (GPT-4 and Whisper)
- ElevenLabs TTS API mocking
- PDF parsing mocks
- Web APIs (MediaRecorder, SpeechRecognition, etc.)

### React Test Utils (`test-utils.tsx`)
- Custom render functions with authentication contexts
- Mock user objects and authentication states
- Helper functions for file uploads and events

## Running Tests

### All Tests
```bash
npm test                    # Run tests in watch mode
npm run test:run           # Run tests once
```

### Specific Test Types
```bash
npm run test:coverage      # Run with coverage report
npm run test:integration   # Run integration tests only
npm run test:e2e          # Run end-to-end tests
```

### Firebase Emulator Tests
```bash
npm run firebase:emulators # Start Firebase emulators
npm run test:integration   # Run integration tests with emulators
```

## Test Configuration

### Vitest Config (`vitest.config.ts`)
- JSdom environment for React components
- Path aliases for imports
- Coverage thresholds (80% minimum)
- Global test setup

### Coverage Settings
- **Minimum Coverage**: 80% for branches, functions, lines, and statements
- **Excluded Files**: Test files, config files, type definitions
- **Reports**: Text, JSON, and HTML formats

### Firebase Emulator Config (`firebase.json`)
- Auth emulator on port 9099
- Firestore emulator on port 8080
- UI dashboard on port 4000

## Test Structure

### Infrastructure Tests
- Verify testing setup is working correctly
- Test mock functions and utilities
- Validate Firebase emulator integration

### Authentication Flow Tests
- Login and signup forms
- Authentication state management
- Route protection and navigation

### Quiz Flow Tests
- PDF upload and processing
- MCQ generation from content
- Voice-enabled quiz sessions
- Results and scoring

### Component Tests
- Individual component rendering
- User interaction handling
- Props and state management
- Error boundary behavior

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Mocking Strategy
- Mock external APIs and services
- Use real Firebase emulator for database tests
- Mock browser APIs (MediaRecorder, SpeechRecognition)

### Data Management
- Use test data factories for consistent test data
- Clean up test data between tests
- Reset mocks before each test

### Async Testing
- Use proper async/await patterns
- Wait for DOM updates with waitFor
- Handle loading states in tests

## Coverage Goals

The testing suite aims to achieve:
- **80%+ code coverage** across all metrics
- **Complete user journey coverage** through E2E tests
- **API integration testing** with proper mocking
- **Error handling verification** for all critical paths
- **Accessibility compliance** in component tests

## Continuous Integration

Tests are configured to run in CI environments with:
- Headless browser testing
- Firebase emulator setup
- Coverage reporting
- Test result artifacts

## Troubleshooting

### Common Issues
1. **Firebase Emulator Connection**: Ensure emulators are running before integration tests
2. **React Act Warnings**: Wrap state updates in act() for cleaner test output
3. **Module Resolution**: Check path aliases in vitest.config.ts
4. **Mock Cleanup**: Ensure mocks are reset between tests

### Debug Commands
```bash
npm run test:ui           # Open Vitest UI for debugging
npm run test:coverage     # Generate detailed coverage report
npm run firebase:emulators # Start emulators for manual testing
```

## Future Enhancements

- Visual regression testing with Playwright
- Performance testing for quiz generation
- Accessibility testing automation
- Cross-browser compatibility testing
- Mobile device testing with Playwright