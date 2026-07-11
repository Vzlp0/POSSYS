import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Delete, 
  RotateCcw, 
  CornerDownLeft, 
  Keyboard, 
  Minimize2,
  Type,
  Hash
} from 'lucide-react';

interface TouchKeyboardProps {
  isVisible: boolean;
  onClose: () => void;
  mode: 'numeric' | 'alpha';
  onModeChange: (mode: 'numeric' | 'alpha') => void;
  allowModeToggle: boolean;
}

const numericKeys = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'backspace'],
  ['clear', 'enter']
];

const alphaKeys = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
  ['123', 'space', '.', ',', '-', '@', '/', 'enter']
];

const symbolKeys = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
  ['shift', '.', ',', '?', '!', "'", 'backspace'],
  ['ABC', 'space', 'clear', 'enter']
];

export default function TouchKeyboard({ 
  isVisible, 
  onClose, 
  mode, 
  onModeChange, 
  allowModeToggle 
}: TouchKeyboardProps) {
  const [isShifted, setIsShifted] = useState(false);
  const [isSymbols, setIsSymbols] = useState(false);
  const [activeInput, setActiveInput] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const lastEnterTime = useRef<number>(0);

  // Track active input
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.hasAttribute('data-touchkeyboard')) {
        setActiveInput(target as HTMLInputElement | HTMLTextAreaElement);
      }
    };

    const handleBlur = (e: FocusEvent) => {
      // Small delay to allow for keyboard interactions
      setTimeout(() => {
        const focusedElement = document.activeElement;
        if (!focusedElement?.hasAttribute('data-touchkeyboard') && 
            !keyboardRef.current?.contains(focusedElement as Node)) {
          setActiveInput(null);
        }
      }, 100);
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  // Auto-scroll input into view when keyboard appears
  useEffect(() => {
    if (isVisible && activeInput) {
      const keyboardHeight = 280; // Approximate keyboard height
      const inputRect = activeInput.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      if (inputRect.bottom > viewportHeight - keyboardHeight) {
        const scrollAmount = inputRect.bottom - (viewportHeight - keyboardHeight) + 20;
        window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
      }
    }
  }, [isVisible, activeInput]);

  const handleKeyPress = useCallback((key: string) => {
    if (!activeInput) return;

    const currentValue = activeInput.value;
    const selectionStart = activeInput.selectionStart || 0;
    const selectionEnd = activeInput.selectionEnd || 0;

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
        // Debounce enter to prevent double submits
        const now = Date.now();
        if (now - lastEnterTime.current < 500) return;
        lastEnterTime.current = now;

        // Trigger form submission or primary action
        const form = activeInput.closest('form');
        if (form) {
          const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
          if (submitButton && !submitButton.disabled) {
            submitButton.click();
          }
        } else {
          // Trigger change event and blur
          activeInput.dispatchEvent(new Event('change', { bubbles: true }));
          activeInput.blur();
        }
        return;

      case 'shift':
        setIsShifted(!isShifted);
        return;

      case '123':
        setIsSymbols(true);
        return;

      case 'ABC':
        setIsSymbols(false);
        return;

      case 'space':
        newValue = currentValue.slice(0, selectionStart) + ' ' + currentValue.slice(selectionEnd);
        newCursorPos = selectionStart + 1;
        break;

      default:
        // Handle regular character input
        let char = key;
        if (mode === 'alpha' && !isSymbols && char.length === 1) {
          char = isShifted ? char.toUpperCase() : char.toLowerCase();
        }
        
        // For numeric mode, validate decimal input
        if (mode === 'numeric' && key === '.') {
          if (currentValue.includes('.')) return; // Prevent multiple decimals
        }

        newValue = currentValue.slice(0, selectionStart) + char + currentValue.slice(selectionEnd);
        newCursorPos = selectionStart + char.length;
        break;
    }

    // Update input value
    activeInput.value = newValue;
    activeInput.setSelectionRange(newCursorPos, newCursorPos);

    // Dispatch events for React to pick up the change
    activeInput.dispatchEvent(new Event('input', { bubbles: true }));
    activeInput.dispatchEvent(new Event('change', { bubbles: true }));

    // Reset shift after character input (except for shift key itself)
    if (key !== 'shift' && isShifted && mode === 'alpha' && !isSymbols) {
      setIsShifted(false);
    }
  }, [activeInput, isShifted, mode, isSymbols]);

  const renderKey = (key: string, extraClasses = '') => {
    let displayKey = key;
    let keyClasses = `min-h-[56px] bg-white border border-gray-300 rounded-lg font-semibold text-gray-900 hover:bg-gray-50 active:bg-gray-100 transition-all ${extraClasses}`;
    let icon = null;

    // Handle special keys
    switch (key) {
      case 'backspace':
        icon = <Delete className="w-5 h-5" />;
        displayKey = '';
        keyClasses += ' bg-red-50 hover:bg-red-100 text-red-700';
        break;
      case 'clear':
        icon = <RotateCcw className="w-5 h-5" />;
        displayKey = '';
        keyClasses += ' bg-orange-50 hover:bg-orange-100 text-orange-700';
        break;
      case 'enter':
        icon = <CornerDownLeft className="w-5 h-5" />;
        displayKey = '';
        keyClasses += ' bg-blue-50 hover:bg-blue-100 text-blue-700';
        break;
      case 'shift':
        icon = <Type className="w-4 h-4" />;
        displayKey = '';
        keyClasses += ` ${isShifted ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'}`;
        break;
      case 'space':
        displayKey = 'Space';
        keyClasses += ' col-span-4';
        break;
      case '123':
        displayKey = '123';
        keyClasses += ' bg-gray-50 hover:bg-gray-100 text-gray-700';
        break;
      case 'ABC':
        displayKey = 'ABC';
        keyClasses += ' bg-gray-50 hover:bg-gray-100 text-gray-700';
        break;
      default:
        if (mode === 'alpha' && !isSymbols && key.length === 1 && /[a-z]/.test(key)) {
          displayKey = isShifted ? key.toUpperCase() : key;
        }
        break;
    }

    return (
      <button
        key={key}
        onClick={() => handleKeyPress(key)}
        className={keyClasses}
        aria-label={`Key ${displayKey || key}`}
        type="button"
      >
        {icon || displayKey}
      </button>
    );
  };

  const getCurrentKeys = () => {
    if (mode === 'numeric') {
      return numericKeys;
    } else if (isSymbols) {
      return symbolKeys;
    } else {
      return alphaKeys;
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={keyboardRef}
      className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-300 shadow-2xl z-40"
      style={{ height: '280px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-200 border-b border-gray-300 dark:border-gray-600">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Keyboard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              Touch Keyboard - {mode === 'numeric' ? 'Numeric' : isSymbols ? 'Symbols' : 'Alpha'}
            </span>
          </div>
          
          {allowModeToggle && (
            <div className="flex items-center space-x-1 bg-white rounded-lg p-1">
              <button
                onClick={() => onModeChange('numeric')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all flex items-center space-x-1 ${
                  mode === 'numeric' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100 dark:bg-gray-700'
                }`}
              >
                <Hash className="w-3 h-3" />
                <span>123</span>
              </button>
              <button
                onClick={() => onModeChange('alpha')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all flex items-center space-x-1 ${
                  mode === 'alpha' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100 dark:bg-gray-700'
                }`}
              >
                <Type className="w-3 h-3" />
                <span>ABC</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-300 rounded-lg transition-all"
          aria-label="Minimize keyboard"
        >
          <Minimize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Keyboard Grid */}
      <div className="p-4 h-full">
        <div className="grid gap-2 h-full">
          {getCurrentKeys().map((row, rowIndex) => (
            <div key={rowIndex} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${row.length}, 1fr)` }}>
              {row.map((key) => renderKey(key))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}