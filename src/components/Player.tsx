import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  AlertTriangle,
  Package,
  ChefHat,
  Monitor,
  Loader,
  CheckCircle,
  X,
  Fullscreen,
  RotateCcw
} from 'lucide-react';
import { MenuScreen, MenuItemData, Playlist } from '../types';

interface PairingData {
  deviceToken: string;
  isLoading: boolean;
  error: string;
}

// Mock data for pairing
const mockScreensForPairing = [
  {
    id: '1',
    name: 'Main Entrance Display',
    deviceToken: 'ABC123',
    theme: 'blue',
    language: 'en',
    currency: 'USD',
    showPrices: true,
    rotationSeconds: 10,
    isActive: true,
    currentPlaylistId: '1'
  },
  {
    id: '2',
    name: 'Counter Display',
    deviceToken: 'DEF456',
    theme: 'light',
    language: 'en',
    currency: 'USD',
    showPrices: false,
    rotationSeconds: 15,
    isActive: true,
    currentPlaylistId: '2'
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
  },
  {
    id: '3',
    branchId: '1',
    sku: 'BEV-001',
    nameEn: 'Cappuccino',
    description: 'Rich and creamy cappuccino',
    price: 4.50,
    category: 'Coffee',
    imageUrl: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg',
    isActive: true,
    isOutOfStock: false,
    minDisplayThreshold: 10
  },
  {
    id: '4',
    branchId: '1',
    sku: 'PASTRY-002',
    nameEn: 'Blueberry Muffin',
    description: 'Fresh blueberry muffin',
    price: 2.99,
    category: 'Pastries',
    imageUrl: 'https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg',
    isActive: true,
    isOutOfStock: false,
    minDisplayThreshold: 5
  }
];

