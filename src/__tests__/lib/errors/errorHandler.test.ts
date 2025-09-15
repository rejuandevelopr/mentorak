import { ErrorHandler, createError } from '@/lib/errors/errorHandler';
import { AppError, ErrorCodes } from '@/lib/errors/AppError';
import { FirebaseError } from 'firebase/app';
import { vi } from 'vitest';

// Mock console methods
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleGroup = vi.spyOn(console, 'group').mockImplementation(() => {});
const mockConsoleGroupEnd = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleError', () => {
    it('should return AppError as is', () => {
      const originalError = new AppError('Test', ErrorCodes.VALIDATION_ERROR, 'Test message');
      const result = ErrorHandler.handleError(originalError);
      
      expect(result).toBe(originalError);
    });

    it('should handle Firebase auth errors', () => {
      const firebaseError = new FirebaseError('auth/user-not-found', 'User not found');
      const result = ErrorHandler.handleError(firebaseError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe(ErrorCodes.INVALID_CREDENTIALS);
      expect(result.userMessage).toBe('Invalid email or password. Please try again.');
    });

    it('should handle Firebase permission denied errors', () => {
      const firebaseError = new FirebaseError('permission-denied', 'Permission denied');
      const result = ErrorHandler.handleError(firebaseError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe(ErrorCodes.PERMISSION_DENIED);
      expect(result.userMessage).toBe('You do not have permission to perform this action.');
    });

    it('should handle network errors', () => {
      const networkError = new Error('fetch failed');
      const result = ErrorHandler.handleError(networkError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe(ErrorCodes.NETWORK_ERROR);
      expect(result.userMessage).toBe('Unable to connect to the server. Please check your internet connection.');
    });

    it('should handle API errors with status codes', () => {
      const apiError = { status: 429, message: 'Rate limit exceeded' };
      const result = ErrorHandler.handleError(apiError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe(ErrorCodes.RATE_LIMIT);
      expect(result.userMessage).toBe('Too many requests. Please wait a moment and try again.');
    });

    it('should handle validation errors', () => {
      const validationError = new Error('Validation failed: email is required');
      const result = ErrorHandler.handleError(validationError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(result.userMessage).toBe('Please check your input and try again.');
    });

    it('should handle unknown errors', () => {
      const unknownError = 'Some string error';
      const result = ErrorHandler.handleError(unknownError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe(ErrorCodes.UNKNOWN_ERROR);
      expect(result.userMessage).toBe('An unexpected error occurred. Please try again.');
    });

    it('should include context in the error', () => {
      const context = { userId: '123', action: 'upload' };
      const error = new Error('Test error');
      const result = ErrorHandler.handleError(error, context);

      expect(result.context).toEqual(expect.objectContaining(context));
    });
  });

  describe('logError', () => {
    beforeEach(() => {
      // Set NODE_ENV to development for console logging
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    it('should log error to console in development', () => {
      const error = new AppError('Test', ErrorCodes.VALIDATION_ERROR, 'Test message');
      
      ErrorHandler.logError(error);

      expect(mockConsoleGroup).toHaveBeenCalledWith('🚨 MEDIUM ERROR: VALIDATION_ERROR');
      expect(mockConsoleError).toHaveBeenCalledWith('Message:', 'Test');
      expect(mockConsoleError).toHaveBeenCalledWith('User Message:', 'Test message');
      expect(mockConsoleGroupEnd).toHaveBeenCalled();
    });

    it('should include additional context in logs', () => {
      const errorContext = { userId: '123' };
      const error = new AppError('Test', ErrorCodes.VALIDATION_ERROR, 'Test message', 'medium', errorContext);
      const additionalContext = { requestId: 'abc123' };
      
      ErrorHandler.logError(error, additionalContext);

      expect(mockConsoleError).toHaveBeenCalledWith('Context:', errorContext);
    });
  });

  describe('createError utilities', () => {
    it('should create validation error', () => {
      const error = createError.validation('Invalid input', 'Please check your data');

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid input');
      expect(error.userMessage).toBe('Please check your data');
      expect(error.severity).toBe('low');
    });

    it('should create network error', () => {
      const error = createError.network('Connection failed');

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe(ErrorCodes.NETWORK_ERROR);
      expect(error.userMessage).toBe('Network connection failed. Please try again.');
      expect(error.severity).toBe('medium');
    });

    it('should create file upload error', () => {
      const error = createError.fileUpload('Upload failed', 'File too large');

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe(ErrorCodes.FILE_UPLOAD_FAILED);
      expect(error.userMessage).toBe('File too large');
      expect(error.severity).toBe('medium');
    });

    it('should create API quota error', () => {
      const error = createError.apiQuota('OpenAI');

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe(ErrorCodes.API_QUOTA_EXCEEDED);
      expect(error.userMessage).toBe('Service quota exceeded. Please contact support.');
      expect(error.severity).toBe('high');
    });

    it('should create rate limit error', () => {
      const error = createError.rateLimit('ElevenLabs');

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe(ErrorCodes.RATE_LIMIT);
      expect(error.userMessage).toBe('Too many requests. Please wait a moment and try again.');
      expect(error.severity).toBe('medium');
    });
  });
});