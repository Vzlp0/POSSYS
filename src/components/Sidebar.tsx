import React from 'react';
import { ShoppingCart, LayoutGrid } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

export default function Sidebar({ activeItem, onItemClick }: SidebarProps) {
  const { isDarkMode } = useTheme();

  const isPosActive = activeItem === 'pos';
  const isHubActive = activeItem !== 'pos';

  return (
    <div className={`w-full h-16 border-t ${
      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <nav className="h-full">
        <ul className="flex h-full">
          {/* Cashier Tab */}
          <li className="flex-1">
            <button
              onClick={() => onItemClick('pos')}
              className={`w-full h-full flex flex-col items-center justify-center space-y-1 transition-all ${
                isPosActive
                  ? isDarkMode ? 'bg-blue-900 text-blue-400' : 'bg-blue-50 text-blue-700'
                  : isDarkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ShoppingCart className={`w-6 h-6 ${isPosActive ? (isDarkMode ? 'text-blue-400' : 'text-blue-700') : ''}`} />
              <span className="text-xs font-medium">Cashier</span>
            </button>
          </li>

          {/* Features Hub Tab */}
          <li className="flex-1">
            <button
              onClick={() => onItemClick('hub')}
              className={`w-full h-full flex flex-col items-center justify-center space-y-1 transition-all ${
                isHubActive
                  ? isDarkMode ? 'bg-blue-900 text-blue-400' : 'bg-blue-50 text-blue-700'
                  : isDarkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className={`w-6 h-6 ${isHubActive ? (isDarkMode ? 'text-blue-400' : 'text-blue-700') : ''}`} />
              <span className="text-xs font-medium">Features</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
