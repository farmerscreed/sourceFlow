'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

/**
 * Hook to track online/offline status and update the global store.
 * Should be used once at the app root level.
 */
export function useOnlineStatus() {
  const { isOnline, setIsOnline } = useAppStore();

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);

  return isOnline;
}

/**
 * Simple hook to just read online status without setting up listeners.
 * Use this in components that just need to read the value.
 */
export function useIsOnline() {
  return useAppStore((state) => state.isOnline);
}
