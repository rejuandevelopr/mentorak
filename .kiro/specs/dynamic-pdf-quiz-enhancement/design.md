# Design Document

## Overview

This design enhances the existing PDF quiz generation system to ensure dynamic content generation, improved user interface, and better navigation. The solution addresses three core issues: generic question generation, single-question pagination, and lack of navigation controls.

## Architecture

### Current System Analysis
- **API Endpoint**: `/api/pdf-openai-safe/route.ts` handles PDF processing and MCQ generation
- **Quiz Interface**: `/app/quiz-direct/page.tsx` displays questions one at a time
- **OpenAI Integration**: Uses GPT-4o-mini for text extraction and GPT-3.5-turbo for MCQ generation
- **Fallback System**: Generic questions based on filename when OpenAI fails

### Enhanced Architecture
The design maintains the existing API structure while improving content processing and UI presentation:

```
PDF Upload → Enhanced Text Processing → Improved MCQ Generation → Single-Page Quiz Interface
```

## Components and Interfaces

### 1. Enhanced PDF Text Processing

**Current Issue**: OpenAI text extraction may not be working properly, leading to fallback questions.

**Solution**: Implement a hybrid approach with better error handling and content validation.

```typescript
interface PDFProcessingResult {
  success: boolean;
  extractedText: string;
  textLength: number;
  processingMethod: 'openai-vision' | 'pdf-parse' | 'hybrid';
  contentQuality: 'high' | 'medium' | 'low';
}
```

**Implementation Strategy**:
- Primary: OpenAI Vision API for PDF text extraction
- Secondary: pdf-parse library as backup
- Validation: Ensure extracted text has sufficient content (minimum 200 characters)
- Content Quality Assessment: Analyze text complexity and topic diversity

### 2. Improved MCQ Generation

**Current Issue**: Questions are generic and not based on actual PDF content.

**Solution**: Enhanced OpenAI prompting with content validation and uniqueness checks.

```typescript
interface MCQGenerationRequest {
  extractedText: string;
  documentTitle: string;
  contentType: string;
  questionCount: 10;
  difficultyLevel: 'mixed';
}

interface GeneratedQuestion {
  id: string;
  text: string;
  options: string[4];
  correctAnswer: number;
  contentReference: string; // Which part of PDF this question relates to
  difficulty: 'easy' | 'medium' | 'hard';
}
```

**Enhanced OpenAI Prompt Strategy**:
- Analyze content structure and identify key concepts
- Generate questions that reference specific facts, concepts, or sections
- Ensure question diversity across different parts of the document
- Include content validation to verify questions are answerable from the text

### 3. Single-Page Quiz Interface

**Current Issue**: Questions are displayed one at a time with page navigation.

**Solution**: Display all 10 questions on a single scrollable page with in-page navigation.

```typescript
interface QuizPageState {
  questions: GeneratedQuestion[];
  currentQuestionIndex: number;
  answers: (number | null)[];
  isComplete: boolean;
  canNavigateBack: boolean;
}
```

**UI Components**:
- **Question Grid**: All 10 questions visible with scroll navigation
- **Progress Sidebar**: Shows completion status for each question
- **Navigation Controls**: Previous/Next buttons and question jump links
- **Cancel Button**: Always visible "Back to Dashboard" option

### 4. Enhanced Navigation System

**New Component**: Navigation header with progress and controls

```typescript
interface QuizNavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  completedQuestions: boolean[];
  onQuestionJump: (index: number) => void;
  onCancel: () => void;
}
```

## Data Models

### Enhanced Quiz Model

```typescript
interface EnhancedQuiz {
  id: string;
  title: string;
  sourceDocument: string;
  questions: GeneratedQuestion[];
  totalQuestions: 10; // Always 10
  generationMetadata: {
    processingMethod: string;
    textLength: number;
    contentQuality: string;
    generatedAt: Date;
  };
  userProgress: {
    answers: (number | null)[];
    currentQuestion: number;
    startedAt: Date;
    completedAt?: Date;
  };
}
```

### Question Validation Model

```typescript
interface QuestionValidation {
  isContentBased: boolean;
  hasSpecificReferences: boolean;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  topicCoverage: string[];
}
```

## Error Handling

### PDF Processing Errors
1. **Invalid File**: Clear error message with file requirements
2. **Text Extraction Failure**: Attempt multiple methods before fallback
3. **Insufficient Content**: Specific error for PDFs with too little text
4. **OpenAI API Errors**: Graceful degradation with retry logic

### MCQ Generation Errors
1. **Content Validation**: Verify questions reference actual PDF content
2. **Format Validation**: Ensure proper JSON structure and question format
3. **Quality Checks**: Validate question uniqueness and difficulty distribution
4. **Fallback Prevention**: Only use generic questions as absolute last resort

### UI Error States
1. **Loading States**: Clear progress indicators during processing
2. **Network Errors**: Offline handling and retry options
3. **Navigation Errors**: Prevent data loss during navigation
4. **Session Management**: Handle browser refresh and back button

## Testing Strategy

### Content Generation Testing
1. **PDF Variety Tests**: Test with different document types (academic, business, technical)
2. **Content Validation**: Verify questions are actually based on PDF content
3. **Uniqueness Tests**: Ensure different PDFs generate different questions
4. **Quality Metrics**: Measure question relevance and difficulty distribution

### UI/UX Testing
1. **Single Page Navigation**: Test scrolling and question jumping
2. **Progress Tracking**: Verify progress indicators update correctly
3. **Cancel Functionality**: Test navigation back to dashboard
4. **Responsive Design**: Ensure interface works on different screen sizes

### Integration Testing
1. **End-to-End Flow**: PDF upload → processing → quiz display → completion
2. **Error Scenarios**: Test all failure modes and recovery paths
3. **Performance Testing**: Measure processing time and UI responsiveness
4. **Cross-Browser Testing**: Ensure compatibility across browsers

## Implementation Approach

### Phase 1: Enhanced PDF Processing
- Improve text extraction reliability
- Add content quality validation
- Implement hybrid processing approach

### Phase 2: MCQ Generation Improvement
- Enhance OpenAI prompts for content-specific questions
- Add question validation and quality checks
- Implement content reference tracking

### Phase 3: Single-Page Quiz Interface
- Redesign quiz page to show all questions
- Add in-page navigation and progress tracking
- Implement cancel/back to dashboard functionality

### Phase 4: Testing and Optimization
- Comprehensive testing across different PDF types
- Performance optimization
- User experience refinements

## Technical Considerations

### Performance
- **Text Processing**: Optimize for large PDFs (chunking if needed)
- **UI Rendering**: Efficient rendering of 10 questions simultaneously
- **Memory Management**: Handle large documents without memory issues

### Security
- **File Validation**: Strict PDF file type and size validation
- **Content Sanitization**: Clean extracted text before processing
- **API Rate Limiting**: Prevent abuse of OpenAI API calls

### Scalability
- **Caching Strategy**: Cache processed results for repeated uploads
- **Error Recovery**: Robust fallback mechanisms
- **Monitoring**: Track success rates and processing times