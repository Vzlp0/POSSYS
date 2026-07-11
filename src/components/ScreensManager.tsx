import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Monitor, 
  MapPin, 
  Wifi, 
  WifiOff,
  ArrowLeft,
  Save,
  X,
  Settings,
  List,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Copy,
  Activity,
  Palette,
  Globe,
  DollarSign,
  Timer,
  Power,
  PowerOff
} from 'lucide-react';
import { Screen, ScreenPlaylist, ScreenOverride } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Data from localStorage
const mockScreens: Screen[] = JSON.parse(localStorage.getItem('pos_menu_screens') || '[]');
const mockPlaylists: ScreenPlaylist[] = JSON.parse(localStorage.getItem('pos_menu_playlists') || '[]');

const themes = [
  { value: 'light', label: 'Light', preview: 'bg-white text-gray-900 dark:text-gray-100' },
  { value: 'dark', label: 'Dark', preview: 'bg-gray-900 text-white' },
  { value: 'blue', label: 'Blue', preview: 'bg-blue-600 text-white' },
  { value: 'green', label: 'Green', preview: 'bg-green-600 text-white' }
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
  { value: 'fr', label: 'Français' }
];

const currencies = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'SAR', label: 'Saudi Riyal (ر.س)' },
  { value: 'EUR', label: 'Euro (€)' }
];

const screenGroups = ['Coffee', 'Beverages', 'Pastries', 'Specialty', 'Promotions'];

interface ScreensManagerProps {
  onBack: () => void;
}

