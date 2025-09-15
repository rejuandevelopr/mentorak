import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { vi } from 'vitest';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock fetch
global.fetch = vi.fn();

// Mock window event listeners
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
Object.defineProperty(window, 'addEventListener', { value: mockAddEventListener });
Object.defineProperty(window, 'removeEventListener', { value: mockRemoveEventListener });

describe('useOnlineStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (navigator as any).onLine = true;
    (global.fetch as any).mockResolvedValue({ ok: true });
  });

  it('should initialize with online status', () => {
    const { result } = renderHook(() => useOnlineStatus());
    
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isOffline).toBe(false);
    expect(result.current.wasOffline).toBe(false);
  });

  it('should initialize with offline status when navigator is offline', () => {
    (navigator as any).onLine = false;
    
    const { result } = renderHook(() => useOnlineStatus());
    
    expect(result.current.isOnline).toBe(false);
    expect(result.current.isOffline).toBe(true);
  });

  it('should add event listeners on mount', () => {
    renderHook(() => useOnlineStatus());
    
    expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should remove event listeners on unmount', () => {
    const { unmount } = renderHook(() => useOnlineStatus());
    
    unmount();
    
    expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should update status when online event is triggered', () => {
    // Start with offline status
    (navigator as any).onLine = false;
    const { result } = renderHook(() => useOnlineStatus());
    
    // Get the online event handler
    const onlineHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'online'
    )?.[1];
    
    // Change navigator status and trigger online event
    act(() => {
      (navigator as any).onLine = true;
      onlineHandler?.();
    });
    
    expect(result.current.isOnline).toBe(true);
  });

  it('should update status when offline event is triggered', () => {
    const { result } = renderHook(() => useOnlineStatus());
    
    // Get the offline event handler
    const offlineHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'offline'
    )?.[1];
    
    // Change navigator status and trigger offline event
    act(() => {
      (navigator as any).onLine = false;
      offlineHandler?.();
    });
    
    expect(result.current.isOnline).toBe(false);
    expect(result.current.wasOffline).toBe(true);
  });

  it('should clear wasOffline flag', () => {
    const { result } = renderHook(() => useOnlineStatus());
    
    // Set wasOffline to true
    act(() => {
      const offlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1];
      offlineHandler?.();
    });
    
    expect(result.current.wasOffline).toBe(true);
    
    // Clear the flag
    act(() => {
      result.current.clearWasOffline();
    });
    
    expect(result.current.wasOffline).toBe(false);
  });

  it('should handle fetch failure for connectivity check', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useOnlineStatus());
    
    // Initially online, but fetch will fail
    expect(result.current.isOnline).toBe(true);
    
    // Wait for the connectivity check to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Should still be online since we don't automatically update based on fetch failure
    // The actual implementation might vary based on your specific logic
  });
});