export default function Player() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isConnected, setIsConnected] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [cycleDuration, setCycleDuration] = useState(10000);
  const [isPaired, setIsPaired] = useState(false);
  const [screenConfig, setScreenConfig] = useState<any>(null);
  const [pairingData, setPairingData] = useState<PairingData>({
    deviceToken: '',
    isLoading: false,
    error: ''
  });
  const heartbeatRef = React.useRef<NodeJS.Timeout>();

  // Check for existing pairing on startup
  useEffect(() => {
    const savedDeviceToken = localStorage.getItem('pairedDeviceToken');
    if (savedDeviceToken) {
      // Load screen configuration
      const screen = mockScreensForPairing.find(s => s.deviceToken === savedDeviceToken);
      if (screen && screen.isActive) {
        setScreenConfig(screen);
        setIsPaired(true);
        setCycleDuration(screen.rotationSeconds * 1000);
        startHeartbeat(screen.id);
      } else {
        // Screen not found or inactive, clear pairing
        localStorage.removeItem('pairedDeviceToken');
      }
    }
  }, []);

  const startHeartbeat = (screenId: string) => {
    // Clear existing heartbeat
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    // Send initial ping
    updateLastPing(screenId);

    // Set up recurring heartbeat every 30 seconds
    heartbeatRef.current = setInterval(() => {
      updateLastPing(screenId);
    }, 30000);
  };

  const updateLastPing = (screenId: string) => {
    // In real app, this would be an API call
    console.log(`Heartbeat ping for screen ${screenId} at ${new Date().toISOString()}`);
    setIsConnected(true);
  };

  const handlePairing = async () => {
    if (!pairingData.deviceToken.trim()) {
      setPairingData(prev => ({ ...prev, error: 'Please enter a device token' }));
      return;
    }

    setPairingData(prev => ({ ...prev, isLoading: true, error: '' }));

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Find screen by device token
    const screen = mockScreensForPairing.find(s => 
      s.deviceToken.toLowerCase() === pairingData.deviceToken.toLowerCase()
    );

    if (screen && screen.isActive) {
      // Successful pairing
      localStorage.setItem('pairedDeviceToken', screen.deviceToken);
      setScreenConfig(screen);
      setIsPaired(true);
      setCycleDuration(screen.rotationSeconds * 1000);
      startHeartbeat(screen.id);
      setPairingData({ deviceToken: '', isLoading: false, error: '' });
    } else {
      setPairingData(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: screen ? 'Screen is inactive' : 'Invalid device token' 
      }));
    }
  };

  const handleUnpair = () => {
    if (confirm('Are you sure you want to unpair this device? You will need to enter the device token again.')) {
      localStorage.removeItem('pairedDeviceToken');
      setIsPaired(false);
      setScreenConfig(null);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    }
  };

  // Cleanup heartbeat on unmount
  useEffect(() => {
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, []);

  // Get enabled categories
  const categories = React.useMemo(() => {
    const enabledItems = mockMenuItems.filter(item => item.isActive);
    const categoryMap = new Map<string, number>();
    
    enabledItems.forEach(item => {
      categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + 1);
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, itemCount]) => ({ name, itemCount }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Set initial category
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].name);
    }
  }, [categories, activeCategory]);

  // Auto-cycle categories
  useEffect(() => {
    if (categories.length <= 1) return;

    const interval = setInterval(() => {
      setActiveCategory(prev => {
        const currentIndex = categories.findIndex(cat => cat.name === prev);
        const nextIndex = (currentIndex + 1) % categories.length;
        return categories[nextIndex].name;
      });
    }, cycleDuration);

    return () => clearInterval(interval);
  }, [categories, cycleDuration]);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  const handleKeyboard = useCallback((e: KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
      case 'f':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'r':
        e.preventDefault();
        refreshData();
        break;
      case 'arrowleft':
        e.preventDefault();
        navigateCategory(-1);
        break;
      case 'arrowright':
        e.preventDefault();
        navigateCategory(1);
        break;
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [handleKeyboard]);

  // Show pairing screen if not paired
  if (!isPaired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Monitor className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pair Device</h1>
            <p className="text-gray-600 dark:text-gray-400">Enter the device token to connect this display</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device Token
              </label>
              <input
                type="text"
                value={pairingData.deviceToken}
                onChange={(e) => setPairingData(prev => ({ 
                  ...prev, 
                  deviceToken: e.target.value.toUpperCase(),
                  error: ''
                }))}
                onKeyPress={(e) => e.key === 'Enter' && handlePairing()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono text-lg font-bold uppercase"
                placeholder="ABC123"
                maxLength={6}
                disabled={pairingData.isLoading}
              />
            </div>

            {pairingData.error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm">{pairingData.error}</span>
              </div>
            )}

            <button
              onClick={handlePairing}
              disabled={pairingData.isLoading || !pairingData.deviceToken.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              {pairingData.isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Pairing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Pair Device</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Instructions:</h3>
            <ol className="text-xs text-gray-600 space-y-1">
              <li>1. Get the device token from your manager</li>
              <li>2. Enter the 6-character token above</li>
              <li>3. Click "Pair Device" to connect</li>
              <li>4. The menu will load automatically</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const refreshData = () => {
    console.log('Refreshing menu data...');
    setIsConnected(false);
    setTimeout(() => setIsConnected(true), 1000);
  };

  const navigateCategory = (direction: number) => {
    if (categories.length <= 1) return;
    
    const currentIndex = categories.findIndex(cat => cat.name === activeCategory);
    let nextIndex = currentIndex + direction;
    
    if (nextIndex < 0) nextIndex = categories.length - 1;
    if (nextIndex >= categories.length) nextIndex = 0;
    
    setActiveCategory(categories[nextIndex].name);
  };

  const getThemeClasses = () => {
    if (!screenConfig) return 'from-gray-900 to-gray-800 text-white';
    
    switch (screenConfig.theme) {
      case 'light':
        return 'from-gray-100 to-gray-200 text-gray-900 dark:text-gray-100';
      case 'dark':
        return 'from-gray-900 to-gray-800 text-white';
      case 'blue':
        return 'from-blue-900 to-blue-800 text-white';
      case 'green':
        return 'from-green-900 to-green-800 text-white';
      default:
        return 'from-gray-900 to-gray-800 text-white';
    }
  };

  const formatCurrencyByConfig = (amount: number) => {
    const currency = screenConfig?.currency || 'USD';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol'
    }).format(amount);
  };

  // Get items for active category
  const activeItems = mockMenuItems
    .filter(item => item.isActive && item.category === activeCategory)
    .sort((a, b) => a.nameEn.localeCompare(b.nameEn));

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getThemeClasses()}`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between p-8 bg-black bg-opacity-30">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">MENU</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold">My Coffee Shop</h1>
            <p className="text-blue-200">
              {screenConfig?.name || 'Menu Display'}
            </p>
          </div>
        </div>

        {/* Current Time */}
        <div className="text-center">
          <div className="text-4xl font-bold font-mono">
            {formatTime(currentTime)}
          </div>
          <div className="text-blue-200">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>

        {/* Connection Status & Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleFullscreen}
            className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-opacity-30 transition-all flex items-center space-x-1"
          >
            <Fullscreen className="w-3 h-3" />
            <span>Fullscreen</span>
          </button>
          <button
            onClick={refreshData}
            className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-opacity-30 transition-all flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleUnpair}
            className="bg-red-600 bg-opacity-20 text-red-300 px-3 py-1 rounded-lg text-sm font-medium hover:bg-opacity-30 transition-all flex items-center space-x-1"
          >
            <X className="w-3 h-3" />
            <span>Unpair</span>
          </button>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <Wifi className="w-6 h-6 text-green-400" />
                <span className="text-green-400 font-medium">Connected</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <WifiOff className="w-6 h-6 text-red-400" />
                <span className="text-red-400 font-medium">Disconnected</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      {categories.length > 1 && (
        <div className="px-8 py-4 bg-black bg-opacity-20">
          <div className="flex items-center justify-center space-x-6">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition-all ${
                  activeCategory === category.name
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white bg-opacity-10 text-blue-200 hover:bg-opacity-20'
                }`}
              >
                {category.name}
                <span className="ml-2 text-sm opacity-75">({category.itemCount})</span>
              </button>
            ))}
          </div>
          
          {/* Category Progress Indicator */}
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              {categories.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all ${
                    categories[index].name === activeCategory
                      ? 'bg-blue-400'
                      : 'bg-white bg-opacity-30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu Items Grid */}
      <div className="flex-1 p-8">
        {activeItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {activeItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl overflow-hidden shadow-2xl transition-all transform hover:scale-105 ${
                  item.isOutOfStock ? 'opacity-40' : ''
                }`}
              >
                {/* Item Image */}
                <div className="relative h-48 bg-gray-200">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.nameEn}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                      <Package className="w-16 h-16 text-blue-600" />
                    </div>
                  )}
                  
                  {/* Out of Stock Badge */}
                  {item.isOutOfStock && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center space-x-2 shadow-lg">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Out of Stock</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                    {item.nameEn}
                  </h3>
                  
                  {item.description && (
                    <p className="text-gray-600 mb-3 text-sm">{item.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 font-medium">{item.sku}</span>
                    </div>
                    
                    {screenConfig?.showPrices && (
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">
                          {formatCurrencyByConfig(item.price)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stock Info */}
                  {!item.isOutOfStock && (
                    <div className="mt-3 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Available</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* No Items Message */
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-32 h-32 bg-white bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-8">
                <Package className="w-16 h-16 text-white opacity-50" />
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">
                No items in {activeCategory}
              </h2>
              <p className="text-xl text-blue-200">
                Check back soon for new additions to our menu!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer with Shortcuts */}
      <div className="p-4 bg-black bg-opacity-30 text-center">
        <div className="text-sm text-blue-200 space-x-6">
          <span>← → Change Category</span>
          <span>F Fullscreen</span>
          <span>R Refresh</span>
          <span>X Unpair</span>
          <span className="text-blue-300">Auto-cycling every {(cycleDuration || 10000) / 1000}s</span>
        </div>
      </div>
    </div>
  );
}