import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Monitor, 
  Camera, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  AlertTriangle,
  ArrowLeft,
  Save,
  X,
  Building,
  Clock,
  Activity,
  Settings,
  Zap
} from 'lucide-react';

// Mock data
const mockBranches = [
  { id: '1', name: 'KC Store', code: 'KC', timezone: 'Asia/Riyadh' },
  { id: '2', name: 'Olaya Store', code: 'OL', timezone: 'Asia/Riyadh' },
  { id: '3', name: 'Solitaire Store', code: 'SOL', timezone: 'Asia/Riyadh' },
  { id: '4', name: 'Jeddah Store', code: 'JED', timezone: 'Asia/Riyadh' }
];

const mockNVRs = [
  {
    id: '1',
    branchId: '1',
    vendor: 'Hikvision',
    name: 'KC Main NVR',
    host: '192.168.1.100',
    apiPort: 80,
    rtspPort: 554,
    username: 'admin',
    timezone: 'Asia/Riyadh',
    clockDriftSec: 0,
    defaultPreSec: 10,
    defaultPostSec: 10,
    retentionDays: 30,
    storageTarget: 'Local',
    isEnabled: true,
    healthStatus: 'Online',
    lastHeartbeatAt: new Date(Date.now() - 30000).toISOString(),
    createdAt: '2024-12-20T08:00:00Z'
  },
  {
    id: '2',
    branchId: '2',
    vendor: 'Dahua',
    name: 'Olaya NVR',
    host: '192.168.2.100',
    apiPort: 80,
    rtspPort: 554,
    username: 'admin',
    timezone: 'Asia/Riyadh',
    clockDriftSec: -5,
    defaultPreSec: 10,
    defaultPostSec: 10,
    retentionDays: 30,
    storageTarget: 'S3',
    isEnabled: true,
    healthStatus: 'Offline',
    lastHeartbeatAt: new Date(Date.now() - 300000).toISOString(),
    createdAt: '2024-12-19T10:00:00Z'
  }
];

const mockCameras = [
  {
    id: '1',
    branchId: '1',
    nvrId: '1',
    name: 'Cashier 1',
    channel: 1,
    rtspUrl: 'rtsp://192.168.1.100:554/cam1',
    onvifProfile: 'Profile_1',
    tags: ['cashier', 'pos'],
    isEnabled: true,
    healthStatus: 'Online',
    lastHeartbeatAt: new Date(Date.now() - 45000).toISOString(),
    createdAt: '2024-12-20T08:00:00Z'
  },
  {
    id: '2',
    branchId: '1',
    nvrId: '1',
    name: 'Entrance',
    channel: 2,
    rtspUrl: 'rtsp://192.168.1.100:554/cam2',
    onvifProfile: 'Profile_1',
    tags: ['entrance', 'security'],
    isEnabled: true,
    healthStatus: 'Online',
    lastHeartbeatAt: new Date(Date.now() - 60000).toISOString(),
    createdAt: '2024-12-20T08:00:00Z'
  },
  {
    id: '3',
    branchId: '1',
    nvrId: '1',
    name: 'Safe Area',
    channel: 3,
    rtspUrl: 'rtsp://192.168.1.100:554/cam3',
    tags: ['safe', 'security'],
    isEnabled: true,
    healthStatus: 'Error',
    lastHeartbeatAt: new Date(Date.now() - 600000).toISOString(),
    createdAt: '2024-12-20T08:00:00Z'
  }
];

const vendors = ['Hikvision', 'Dahua', 'UNV', 'Axis', 'Other'];
const storageTargets = ['Local', 'S3'];
const cameraTagOptions = ['cashier', 'entrance', 'safe', 'backroom', 'storage', 'security'];

interface CameraDevicesProps {
  onBack: () => void;
}

