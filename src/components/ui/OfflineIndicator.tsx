'use client';

import React, { useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useToast } from '@/components/ui/Toast';

/**
 * Component that shows offline status and notifications
 */
export function OfflineIndicator() {
  const { isOnline, isOffline, wasOffline, clearWasOffline } = useOnlineStatus();
  const { showWarning, showInfo } = useToast();

  useEffect(() => {
    if (isOffline) {
      showWarning(
        'You are currently offline. Some features may not work properly.',
        'Connection Lost'
      );
    } else if (wasOffline && isOnline) {
      showInfo(
        'Connection restored. You can now use all features.',
        'Back Online'
      );
      clearWasOffline();
    }
  }, [isOnline, isOffline, wasOffline, showWarning, showInfo, clearWasOffline]);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-center text-sm font-medium z-50">
      <div className="flex items-center justify-center space-x-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span>You're offline. Some features may not work properly.</span>
      </div>
    </div>
  );
}

/**
 * Hook to check if a feature should be disabled when offline
 */
export function useOfflineDisabled() {
  const { isOffline } = useOnlineStatus();
  
  return {
    isOffline,
    getOfflineProps: (disabled = false) => ({
      disabled: disabled || isOffline,
      title: isOffline ? 'This feature requires an internet connection' : undefined,
    }),
  };
}