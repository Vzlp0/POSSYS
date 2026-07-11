import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Save, 
  Eye, 
  Trash2, 
  Move, 
  Type, 
  List, 
  DollarSign, 
  QrCode, 
  Image, 
  Video,
  Palette,
  Monitor,
  Smartphone,
  Square,
  Settings,
  Upload,
  Grid,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  BarChart3
} from 'lucide-react';
import { MenuTemplate, TemplateZone, MediaAsset } from '../types';

// Mock data
const mockTemplates: MenuTemplate[] = [
  {
    id: '1',
    name: 'Lux Single Board',
    branchId: '1',
    bgMode: 'image',
    bgColor: '#1f2937',
    bgMediaId: '1',
    zones: [
      {
        id: '1',
        type: 'priceboard',
        x: 50,
        y: 100,
        w: 600,
        h: 800,
        style: {
          fontFamily: 'Inter',
          fontSize: 24,
          fontWeight: 'bold',
          textAlign: 'left',
          color: '#ffffff',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: 20,
          borderRadius: 12
        },
        bindings: {
          categories: ['Coffee', 'Pastries'],
          hideOOS: true
        }
      }
    ]
  }
];

const mockMediaAssets: MediaAsset[] = [
  {
    id: '1',
    title: 'Coffee Shop Background',
    type: 'image',
    fileUrl: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg',
    aspect: '16:9',
    branchId: '1'
  },
  {
    id: '2',
    title: 'Morning Promo Video',
    type: 'video',
    fileUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    durationSec: 30,
    aspect: '16:9',
    branchId: '1'
  }
];

const mockPlaylists = [
  {
    id: '1',
    name: 'Main Menu',
    branchId: '1',
    templateId: '1',
    rotation: []
  },
  {
    id: '2', 
    name: 'Breakfast Special',
    branchId: '1',
    templateId: '1',
    rotation: []
  }
];

const resolutionPresets = [
  { name: 'HD Landscape', width: 1920, height: 1080, aspect: '16:9' },
  { name: 'HD Portrait', width: 1080, height: 1920, aspect: '9:16' },
  { name: 'Square', width: 1080, height: 1080, aspect: '1:1' },
  { name: 'Standard', width: 1280, height: 720, aspect: '16:9' }
];

const zoneTypes = [
  { type: 'text', label: 'Text', icon: Type, description: 'Title or paragraph text' },
  { type: 'priceboard', label: 'Price Board', icon: DollarSign, description: 'List of items with prices' },
  { type: 'list', label: 'Item List', icon: List, description: 'Simple list of items' },
  { type: 'image', label: 'Image', icon: Image, description: 'Static image' },
  { type: 'video', label: 'Video', icon: Video, description: 'Video content' },
  { type: 'qr', label: 'QR Code', icon: QrCode, description: 'QR code with URL' }
];

const fontFamilies = ['Inter', 'Arial', 'Helvetica', 'Georgia', 'Times New Roman'];
const categories = ['Coffee', 'Pastries', 'Beverages', 'Specialty', 'Promotions'];

interface TemplateDesignerProps {
  onBack: () => void;
}

