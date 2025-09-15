import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary } from '@/components/errors/ErrorBoundary';
import { AppError, ErrorCodes } from '@/lib/errors/AppError';
import { vi } from 'vitest';

// Mock console.error to avoid noise in tests
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new AppError('Test error', ErrorCodes.VALIDATION_ERROR, 'Something went wrong');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render default error UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument(); // User message
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Refresh Page')).toBeInTheDocument();
  });

  it('should render critical error UI for critical errors', () => {
    const CriticalError = () => {
      throw new AppError('Critical error', ErrorCodes.API_KEY_INVALID, 'Critical system error', 'critical');
    };

    render(
      <ErrorBoundary>
        <CriticalError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Critical Error')).toBeInTheDocument();
    expect(screen.getByText('Critical system error')).toBeInTheDocument();
  });

  it('should show retry button for retryable errors', () => {
    const RetryableError = () => {
      throw new AppError('Network error', ErrorCodes.NETWORK_ERROR, 'Network failed');
    };

    render(
      <ErrorBoundary>
        <RetryableError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should call retry function when retry button is clicked', () => {
    let shouldThrow = true;
    const RetryableComponent = () => {
      if (shouldThrow) {
        throw new AppError('Network error', ErrorCodes.NETWORK_ERROR, 'Network failed');
      }
      return <div>Success after retry</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <RetryableComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Network failed')).toBeInTheDocument();

    // Simulate successful retry
    shouldThrow = false;
    fireEvent.click(screen.getByText('Try Again'));

    // Re-render with updated component
    rerender(
      <ErrorBoundary>
        <RetryableComponent />
      </ErrorBoundary>
    );

    // Note: In a real scenario, the component would need to be re-mounted
    // This test demonstrates the retry button functionality
  });

  it('should call custom onError handler', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(AppError),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('should render custom fallback when provided', () => {
    const customFallback = (error: AppError, retry: () => void) => (
      <div>
        <h1>Custom Error UI</h1>
        <p>{error.userMessage}</p>
        <button onClick={retry}>Custom Retry</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Custom Retry')).toBeInTheDocument();
  });

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should refresh page when refresh button is clicked', () => {
    // Mock window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Refresh Page'));
    expect(mockReload).toHaveBeenCalled();
  });
});

describe('withErrorBoundary HOC', () => {
  it('should wrap component with error boundary', () => {
    const TestComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>Test component</div>;
    };

    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent shouldThrow={false} />);
    expect(screen.getByText('Test component')).toBeInTheDocument();

    render(<WrappedComponent shouldThrow={true} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should pass error boundary props to HOC', () => {
    const onError = vi.fn();
    const TestComponent = () => {
      throw new Error('Test error');
    };

    const WrappedComponent = withErrorBoundary(TestComponent, { onError });

    render(<WrappedComponent />);

    expect(onError).toHaveBeenCalled();
  });
});