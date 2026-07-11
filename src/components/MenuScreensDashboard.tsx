import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Wifi, 
  WifiOff, 
  Package, 
  AlertTriangle, 
  Plus, 
  BarChart3,
  Clock,
  CheckCircle,
  Calendar,
  Building,
  Activity,
  TrendingUp,
  Eye,
  Settings,
  Zap,
  Users
} from 'lucide-react';
import { MenuScreen, Branch, Playlist, MenuItemData } from '../types';

// Mock data
const mockBranches: Branch[] = [
  { id: '1', name: 'Main Branch', code: 'MAIN' },
  { id: '2', name: 'Downtown Branch', code: 'DOWN' },
  { id: '3', name: 'Mall Branch', code: 'MALL' }
];

const mockScreens: MenuScreen[] = [
  {
    id: '1',
    name: 'Main Entrance Display',
    branchId: '1',
    groupId: '1',
    orientation: 'landscape',
    resolutionW: 1920,
    resolutionH: 1080,
    currentPlaylistId: '1',
    deviceToken: 'ABC123',
    isActive: true,
    lastHeartbeatAt: new Date(Date.now() - 30000).toISOString(),
    theme: 'blue',
    language: 'en',
    currency: 'USD',
    showPrices: true,
    rotationSeconds: 10
  },
  {
    id: '2',
    name: 'Counter Display',
    branchId: '1',
    orientation: 'portrait',
    resolutionW: 1080,
    resolutionH: 1920,
    currentPlaylistId: '2',
    deviceToken: 'DEF456',
    isActive: true,
    lastHeartbeatAt: new Date(Date.now() - 180000).toISOString(),
    theme: 'light',
    language: 'en',
    currency: 'USD',
    showPrices: false,
    rotationSeconds: 15
  },
  {
    id: '3',
    name: 'Drive-Through Menu',
    branchId: '2',
    orientation: 'landscape',
    resolutionW: 1920,
    resolutionH: 1080,
    deviceToken: 'GHI789',
    isActive: false,
    lastHeartbeatAt: new Date(Date.now() - 600000).toISOString(),
    theme: 'dark',
    language: 'en',
    currency: 'USD',
    showPrices: true,
    rotationSeconds: 8
  }
];

const mockPlaylists: Playlist[] = [
  {
    id: '1',
    name: 'Main Menu - All Day',
    branchId: '1',
    templateId: '1',
    rotation: [
      { id: '1', durationSec: 10 },
      { id: '2', durationSec: 8 }
    ]
  },
  {
    id: '2',
    name: 'Quick Items',
    branchId: '1',
    templateId: '2',
    rotation: [
      { id: '1', durationSec: 15 }
    ]
  }
];

const mockMenuItems: MenuItemData[] = [
  {
    id: '1',
    branchId: '1',
    sku: 'COFFEE-001',
    nameEn: 'Premium Coffee Blend',
    description: 'Our signature coffee blend',
    price: 4.50,
    category: 'Coffee',
    imageUrl: 'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg',
    isActive: true,
    isOutOfStock: false,
    minDisplayThreshold: 5
  },
  {
    id: '2',
    branchId: '1',
    sku: 'PASTRY-001',
    nameEn: 'Croissant',
    description: 'Fresh baked croissant',
    price: 3.75,
    category: 'Pastries',
    imageUrl: 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg',
    isActive: true,
    isOutOfStock: true,
    minDisplayThreshold: 3
  }
];

interface MenuScreensDashboardProps {
  onNavigate: (page: 'menu-admin' | 'template-designer' | 'screens-manager' | 'player') => void;
}

