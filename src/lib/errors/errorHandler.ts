import { AppError, ErrorCodes } from './AppError';
import { FirebaseError } from 'firebase/app';

/**
 * Central error handler that converts various error types to AppError
 */
export class ErrorHandler {
  /**
   * Convert any error to AppError with appropriate user message
   */
  static handleError(error: unknown, context?: Record<string, any>): AppError {
    // If it's already an AppError, return as is
    if (error instanceof AppError) {
      return error;
    }

    // Handle Firebase errors
    if (error instanceof FirebaseError) {
      return this.handleFirebaseError(error, context);
    }

    // Handle network errors
    if (this.isNetworkError(error)) {
      return new AppError(
        'Network request failed',
        ErrorCodes.NETWORK_ERROR,
        'Unable to connect to the server. Please check your internet connection.',
        'medium',
        context
      );
    }

    // Handle API errors (OpenAI, ElevenLabs)
    if (this.isAPIError(error)) {
      return this.handleAPIError(error, context);
    }

    // Handle validation errors
    if (this.isValidationError(error)) {
      return new AppError(
        (error as Error).message || 'Validation failed',
        ErrorCodes.VALIDATION_ERROR,
        'Please check your input and try again.',
        'low',
        context
      );
    }

    // Handle generic Error objects
    if (error instanceof Error) {
      return new AppError(
        error.message,
        ErrorCodes.UNKNOWN_ERROR,
        'An unexpected error occurred. Please try again.',
        'medium',
        { ...context, originalError: error.name }
      );
    }

    // Handle unknown error types
    return new AppError(
      'Unknown error occurred',
      ErrorCodes.UNKNOWN_ERROR,
      'An unexpected error occurred. Please try again.',
      'medium',
      { ...context, errorType: typeof error }
    );
  }

  /**
   * Handle Firebase-specific errors
   */
  private static handleFirebaseError(error: FirebaseError, context?: Record<string, any>): AppError {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return new AppError(
          'Invalid credentials',
          ErrorCodes.INVALID_CREDENTIALS,
          'Invalid email or password. Please try again.',
          'low',
          context
        );

      case 'auth/email-already-in-use':
        return new AppError(
          'Email already exists',
          ErrorCodes.EMAIL_ALREADY_EXISTS,
          'An account with this email already exists. Please sign in instead.',
          'low',
          context
        );

      case 'auth/weak-password':
        return new AppError(
          'Password too weak',
          ErrorCodes.WEAK_PASSWORD,
          'Password should be at least 6 characters long.',
          'low',
          context
        );

      case 'auth/user-disabled':
        return new AppError(
          'Account disabled',
          ErrorCodes.UNAUTHENTICATED,
          'Your account has been disabled. Please contact support.',
          'high',
          context
        );

      case 'permission-denied':
        return new AppError(
          'Permission denied',
          ErrorCodes.PERMISSION_DENIED,
          'You do not have permission to perform this action.',
          'medium',
          context
        );

      case 'not-found':
        return new AppError(
          'Document not found',
          ErrorCodes.NOT_FOUND,
          'The requested data could not be found.',
          'low',
          context
        );

      case 'unavailable':
        return new AppError(
          'Service unavailable',
          ErrorCodes.SERVICE_UNAVAILABLE,
          'The service is temporarily unavailable. Please try again later.',
          'high',
          context
        );

      default:
        return new AppError(
          `Firebase error: ${error.message}`,
          ErrorCodes.UNKNOWN_ERROR,
          'A service error occurred. Please try again.',
          'medium',
          { ...context, firebaseCode: error.code }
        );
    }
  }

  /**
   * Handle API errors from external services
   */
  private static handleAPIError(error: any, context?: Record<string, any>): AppError {
    const status = error.status || error.response?.status;
    const message = error.message || error.response?.data?.message || 'API request failed';

    switch (status) {
      case 401:
        return new AppError(
          'API authentication failed',
          ErrorCodes.API_KEY_INVALID,
          'Service configuration error. Please contact support.',
          'critical',
          context
        );

      case 429:
        return new AppError(
          'Rate limit exceeded',
          ErrorCodes.RATE_LIMIT,
          'Too many requests. Please wait a moment and try again.',
          'medium',
          context
        );

      case 402:
      case 403:
        return new AppError(
          'API quota exceeded',
          ErrorCodes.API_QUOTA_EXCEEDED,
          'Service quota exceeded. Please contact support.',
          'high',
          context
        );

      case 500:
      case 502:
      case 503:
      case 504:
        return new AppError(
          'Service error',
          ErrorCodes.SERVICE_UNAVAILABLE,
          'The service is temporarily unavailable. Please try again later.',
          'high',
          context
        );

      default:
        return new AppError(
          `API error: ${message}`,
          ErrorCodes.UNKNOWN_ERROR,
          'A service error occurred. Please try again.',
          'medium',
          { ...context, apiStatus: status }
        );
    }
  }

  /**
   * Check if error is a network-related error
   */
  private static isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const networkIndicators = [
      'network error',
      'fetch failed',
      'connection refused',
      'timeout',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT'
    ];

    const errorString = (error.message || error.toString()).toLowerCase();
    return networkIndicators.some(indicator => errorString.includes(indicator));
  }

  /**
   * Check if error is an API error
   */
  private static isAPIError(error: any): boolean {
    return error && (
      typeof error.status === 'number' ||
      (error.response && typeof error.response.status === 'number')
    );
  }

  /**
   * Check if error is a validation error
   */
  private static isValidationError(error: any): boolean {
    if (!error) return false;
    
    const validationIndicators = [
      'validation',
      'invalid',
      'required',
      'must be',
      'should be'
    ];

    const errorString = (error.message || error.toString()).toLowerCase();
    return validationIndicators.some(indicator => errorString.includes(indicator));
  }

  /**
   * Log error for debugging and monitoring
   */
  static logError(error: AppError, additionalContext?: Record<string, any>): void {
    const logData = {
      ...error.toJSON(),
      ...additionalContext,
    };

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${error.severity.toUpperCase()} ERROR: ${error.code}`);
      console.error('Message:', error.message);
      console.error('User Message:', error.userMessage);
      console.error('Context:', error.context);
      console.error('Stack:', error.stack);
      console.groupEnd();
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production' && error.shouldReport()) {
      // TODO: Integrate with monitoring service (Sentry, LogRocket, etc.)
      console.error('Error to report:', logData);
    }
  }
}

/**
 * Utility function to create specific error types
 */
export const createError = {
  validation: (message: string, userMessage?: string, context?: Record<string, any>) =>
    new AppError(message, ErrorCodes.VALIDATION_ERROR, userMessage || message, 'low', context),

  network: (message: string, context?: Record<string, any>) =>
    new AppError(message, ErrorCodes.NETWORK_ERROR, 'Network connection failed. Please try again.', 'medium', context),

  fileUpload: (message: string, userMessage: string, context?: Record<string, any>) =>
    new AppError(message, ErrorCodes.FILE_UPLOAD_FAILED, userMessage, 'medium', context),

  apiQuota: (service: string, context?: Record<string, any>) =>
    new AppError(
      `${service} quota exceeded`,
      ErrorCodes.API_QUOTA_EXCEEDED,
      'Service quota exceeded. Please contact support.',
      'high',
      context
    ),

  rateLimit: (service: string, context?: Record<string, any>) =>
    new AppError(
      `${service} rate limit exceeded`,
      ErrorCodes.RATE_LIMIT,
      'Too many requests. Please wait a moment and try again.',
      'medium',
      context
    ),
};