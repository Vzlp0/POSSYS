import React, { createContext, useContext, ReactNode } from 'react';

interface KeyboardContextType {
  handleKeyPress: (key: string) => void;
  activeInputRef: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>;
}

const KeyboardContext = createContext<KeyboardContextType | undefined>(undefined);

export function useKeyboard() {
  const context = useContext(KeyboardContext);
  if (context === undefined) {
    throw new Error('useKeyboard must be used within a KeyboardProvider');
  }
  return context;
}

interface KeyboardProviderProps {
  children: ReactNode;
  handleKeyPress: (key: string) => void;
  activeInputRef: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>;
}

export function KeyboardProvider({ children, handleKeyPress, activeInputRef }: KeyboardProviderProps) {
  return (
    <KeyboardContext.Provider value={{ handleKeyPress, activeInputRef }}>
      {children}
    </KeyboardContext.Provider>
  );
}