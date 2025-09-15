'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { AppError } from '@/lib/errors/AppError';
import { ErrorHandler } from '@/lib/errors/errorHandler';
import { ErrorBoundary } from './ErrorBoundary';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AppError, retry: () => void) => ReactNode;
  onError?: (error: AppError) => void;
}

/**
 * Error boundary that can handle async errors (Promise rejections)
 * that occur outside of React's render cycle
 */
export function AsyncErrorBoundary({ children, fallback, onError }: AsyncErrorBoundaryProps) {
  const [asyncError, setAsyncError] = useState<AppError | null>(null);

  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = ErrorHandler.handleError(event.reason, {
        type: 'unhandledRejection',
        promise: event.promise,
      });

      ErrorHandler.logError(error);
      setAsyncError(error);

      if (onError) {
        onError(error);
      }

      // Prevent the default browser behavior
      event.preventDefault();
    };

    // Handle uncaught errors
    const handleError = (event: ErrorEvent) => {
      const error = ErrorHandler.handleError(event.error, {
        type: 'uncaughtError',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });

      ErrorHandler.logError(error);
      setAsyncError(error);

      if (onError) {
        onError(error);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [onError]);

  const retry = () => {
    setAsyncError(null);
  };

  // If there's an async error, show the fallback
  if (asyncError) {
    if (fallback) {
      return <>{fallback(asyncError, retry)}</>;
    }

    // Use the default error boundary fallback
    return (
      <ErrorBoundary fallback={fallback}>
        <div>
          {/* This will trigger the error boundary */}
          {(() => {
            throw asyncError;
          })()}
        </div>
      </ErrorBoundary>
    );
  }

  // Wrap children in regular error boundary for sync errors
  return (
    <ErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Hook for handling async errors in components
 */
export function useAsyncError() {
  const [, setError] = useState<Error | null>(null);

  return (error: unknown) => {
    const appError = ErrorHandler.handleError(error);
    ErrorHandler.logError(appError);
    setError(() => {
      throw appError;
    });
  };
}