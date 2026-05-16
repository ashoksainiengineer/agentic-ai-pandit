'use client';

import { createContext, useContext } from 'react';

export const TestModeContext = createContext<boolean>(false);

export function TestModeProvider({
  value,
  children,
}: {
  value: boolean;
  children: React.ReactNode;
}) {
  return (
    <TestModeContext.Provider value={value}>
      {children}
    </TestModeContext.Provider>
  );
}

export function useTestMode(): boolean {
  return useContext(TestModeContext);
}
