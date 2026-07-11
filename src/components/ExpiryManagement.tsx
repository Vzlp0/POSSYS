import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Package, 
  MapPin, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  ArrowLeft,
  Settings,
  Trash2,
  ArrowRightLeft,
  Printer,
  Save,
  X,
  Eye,
  BarChart3
} from 'lucide-react';

interface BatchItem {
  id: string;
  itemCode: string;
  itemName: string;
  batchNumber: string;
  availableQuantity: number;
  unit: string;
  expiryDate: string | null;
  locationId: string;
  locationName: string;
  locationType: 'warehouse' | 'store' | 'display' | 'storage';
  status: 'Active' | 'Near Expiry' | 'Expired';
  daysToExpiry: number;
}

interface ItemSummary {
  itemCode: string;
  itemName: string;
  unit: string;
  totalQuantity: number;
  numberOfBatches: number;
  earliestExpiry: string | null;
  latestExpiry: string | null;
  batches: BatchItem[];
}

// Mock batch data
const mockBatches: BatchItem[] = [];

interface ExpiryManagementProps {
  onBack: () => void;
}

export default function ExpiryManagement({ onBack }: ExpiryManagementProps) {
  const [batches, setBatches] = useState<BatchItem[]>(mockBatches);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showBatchDetails, setShowBatchDetails] = useState<string | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState<any[]>([]);
  const [showActionModal, setShowActionModal] = useState<{
    batchId: string;
    action: 'damage' | 'writeoff' | 'transfer';
    quantity: string;
    reason: string;
    transferLocation: string;
  } | null>(null);
  const [settings, setSettings] = useState({
    nearExpiryDays: 30,
    blockExpiredSales: true
  });

  // Generate item summaries from batches
  const generateItemSummaries = (): ItemSummary[] => {
    const itemMap = new Map<string, ItemSummary>();

    // Filter batches to only include items with expiry tracking (have at least one batch with expiry date)
    const expiryTrackedBatches = batches.filter(batch => batch.expiryDate !== null);
    
    // Group by item to check if item has any expiry-tracked batches
    const itemsWithExpiry = new Set<string>();
    expiryTrackedBatches.forEach(batch => {
      itemsWithExpiry.add(batch.itemCode);
    });
    
    // Only process batches for items that have expiry tracking
    const filteredBatches = batches.filter(batch => itemsWithExpiry.has(batch.itemCode));

    filteredBatches.forEach(batch => {
      const key = batch.itemCode;
      
      if (!itemMap.has(key)) {
        itemMap.set(key, {
          itemCode: batch.itemCode,
          itemName: batch.itemName,
          unit: batch.unit,
          totalQuantity: 0,
          numberOfBatches: 0,
          earliestExpiry: null,
          latestExpiry: null,
          batches: []
        });
      }

      const item = itemMap.get(key)!;
      item.totalQuantity += batch.availableQuantity;
      item.numberOfBatches += 1;
      item.batches.push(batch);

      // Update earliest and latest expiry (only for batches with expiry dates)
      if (batch.expiryDate) {
        if (!item.earliestExpiry || batch.expiryDate < item.earliestExpiry) {
          item.earliestExpiry = batch.expiryDate;
        }
        if (!item.latestExpiry || batch.expiryDate > item.latestExpiry) {
          item.latestExpiry = batch.expiryDate;
        }
      }
    });

    return Array.from(itemMap.values());
  };

  const itemSummaries = generateItemSummaries();

  const filteredItems = itemSummaries.filter(item => {
    const matchesSearch = 
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLocationTypeColor = (locationType: string) => {
    switch (locationType) {
      case 'warehouse':
        return 'bg-blue-100 text-blue-800';
      case 'store':
        return 'bg-green-100 text-green-800';
      case 'display':
        return 'bg-purple-100 text-purple-800';
      case 'storage':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:text-gray-200';
    }
  };

  const getStatusBadge = (status: BatchItem['status']) => {
    const statusConfig = {
      'Active': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      'Near Expiry': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      'Expired': { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle }
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <Icon className="w-3 h-3" />
        <span>{status}</span>
      </div>
    );
  };

  const handleAction = (batchId: string, action: 'damage' | 'writeoff' | 'transfer') => {
    setShowActionModal({
      batchId,
      action,
      quantity: '',
      reason: '',
      transferLocation: ''
    });
  };

  const executeAction = () => {
    if (!showActionModal) return;

    const { batchId, action, quantity, reason } = showActionModal;
    const quantityNum = parseInt(quantity);
    
    if (!quantityNum || quantityNum <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    if (!reason.trim()) {
      alert('Please provide a reason');
      return;
    }

    setBatches(prev => prev.map(batch => {
      if (batch.id === batchId) {
        const newQuantity = Math.max(0, batch.availableQuantity - quantityNum);
        return { ...batch, availableQuantity: newQuantity };
      }
      return batch;
    }));

    console.log(`${action} executed:`, { batchId, quantity: quantityNum, reason });
    setShowActionModal(null);
  };

  const printTag = (batch: BatchItem) => {
    const tags = [{
      itemName: batch.itemName,
      itemCode: batch.itemCode,
      batchNumber: batch.batchNumber,
      quantity: batch.availableQuantity,
      unit: batch.unit,
      expiryDate: batch.expiryDate,
      locationName: batch.locationName
    }];
    
    setShowPrintPreview(tags);
  };

  const handlePrintTags = () => {
    alert(`Printing ${showPrintPreview.length} batch tags...`);
    setShowPrintPreview([]);
  };

  const saveSettings = () => {
    console.log('Settings saved:', settings);
    setShowSettings(false);
  };

  // Settings Modal
  if (showSettings) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSettings(false)}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Expiry Management</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Expiry Settings</h1>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Near Expiry Warning Days
              </label>
              <input
                type="number"
                value={settings.nearExpiryDays}
                onChange={(e) => setSettings(prev => ({ ...prev, nearExpiryDays: parseInt(e.target.value) || 30 }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="365"
              />
              <p className="text-sm text-gray-500 mt-1">
                Items will be marked as "Near Expiry" when they expire within this many days
              </p>
            </div>

            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.blockExpiredSales}
                  onChange={(e) => setSettings(prev => ({ ...prev, blockExpiredSales: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Block Expired Item Sales</span>
                  <p className="text-sm text-gray-500">Prevent selling expired items in POS system</p>
                </div>
              </label>
            </div>

            <div className="flex items-center space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={saveSettings}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </button>
              <button
                onClick={() => setShowSettings(false)}
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

  // Batch Details Modal
  if (showBatchDetails) {
    const item = itemSummaries.find(i => i.itemCode === showBatchDetails);
    if (!item) return null;

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowBatchDetails(null)}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Items</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.itemName}</h1>
              <p className="text-gray-600 dark:text-gray-400">Batch Details - {item.itemCode}</p>
            </div>
          </div>
        </div>

        {/* Item Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Item Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity</label>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.totalQuantity} {item.unit}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Batches</label>
              <p className="text-lg font-medium text-blue-600">{item.numberOfBatches}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Earliest Expiry</label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(item.earliestExpiry)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latest Expiry</label>
              <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(item.latestExpiry)}</p>
            </div>
          </div>
        </div>

        {/* Batches Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Batch Details</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {item.batches.map((batch) => (
                  <tr key={batch.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {batch.batchNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {batch.availableQuantity} {batch.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">{formatDate(batch.expiryDate)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{batch.locationName}</p>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${getLocationTypeColor(batch.locationType)}`}>
                            {batch.locationType}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(batch.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleAction(batch.id, 'damage')}
                          className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                          title="Mark as Damaged"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAction(batch.id, 'writeoff')}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Write Off"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAction(batch.id, 'transfer')}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Transfer"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => printTag(batch)}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                          title="Print Tag"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Inventory</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Expiry Management</h1>
              <p className="text-gray-600 mt-1">Monitor and manage item expiry dates by item summary</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{itemSummaries.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Batches</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{batches.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expired Batches</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {batches.filter(b => b.status === 'Expired').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Near Expiry</p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">
                  {batches.filter(b => b.status === 'Near Expiry').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by item code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Item Code</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Item Name</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Total Qty</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Number of Batches</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Earliest Expiry</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Latest Expiry</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr 
                    key={item.itemCode} 
                    className="hover:bg-gray-50 transition-all cursor-pointer"
                    onClick={() => setShowBatchDetails(item.itemCode)}
                  >
                    <td className="py-4 px-6">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {item.itemCode}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{item.itemName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {item.totalQuantity} {item.unit}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {item.numberOfBatches} batches
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-100">{formatDate(item.earliestExpiry)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-100">{formatDate(item.latestExpiry)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowBatchDetails(item.itemCode);
                        }}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="View Batch Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredItems.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your search criteria.</p>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {showActionModal.action === 'damage' ? 'Mark as Damaged' :
                 showActionModal.action === 'writeoff' ? 'Write Off' : 'Transfer'}
              </h3>
              <button
                onClick={() => setShowActionModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={showActionModal.quantity}
                  onChange={(e) => setShowActionModal(prev => prev ? { ...prev, quantity: e.target.value } : null)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter quantity"
                  min="1"
                />
              </div>

              {showActionModal.action === 'transfer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transfer to Location *
                  </label>
                  <select
                    value={showActionModal.transferLocation}
                    onChange={(e) => setShowActionModal(prev => prev ? { ...prev, transferLocation: e.target.value } : null)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Location</option>
                    <option value="Warehouse - Section A1">Warehouse - Section A1</option>
                    <option value="Warehouse - Section B2">Warehouse - Section B2</option>
                    <option value="KC Store - Main Floor">KC Store - Main Floor</option>
                    <option value="Display Area 1">Display Area 1</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason *
                </label>
                <textarea
                  value={showActionModal.reason}
                  onChange={(e) => setShowActionModal(prev => prev ? { ...prev, reason: e.target.value } : null)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter reason for this action"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  onClick={executeAction}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowActionModal(null)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintPreview.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Print Preview - Batch Tags</h3>
              <button
                onClick={() => setShowPrintPreview([])}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {showPrintPreview.map((tag, index) => (
                <div key={index} className="border-2 border-dashed border-gray-300 p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <div className="text-center space-y-2">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">{tag.itemName}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Code: {tag.itemCode}</p>
                    <p className="font-mono text-lg bg-white px-2 py-1 rounded border">
                      {tag.batchNumber}
                    </p>
                    <p className="text-sm">Qty: {tag.quantity} {tag.unit}</p>
                    {tag.expiryDate && (
                      <p className="text-sm text-orange-600">
                        Exp: {formatDate(tag.expiryDate)}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">{tag.locationName}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={handlePrintTags}
                className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print {showPrintPreview.length} Tags</span>
              </button>
              <button
                onClick={() => setShowPrintPreview([])}
                className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}