export default function CameraDevices({ onBack }: CameraDevicesProps) {
  const [activeTab, setActiveTab] = useState<'nvrs' | 'cameras' | 'discovery'>('nvrs');
  const [nvrs, setNVRs] = useState(mockNVRs);
  const [cameras, setCameras] = useState(mockCameras);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [showAddNVR, setShowAddNVR] = useState(false);
  const [showAddCamera, setShowAddCamera] = useState(false);
  const [editingNVR, setEditingNVR] = useState<any>(null);
  const [editingCamera, setEditingCamera] = useState<any>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  
  const [nvrForm, setNVRForm] = useState({
    name: '',
    branchId: '',
    vendor: 'Hikvision',
    host: '',
    apiPort: 80,
    rtspPort: 554,
    username: 'admin',
    secret: '',
    timezone: 'Asia/Riyadh',
    clockDriftSec: 0,
    defaultPreSec: 10,
    defaultPostSec: 10,
    retentionDays: 30,
    storageTarget: 'Local',
    isEnabled: true
  });

  const [cameraForm, setCameraForm] = useState({
    name: '',
    branchId: '',
    nvrId: '',
    channel: 1,
    rtspUrl: '',
    onvifProfile: '',
    tags: [] as string[],
    isEnabled: true
  });

  const handleAddNVR = () => {
    setNVRForm({
      name: '',
      branchId: '',
      vendor: 'Hikvision',
      host: '',
      apiPort: 80,
      rtspPort: 554,
      username: 'admin',
      secret: '',
      timezone: 'Asia/Riyadh',
      clockDriftSec: 0,
      defaultPreSec: 10,
      defaultPostSec: 10,
      retentionDays: 30,
      storageTarget: 'Local',
      isEnabled: true
    });
    setEditingNVR(null);
    setShowAddNVR(true);
  };

  const handleEditNVR = (nvr: any) => {
    setNVRForm({
      name: nvr.name,
      branchId: nvr.branchId,
      vendor: nvr.vendor,
      host: nvr.host,
      apiPort: nvr.apiPort,
      rtspPort: nvr.rtspPort,
      username: nvr.username,
      secret: nvr.secret || '',
      timezone: nvr.timezone,
      clockDriftSec: nvr.clockDriftSec,
      defaultPreSec: nvr.defaultPreSec,
      defaultPostSec: nvr.defaultPostSec,
      retentionDays: nvr.retentionDays,
      storageTarget: nvr.storageTarget,
      isEnabled: nvr.isEnabled
    });
    setEditingNVR(nvr);
    setShowAddNVR(true);
  };

  const handleSaveNVR = () => {
    if (!nvrForm.name || !nvrForm.branchId || !nvrForm.host) {
      alert('Please fill in all required fields');
      return;
    }

    const now = new Date().toISOString();

    if (editingNVR) {
      setNVRs(prev => prev.map(nvr => 
        nvr.id === editingNVR.id 
          ? { ...nvr, ...nvrForm, updatedAt: now }
          : nvr
      ));
    } else {
      const newNVR = {
        id: Date.now().toString(),
        ...nvrForm,
        healthStatus: 'Offline',
        createdAt: now,
        updatedAt: now
      };
      setNVRs(prev => [...prev, newNVR]);
    }

    setShowAddNVR(false);
    setEditingNVR(null);
  };

  const handleAddCamera = () => {
    setCameraForm({
      name: '',
      branchId: '',
      nvrId: '',
      channel: 1,
      rtspUrl: '',
      onvifProfile: '',
      tags: [],
      isEnabled: true
    });
    setEditingCamera(null);
    setShowAddCamera(true);
  };

  const handleEditCamera = (camera: any) => {
    setCameraForm({
      name: camera.name,
      branchId: camera.branchId,
      nvrId: camera.nvrId,
      channel: camera.channel,
      rtspUrl: camera.rtspUrl || '',
      onvifProfile: camera.onvifProfile || '',
      tags: [...camera.tags],
      isEnabled: camera.isEnabled
    });
    setEditingCamera(camera);
    setShowAddCamera(true);
  };

  const handleSaveCamera = () => {
    if (!cameraForm.name || !cameraForm.branchId || !cameraForm.nvrId) {
      alert('Please fill in all required fields');
      return;
    }

    const now = new Date().toISOString();

    if (editingCamera) {
      setCameras(prev => prev.map(camera => 
        camera.id === editingCamera.id 
          ? { ...camera, ...cameraForm, updatedAt: now }
          : camera
      ));
    } else {
      const newCamera = {
        id: Date.now().toString(),
        ...cameraForm,
        healthStatus: 'Offline',
        createdAt: now,
        updatedAt: now
      };
      setCameras(prev => [...prev, newCamera]);
    }

    setShowAddCamera(false);
    setEditingCamera(null);
  };

  const handleDeleteNVR = (id: string) => {
    const nvr = nvrs.find(n => n.id === id);
    if (confirm(`Are you sure you want to delete "${nvr?.name}"? This will also delete all associated cameras.`)) {
      setNVRs(prev => prev.filter(nvr => nvr.id !== id));
      setCameras(prev => prev.filter(camera => camera.nvrId !== id));
    }
  };

  const handleDeleteCamera = (id: string) => {
    const camera = cameras.find(c => c.id === id);
    if (confirm(`Are you sure you want to delete "${camera?.name}"?`)) {
      setCameras(prev => prev.filter(camera => camera.id !== id));
    }
  };

  const handleDiscovery = async () => {
    setIsDiscovering(true);
    // Simulate ONVIF discovery
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsDiscovering(false);
    alert('Discovery completed. Found 2 new cameras on the network.');
  };

  const filteredNVRs = nvrs.filter(nvr => {
    const matchesSearch = nvr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nvr.host.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = selectedBranch === 'all' || nvr.branchId === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  const filteredCameras = cameras.filter(camera => {
    const matchesSearch = camera.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         camera.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesBranch = selectedBranch === 'all' || camera.branchId === selectedBranch;
    return matchesSearch && matchesBranch;
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

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'Online':
        return 'bg-green-100 text-green-800';
      case 'Offline':
        return 'bg-red-100 text-red-800';
      case 'Error':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:text-gray-200';
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
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Overview</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Camera Devices</h1>
            <p className="text-gray-600 mt-1">Manage NVRs and cameras</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {activeTab === 'nvrs' && (
            <button
              onClick={handleAddNVR}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add NVR</span>
            </button>
          )}
          {activeTab === 'cameras' && (
            <button
              onClick={handleAddCamera}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Camera</span>
            </button>
          )}
          {activeTab === 'discovery' && (
            <button
              onClick={handleDiscovery}
              disabled={isDiscovering}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isDiscovering ? 'Discovering...' : 'Start Discovery'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'nvrs', label: 'NVRs', icon: Monitor },
              { id: 'cameras', label: 'Cameras', icon: Camera },
              { id: 'discovery', label: 'Discovery', icon: Zap }
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
          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Branches</option>
                  {mockBranches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {activeTab === 'nvrs' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">NVR</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Branch</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Vendor</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Host</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Cameras</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Last Heartbeat</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredNVRs.map((nvr) => {
                    const branch = mockBranches.find(b => b.id === nvr.branchId);
                    const cameraCount = cameras.filter(c => c.nvrId === nvr.id).length;
                    const HealthIcon = getHealthStatusIcon(nvr.healthStatus);
                    
                    return (
                      <tr key={nvr.id} className="hover:bg-gray-50 dark:bg-gray-900">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Monitor className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{nvr.name}</p>
                              <p className="text-sm text-gray-500">ID: {nvr.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 dark:text-gray-100">{branch?.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            {nvr.vendor}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-mono text-sm text-gray-900 dark:text-gray-100">{nvr.host}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(nvr.healthStatus)}`}>
                            <HealthIcon className="w-3 h-3" />
                            <span>{nvr.healthStatus}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-900 dark:text-gray-100">{cameraCount} cameras</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 dark:text-gray-100">{formatDate(nvr.lastHeartbeatAt)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditNVR(nvr)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteNVR(nvr.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'cameras' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Camera</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Branch</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">NVR</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Channel</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Tags</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Last Heartbeat</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCameras.map((camera) => {
                    const branch = mockBranches.find(b => b.id === camera.branchId);
                    const nvr = nvrs.find(n => n.id === camera.nvrId);
                    const HealthIcon = getHealthStatusIcon(camera.healthStatus);
                    
                    return (
                      <tr key={camera.id} className="hover:bg-gray-50 dark:bg-gray-900">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Camera className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{camera.name}</p>
                              <p className="text-sm text-gray-500">Ch {camera.channel}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 dark:text-gray-100">{branch?.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-900 dark:text-gray-100">{nvr?.name}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {camera.channel}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {camera.tags.map(tag => (
                              <span key={tag} className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(camera.healthStatus)}`}>
                            <HealthIcon className="w-3 h-3" />
                            <span>{camera.healthStatus}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 dark:text-gray-100">{formatDate(camera.lastHeartbeatAt)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditCamera(camera)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCamera(camera.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'discovery' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">ONVIF Discovery</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Automatically discover cameras on your network using ONVIF protocol. 
                This will scan local subnets and pre-fill camera forms.
              </p>
              {isDiscovering ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  <span className="text-gray-600 dark:text-gray-400">Scanning network...</span>
                </div>
              ) : (
                <button
                  onClick={handleDiscovery}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-all flex items-center space-x-2 mx-auto"
                >
                  <Zap className="w-5 h-5" />
                  <span>Start Discovery</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit NVR Modal */}
      {showAddNVR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {editingNVR ? 'Edit NVR' : 'Add New NVR'}
              </h3>
              <button
                onClick={() => setShowAddNVR(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NVR Name *
                  </label>
                  <input
                    type="text"
                    value={nvrForm.name}
                    onChange={(e) => setNVRForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter NVR name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch *
                  </label>
                  <select
                    value={nvrForm.branchId}
                    onChange={(e) => setNVRForm(prev => ({ ...prev, branchId: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Branch</option>
                    {mockBranches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor *
                  </label>
                  <select
                    value={nvrForm.vendor}
                    onChange={(e) => setNVRForm(prev => ({ ...prev, vendor: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {vendors.map(vendor => (
                      <option key={vendor} value={vendor}>{vendor}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Host/IP *
                  </label>
                  <input
                    type="text"
                    value={nvrForm.host}
                    onChange={(e) => setNVRForm(prev => ({ ...prev, host: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="192.168.1.100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={nvrForm.username}
                    onChange={(e) => setNVRForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="admin"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSaveNVR}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingNVR ? 'Update NVR' : 'Add NVR'}</span>
                </button>
                <button
                  onClick={() => setShowAddNVR(false)}
                  className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Camera Modal */}
      {showAddCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {editingCamera ? 'Edit Camera' : 'Add New Camera'}
              </h3>
              <button
                onClick={() => setShowAddCamera(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Camera Name *
                  </label>
                  <input
                    type="text"
                    value={cameraForm.name}
                    onChange={(e) => setCameraForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter camera name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch *
                  </label>
                  <select
                    value={cameraForm.branchId}
                    onChange={(e) => {
                      setCameraForm(prev => ({ ...prev, branchId: e.target.value, nvrId: '' }));
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Branch</option>
                    {mockBranches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NVR *
                  </label>
                  <select
                    value={cameraForm.nvrId}
                    onChange={(e) => setCameraForm(prev => ({ ...prev, nvrId: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select NVR</option>
                    {nvrs.filter(nvr => nvr.branchId === cameraForm.branchId).map(nvr => (
                      <option key={nvr.id} value={nvr.id}>{nvr.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channel *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="32"
                    value={cameraForm.channel}
                    onChange={(e) => setCameraForm(prev => ({ ...prev, channel: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {cameraTagOptions.map(tag => (
                    <label key={tag} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={cameraForm.tags.includes(tag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCameraForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                          } else {
                            setCameraForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSaveCamera}
                  className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingCamera ? 'Update Camera' : 'Add Camera'}</span>
                </button>
                <button
                  onClick={() => setShowAddCamera(false)}
                  className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}