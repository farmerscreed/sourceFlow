'use client';

import { useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSync } from '@/hooks/useSync';

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * App-level provider that initializes hooks and handles global state.
 * This component should wrap the entire application.
 */
export function AppProvider({ children }: AppProviderProps) {
  // Initialize online status tracking
  useOnlineStatus();

  // Initialize sync engine
  useSync();

  return <>{children}</>;
}
