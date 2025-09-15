import { withRetry, withAPIRetry, CircuitBreaker, circuitBreakers } from '@/lib/utils/retry';
import { AppError, ErrorCodes } from '@/lib/errors/AppError';
import { vi } from 'vitest';

// Mock setTimeout for testing
vi.useFakeTimers();

describe('withRetry', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  it('should succeed on first attempt', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    
    const result = await withRetry(mockFn);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable errors', async () => {
    const retryableError = new AppError('Network error', ErrorCodes.NETWORK_ERROR, 'Network failed');
    const mockFn = vi.fn()
      .mockRejectedValueOnce(retryableError)
      .mockRejectedValueOnce(retryableError)
      .mockResolvedValue('success');

    const promise = withRetry(mockFn, { maxAttempts: 3 });
    
    // Fast-forward through the delays
    vi.runAllTimers();
    
    const result = await promise;
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should not retry on non-retryable errors', async () => {
    const nonRetryableError = new AppError('Validation error', ErrorCodes.VALIDATION_ERROR, 'Invalid input');
    const mockFn = vi.fn().mockRejectedValue(nonRetryableError);

    await expect(withRetry(mockFn)).rejects.toThrow(nonRetryableError);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should respect maxAttempts', async () => {
    const retryableError = new AppError('Network error', ErrorCodes.NETWORK_ERROR, 'Network failed');
    const mockFn = vi.fn().mockRejectedValue(retryableError);

    const promise = withRetry(mockFn, { maxAttempts: 2 });
    
    // Fast-forward through the delays
    vi.runAllTimers();
    
    await expect(promise).rejects.toThrow(retryableError);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should call onRetry callback', async () => {
    const retryableError = new AppError('Network error', ErrorCodes.NETWORK_ERROR, 'Network failed');
    const mockFn = vi.fn()
      .mockRejectedValueOnce(retryableError)
      .mockResolvedValue('success');
    const onRetry = vi.fn();

    const promise = withRetry(mockFn, { onRetry });
    
    // Fast-forward through the delays
    vi.runAllTimers();
    
    await promise;
    
    expect(onRetry).toHaveBeenCalledWith(1, retryableError);
  });

  it('should use custom retry condition', async () => {
    const customError = new AppError('Custom error', 'CUSTOM_ERROR' as any, 'Custom message');
    const mockFn = vi.fn().mockRejectedValue(customError);
    const retryCondition = vi.fn().mockReturnValue(false);

    await expect(withRetry(mockFn, { retryCondition })).rejects.toThrow(customError);
    
    expect(retryCondition).toHaveBeenCalledWith(customError);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});

describe('withAPIRetry', () => {
  it('should retry on default API error codes', async () => {
    const rateLimitError = new AppError('Rate limit', ErrorCodes.RATE_LIMIT, 'Too many requests');
    const mockFn = vi.fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValue('success');

    const promise = withAPIRetry(mockFn);
    
    // Fast-forward through the delays
    vi.runAllTimers();
    
    const result = await promise;
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should not retry on non-API errors', async () => {
    const validationError = new AppError('Validation error', ErrorCodes.VALIDATION_ERROR, 'Invalid input');
    const mockFn = vi.fn().mockRejectedValue(validationError);

    await expect(withAPIRetry(mockFn)).rejects.toThrow(validationError);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should use custom retryOn codes', async () => {
    const customError = new AppError('Custom error', 'CUSTOM_ERROR' as any, 'Custom message');
    const mockFn = vi.fn()
      .mockRejectedValueOnce(customError)
      .mockResolvedValue('success');

    const promise = withAPIRetry(mockFn, { retryOn: ['CUSTOM_ERROR' as any] });
    
    // Fast-forward through the delays
    vi.runAllTimers();
    
    const result = await promise;
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(2, 1000, 2000); // 2 failures, 1s recovery
  });

  it('should execute successfully when closed', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    
    const result = await circuitBreaker.execute(mockFn);
    
    expect(result).toBe('success');
    expect(circuitBreaker.getState().state).toBe('closed');
  });

  it('should open after failure threshold', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Service error'));
    
    // First failure
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
    expect(circuitBreaker.getState().state).toBe('closed');
    
    // Second failure - should open circuit
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
    expect(circuitBreaker.getState().state).toBe('open');
  });

  it('should reject immediately when open', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Service error'));
    
    // Trigger failures to open circuit
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
    
    // Should now reject immediately
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow(AppError);
    expect(mockFn).toHaveBeenCalledTimes(2); // Not called the third time
  });

  it('should transition to half-open after recovery timeout', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Service error'));
    
    // Open the circuit
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
    
    // Fast-forward past recovery timeout
    vi.advanceTimersByTime(1500);
    
    // Should now be half-open and allow one attempt
    mockFn.mockResolvedValueOnce('success');
    const result = await circuitBreaker.execute(mockFn);
    
    expect(result).toBe('success');
    expect(circuitBreaker.getState().state).toBe('closed');
  });

  it('should reset state', () => {
    circuitBreaker.reset();
    
    const state = circuitBreaker.getState();
    expect(state.state).toBe('closed');
    expect(state.failures).toBe(0);
    expect(state.lastFailureTime).toBe(0);
  });
});

describe('Global circuit breakers', () => {
  it('should have circuit breakers for all services', () => {
    expect(circuitBreakers.openai).toBeInstanceOf(CircuitBreaker);
    expect(circuitBreakers.elevenlabs).toBeInstanceOf(CircuitBreaker);
    expect(circuitBreakers.firebase).toBeInstanceOf(CircuitBreaker);
  });
});