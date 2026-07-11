import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  ArrowLeft,
  Grid3X3,
  Grid2X2,
  Filter,
  Building,
  CheckCircle,
  AlertTriangle,
  WifiOff,
  Download,
  RotateCcw
} from 'lucide-react';

// Mock data
const mockBranches = [
  { id: '1', name: 'KC Store', code: 'KC' },
  { id: '2', name: 'Olaya Store', code: 'OL' },
  { id: '3', name: 'Solitaire Store', code: 'SOL' },
  { id: '4', name: 'Jeddah Store', code: 'JED' }
];

const mockCameras = [
  {
    id: '1',
    branchId: '1',
    name: 'Cashier 1',
    tags: ['cashier', 'pos'],
    healthStatus: 'Online',
    liveUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    isPlaying: true,
    isMuted: true
  },
  {
    id: '2',
    branchId: '1',
    name: 'Entrance',
    tags: ['entrance', 'security'],
    healthStatus: 'Online',
    liveUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    isPlaying: true,
    isMuted: true
  },
  {
    id: '3',
    branchId: '1',
    name: 'Safe Area',
    tags: ['safe', 'security'],
    healthStatus: 'Error',
    liveUrl: null,
    isPlaying: false,
    isMuted: true
  },
  {
    id: '4',
    branchId: '1',
    name: 'Backroom',
    tags: ['backroom', 'storage'],
    healthStatus: 'Online',
    liveUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    isPlaying: true,
    isMuted: true
  },
  {
    id: '5',
    branchId: '2',
    name: 'Cashier 1',
    tags: ['cashier', 'pos'],
    healthStatus: 'Offline',
    liveUrl: null,
    isPlaying: false,
    isMuted: true
  }
];

interface CameraLiveViewProps {
  onBack: () => void;
}

