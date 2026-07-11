import React, { useState } from 'react';
import { 
  Save, 
  ArrowLeft, 
  Camera, 
  Clock, 
  Database, 
  Shield, 
  Webhook, 
  Settings as SettingsIcon,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Plus,
  Activity
} from 'lucide-react';

interface CameraSettingsProps {
  onBack: () => void;
}

export default function CameraSettings({ onBack }: CameraSettingsProps) {
  const [activeTab, setActiveTab] = useState<'capture' | 'storage' | 'retention' | 'webhooks' | 'health'>('capture');
  
  const [captureSettings, setCaptureSettings] = useState({
    defaultPreSec: 10,
    defaultPostSec: 10,
    maxClipLength: 60,
    retries: 3,
    timeoutSec: 30,
    watermarkEnabled: true,
    watermarkText: '{branch}-{register}-{timestamp}',
    posOverlayEnabled: true
  });

  const [storageSettings, setStorageSettings] = useState({
    storagePath: '/var/camera-storage',
    cloudBucket: 'camera-clips-bucket',
    folderPattern: '{branch}/{YYYY}/{MM}/{DD}/{event_id}/',
    useCloud: false
  });

  const [retentionSettings, setRetentionSettings] = useState({
    retentionDays: 30,
    thumbnailRetentionDays: 90,
    autoPurgeEnabled: true,
    purgeSchedule: '02:00'
  });

  const [webhookSettings, setWebhookSettings] = useState({
    webhookSecret: 'pos-webhook-secret-key',
    hmacSigningKey: 'hmac-signing-key',
    outboundWebhookUrls: ['https://api.example.com/camera-events']
  });

  const [healthSettings, setHealthSettings] = useState({
    heartbeatInterval: 60,
    offlineThreshold: 300,
    alertEnabled: true,
    alertEmail: 'admin@company.com'
  });

  const handleSaveSettings = () => {
    // In real app, this would save to database
    console.log('Saving settings:', {
      capture: captureSettings,
      storage: storageSettings,
      retention: retentionSettings,
      webhooks: webhookSettings,
      health: healthSettings
    });
    alert('Settings saved successfully!');
  };

  const addWebhookUrl = () => {
    setWebhookSettings(prev => ({
      ...prev,
      outboundWebhookUrls: [...prev.outboundWebhookUrls, '']
    }));
  };

  const removeWebhookUrl = (index: number) => {
    setWebhookSettings(prev => ({
      ...prev,
      outboundWebhookUrls: prev.outboundWebhookUrls.filter((_, i) => i !== index)
    }));
  };

  const updateWebhookUrl = (index: number, url: string) => {
    setWebhookSettings(prev => ({
      ...prev,
      outboundWebhookUrls: prev.outboundWebhookUrls.map((existingUrl, i) => 
        i === index ? url : existingUrl
      )
    }));
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Camera Settings</h1>
            <p className="text-gray-600 mt-1">Configure capture, storage, and integration settings</p>
          </div>
        </div>
        <button
          onClick={handleSaveSettings}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Save All Settings</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'capture', label: 'Capture Settings', icon: Camera },
              { id: 'storage', label: 'Storage', icon: Database },
              { id: 'retention', label: 'Retention', icon: Clock },
              { id: 'webhooks', label: 'Webhooks & API', icon: Webhook },
              { id: 'health', label: 'Health & Logs', icon: Activity }
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
          {activeTab === 'capture' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Capture Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Pre-Event Seconds
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={captureSettings.defaultPreSec}
                      onChange={(e) => setCaptureSettings(prev => ({ ...prev, defaultPreSec: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Post-Event Seconds
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={captureSettings.defaultPostSec}
                      onChange={(e) => setCaptureSettings(prev => ({ ...prev, defaultPostSec: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Clip Length (seconds)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="300"
                      value={captureSettings.maxClipLength}
                      onChange={(e) => setCaptureSettings(prev => ({ ...prev, maxClipLength: parseInt(e.target.value) || 60 }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capture Timeout (seconds)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="120"
                      value={captureSettings.timeoutSec}
                      onChange={(e) => setCaptureSettings(prev => ({ ...prev, timeoutSec: parseInt(e.target.value) || 30 }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={captureSettings.watermarkEnabled}
                      onChange={(e) => setCaptureSettings(prev => ({ ...prev, watermarkEnabled: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Watermark</span>
                      <p className="text-sm text-gray-500">Add timestamp and branch info to clips</p>
                    </div>
                  </label>

                  {captureSettings.watermarkEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Watermark Template
                      </label>
                      <input
                        type="text"
                        value={captureSettings.watermarkText}
                        onChange={(e) => setCaptureSettings(prev => ({ ...prev, watermarkText: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="{branch}-{register}-{timestamp}"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Available variables: {'{branch}'}, {'{register}'}, {'{timestamp}'}, {'{invoice}'}
                      </p>
                    </div>
                  )}

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={captureSettings.posOverlayEnabled}
                      onChange={(e) => setCaptureSettings(prev => ({ ...prev, posOverlayEnabled: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">POS Receipt Overlay</span>
                      <p className="text-sm text-gray-500">Burn receipt data onto video clips</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Configuration</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={storageSettings.useCloud}
                      onChange={(e) => setStorageSettings(prev => ({ ...prev, useCloud: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Use Cloud Storage (S3)</span>
                      <p className="text-sm text-gray-500">Store clips in cloud instead of local storage</p>
                    </div>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {storageSettings.useCloud ? 'S3 Bucket Name' : 'Local Storage Path'}
                    </label>
                    <input
                      type="text"
                      value={storageSettings.useCloud ? storageSettings.cloudBucket : storageSettings.storagePath}
                      onChange={(e) => setStorageSettings(prev => ({
                        ...prev,
                        [storageSettings.useCloud ? 'cloudBucket' : 'storagePath']: e.target.value
                      }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={storageSettings.useCloud ? 'camera-clips-bucket' : '/var/camera-storage'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Folder Structure Pattern
                    </label>
                    <input
                      type="text"
                      value={storageSettings.folderPattern}
                      onChange={(e) => setStorageSettings(prev => ({ ...prev, folderPattern: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="{branch}/{YYYY}/{MM}/{DD}/{event_id}/"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Available variables: {'{branch}'}, {'{YYYY}'}, {'{MM}'}, {'{DD}'}, {'{event_id}'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'retention' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Retention</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Video Clips Retention (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={retentionSettings.retentionDays}
                      onChange={(e) => setRetentionSettings(prev => ({ ...prev, retentionDays: parseInt(e.target.value) || 30 }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thumbnails Retention (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={retentionSettings.thumbnailRetentionDays}
                      onChange={(e) => setRetentionSettings(prev => ({ ...prev, thumbnailRetentionDays: parseInt(e.target.value) || 90 }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={retentionSettings.autoPurgeEnabled}
                      onChange={(e) => setRetentionSettings(prev => ({ ...prev, autoPurgeEnabled: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Auto-Purge</span>
                      <p className="text-sm text-gray-500">Automatically delete old files</p>
                    </div>
                  </label>

                  {retentionSettings.autoPurgeEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Purge Schedule (24h format)
                      </label>
                      <input
                        type="time"
                        value={retentionSettings.purgeSchedule}
                        onChange={(e) => setRetentionSettings(prev => ({ ...prev, purgeSchedule: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                {/* Storage Calculator */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Storage Estimate</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• Estimated 50 events/day × 4 cameras = 200 clips/day</p>
                    <p>• Average clip size: ~10MB (20s @ 4Mbps)</p>
                    <p>• Daily storage: ~2GB</p>
                    <p>• {retentionSettings.retentionDays}-day retention: ~{Math.round(retentionSettings.retentionDays * 2)}GB</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'webhooks' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Webhook Configuration</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Inbound Webhook Secret
                    </label>
                    <input
                      type="text"
                      value={webhookSettings.webhookSecret}
                      onChange={(e) => setWebhookSettings(prev => ({ ...prev, webhookSecret: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter webhook secret"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Used to verify incoming POS events
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HMAC Signing Key
                    </label>
                    <input
                      type="text"
                      value={webhookSettings.hmacSigningKey}
                      onChange={(e) => setWebhookSettings(prev => ({ ...prev, hmacSigningKey: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter HMAC key"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Outbound Webhook URLs
                      </label>
                      <button
                        onClick={addWebhookUrl}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700 transition-all flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add URL</span>
                      </button>
                    </div>
                    <div className="space-y-2">
                      {webhookSettings.outboundWebhookUrls.map((url, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => updateWebhookUrl(index, e.target.value)}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://api.example.com/camera-events"
                          />
                          <button
                            onClick={() => removeWebhookUrl(index)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Monitoring</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heartbeat Interval (seconds)
                    </label>
                    <input
                      type="number"
                      min="30"
                      max="300"
                      value={healthSettings.heartbeatInterval}
                      onChange={(e) => setHealthSettings(prev => ({ ...prev, heartbeatInterval: parseInt(e.target.value) || 60 }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Offline Threshold (seconds)
                    </label>
                    <input
                      type="number"
                      min="60"
                      max="1800"
                      value={healthSettings.offlineThreshold}
                      onChange={(e) => setHealthSettings(prev => ({ ...prev, offlineThreshold: parseInt(e.target.value) || 300 }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={healthSettings.alertEnabled}
                      onChange={(e) => setHealthSettings(prev => ({ ...prev, alertEnabled: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Health Alerts</span>
                      <p className="text-sm text-gray-500">Send notifications when devices go offline</p>
                    </div>
                  </label>

                  {healthSettings.alertEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alert Email
                      </label>
                      <input
                        type="email"
                        value={healthSettings.alertEmail}
                        onChange={(e) => setHealthSettings(prev => ({ ...prev, alertEmail: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="admin@company.com"
                      />
                    </div>
                  )}
                </div>

                {/* Health Status */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Current System Health</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Capture Service: Running</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Storage: Available</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Queue: 3 pending jobs</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Webhooks: Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}