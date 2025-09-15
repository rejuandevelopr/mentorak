# Requirements Document

## Introduction

This specification outlines the transformation of Mentorak from a feature prototype into a complete product. The enhanced version will include user authentication, a comprehensive dashboard, quiz history management, and a public landing page, while maintaining the core PDF-to-voice-quiz functionality.

## Dependencies

- Next.js 14 with App Router
- Firebase Auth + Firestore
- OpenAI API (GPT-4 or GPT-4o for MCQ + Whisper for voice)
- ElevenLabs API (Text-to-Speech)
- Tailwind CSS for styling
- React Hook Form for input handling

## Requirements

### Requirement 1: User Authentication System

**User Story:** As a user, I want to create an account and log in securely, so that I can save my quiz history and access personalized features.

#### Acceptance Criteria

1. WHEN a new user visits the signup page THEN the system SHALL provide email/password registration using Firebase Auth
2. WHEN a user provides valid credentials during signup THEN the system SHALL create a new user account and redirect to dashboard
3. WHEN an existing user visits the login page THEN the system SHALL authenticate using Firebase Auth
4. WHEN a user provides invalid credentials THEN the system SHALL display appropriate error messages
5. WHEN a user is authenticated THEN the system SHALL maintain session state across page refreshes
6. WHEN a user logs out THEN the system SHALL clear authentication state and redirect to landing page

### Requirement 2: Public Landing Page

**User Story:** As a potential user, I want to understand what Mentorak offers and see a demo, so that I can decide whether to sign up.

#### Acceptance Criteria

1. WHEN an unauthenticated user visits the root URL THEN the system SHALL display a public landing page
2. WHEN viewing the landing page THEN the system SHALL show a hero section with compelling product description
3. WHEN viewing the landing page THEN the system SHALL display key features: PDF upload, MCQ generation, and voice interaction
4. WHEN viewing the landing page THEN the system SHALL include a demo preview or example of the quiz flow
5. WHEN a user clicks the CTA button THEN the system SHALL redirect to the signup page
6. WHEN viewing the landing page THEN the system SHALL include footer with links and contact information

### Requirement 3: User Dashboard

**User Story:** As an authenticated user, I want a central dashboard to see my quiz history and quick actions, so that I can easily manage my learning activities.

#### Acceptance Criteria

1. WHEN an authenticated user visits the dashboard THEN the system SHALL display a personalized welcome message
2. WHEN viewing the dashboard THEN the system SHALL show recent quiz history with scores and dates
3. WHEN viewing the dashboard THEN the system SHALL provide quick action buttons for uploading new PDFs
4. WHEN viewing the dashboard THEN the system SHALL display summary statistics (total quizzes, average score)
5. WHEN a user clicks on a quiz from history THEN the system SHALL navigate to detailed results view
6. WHEN an unauthenticated user tries to access dashboard THEN the system SHALL redirect to login page

### Requirement 4: Quiz Upload & MCQ Generation

**User Story:** As an authenticated user, I want to upload PDFs and generate quizzes that are saved to my account, so that I can track my learning progress.

#### Acceptance Criteria

1. WHEN a user uploads a PDF THEN the system SHALL save the quiz session to their Firestore profile
2. WHEN generating MCQs THEN the system SHALL store questions, options, and correct answers in the database
3. WHEN a quiz is completed THEN the system SHALL save the user's responses and calculate score
4. WHEN saving quiz data THEN the system SHALL include timestamp, PDF title, and performance metrics
5. WHEN a quiz fails to generate THEN the system SHALL provide clear error feedback without saving incomplete data

### Requirement 5: Quiz History Management

**User Story:** As a user, I want to view all my past quizzes with scores and dates, so that I can track my learning progress over time.

#### Acceptance Criteria

1. WHEN a user visits the history page THEN the system SHALL display a table of all past quizzes
2. WHEN viewing quiz history THEN the system SHALL show quiz title, date taken, score, and total questions
3. WHEN a user clicks on a specific quiz THEN the system SHALL navigate to detailed results view
4. WHEN viewing history THEN the system SHALL sort quizzes by most recent first
5. WHEN no quizzes exist THEN the system SHALL display an empty state with CTA to create first quiz

### Requirement 6: Detailed Results View

**User Story:** As a user, I want to review detailed results of any past quiz, so that I can understand what I got right or wrong and learn from mistakes.

#### Acceptance Criteria

1. WHEN viewing a quiz result THEN the system SHALL display overall score and percentage
2. WHEN viewing results THEN the system SHALL show each question with user's answer and correct answer
3. WHEN viewing results THEN the system SHALL highlight correct answers in green and incorrect in red
4. WHEN viewing results THEN the system SHALL provide voice feedback option for reviewing questions
5. WHEN viewing results THEN the system SHALL include option to retake the same quiz
6. WHEN accessing a non-existent quiz result THEN the system SHALL display 404 error

### Requirement 7: Route Protection & Auth Guard

**User Story:** As a system administrator, I want to ensure that authenticated features are only accessible to logged-in users, so that user data remains secure.

#### Acceptance Criteria

1. WHEN an unauthenticated user tries to access protected routes THEN the system SHALL redirect to login page
2. WHEN authentication state changes THEN the system SHALL update route access permissions immediately
3. WHEN a user's session expires THEN the system SHALL redirect to login and clear local state
4. WHEN navigation occurs THEN the system SHALL verify authentication status before rendering protected content

### Requirement 8: Firebase Auth + Firestore Integration

**User Story:** As a developer, I want robust Firebase integration for authentication and data storage, so that the application can scale and maintain user data reliably.

#### Acceptance Criteria

1. WHEN the application initializes THEN the system SHALL configure Firebase Auth and Firestore
2. WHEN storing quiz data THEN the system SHALL use the structure: users/{uid}/quizzes/{quizId}
3. WHEN a user creates an account THEN the system SHALL initialize their Firestore user document
4. WHEN database operations fail THEN the system SHALL provide appropriate error handling and user feedback
5. WHEN offline THEN the system SHALL handle Firebase connection issues gracefully
6. WHEN storing quiz data THEN all quiz sessions SHALL be stored under `users/{uid}/quizzes/{quizId}`
7. WHEN creating quiz documents THEN each SHALL contain: `questions`, `responses`, `score`, `createdAt`, `title`

### Requirement 9: Voice-Based Quiz Engine

**User Story:** As a user, I want my voice quiz sessions to be saved and retrievable, so that I can review my performance and retake quizzes.

#### Acceptance Criteria

1. WHEN starting a voice quiz THEN the system SHALL create a new quiz session in the database
2. WHEN answering questions via voice THEN the system SHALL save responses in real-time
3. WHEN completing a quiz THEN the system SHALL calculate and save final score
4. WHEN quiz session is interrupted THEN the system SHALL allow resuming from last answered question
5. WHEN voice recognition fails THEN the system SHALL provide fallback text input option