export default function ScreensManager({ onBack }: ScreensManagerProps) {
  const { user } = useAuth();
  const [screens, setScreens] = useState<Screen[]>(mockScreens);
  const [playlists, setPlaylists] = useState<ScreenPlaylist[]>(mockPlaylists);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'playlist' | 'overrides' | 'activity'>('general');
  const [selectedScreens, setSelectedScreens] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    theme: 'light' as const,
    language: 'en' as const,
    currency: 'USD' as const,
    showPrices: true,
    rotationSeconds: 10,
    isActive: true
  });

  // Update online status based on last ping
  useEffect(() => {
    const updateOnlineStatus = () => {
      const now = new Date();
      setScreens(prev => prev.map(screen => ({
        ...screen,
        isOnline: screen.lastPingAt 
          ? (now.getTime() - new Date(screen.lastPingAt).getTime()) < 120000 // 2 minutes
          : false
      })));
    };

    updateOnlineStatus();
    const interval = setInterval(updateOnlineStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const generateScreenCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      location: '',
      theme: 'light',
      language: 'en',
      currency: 'USD',
      showPrices: true,
      rotationSeconds: 10,
      isActive: true
    });
    setEditingScreen(null);
    setActiveTab('general');
    setShowAddForm(true);
  };

  const handleEdit = (screen: Screen) => {
    setFormData({
      name: screen.name,
      location: screen.location,
      theme: screen.theme,
      language: screen.language,
      currency: screen.currency,
      showPrices: screen.showPrices,
      rotationSeconds: screen.rotationSeconds,
      isActive: screen.isActive
    });
    setEditingScreen(screen);
    setActiveTab('general');
    setShowAddForm(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.location) {
      alert('Please fill in all required fields');
      return;
    }

    const now = new Date().toISOString();

    if (editingScreen) {
      // Update existing screen
      setScreens(prev => prev.map(screen => 
        screen.id === editingScreen.id 
          ? { ...screen, ...formData, updatedAt: now }
          : screen
      ));
    } else {
      // Add new screen
      const newScreen: Screen = {
        id: Date.now().toString(),
        ...formData,
        screenCode: generateScreenCode(),
        isOnline: false,
        createdAt: now,
        updatedAt: now
      };
      setScreens(prev => [...prev, newScreen]);
    }

    setShowAddForm(false);
    setEditingScreen(null);
  };

  const handleDelete = (id: string) => {
    const screen = screens.find(s => s.id === id);
    if (confirm(`Are you sure you want to delete "${screen?.name}"? This action cannot be undone.`)) {
      setScreens(prev => prev.filter(screen => screen.id !== id));
      setPlaylists(prev => prev.filter(playlist => playlist.screenId !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setScreens(prev => prev.map(screen => 
      screen.id === id 
        ? { ...screen, isActive: !screen.isActive, updatedAt: new Date().toISOString() }
        : screen
    ));
  };

  const handleRegenerateCode = (id: string) => {
    if (confirm('Are you sure you want to regenerate the screen code? The device will need to be re-paired.')) {
      setScreens(prev => prev.map(screen => 
        screen.id === id 
          ? { ...screen, screenCode: generateScreenCode(), updatedAt: new Date().toISOString() }
          : screen
      ));
    }
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'regenerate_codes') => {
    if (selectedScreens.length === 0) {
      alert('Please select screens first');
      return;
    }

    if (action === 'regenerate_codes') {
      if (!confirm(`Are you sure you want to regenerate codes for ${selectedScreens.length} screen(s)? They will need to be re-paired.`)) {
        return;
      }
    }

    setScreens(prev => prev.map(screen => {
      if (selectedScreens.includes(screen.id)) {
        switch (action) {
          case 'activate':
            return { ...screen, isActive: true, updatedAt: new Date().toISOString() };
          case 'deactivate':
            return { ...screen, isActive: false, updatedAt: new Date().toISOString() };
          case 'regenerate_codes':
            return { ...screen, screenCode: generateScreenCode(), updatedAt: new Date().toISOString() };
          default:
            return screen;
        }
      }
      return screen;
    }));

    setSelectedScreens([]);
  };

  const filteredScreens = screens.filter(screen => {
    const matchesSearch = 
      screen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      screen.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      screen.screenCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = selectedLocation === 'all' || screen.location.includes(selectedLocation);
    
    let matchesStatus = true;
    if (selectedStatus === 'online') matchesStatus = screen.isOnline;
    else if (selectedStatus === 'offline') matchesStatus = !screen.isOnline;
    else if (selectedStatus === 'active') matchesStatus = screen.isActive;
    else if (selectedStatus === 'inactive') matchesStatus = !screen.isActive;
    
    return matchesSearch && matchesLocation && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (screen: Screen) => {
    if (!screen.isActive) {
      return (
        <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:text-gray-200">
          <PowerOff className="w-3 h-3" />
          <span>Inactive</span>
        </div>
      );
    }
    
    if (screen.isOnline) {
      return (
        <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <Wifi className="w-3 h-3" />
          <span>Online</span>
        </div>
      );
    }
    
    return (
      <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
        <WifiOff className="w-3 h-3" />
        <span>Offline</span>
      </div>
    );
  };

  const copyScreenCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Screen code copied to clipboard!');
  };

  // Edit Screen Modal
  if (showAddForm) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Screens</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {editingScreen ? 'Edit Screen' : 'Add New Screen'}
            </h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'general', label: 'General', icon: Settings },
                { id: 'playlist', label: 'Playlist', icon: List },
                { id: 'overrides', label: 'Overrides', icon: Eye },
                { id: 'activity', label: 'Activity', icon: Activity }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-all flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Screen Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter screen name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter location"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Theme
                    </label>
                    <select
                      value={formData.theme}
                      onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value as any }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {themes.map(theme => (
                        <option key={theme.value} value={theme.value}>{theme.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value as any }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {languages.map(lang => (
                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value as any }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {currencies.map(curr => (
                        <option key={curr.value} value={curr.value}>{curr.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rotation Speed (seconds)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={formData.rotationSeconds}
                      onChange={(e) => setFormData(prev => ({ ...prev, rotationSeconds: parseInt(e.target.value) || 10 }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.showPrices}
                        onChange={(e) => setFormData(prev => ({ ...prev, showPrices: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Prices</span>
                        <p className="text-sm text-gray-500">Display item prices on menu</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                        <p className="text-sm text-gray-500">Enable this screen</p>
                      </div>
                    </label>
                  </div>
                </div>

                {editingScreen && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Screen Code</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="font-mono text-lg font-bold text-blue-600">
                            {editingScreen.screenCode}
                          </span>
                          <button
                            onClick={() => copyScreenCode(editingScreen.screenCode)}
                            className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                            title="Copy Screen Code"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRegenerateCode(editingScreen.id)}
                        className="bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-all flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Regenerate</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'playlist' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Playlist Management</h3>
                  <p className="text-blue-700 text-sm">
                    Configure which categories/groups are shown on this screen and their display order.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Available Groups</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {screenGroups.map((group, index) => (
                      <div key={group} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">{index + 1}</span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{group}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700 transition-all">
                            Enabled
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'overrides' && (
              <div className="space-y-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-orange-800 mb-2">Screen-Specific Overrides</h3>
                  <p className="text-orange-700 text-sm">
                    Hide or show specific items only for this screen, overriding global menu settings.
                  </p>
                </div>

                <div className="text-center py-8 text-gray-500">
                  <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No overrides configured for this screen</p>
                  <p className="text-sm text-gray-400">Overrides will appear here when configured</p>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Screen Activity</h3>
                  <p className="text-green-700 text-sm">
                    Monitor connection status, ping times, and recent configuration changes.
                  </p>
                </div>

                {editingScreen && (
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Connection Status</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                          {getStatusBadge(editingScreen)}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Last Ping</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {editingScreen.lastPingAt ? formatDate(editingScreen.lastPingAt) : 'Never'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(editingScreen.updatedAt)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Recent Activity</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Screen created</p>
                            <p className="text-xs text-gray-500">{formatDate(editingScreen.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Settings className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Configuration updated</p>
                            <p className="text-xs text-gray-500">{formatDate(editingScreen.updatedAt)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingScreen ? 'Update Screen' : 'Create Screen'}</span>
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Screens Manager</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-gray-600 dark:text-gray-400">Menu Screens</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">Screens Manager</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Screen</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Screens</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{screens.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Monitor className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Online</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {screens.filter(s => s.isOnline).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Wifi className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Offline</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {screens.filter(s => !s.isOnline).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <WifiOff className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {screens.filter(s => s.isActive).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Power className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by screen name, location, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Locations</option>
                <option value="KC">KC Store</option>
                <option value="Olaya">Olaya Store</option>
                <option value="Solitaire">Solitaire Store</option>
                <option value="Jeddah">Jeddah Store</option>
              </select>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedScreens.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="font-medium text-blue-800">
                {selectedScreens.length} screen(s) selected
              </span>
              <button
                onClick={() => setSelectedScreens([])}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-all"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-all"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('regenerate_codes')}
                className="bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-all"
              >
                Regenerate Codes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screens Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-4 px-6">
                  <input
                    type="checkbox"
                    checked={selectedScreens.length === filteredScreens.length && filteredScreens.length > 0}
                    onChange={() => {
                      if (selectedScreens.length === filteredScreens.length) {
                        setSelectedScreens([]);
                      } else {
                        setSelectedScreens(filteredScreens.map(s => s.id));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Screen</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Location</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Screen Code</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Status</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Playlist</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Rotation</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Last Ping</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredScreens.map((screen) => (
                <tr key={screen.id} className="hover:bg-gray-50 transition-all">
                  <td className="py-4 px-6">
                    <input
                      type="checkbox"
                      checked={selectedScreens.includes(screen.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedScreens(prev => [...prev, screen.id]);
                        } else {
                          setSelectedScreens(prev => prev.filter(id => id !== screen.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Monitor className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{screen.name}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            themes.find(t => t.value === screen.theme)?.preview || 'bg-gray-100 text-gray-800 dark:text-gray-200'
                          }`}>
                            {screen.theme}
                          </span>
                          <span className="text-xs text-gray-500">{screen.language.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">{screen.location}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded font-bold">
                        {screen.screenCode}
                      </span>
                      <button
                        onClick={() => copyScreenCode(screen.screenCode)}
                        className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                        title="Copy Screen Code"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(screen)}
                      <button
                        onClick={() => handleToggleActive(screen.id)}
                        className={`p-1 rounded transition-all ${
                          screen.isActive 
                            ? 'text-green-600 hover:bg-green-50' 
                            : 'text-gray-400 hover:bg-gray-50 dark:bg-gray-900'
                        }`}
                        title={screen.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {screen.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-900 dark:text-gray-100">
                      {screen.assignedPlaylistName || 'No playlist'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <Timer className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">{screen.rotationSeconds}s</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-900 dark:text-gray-100">
                      {screen.lastPingAt ? formatDate(screen.lastPingAt) : 'Never'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(screen)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit Screen"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRegenerateCode(screen.id)}
                        className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all"
                        title="Regenerate Code"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(screen.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Screen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredScreens.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No screens found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria.</p>
          <button
            onClick={handleAddNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            Add Your First Screen
          </button>
        </div>
      )}
    </div>
  );
}