export default function MenuScreensDashboard({ onNavigate }: MenuScreensDashboardProps) {
  const [screens, setScreens] = useState<MenuScreen[]>(mockScreens);
  const [selectedBranch, setSelectedBranch] = useState('all');

  // Update online status based on heartbeat
  useEffect(() => {
    const updateOnlineStatus = () => {
      const now = new Date();
      setScreens(prev => prev.map(screen => ({
        ...screen,
        isOnline: screen.lastHeartbeatAt 
          ? (now.getTime() - new Date(screen.lastHeartbeatAt).getTime()) < 300000 // 5 minutes
          : false
      })));
    };

    updateOnlineStatus();
    const interval = setInterval(updateOnlineStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'a':
          e.preventDefault();
          onNavigate('menu-admin');
          break;
        case 't':
          e.preventDefault();
          onNavigate('template-designer');
          break;
        case 's':
          e.preventDefault();
          onNavigate('screens-manager');
          break;
        case 'p':
          e.preventDefault();
          onNavigate('player');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [onNavigate]);

  const filteredScreens = selectedBranch === 'all' 
    ? screens 
    : screens.filter(screen => screen.branchId === selectedBranch);

  const onlineScreens = filteredScreens.filter(screen => 
    screen.lastHeartbeatAt && 
    (new Date().getTime() - new Date(screen.lastHeartbeatAt).getTime()) < 300000
  ).length;

  const offlineScreens = filteredScreens.length - onlineScreens;
  const oosItems = mockMenuItems.filter(item => item.isOutOfStock).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Menu Screens Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Central control for digital menu displays and content management
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Branches</option>
            {mockBranches.map(branch => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
          <div className="text-sm text-gray-500">
            <span className="font-medium">Shortcuts:</span> A (Admin) • T (Templates) • S (Screens) • P (Player)
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Screens</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{filteredScreens.filter(s => s.isActive).length}</p>
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
              <p className="text-2xl font-bold text-green-600 mt-2">{onlineScreens}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Wifi className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Offline Screens</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{offlineScreens}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <WifiOff className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Out of Stock Items</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">{oosItems}</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate('screens-manager')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all group"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-all">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100">Pair New Screen</p>
              <p className="text-sm text-gray-500">Add TV display</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('template-designer')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all group"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-all">
              <Plus className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100">New Template</p>
              <p className="text-sm text-gray-500">Design layout</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('menu-admin')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all group"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-all">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100">Toggle OOS</p>
              <p className="text-sm text-gray-500">Quick update</p>
            </div>
          </button>

          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-all group">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-all">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100">Sync from POS</p>
              <p className="text-sm text-gray-500">Update prices</p>
            </div>
          </button>
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
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {mockMenuItems.filter(item => item.isActive).length} items enabled
                    </span>
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      {oosItems} out of stock
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('menu-admin')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center space-x-2 group-hover:shadow-lg"
              >
                <span>Open Menu Admin</span>
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Template Designer Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl hover:border-purple-300 transition-all group">
          <div className="flex items-start space-x-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Template Designer</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Design beautiful menu layouts with drag-and-drop zones. Upload backgrounds, 
                create price boards, and customize the visual experience.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">
                      3 templates
                    </span>
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      2 active
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('template-designer')}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all flex items-center space-x-2 group-hover:shadow-lg"
              >
                <span>Open Template Designer</span>
                <BarChart3 className="w-5 h-5" />
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
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Wifi className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {onlineScreens}/{filteredScreens.length} online
                    </span>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {mockBranches.length} branches
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('screens-manager')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center space-x-2 group-hover:shadow-lg"
              >
                <span>Open Screens Manager</span>
                <Monitor className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Player Preview Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl hover:border-orange-300 transition-all group">
          <div className="flex items-start space-x-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Player Preview</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Preview how menus look on TV displays. Test different templates, 
                themes, and content before deploying to live screens.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">
                      Live preview
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      Device mode
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('player')}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-all flex items-center space-x-2 group-hover:shadow-lg"
              >
                <span>Open Player Preview</span>
                <Eye className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Today's Schedule</h2>
          <p className="text-gray-600 text-sm mt-1">Current playlists running on each screen</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Screen</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Branch</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Status</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Current Playlist</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Rotation</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Last Heartbeat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredScreens.map((screen) => {
                const branch = mockBranches.find(b => b.id === screen.branchId);
                const playlist = mockPlaylists.find(p => p.id === screen.currentPlaylistId);
                const isOnline = screen.lastHeartbeatAt && 
                  (new Date().getTime() - new Date(screen.lastHeartbeatAt).getTime()) < 300000;
                
                return (
                  <tr key={screen.id} className="hover:bg-gray-50 dark:bg-gray-900">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Monitor className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{screen.name}</p>
                          <p className="text-sm text-gray-500">{screen.resolutionW}×{screen.resolutionH}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        {branch?.name}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        {isOnline ? (
                          <>
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <Wifi className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 font-medium text-sm">Online</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                            <WifiOff className="w-4 h-4 text-red-600" />
                            <span className="text-red-600 font-medium text-sm">Offline</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-900 dark:text-gray-100">{playlist?.name || 'No playlist'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-100">{screen.rotationSeconds}s</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-900 dark:text-gray-100">
                        {screen.lastHeartbeatAt ? formatDate(screen.lastHeartbeatAt) : 'Never'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Croissant marked out of stock</p>
              <p className="text-xs text-gray-500">15 minutes ago</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Monitor className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">New template "Breakfast Special" created</p>
              <p className="text-xs text-gray-500">1 hour ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}