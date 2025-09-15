# Implementation Plan

- [x] 1. Create clean PDF upload and MCQ generation API endpoint





  - Replace the existing `/api/generate-quiz/route.ts` with a simplified, robust implementation
  - Ensure all error responses return JSON format with proper Content-Type headers
  - Remove complex error handling layers that may cause HTML responses
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.3_

- [x] 2. Implement reliable PDF text extraction





  - Create a focused PDF processing function using pdf-parse library
  - Add proper validation for file type, size, and content
  - Handle edge cases like empty PDFs, password-protected files, and corrupted files
  - Return structured error responses for all failure scenarios
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3, 5.4_

- [x] 3. Implement OpenAI MCQ generation with error handling





  - Create a clean OpenAI integration that generates exactly 5 MCQs
  - Validate OpenAI response format and handle non-JSON responses
  - Ensure questions have proper structure with 4 options and correct answer index
  - Add retry logic for OpenAI API failures
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Ensure consistent JSON response format








  - Implement response formatting that always returns JSON
  - Create success response format: { quiz: [...] }
  - Create error response format: { error: "message" }
  - Add proper Content-Type headers to all responses
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Test the complete flow end-to-end





  - Write integration tests for successful PDF upload and quiz generation
  - Test error scenarios: invalid files, OpenAI failures, network issues
  - Verify all responses are valid JSON format
  - Ensure compatibility with existing frontend code
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2_