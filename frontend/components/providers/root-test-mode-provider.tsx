'use client';

import { useEffect, useState } from 'react';
import { TestModeProvider } from '@/lib/test-mode-context';
import { enableGlobalTestMode } from '@/lib/secure-logger';

/**
 * RootTestModeProvider - Detects test mode from window.__AI_PANDIT_TEST_MODE__
 * (set by Playwright addInitScript) and provides it via React Context.
 *
 * For vitest/jsdom unit tests, components should be wrapped directly with
 * <TestModeProvider value={true}> since window flags in jsdom are unreliable
 * after module initialization.
 */
export function RootTestModeProvider({ children }: { children: React.ReactNode }) {
  const [isTestMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.__AI_PANDIT_TEST_MODE__ === true;
    }
    return false;
  });

  useEffect(() => {
    if (isTestMode) {
      enableGlobalTestMode();
    }
  }, [isTestMode]);

  return (
    <TestModeProvider value={isTestMode}>
      {children}
    </TestModeProvider>
  );
}
