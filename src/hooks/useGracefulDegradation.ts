import { useState, useEffect, useCallback } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { AppError, ErrorCodes } from '@/lib/errors/AppError';
import { ErrorHandler } from '@/lib/errors/errorHandler';

interface ServiceStatus {
  isAvailable: boolean;
  lastChecked: Date;
  consecutiveFailures: number;
}

interface GracefulDegradationOptions {
  maxFailures?: number;
  checkInterval?: number;
  services?: string[];
}

/**
 * Hook for graceful degradation when services are unavailable
 */
export function useGracefulDegradation(options: GracefulDegradationOptions = {}) {
  const {
    maxFailures = 3,
    checkInterval = 60000, // 1 minute
    services = ['openai', 'elevenlabs', 'firebase']
  } = options;

  const { isOnline } = useOnlineStatus();
  const [serviceStatuses, setServiceStatuses] = useState<Record<string, ServiceStatus>>(() =>
    services.reduce((acc, service) => ({
      ...acc,
      [service]: {
        isAvailable: true,
        lastChecked: new Date(),
        consecutiveFailures: 0,
      }
    }), {})
  );

  /**
   * Mark a service as failed
   */
  const markServiceFailure = useCallback((service: string, error?: AppError) => {
    setServiceStatuses(prev => {
      const current = prev[service];
      if (!current) return prev;

      const consecutiveFailures = current.consecutiveFailures + 1;
      const isAvailable = consecutiveFailures < maxFailures;

      return {
        ...prev,
        [service]: {
          ...current,
          isAvailable,
          consecutiveFailures,
          lastChecked: new Date(),
        }
      };
    });

    // Log the service failure
    if (error) {
      ErrorHandler.logError(error, { service, degradation: true });
    }
  }, [maxFailures]);

  /**
   * Mark a service as successful
   */
  const markServiceSuccess = useCallback((service: string) => {
    setServiceStatuses(prev => {
      const current = prev[service];
      if (!current) return prev;

      return {
        ...prev,
        [service]: {
          ...current,
          isAvailable: true,
          consecutiveFailures: 0,
          lastChecked: new Date(),
        }
      };
    });
  }, []);

  /**
   * Check if a service is available
   */
  const isServiceAvailable = useCallback((service: string): boolean => {
    if (!isOnline) return false;
    return serviceStatuses[service]?.isAvailable ?? true;
  }, [isOnline, serviceStatuses]);

  /**
   * Get degraded functionality message for a service
   */
  const getDegradationMessage = useCallback((service: string): string | null => {
    if (!isOnline) {
      return 'This feature requires an internet connection.';
    }

    const status = serviceStatuses[service];
    if (!status?.isAvailable) {
      switch (service) {
        case 'openai':
          return 'Quiz generation is temporarily unavailable. Please try again later.';
        case 'elevenlabs':
          return 'Voice features are temporarily unavailable. You can still take quizzes using text.';
        case 'firebase':
          return 'Data sync is temporarily unavailable. Your progress may not be saved.';
        default:
          return `${service} service is temporarily unavailable.`;
      }
    }

    return null;
  }, [isOnline, serviceStatuses]);

  /**
   * Execute a function with service availability tracking
   */
  const withServiceTracking = useCallback(async <T>(
    service: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    try {
      const result = await fn();
      markServiceSuccess(service);
      return result;
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      markServiceFailure(service, appError);
      throw appError;
    }
  }, [markServiceSuccess, markServiceFailure]);

  /**
   * Get fallback options when a service is unavailable
   */
  const getFallbackOptions = useCallback((service: string) => {
    switch (service) {
      case 'openai':
        return {
          canUploadPDF: false,
          canGenerateQuiz: false,
          canUseVoice: isServiceAvailable('elevenlabs'),
          message: 'Quiz generation is temporarily unavailable.',
        };
      
      case 'elevenlabs':
        return {
          canUseVoice: false,
          canPlayAudio: false,
          useTextFallback: true,
          message: 'Voice features unavailable. Using text mode.',
        };
      
      case 'firebase':
        return {
          canSaveProgress: false,
          canLoadHistory: false,
          useLocalStorage: true,
          message: 'Data sync unavailable. Progress will be stored locally.',
        };
      
      default:
        return {
          isAvailable: false,
          message: `${service} is temporarily unavailable.`,
        };
    }
  }, [isServiceAvailable]);

  /**
   * Periodic health check for services
   */
  useEffect(() => {
    if (!isOnline) return;

    const healthCheck = async () => {
      // This would typically ping service health endpoints
      // For now, we'll just reset services that have been down for a while
      const now = new Date();
      
      setServiceStatuses(prev => {
        const updated = { ...prev };
        
        Object.keys(updated).forEach(service => {
          const status = updated[service];
          const timeSinceLastCheck = now.getTime() - status.lastChecked.getTime();
          
          // Reset service status after check interval if it was marked as down
          if (!status.isAvailable && timeSinceLastCheck > checkInterval) {
            updated[service] = {
              ...status,
              isAvailable: true,
              consecutiveFailures: 0,
              lastChecked: now,
            };
          }
        });
        
        return updated;
      });
    };

    const interval = setInterval(healthCheck, checkInterval);
    return () => clearInterval(interval);
  }, [isOnline, checkInterval]);

  return {
    serviceStatuses,
    isServiceAvailable,
    getDegradationMessage,
    getFallbackOptions,
    markServiceFailure,
    markServiceSuccess,
    withServiceTracking,
  };
}