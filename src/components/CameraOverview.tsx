import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Monitor, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Filter,
  Building,
  Wifi,
  WifiOff,
  BarChart3,
  Calendar,
  Users,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Data from localStorage
const mockBranches: any[] = JSON.parse(localStorage.getItem('pos_branches') || '[]');
const mockNVRs: any[] = JSON.parse(localStorage.getItem('pos_nvrs') || '[]');
const mockCameras: any[] = JSON.parse(localStorage.getItem('pos_cameras') || '[]');
const mockEvents: any[] = JSON.parse(localStorage.getItem('pos_transactions') || '[]');

interface CameraOverviewProps {
  onNavigate: (page: 'event-viewer' | 'live-view' | 'playback' | 'devices' | 'settings') => void;
}

export default function CameraOverview({ onNavigate }: CameraOverviewProps) {
  const { user } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [liveGridCameras, setLiveGridCameras] = useState<any[]>([]);
  const [gridLayout, setGridLayout] = useState<'2x2' | '3x3'>('2x2');

  // Filter cameras for live grid
  useEffect(() => {
    const filteredCameras = mockCameras.filter(camera => {
      if (selectedBranch === 'all') return true;
      return camera.branchId === selectedBranch;
    }).filter(camera => camera.isEnabled && camera.healthStatus === 'Online');

    setLiveGridCameras(filteredCameras.slice(0, gridLayout === '2x2' ? 4 : 9));
  }, [selectedBranch, gridLayout]);

  // Calculate KPIs
  const totalCameras = mockCameras.length;
  const onlineCameras = mockCameras.filter(c => c.healthStatus === 'Online').length;
  const totalNVRs = mockNVRs.length;
  const onlineNVRs = mockNVRs.filter(n => n.healthStatus === 'Online').length;
  const eventsToday = mockEvents.filter(e => {
    const eventDate = new Date(e.createdAt);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  }).length;
  const failedCaptures = mockEvents.reduce((count, event) => {
    return count + event.cameraEvents.filter(ce => ce.captureStatus === 'failed').length;
  }, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'Online':
        return 'text-green-600';
      case 'Offline':
        return 'text-red-600';
      case 'Error':
        return 'text-orange-600';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'Online':
        return CheckCircle;
      case 'Offline':
        return WifiOff;
      case 'Error':
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Camera System Overview</h1>
          <p className="text-gray-600 mt-1">
            Monitor cameras, view events, and manage security integrations
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
          <button
            onClick={() => onNavigate('event-viewer')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>Open Event Viewer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cameras Online</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{onlineCameras}/{totalCameras}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Camera className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">NVRs Online</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{onlineNVRs}/{totalNVRs}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Monitor className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Events Today</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{eventsToday}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed Captures</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{failedCaptures}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigate('event-viewer')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all group"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-all">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100">View Events</p>
              <p className="text-sm text-gray-500">Browse POS events</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('live-view')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all group"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-all">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100">Live View</p>
              <p className="text-sm text-gray-500">Monitor cameras</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('devices')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all group"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-all">
              <Monitor className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100">Manage Devices</p>
              <p className="text-sm text-gray-500">NVRs & Cameras</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-all group"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-all">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100">Settings</p>
              <p className="text-sm text-gray-500">Configure system</p>
            </div>
          </button>
        </div>
      </div>

      {/* Live Camera Grid */}
      <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Live Camera Grid</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={gridLayout}
                  onChange={(e) => setGridLayout(e.target.value as '2x2' | '3x3')}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="2x2">2×2 Grid</option>
                  <option value="3x3">3×3 Grid</option>
                </select>
              </div>
              <button
                onClick={() => onNavigate('live-view')}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
              >
                Full View
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {liveGridCameras.length > 0 ? (
            <div className={`grid gap-4 ${gridLayout === '2x2' ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {liveGridCameras.map((camera) => {
                const branch = mockBranches.find(b => b.id === camera.branchId);
                const HealthIcon = getHealthStatusIcon(camera.healthStatus);
                
                return (
                  <div key={camera.id} className="bg-gray-900 rounded-lg overflow-hidden relative group">
                    <div className="aspect-video bg-gray-800 flex items-center justify-center">
                      {camera.liveUrl ? (
                        <video
                          src={camera.liveUrl}
                          className="w-full h-full object-cover"
                          autoPlay
                          muted
                          loop
                        />
                      ) : (
                        <div className="text-center text-gray-400">
                          <Camera className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-sm">No Signal</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Camera Info Overlay */}
                    <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm">
                      <div className="flex items-center space-x-2">
                        <HealthIcon className={`w-3 h-3 ${getHealthStatusColor(camera.healthStatus)}`} />
                        <span>{camera.name}</span>
                      </div>
                      <p className="text-xs text-gray-300">{branch?.name}</p>
                    </div>

                    {/* Controls Overlay */}
                    <div className="absolute bottom-3 right-3 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="bg-black bg-opacity-70 text-white p-2 rounded-lg hover:bg-opacity-90 transition-all">
                        <Maximize className="w-4 h-4" />
                      </button>
                      <button className="bg-black bg-opacity-70 text-white p-2 rounded-lg hover:bg-opacity-90 transition-all">
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No cameras available</h3>
              <p className="text-gray-600 mb-4">
                {selectedBranch === 'all' 
                  ? 'No online cameras found across all branches'
                  : 'No online cameras found for selected branch'
                }
              </p>
              <button
                onClick={() => onNavigate('devices')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all"
              >
                Manage Devices
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent POS Events</h2>
              <button
                onClick={() => onNavigate('event-viewer')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {mockEvents.slice(0, 5).map((event) => {
                const branch = mockBranches.find(b => b.id === event.branchId);
                const capturedCount = event.cameraEvents.filter(ce => ce.captureStatus === 'captured').length;
                const totalCameras = event.cameraEvents.length;
                
                return (
                  <div key={event.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 capitalize">{event.eventType}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-600 dark:text-gray-400">{event.invoiceNo}</span>
                        <span className="text-gray-500">•</span>
                        <span className="font-medium text-green-600">${event.amount}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500">{branch?.name}</span>
                        <span className="text-sm text-gray-500">{formatDate(event.createdAt)}</span>
                        <span className={`text-sm font-medium ${
                          capturedCount === totalCameras ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {capturedCount}/{totalCameras} cameras captured
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">System Health</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* NVR Status */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">NVR Status</h3>
                <div className="space-y-2">
                  {mockNVRs.map((nvr) => {
                    const branch = mockBranches.find(b => b.id === nvr.branchId);
                    const HealthIcon = getHealthStatusIcon(nvr.healthStatus);
                    
                    return (
                      <div key={nvr.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <HealthIcon className={`w-4 h-4 ${getHealthStatusColor(nvr.healthStatus)}`} />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{nvr.name}</span>
                          <span className="text-xs text-gray-500">({branch?.name})</span>
                        </div>
                        <span className={`text-xs font-medium ${getHealthStatusColor(nvr.healthStatus)}`}>
                          {nvr.healthStatus}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Camera Status Summary */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Camera Status</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-green-50 p-2 rounded">
                    <p className="text-lg font-bold text-green-600">
                      {mockCameras.filter(c => c.healthStatus === 'Online').length}
                    </p>
                    <p className="text-xs text-green-700">Online</p>
                  </div>
                  <div className="bg-red-50 p-2 rounded">
                    <p className="text-lg font-bold text-red-600">
                      {mockCameras.filter(c => c.healthStatus === 'Offline').length}
                    </p>
                    <p className="text-xs text-red-700">Offline</p>
                  </div>
                  <div className="bg-orange-50 p-2 rounded">
                    <p className="text-lg font-bold text-orange-600">
                      {mockCameras.filter(c => c.healthStatus === 'Error').length}
                    </p>
                    <p className="text-xs text-orange-700">Error</p>
                  </div>
                </div>
              </div>
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
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Sale event captured successfully</p>
              <p className="text-xs text-gray-500">KC Store • Cashier 1 • 2 minutes ago</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Camera "Safe Area" went offline</p>
              <p className="text-xs text-gray-500">KC Store • 15 minutes ago</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Monitor className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">NVR "Olaya NVR" connection restored</p>
              <p className="text-xs text-gray-500">Olaya Store • 1 hour ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}