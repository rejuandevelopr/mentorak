import { AppError, ErrorCodes } from '@/lib/errors/AppError';
import { ErrorHandler } from '@/lib/errors/errorHandler';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: AppError) => boolean;
  onRetry?: (attempt: number, error: AppError) => void;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error: AppError) => error.isRetryable(),
  onRetry: () => {},
};

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: AppError;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = ErrorHandler.handleError(error, { attempt });

      // If this is the last attempt or error is not retryable, throw
      if (attempt === config.maxAttempts || !config.retryCondition(lastError)) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
        config.maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;

      config.onRetry(attempt, lastError);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }

  throw lastError!;
}

/**
 * Retry wrapper for API calls with specific retry conditions
 */
export async function withAPIRetry<T>(
  fn: () => Promise<T>,
  options: Omit<RetryOptions, 'retryCondition'> & {
    retryOn?: string[];
  } = {}
): Promise<T> {
  const { retryOn = [ErrorCodes.RATE_LIMIT, ErrorCodes.SERVICE_UNAVAILABLE, ErrorCodes.NETWORK_ERROR], ...retryOptions } = options;

  return withRetry(fn, {
    ...retryOptions,
    retryCondition: (error: AppError) => retryOn.includes(error.code),
  });
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000, // 1 minute
    private monitoringPeriod: number = 120000 // 2 minutes
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open';
      } else {
        throw new AppError(
          'Circuit breaker is open',
          ErrorCodes.SERVICE_UNAVAILABLE,
          'Service is temporarily unavailable. Please try again later.',
          'high'
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset() {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'closed';
  }
}

/**
 * Global circuit breakers for different services
 */
export const circuitBreakers = {
  openai: new CircuitBreaker(3, 30000, 60000), // More sensitive for API calls
  elevenlabs: new CircuitBreaker(3, 30000, 60000),
  firebase: new CircuitBreaker(5, 60000, 120000), // Less sensitive for database
};

/**
 * Utility function to execute with circuit breaker and retry
 */
export async function withCircuitBreakerAndRetry<T>(
  fn: () => Promise<T>,
  circuitBreaker: CircuitBreaker,
  retryOptions: RetryOptions = {}
): Promise<T> {
  return circuitBreaker.execute(() => withRetry(fn, retryOptions));
}

/**
 * Batch retry for multiple operations
 */
export async function retryBatch<T>(
  operations: (() => Promise<T>)[],
  options: RetryOptions & {
    concurrency?: number;
    failFast?: boolean;
  } = {}
): Promise<(T | AppError)[]> {
  const { concurrency = 3, failFast = false, ...retryOptions } = options;
  const results: (T | AppError)[] = [];
  
  // Process operations in batches
  for (let i = 0; i < operations.length; i += concurrency) {
    const batch = operations.slice(i, i + concurrency);
    
    const batchPromises = batch.map(async (operation, index) => {
      try {
        return await withRetry(operation, retryOptions);
      } catch (error) {
        const appError = ErrorHandler.handleError(error);
        
        if (failFast) {
          throw appError;
        }
        
        return appError;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}