export default function TemplateDesigner({ onBack }: TemplateDesignerProps) {
  const [templates, setTemplates] = useState<MenuTemplate[]>(mockTemplates);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(mockMediaAssets);
  const [selectedTemplate, setSelectedTemplate] = useState<MenuTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [canvasResolution, setCanvasResolution] = useState(resolutionPresets[0]);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState<{ type: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    bgMode: 'color' as 'color' | 'image' | 'video',
    bgColor: '#1f2937',
    bgMediaId: '',
    zones: [] as TemplateZone[]
  });

  const [zoneForm, setZoneForm] = useState({
    type: 'text',
    x: 100,
    y: 100,
    w: 300,
    h: 100,
    style: {
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: 'normal',
      textAlign: 'left' as 'left' | 'center' | 'right',
      color: '#000000',
      backgroundColor: 'transparent',
      padding: 10,
      borderRadius: 0
    },
    bindings: {
      categories: [] as string[],
      hideOOS: true,
      url: ''
    }
  });

  const handleNewTemplate = () => {
    setFormData({
      name: '',
      bgMode: 'color',
      bgColor: '#1f2937',
      bgMediaId: '',
      zones: []
    });
    setSelectedTemplate(null);
    setIsEditing(true);
  };

  const handleEditTemplate = (template: MenuTemplate) => {
    setFormData({
      name: template.name,
      bgMode: template.bgMode,
      bgColor: template.bgColor || '#1f2937',
      bgMediaId: template.bgMediaId || '',
      zones: [...template.zones]
    });
    setSelectedTemplate(template);
    setIsEditing(true);
  };

  const handleSaveTemplate = () => {
    if (!formData.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    const now = new Date().toISOString();

    if (selectedTemplate) {
      // Update existing template
      const updatedTemplate: MenuTemplate = {
        ...selectedTemplate,
        name: formData.name,
        bgMode: formData.bgMode,
        bgColor: formData.bgColor,
        bgMediaId: formData.bgMediaId,
        zones: formData.zones
      };

      setTemplates(prev => prev.map(template => 
        template.id === selectedTemplate.id ? updatedTemplate : template
      ));
      setSelectedTemplate(updatedTemplate);
    } else {
      // Create new template
      const newTemplate: MenuTemplate = {
        id: Date.now().toString(),
        name: formData.name,
        branchId: '1',
        bgMode: formData.bgMode,
        bgColor: formData.bgColor,
        bgMediaId: formData.bgMediaId,
        zones: formData.zones
      };

      setTemplates(prev => [...prev, newTemplate]);
      setSelectedTemplate(newTemplate);
    }

    setIsEditing(false);
  };

  const handleAddZone = () => {
    const newZone: TemplateZone = {
      id: Date.now().toString(),
      type: zoneForm.type as any,
      x: zoneForm.x,
      y: zoneForm.y,
      w: zoneForm.w,
      h: zoneForm.h,
      style: { ...zoneForm.style },
      bindings: { ...zoneForm.bindings }
    };

    setFormData(prev => ({
      ...prev,
      zones: [...prev.zones, newZone]
    }));

    setShowZoneModal(null);
  };

  const handleDeleteZone = (zoneId: string) => {
    setFormData(prev => ({
      ...prev,
      zones: prev.zones.filter(zone => zone.id !== zoneId)
    }));
    setSelectedZone(null);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(prev => prev.filter(template => template.id !== templateId));
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
        setIsEditing(false);
      }
    }
  };

  const getZoneIcon = (type: string) => {
    const zoneType = zoneTypes.find(zt => zt.type === type);
    return zoneType ? zoneType.icon : Type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Template Editor View
  if (isEditing) {
    return (
      <div className="h-screen bg-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsEditing(false)}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Templates</span>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedTemplate ? 'Edit Template' : 'New Template'}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-gray-600 dark:text-gray-400">Menu Screens</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600 dark:text-gray-400">Template Designer</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-900 font-medium">Editor</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={`${canvasResolution.width}x${canvasResolution.height}`}
                onChange={(e) => {
                  const preset = resolutionPresets.find(p => `${p.width}x${p.height}` === e.target.value);
                  if (preset) setCanvasResolution(preset);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {resolutionPresets.map(preset => (
                  <option key={`${preset.width}x${preset.height}`} value={`${preset.width}x${preset.height}`}>
                    {preset.name} ({preset.width}×{preset.height})
                  </option>
                ))}
              </select>
              <button
                onClick={handleSaveTemplate}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Template</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Left Panel - Properties */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            {/* Template Properties */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Properties</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter template name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background
                  </label>
                  <div className="space-y-2">
                    <select
                      value={formData.bgMode}
                      onChange={(e) => setFormData(prev => ({ ...prev, bgMode: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="color">Solid Color</option>
                      <option value="image">Background Image</option>
                      <option value="video">Background Video</option>
                    </select>

                    {formData.bgMode === 'color' && (
                      <input
                        type="color"
                        value={formData.bgColor}
                        onChange={(e) => setFormData(prev => ({ ...prev, bgColor: e.target.value }))}
                        className="w-full h-10 border border-gray-300 rounded-lg"
                      />
                    )}

                    {(formData.bgMode === 'image' || formData.bgMode === 'video') && (
                      <div>
                        <button
                          onClick={() => setShowMediaModal(true)}
                          className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all"
                        >
                          Select Media
                        </button>
                        {formData.bgMediaId && (
                          <p className="text-sm text-gray-600 mt-1">
                            {mediaAssets.find(m => m.id === formData.bgMediaId)?.title}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Add Zones */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Zones</h3>
              <div className="grid grid-cols-2 gap-2">
                {zoneTypes.map((zoneType) => {
                  const Icon = zoneType.icon;
                  return (
                    <button
                      key={zoneType.type}
                      onClick={() => setShowZoneModal({ type: zoneType.type })}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all text-center"
                    >
                      <Icon className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{zoneType.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zone Properties */}
            {selectedZone && (
              <div className="flex-1 p-4 overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Zone Properties</h3>
                <div className="space-y-4">
                  {/* Zone styling controls would go here */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Zone ID: {selectedZone}</p>
                    <p className="text-xs text-gray-500 mt-1">Select a zone to edit its properties</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Center - Canvas */}
          <div className="flex-1 bg-gray-200 p-8 overflow-auto">
            <div className="flex justify-center">
              <div 
                className="bg-white shadow-2xl relative"
                style={{
                  width: Math.min(canvasResolution.width * 0.5, 960),
                  height: Math.min(canvasResolution.height * 0.5, 540),
                  backgroundColor: formData.bgMode === 'color' ? formData.bgColor : '#ffffff'
                }}
              >
                {/* Background Media */}
                {formData.bgMode !== 'color' && formData.bgMediaId && (
                  <div className="absolute inset-0">
                    {(() => {
                      const media = mediaAssets.find(m => m.id === formData.bgMediaId);
                      if (!media) return null;
                      
                      if (media.type === 'image') {
                        return (
                          <img
                            src={media.fileUrl}
                            alt={media.title}
                            className="w-full h-full object-cover"
                          />
                        );
                      } else {
                        return (
                          <video
                            src={media.fileUrl}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                          />
                        );
                      }
                    })()}
                  </div>
                )}

                {/* Zones */}
                {formData.zones.map((zone) => {
                  const ZoneIcon = getZoneIcon(zone.type);
                  const isSelected = selectedZone === zone.id;
                  
                  return (
                    <div
                      key={zone.id}
                      className={`absolute border-2 cursor-pointer transition-all ${
                        isSelected ? 'border-blue-500 bg-blue-50 bg-opacity-50' : 'border-dashed border-gray-400 hover:border-blue-400'
                      }`}
                      style={{
                        left: zone.x * 0.5,
                        top: zone.y * 0.5,
                        width: zone.w * 0.5,
                        height: zone.h * 0.5,
                        backgroundColor: zone.style.backgroundColor || 'transparent',
                        borderRadius: zone.style.borderRadius || 0
                      }}
                      onClick={() => setSelectedZone(zone.id)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white bg-opacity-90 px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                          <ZoneIcon className="w-3 h-3" />
                          <span>{zone.type}</span>
                        </div>
                      </div>
                      
                      {/* Zone Content Preview */}
                      {zone.type === 'text' && (
                        <div 
                          className="p-2 text-xs"
                          style={{
                            fontFamily: zone.style.fontFamily,
                            fontSize: (zone.style.fontSize || 24) * 0.3,
                            fontWeight: zone.style.fontWeight,
                            textAlign: zone.style.textAlign,
                            color: zone.style.color
                          }}
                        >
                          Sample Text
                        </div>
                      )}
                      
                      {zone.type === 'priceboard' && (
                        <div className="p-2 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Coffee</span>
                            <span>$4.50</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pastry</span>
                            <span>$3.75</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Grid Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                  <div 
                    className="w-full h-full"
                    style={{
                      backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Zone List */}
          <div className="w-64 bg-white border-l border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Zones ({formData.zones.length})</h3>
            <div className="space-y-2">
              {formData.zones.map((zone) => {
                const ZoneIcon = getZoneIcon(zone.type);
                const isSelected = selectedZone === zone.id;
                
                return (
                  <div
                    key={zone.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                    }`}
                    onClick={() => setSelectedZone(zone.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ZoneIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 capitalize">{zone.type}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteZone(zone.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {zone.x}, {zone.y} • {zone.w}×{zone.h}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Add Zone Modal */}
        {showZoneModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add {showZoneModal.type} Zone</h3>
                <button
                  onClick={() => setShowZoneModal(null)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">X Position</label>
                    <input
                      type="number"
                      value={zoneForm.x}
                      onChange={(e) => setZoneForm(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Y Position</label>
                    <input
                      type="number"
                      value={zoneForm.y}
                      onChange={(e) => setZoneForm(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                    <input
                      type="number"
                      value={zoneForm.w}
                      onChange={(e) => setZoneForm(prev => ({ ...prev, w: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                    <input
                      type="number"
                      value={zoneForm.h}
                      onChange={(e) => setZoneForm(prev => ({ ...prev, h: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {showZoneModal.type === 'priceboard' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                    <div className="space-y-2">
                      {categories.map(category => (
                        <label key={category} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={zoneForm.bindings.categories.includes(category)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setZoneForm(prev => ({
                                  ...prev,
                                  bindings: {
                                    ...prev.bindings,
                                    categories: [...prev.bindings.categories, category]
                                  }
                                }));
                              } else {
                                setZoneForm(prev => ({
                                  ...prev,
                                  bindings: {
                                    ...prev.bindings,
                                    categories: prev.bindings.categories.filter(c => c !== category)
                                  }
                                }));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4 pt-4">
                  <button
                    onClick={handleAddZone}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all"
                  >
                    Add Zone
                  </button>
                  <button
                    onClick={() => setShowZoneModal(null)}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Media Selection Modal */}
        {showMediaModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Select Media Asset</h3>
                <button
                  onClick={() => setShowMediaModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mediaAssets
                  .filter(asset => asset.type === formData.bgMode)
                  .map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, bgMediaId: asset.id }));
                        setShowMediaModal(false);
                      }}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-all text-left"
                    >
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        {asset.type === 'image' ? (
                          <img
                            src={asset.fileUrl}
                            alt={asset.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{asset.title}</p>
                      <p className="text-sm text-gray-500">{asset.aspect}</p>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Template Designer</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-gray-600 dark:text-gray-400">Menu Screens</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">Template Designer</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleNewTemplate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Template</span>
        </button>
      </div>

      {/* Starter Templates */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Starter Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all">
            <div className="aspect-video bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg mb-4 flex items-center justify-center">
              <Monitor className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Lux Single Board</h3>
            <p className="text-sm text-gray-600 mb-4">Hero image/video right, priceboard left</p>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-all">
              Use Template
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-all">
            <div className="aspect-video bg-gradient-to-r from-green-500 to-green-600 rounded-lg mb-4 flex items-center justify-center">
              <Grid className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Grid Café</h3>
            <p className="text-sm text-gray-600 mb-4">3 columns of items with thumbnails</p>
            <button className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-all">
              Use Template
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-all">
            <div className="aspect-video bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg mb-4 flex items-center justify-center">
              <Video className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Promo Loop</h3>
            <p className="text-sm text-gray-600 mb-4">Full-bleed video + floating priceboard</p>
            <button className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition-all">
              Use Template
            </button>
          </div>
        </div>
      </div>

      {/* Existing Templates */}
      <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Your Templates</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Template</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Background</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Zones</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Used By</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900 dark:text-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50 dark:bg-gray-900">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{template.name}</p>
                        <p className="text-sm text-gray-500">Template ID: {template.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                      {template.bgMode}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-900 dark:text-gray-100">{template.zones.length} zones</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-900 dark:text-gray-100">
                      {mockPlaylists.filter(p => p.templateId === template.id).length} playlists
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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

      {templates.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-600 mb-4">Create your first template to get started.</p>
          <button
            onClick={handleNewTemplate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            Create Your First Template
          </button>
        </div>
      )}
    </div>
  );
}