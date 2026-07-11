import React, { useState } from 'react';
import { 
  Calendar, 
  Camera, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Download, 
  ArrowLeft,
  Clock,
  Building,
  Search,
  Filter
} from 'lucide-react';

// Mock data
const mockBranches = [
  { id: '1', name: 'KC Store', code: 'KC' },
  { id: '2', name: 'Olaya Store', code: 'OL' },
  { id: '3', name: 'Solitaire Store', code: 'SOL' },
  { id: '4', name: 'Jeddah Store', code: 'JED' }
];

const mockCameras = [
  { id: '1', branchId: '1', name: 'Cashier 1', tags: ['cashier', 'pos'] },
  { id: '2', branchId: '1', name: 'Entrance', tags: ['entrance', 'security'] },
  { id: '3', branchId: '1', name: 'Safe Area', tags: ['safe', 'security'] },
  { id: '4', branchId: '2', name: 'Cashier 1', tags: ['cashier', 'pos'] }
];

interface CameraPlaybackProps {
  onBack: () => void;
}

export default function CameraPlayback({ onBack }: CameraPlaybackProps) {
  const [selectedBranch, setSelectedBranch] = useState('1');
  const [selectedCamera, setSelectedCamera] = useState('1');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeRange, setTimeRange] = useState({
    start: '09:00',
    end: '17:00'
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(100);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [exportRange, setExportRange] = useState({
    start: 0,
    end: 100
  });
  const [showExportModal, setShowExportModal] = useState(false);

  const filteredCameras = mockCameras.filter(camera => camera.branchId === selectedBranch);
  const selectedCameraData = mockCameras.find(c => c.id === selectedCamera);
  const selectedBranchData = mockBranches.find(b => b.id === selectedBranch);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    setCurrentTime(newTime);
  };

  const handleExportClip = () => {
    const startTime = formatTime(exportRange.start);
    const endTime = formatTime(exportRange.end);
    const clipDuration = exportRange.end - exportRange.start;
    
    // In real app, this would trigger clip export
    alert(`Exporting clip from ${startTime} to ${endTime} (${Math.floor(clipDuration)}s) for ${selectedCameraData?.name}`);
    setShowExportModal(false);
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
              <h1 className="text-xl font-bold text-white">Camera Playback</h1>
              <p className="text-gray-400 text-sm">Review recorded footage</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Clip</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                const firstCamera = mockCameras.find(c => c.branchId === e.target.value);
                if (firstCamera) setSelectedCamera(firstCamera.id);
              }}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {mockBranches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Camera</label>
            <select
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {filteredCameras.map(camera => (
                <option key={camera.id} value={camera.id}>{camera.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
            <input
              type="time"
              value={timeRange.start}
              onChange={(e) => setTimeRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
            <input
              type="time"
              value={timeRange.end}
              onChange={(e) => setTimeRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="flex-1 bg-black flex items-center justify-center">
        <div className="w-full h-full max-w-6xl max-h-full flex flex-col">
          {/* Video Area */}
          <div className="flex-1 bg-gray-900 flex items-center justify-center">
            <video
              src="https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
              className="max-w-full max-h-full"
              controls={false}
            />
          </div>

          {/* Timeline and Controls */}
          <div className="bg-gray-800 p-4 space-y-4">
            {/* Timeline */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>{formatTime(currentTime)}</span>
                <span>{selectedCameraData?.name} • {selectedBranchData?.name}</span>
                <span>{formatTime(duration)}</span>
              </div>
              
              <div 
                className="relative h-2 bg-gray-700 rounded-full cursor-pointer"
                onClick={handleTimelineClick}
              >
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-600 rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center space-x-6">
              <button
                onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                className="text-white hover:text-blue-400 transition-all"
              >
                <SkipBack className="w-6 h-6" />
              </button>
              
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-all"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>
              
              <button
                onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))}
                className="text-white hover:text-blue-400 transition-all"
              >
                <SkipForward className="w-6 h-6" />
              </button>

              <div className="flex items-center space-x-2 text-white">
                <span className="text-sm">Speed:</span>
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                  className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                >
                  <option value={0.25}>0.25x</option>
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Export Video Clip</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Export Range</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 w-12">Start:</span>
                    <input
                      type="range"
                      min="0"
                      max={duration}
                      value={exportRange.start}
                      onChange={(e) => setExportRange(prev => ({ ...prev, start: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-16">{formatTime(exportRange.start)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 w-12">End:</span>
                    <input
                      type="range"
                      min="0"
                      max={duration}
                      value={exportRange.end}
                      onChange={(e) => setExportRange(prev => ({ ...prev, end: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-16">{formatTime(exportRange.end)}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Duration: {Math.floor(exportRange.end - exportRange.start)} seconds
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Watermark</span>
                    <p className="text-sm text-gray-500">Include branch-timestamp watermark</p>
                  </div>
                </label>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  onClick={handleExportClip}
                  className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Clip</span>
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
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