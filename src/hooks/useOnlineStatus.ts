import { useState, useEffect } from 'react';

/**
 * Hook to detect online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Track if user was previously offline for reconnection notifications
      if (!navigator.onLine) {
        setWasOffline(true);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Additional check using fetch to verify actual connectivity
    const checkConnectivity = async () => {
      try {
        // Try to fetch a small resource to verify connectivity
        const response = await fetch('/favicon.ico', {
          method: 'HEAD',
          cache: 'no-cache',
        });
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    };

    // Check connectivity periodically when offline
    let intervalId: NodeJS.Timeout;
    if (!isOnline) {
      intervalId = setInterval(checkConnectivity, 30000); // Check every 30 seconds
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isOnline]);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    clearWasOffline: () => setWasOffline(false),
  };
}