import { AppError, ErrorCodes } from '@/lib/errors/AppError';

describe('AppError', () => {
  it('should create an error with all properties', () => {
    const context = { userId: '123', action: 'upload' };
    const error = new AppError(
      'Test error message',
      ErrorCodes.VALIDATION_ERROR,
      'User friendly message',
      'high',
      context
    );

    expect(error.message).toBe('Test error message');
    expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    expect(error.userMessage).toBe('User friendly message');
    expect(error.severity).toBe('high');
    expect(error.context).toEqual(context);
    expect(error.timestamp).toBeInstanceOf(Date);
    expect(error.name).toBe('AppError');
  });

  it('should use default severity when not provided', () => {
    const error = new AppError(
      'Test message',
      ErrorCodes.UNKNOWN_ERROR,
      'User message'
    );

    expect(error.severity).toBe('medium');
  });

  it('should serialize to JSON correctly', () => {
    const context = { test: 'value' };
    const error = new AppError(
      'Test message',
      ErrorCodes.NETWORK_ERROR,
      'Network failed',
      'high',
      context
    );

    const json = error.toJSON();

    expect(json.name).toBe('AppError');
    expect(json.message).toBe('Test message');
    expect(json.code).toBe(ErrorCodes.NETWORK_ERROR);
    expect(json.userMessage).toBe('Network failed');
    expect(json.severity).toBe('high');
    expect(json.context).toEqual(context);
    expect(json.timestamp).toBeDefined();
    expect(json.stack).toBeDefined();
  });

  describe('isRetryable', () => {
    it('should return true for retryable error codes', () => {
      const retryableCodes = [
        ErrorCodes.NETWORK_ERROR,
        ErrorCodes.SERVICE_UNAVAILABLE,
        ErrorCodes.RATE_LIMIT,
      ];

      retryableCodes.forEach(code => {
        const error = new AppError('Test', code, 'Test message');
        expect(error.isRetryable()).toBe(true);
      });
    });

    it('should return false for non-retryable error codes', () => {
      const nonRetryableCodes = [
        ErrorCodes.VALIDATION_ERROR,
        ErrorCodes.PERMISSION_DENIED,
        ErrorCodes.INVALID_CREDENTIALS,
      ];

      nonRetryableCodes.forEach(code => {
        const error = new AppError('Test', code, 'Test message');
        expect(error.isRetryable()).toBe(false);
      });
    });
  });

  describe('shouldReport', () => {
    it('should return false for non-reportable error codes', () => {
      const nonReportableCodes = [
        ErrorCodes.VALIDATION_ERROR,
        ErrorCodes.INVALID_INPUT,
        ErrorCodes.PERMISSION_DENIED,
        ErrorCodes.NOT_FOUND,
      ];

      nonReportableCodes.forEach(code => {
        const error = new AppError('Test', code, 'Test message');
        expect(error.shouldReport()).toBe(false);
      });
    });

    it('should return true for reportable error codes', () => {
      const reportableCodes = [
        ErrorCodes.UNKNOWN_ERROR,
        ErrorCodes.SERVICE_UNAVAILABLE,
        ErrorCodes.API_KEY_INVALID,
      ];

      reportableCodes.forEach(code => {
        const error = new AppError('Test', code, 'Test message');
        expect(error.shouldReport()).toBe(true);
      });
    });

    it('should return true for critical errors regardless of code', () => {
      const error = new AppError(
        'Test',
        ErrorCodes.VALIDATION_ERROR,
        'Test message',
        'critical'
      );

      expect(error.shouldReport()).toBe(true);
    });
  });
});