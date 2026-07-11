import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Settings, 
  ArrowRight, 
  Package, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  BarChart3,
  Eye,
  EyeOff,
  Clock,
  CheckCircle
} from 'lucide-react';

interface MenuScreensHubProps {
  onNavigate: (page: 'menu-admin' | 'screens-manager') => void;
}

// Mock data for quick stats
const mockStats = {
  totalScreens: 3,
  onlineScreens: 2,
  totalCategories: 6,
  itemsOutOfStock: 4,
  enabledItems: 12,
  totalItems: 16
};

export default function MenuScreensHub({ onNavigate }: MenuScreensHubProps) {
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'a':
          e.preventDefault();
          onNavigate('menu-admin');
          break;
        case 's':
          e.preventDefault();
          onNavigate('screens-manager');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [onNavigate]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Menu Screens</h1>
          <p className="text-gray-600 mt-1">
            Central control for TV menu displays and content management
          </p>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-medium">Shortcuts:</span> A (Menu Admin) • S (Screens Manager)
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Screens</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{mockStats.totalScreens}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Monitor className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Online Screens</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{mockStats.onlineScreens}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Wifi className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Categories</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">{mockStats.totalCategories}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Items Out of Stock</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{mockStats.itemsOutOfStock}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Menu Admin Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl hover:border-blue-300 transition-all group">
          <div className="flex items-start space-x-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Menu Admin</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Enable or disable items, mark items Out of Stock, and organize menu categories. 
                Control what customers see on TV displays with real-time updates.
              </p>
              
              {/* Quick Stats for Menu Admin */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {mockStats.enabledItems} items enabled
                    </span>
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      {mockStats.itemsOutOfStock} out of stock
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('menu-admin')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center space-x-2 group-hover:shadow-lg"
              >
                <span>Open Menu Admin</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Screens Manager Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl hover:border-green-300 transition-all group">
          <div className="flex items-start space-x-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Monitor className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Screens Manager</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Add or edit screens, assign playlists, manage pairing codes, and check online status. 
                Complete control center for all TV displays across your locations.
              </p>
              
              {/* Quick Stats for Screens Manager */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Wifi className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {mockStats.onlineScreens}/{mockStats.totalScreens} online
                    </span>
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">
                      {mockStats.totalCategories} categories
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('screens-manager')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center space-x-2 group-hover:shadow-lg"
              >
                <span>Open Screens Manager</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Screen "Main Entrance Display" came online</p>
              <p className="text-xs text-gray-500">2 minutes ago</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Sugar Packets marked out of stock</p>
              <p className="text-xs text-gray-500">15 minutes ago</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Monitor className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">New screen "Counter Display" added</p>
              <p className="text-xs text-gray-500">1 hour ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Getting Started</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Menu Admin</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• Control item visibility on menus</li>
              <li>• Mark items as out of stock</li>
              <li>• Organize menu categories</li>
              <li>• Real-time menu updates</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Screens Manager</h4>
            <ul className="space-y-1 text-blue-700">
              <li>• Add and configure TV screens</li>
              <li>• Manage screen playlists</li>
              <li>• Monitor connection status</li>
              <li>• Generate pairing codes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}