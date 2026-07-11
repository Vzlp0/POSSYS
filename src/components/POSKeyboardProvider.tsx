import React, { useState, useEffect, useRef } from 'react';
import { useCallback } from 'react';
import { Keyboard } from 'lucide-react';
import TouchKeyboard from './TouchKeyboard';
import { KeyboardProvider } from '../contexts/KeyboardContext';

interface POSKeyboardProviderProps {
  children: React.ReactNode;
}

export default function POSKeyboardProvider({ children }: POSKeyboardProviderProps) {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(true);
  const [keyboardMode, setKeyboardMode] = useState<'numeric' | 'alpha'>('numeric');
  const [allowModeToggle, setAllowModeToggle] = useState(true);
  const [hasHardwareKeyboard, setHasHardwareKeyboard] = useState(false);
  const [forceShow, setForceShow] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showFullKeyboard, setShowFullKeyboard] = useState(false);
  const activeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const keyboardTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle key press function
  const handleKeyPress = useCallback((key: string) => {
    if (!activeInputRef.current) return;

    const input = activeInputRef.current;
    const currentValue = input.value;
    const selectionStart = input.selectionStart || 0;
    const selectionEnd = input.selectionEnd || 0;

    let newValue = currentValue;
    let newCursorPos = selectionStart;

    switch (key) {
      case 'backspace':
        if (selectionStart === selectionEnd) {
          if (selectionStart > 0) {
            newValue = currentValue.slice(0, selectionStart - 1) + currentValue.slice(selectionStart);
            newCursorPos = selectionStart - 1;
          }
        } else {
          newValue = currentValue.slice(0, selectionStart) + currentValue.slice(selectionEnd);
          newCursorPos = selectionStart;
        }
        break;

      case 'clear':
        newValue = '';
        newCursorPos = 0;
        break;

      case 'enter':
        // Trigger form submission or primary action
        const form = input.closest('form');
        if (form) {
          const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
          if (submitButton && !submitButton.disabled) {
            submitButton.click();
          }
        } else {
          // Trigger change event and blur
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.blur();
        }
        return;

      case 'space':
        newValue = currentValue.slice(0, selectionStart) + ' ' + currentValue.slice(selectionEnd);
        newCursorPos = selectionStart + 1;
        break;

      default:
        // Handle regular character input
        newValue = currentValue.slice(0, selectionStart) + key + currentValue.slice(selectionEnd);
        newCursorPos = selectionStart + key.length;
        break;
    }

    // Update input value
    input.value = newValue;
    input.setSelectionRange(newCursorPos, newCursorPos);

    // Dispatch events for React to pick up the change
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, []);

  // Detect hardware keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only detect if it's a real keyboard event (not programmatic)
      if (e.isTrusted && !e.repeat) {
        setHasHardwareKeyboard(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle input focus/blur
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      if (target.hasAttribute('data-touchkeyboard') && isEnabled) {
        activeInputRef.current = target as HTMLInputElement | HTMLTextAreaElement;
        
        // Determine keyboard mode from attribute
        const touchKeyboardMode = target.getAttribute('data-touchkeyboard');
        if (touchKeyboardMode === 'numeric') {
          setKeyboardMode('numeric');
          setAllowModeToggle(false);
        } else if (touchKeyboardMode === 'alpha') {
          setKeyboardMode('alpha');
          setAllowModeToggle(true);
        } else {
          // Default to numeric if not specified
          setKeyboardMode('numeric');
          setAllowModeToggle(true);
        }

        // Show keyboard if no hardware keyboard detected or force show is enabled
        if (isEnabled) {
          clearTimeout(keyboardTimeoutRef.current);
          setShowFullKeyboard(true);
          setIsMinimized(false);
        }
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement;
      
      // Don't hide if focus moved to keyboard or another touch keyboard input
      if (relatedTarget?.hasAttribute('data-touchkeyboard') || 
          relatedTarget?.closest('[data-keyboard-container]')) {
        return;
      }

      // Hide full keyboard when focus leaves
      keyboardTimeoutRef.current = setTimeout(() => {
        const currentFocus = document.activeElement as HTMLElement;
        if (!currentFocus?.hasAttribute('data-touchkeyboard') && 
            !currentFocus?.closest('[data-keyboard-container]')) {
          setShowFullKeyboard(false);
          activeInputRef.current = null;
        }
      }, 150);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      clearTimeout(keyboardTimeoutRef.current);
    };
  }, [isEnabled, hasHardwareKeyboard, forceShow]);

  // Handle escape key to close keyboard
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFullKeyboard) {
        setShowFullKeyboard(false);
        setForceShow(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showFullKeyboard]);

  const handleClose = () => {
    setShowFullKeyboard(false);
  };

  const handleModeChange = (mode: 'numeric' | 'alpha') => {
    setKeyboardMode(mode);
  };

  const toggleForceShow = () => {
    setShowFullKeyboard(!showFullKeyboard);
  };

  return (
    <>
      <KeyboardProvider handleKeyPress={handleKeyPress} activeInputRef={activeInputRef}>
        {children}
        {/* Full Touch Keyboard */}
        <div data-keyboard-container>
          <TouchKeyboard
            isVisible={showFullKeyboard}
            onClose={handleClose}
            mode={keyboardMode}
            onModeChange={handleModeChange}
            allowModeToggle={allowModeToggle}
          />
        </div>
      </KeyboardProvider>
    </>
  );
}