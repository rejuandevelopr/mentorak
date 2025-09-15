/**
 * Custom error class for consistent error management across the application
 */
export class AppError extends Error {
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    public readonly code: string,
    public readonly userMessage: string,
    public readonly severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.timestamp = new Date();
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Convert error to a serializable object for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      userMessage: this.userMessage,
      severity: this.severity,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }

  /**
   * Check if error should be retried
   */
  isRetryable(): boolean {
    const retryableCodes = [
      'NETWORK_ERROR',
      'SERVICE_UNAVAILABLE',
      'RATE_LIMIT',
      'TIMEOUT',
      'CONNECTION_ERROR'
    ];
    return retryableCodes.includes(this.code);
  }

  /**
   * Check if error should be reported to monitoring service
   */
  shouldReport(): boolean {
    const nonReportableCodes = [
      'VALIDATION_ERROR',
      'INVALID_INPUT',
      'PERMISSION_DENIED',
      'NOT_FOUND'
    ];
    return !nonReportableCodes.includes(this.code) || this.severity === 'critical';
  }
}

/**
 * Error codes used throughout the application
 */
export const ErrorCodes = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  
  // File upload errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  PDF_PARSING_FAILED: 'PDF_PARSING_FAILED',
  
  // API errors
  RATE_LIMIT: 'RATE_LIMIT',
  API_KEY_INVALID: 'API_KEY_INVALID',
  API_QUOTA_EXCEEDED: 'API_QUOTA_EXCEEDED',
  MCQ_GENERATION_FAILED: 'MCQ_GENERATION_FAILED',
  TTS_GENERATION_FAILED: 'TTS_GENERATION_FAILED',
  VOICE_RECOGNITION_FAILED: 'VOICE_RECOGNITION_FAILED',
  
  // Database errors
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NOT_FOUND: 'NOT_FOUND',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATA_VALIDATION_ERROR: 'DATA_VALIDATION_ERROR',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];