export default function CameraLiveView({ onBack }: CameraLiveViewProps) {
  const [selectedBranch, setSelectedBranch] = useState('1');
  const [gridLayout, setGridLayout] = useState<'2x2' | '3x3'>('2x2');
  const [cameras, setCameras] = useState(mockCameras);
  const [gridCameras, setGridCameras] = useState<any[]>([]);
  const [fullscreenCamera, setFullscreenCamera] = useState<string | null>(null);

  // Filter and arrange cameras for grid
  useEffect(() => {
    const filteredCameras = cameras.filter(camera => 
      camera.branchId === selectedBranch && camera.healthStatus !== 'Offline'
    );
    
    const maxCameras = gridLayout === '2x2' ? 4 : 9;
    setGridCameras(filteredCameras.slice(0, maxCameras));
  }, [selectedBranch, gridLayout, cameras]);

  const handlePlayPause = (cameraId: string) => {
    setCameras(prev => prev.map(camera => 
      camera.id === cameraId 
        ? { ...camera, isPlaying: !camera.isPlaying }
        : camera
    ));
  };

  const handleMuteToggle = (cameraId: string) => {
    setCameras(prev => prev.map(camera => 
      camera.id === cameraId 
        ? { ...camera, isMuted: !camera.isMuted }
        : camera
    ));
  };

  const handleMuteAll = () => {
    setCameras(prev => prev.map(camera => ({ ...camera, isMuted: true })));
  };

  const handleUnmuteAll = () => {
    setCameras(prev => prev.map(camera => ({ ...camera, isMuted: false })));
  };

  const takeSnapshot = (cameraId: string) => {
    const camera = cameras.find(c => c.id === cameraId);
    if (camera) {
      // In real app, this would trigger snapshot capture
      alert(`Snapshot taken for ${camera.name}`);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'Online':
        return 'text-green-400';
      case 'Offline':
        return 'text-red-400';
      case 'Error':
        return 'text-orange-400';
      default:
        return 'text-gray-400';
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
        return Camera;
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Live Camera View</h1>
              <p className="text-gray-400 text-sm">Real-time monitoring dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {mockBranches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setGridLayout('2x2')}
                className={`p-2 rounded-lg transition-all ${
                  gridLayout === '2x2' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Grid2X2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGridLayout('3x3')}
                className={`p-2 rounded-lg transition-all ${
                  gridLayout === '3x3' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleMuteAll}
                className="bg-gray-700 text-gray-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-all flex items-center space-x-1"
              >
                <VolumeX className="w-3 h-3" />
                <span>Mute All</span>
              </button>
              <button
                onClick={handleUnmuteAll}
                className="bg-gray-700 text-gray-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-all flex items-center space-x-1"
              >
                <Volume2 className="w-3 h-3" />
                <span>Unmute All</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Grid */}
      <div className="flex-1 p-6">
        {gridCameras.length > 0 ? (
          <div className={`grid gap-4 h-full ${
            gridLayout === '2x2' ? 'grid-cols-2 grid-rows-2' : 'grid-cols-3 grid-rows-3'
          }`}>
            {gridCameras.map((camera) => {
              const branch = mockBranches.find(b => b.id === camera.branchId);
              const HealthIcon = getHealthStatusIcon(camera.healthStatus);
              
              return (
                <div key={camera.id} className="bg-gray-800 rounded-lg overflow-hidden relative group">
                  {/* Video Feed */}
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    {camera.liveUrl && camera.healthStatus === 'Online' ? (
                      <video
                        src={camera.liveUrl}
                        className="w-full h-full object-cover"
                        autoPlay={camera.isPlaying}
                        muted={camera.isMuted}
                        loop
                      />
                    ) : (
                      <div className="text-center text-gray-400">
                        <Camera className="w-16 h-16 mx-auto mb-4" />
                        <p className="text-lg font-medium">{camera.name}</p>
                        <p className="text-sm">
                          {camera.healthStatus === 'Offline' ? 'Camera Offline' :
                           camera.healthStatus === 'Error' ? 'Connection Error' :
                           'No Signal'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Camera Info Overlay */}
                  <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <HealthIcon className={`w-4 h-4 ${getHealthStatusColor(camera.healthStatus)}`} />
                      <span className="font-medium">{camera.name}</span>
                    </div>
                    <p className="text-sm text-gray-300">{branch?.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {camera.tags.map(tag => (
                        <span key={tag} className="text-xs bg-blue-600 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Controls Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePlayPause(camera.id)}
                        className="bg-black bg-opacity-70 text-white p-2 rounded-lg hover:bg-opacity-90 transition-all"
                        disabled={camera.healthStatus !== 'Online'}
                      >
                        {camera.isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleMuteToggle(camera.id)}
                        className="bg-black bg-opacity-70 text-white p-2 rounded-lg hover:bg-opacity-90 transition-all"
                        disabled={camera.healthStatus !== 'Online'}
                      >
                        {camera.isMuted ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => takeSnapshot(camera.id)}
                        className="bg-black bg-opacity-70 text-white p-2 rounded-lg hover:bg-opacity-90 transition-all"
                        disabled={camera.healthStatus !== 'Online'}
                        title="Take Snapshot"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setFullscreenCamera(camera.id)}
                        className="bg-black bg-opacity-70 text-white p-2 rounded-lg hover:bg-opacity-90 transition-all"
                        disabled={camera.healthStatus !== 'Online'}
                        title="Fullscreen"
                      >
                        <Maximize className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty Grid Slots */}
            {Array.from({ length: (gridLayout === '2x2' ? 4 : 9) - gridCameras.length }).map((_, index) => (
              <div key={`empty-${index}`} className="bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Camera className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Empty Slot</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <Camera className="w-24 h-24 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">No Cameras Available</h2>
              <p className="text-lg mb-6">
                No online cameras found for the selected branch.
              </p>
              <button
                onClick={onBack}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-all"
              >
                Back to Overview
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {fullscreenCamera && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="relative w-full h-full">
            {(() => {
              const camera = cameras.find(c => c.id === fullscreenCamera);
              if (!camera) return null;
              
              return (
                <>
                  {camera.liveUrl ? (
                    <video
                      src={camera.liveUrl}
                      className="w-full h-full object-contain"
                      autoPlay={camera.isPlaying}
                      muted={camera.isMuted}
                      loop
                      controls
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <div className="text-center">
                        <Camera className="w-32 h-32 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold mb-4">{camera.name}</h2>
                        <p className="text-xl">Camera Offline</p>
                      </div>
                    </div>
                  )}

                  {/* Fullscreen Controls */}
                  <div className="absolute top-6 left-6 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg">
                    <h3 className="font-bold text-lg">{camera.name}</h3>
                    <p className="text-sm text-gray-300">
                      {mockBranches.find(b => b.id === camera.branchId)?.name}
                    </p>
                  </div>

                  <div className="absolute top-6 right-6">
                    <button
                      onClick={() => setFullscreenCamera(null)}
                      className="bg-black bg-opacity-70 text-white p-3 rounded-lg hover:bg-opacity-90 transition-all"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}