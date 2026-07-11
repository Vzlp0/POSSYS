import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  ArrowLeft,
  Save,
  X,
  Package,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertTriangle,
  User,
  Calendar,
  Building,
  FileText,
  ClipboardCheck
} from 'lucide-react';
import { InterBranchTransfer as InterBranchTransferType } from '../types';
import { useAuth } from '../contexts/AuthContext';

const stores = ['KC', 'Olaya', 'Solitaire', 'Jeddah'];

const statusOptions = ['Pending', 'Approved', 'Delivery Issued', 'In Transit', 'Delivered', 'GR Completed', 'Rejected'];

interface InterBranchTransferProps {
  onBack: () => void;
}

export default function InterBranchTransfer({ onBack }: InterBranchTransferProps) {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<InterBranchTransferType[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedStore, setSelectedStore] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [editingTransfer, setEditingTransfer] = useState<InterBranchTransferType | null>(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState<{ transferId: string; deliveryNote: string } | null>(null);
  const [showGRModal, setShowGRModal] = useState<{ transferId: string; grNumber: string } | null>(null);
  const [formData, setFormData] = useState({
    transferRequestId: '',
    sourceStore: '',
    destinationStore: '',
    itemId: '',
    quantity: '',
    notes: ''
  });

  // Load items from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('pos_items');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) {
          setItems(parsed);
          return;
        }
      } catch (e) {}
    }
    // Fallback sample items
    setItems([
      { id: '1', name: 'School Shirt - White', sku: 'SH-WHT-001', unit: 'pcs' },
      { id: '2', name: 'School Pants - Navy', sku: 'PN-NVY-001', unit: 'pcs' },
      { id: '3', name: 'School Skirt - Navy', sku: 'SK-NVY-001', unit: 'pcs' },
      { id: '4', name: 'School Blazer - Navy', sku: 'BL-NVY-001', unit: 'pcs' },
      { id: '5', name: 'School Tie', sku: 'TI-STD-001', unit: 'pcs' }
    ]);
  }, []);

  // Load transfers from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('pos_inter_branch_transfers');
    if (stored) {
      try {
        setTransfers(JSON.parse(stored));
      } catch (e) {
        setTransfers([]);
      }
    }
  }, []);

  const generateTransferRequestId = () => {
    const nextNumber = transfers.length + 1;
    return `IBT-${nextNumber.toString().padStart(3, '0')}`;
  };

  const handleAddNew = () => {
    setFormData({
      transferRequestId: generateTransferRequestId(),
      sourceStore: '',
      destinationStore: '',
      itemId: '',
      quantity: '',
      notes: ''
    });
    setEditingTransfer(null);
    setShowAddForm(true);
  };

  const handleEdit = (transfer: InterBranchTransferType) => {
    setFormData({
      transferRequestId: transfer.transferRequestId,
      sourceStore: transfer.sourceStore,
      destinationStore: transfer.destinationStore,
      itemId: transfer.itemId,
      quantity: transfer.quantity.toString(),
      notes: transfer.notes || ''
    });
    setEditingTransfer(transfer);
    setShowAddForm(true);
  };

  const handleSave = () => {
    if (!formData.sourceStore || !formData.destinationStore || !formData.itemId || !formData.quantity) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.sourceStore === formData.destinationStore) {
      alert('Source and destination stores cannot be the same');
      return;
    }

    const selectedItem = items.find(item => item.id === formData.itemId);
    if (!selectedItem) return;

    const quantity = parseInt(formData.quantity);
    const requestedBy = user?.firstName + ' ' + user?.lastName || 'Unknown User';

    let updatedTransfers: InterBranchTransferType[];

    if (editingTransfer) {
      updatedTransfers = transfers.map(transfer =>
        transfer.id === editingTransfer.id
          ? {
              ...transfer,
              sourceStore: formData.sourceStore,
              destinationStore: formData.destinationStore,
              itemId: formData.itemId,
              itemName: selectedItem.name,
              itemSku: selectedItem.sku,
              quantity,
              unit: selectedItem.unit,
              notes: formData.notes
            }
          : transfer
      );
    } else {
      const newTransfer: InterBranchTransferType = {
        id: Date.now().toString(),
        transferRequestId: formData.transferRequestId,
        sourceStore: formData.sourceStore,
        destinationStore: formData.destinationStore,
        itemId: formData.itemId,
        itemName: selectedItem.name,
        itemSku: selectedItem.sku,
        quantity,
        unit: selectedItem.unit,
        status: 'Pending',
        requestedBy,
        requestedAt: new Date().toISOString(),
        notes: formData.notes
      };
      updatedTransfers = [...transfers, newTransfer];
    }

    setTransfers(updatedTransfers);
    localStorage.setItem('pos_inter_branch_transfers', JSON.stringify(updatedTransfers));
    setShowAddForm(false);
    setEditingTransfer(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this transfer request?')) {
      const updatedTransfers = transfers.filter(transfer => transfer.id !== id);
      setTransfers(updatedTransfers);
      localStorage.setItem('pos_inter_branch_transfers', JSON.stringify(updatedTransfers));
    }
  };

  const handleStatusChange = (id: string, newStatus: InterBranchTransferType['status']) => {
    const transfer = transfers.find(t => t.id === id);
    if (!transfer) return;

    const userName = user?.firstName + ' ' + user?.lastName || 'Unknown User';

    // If status is Delivered or GR Completed, update stock levels
    if (newStatus === 'Delivered' || newStatus === 'GR Completed') {
      updateStockLevelsForTransfer(transfer);
    }

    const updatedTransfers = transfers.map(t => {
      if (t.id === id) {
        const updatedTransfer = { ...t, status: newStatus };
        if (newStatus === 'Approved' && !t.approvedBy) {
          updatedTransfer.approvedBy = userName;
          updatedTransfer.approvedAt = new Date().toISOString();
        }
        return updatedTransfer;
      }
      return t;
    });

    setTransfers(updatedTransfers);
    localStorage.setItem('pos_inter_branch_transfers', JSON.stringify(updatedTransfers));
  };

  const updateStockLevelsForTransfer = (transfer: InterBranchTransferType) => {
    const stored = localStorage.getItem('pos_stock_levels');
    let stockLevels: { itemId: string; store: string; quantity: number }[] = [];
    if (stored) {
      try {
        stockLevels = JSON.parse(stored);
      } catch (e) {}
    }

    // Decrease stock at source
    const sourceIdx = stockLevels.findIndex(s => s.itemId === transfer.itemId && s.store === transfer.sourceStore);
    if (sourceIdx >= 0) {
      stockLevels[sourceIdx].quantity = Math.max(0, stockLevels[sourceIdx].quantity - transfer.quantity);
    } else {
      stockLevels.push({ itemId: transfer.itemId, store: transfer.sourceStore, quantity: 0 });
    }

    // Increase stock at destination
    const destIdx = stockLevels.findIndex(s => s.itemId === transfer.itemId && s.store === transfer.destinationStore);
    if (destIdx >= 0) {
      stockLevels[destIdx].quantity += transfer.quantity;
    } else {
      stockLevels.push({ itemId: transfer.itemId, store: transfer.destinationStore, quantity: transfer.quantity });
    }

    localStorage.setItem('pos_stock_levels', JSON.stringify(stockLevels));
  };

  const handleIssueDelivery = (transferId: string) => {
    if (!showDeliveryModal?.deliveryNote) {
      alert('Please enter a delivery note number');
      return;
    }

    const userName = user?.firstName + ' ' + user?.lastName || 'Unknown User';
    const now = new Date().toISOString();

    const updatedTransfers = transfers.map(transfer => {
      if (transfer.id === transferId) {
        return {
          ...transfer,
          status: 'Delivery Issued' as InterBranchTransferType['status'],
          deliveryIssuedBy: userName,
          deliveryIssuedAt: now,
          deliveryNote: showDeliveryModal.deliveryNote
        };
      }
      return transfer;
    });

    setTransfers(updatedTransfers);
    localStorage.setItem('pos_inter_branch_transfers', JSON.stringify(updatedTransfers));
    setShowDeliveryModal(null);
  };

  const handleCompleteGR = (transferId: string) => {
    if (!showGRModal?.grNumber) {
      alert('Please enter a GR number');
      return;
    }

    const userName = user?.firstName + ' ' + user?.lastName || 'Unknown User';
    const now = new Date().toISOString();
    const transfer = transfers.find(t => t.id === transferId);

    // Update stock levels on GR completion
    if (transfer) {
      updateStockLevelsForTransfer(transfer);
    }

    const updatedTransfers = transfers.map(t => {
      if (t.id === transferId) {
        return {
          ...t,
          status: 'GR Completed' as InterBranchTransferType['status'],
          grCompletedBy: userName,
          grCompletedAt: now,
          grNumber: showGRModal.grNumber
        };
      }
      return t;
    });

    setTransfers(updatedTransfers);
    localStorage.setItem('pos_inter_branch_transfers', JSON.stringify(updatedTransfers));
    setShowGRModal(null);
  };

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = 
      transfer.transferRequestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.itemSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || transfer.status === selectedStatus;
    const matchesStore = selectedStore === 'all' || 
      transfer.sourceStore === selectedStore || 
      transfer.destinationStore === selectedStore;
    
    return matchesSearch && matchesStatus && matchesStore;
  });

  const getStatusBadge = (status: InterBranchTransferType['status']) => {
    const statusConfig = {
      'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Delivery Issued': { color: 'bg-blue-100 text-blue-800', icon: FileText },
      'In Transit': { color: 'bg-blue-100 text-blue-800', icon: Truck },
      'Delivered': { color: 'bg-purple-100 text-purple-800', icon: Package },
      'GR Completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Rejected': { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        <span>{status}</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Transfer Details View
  if (showDetails) {
    const transfer = transfers.find(t => t.id === showDetails);
    if (!transfer) return null;

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowDetails(null)}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Transfers</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transfer Request Details</h1>
              <p className="text-gray-600 mt-1">{transfer.transferRequestId}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(transfer.status)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Header Information */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Request ID</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{transfer.transferRequestId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Requested By</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{transfer.requestedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Request Date</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(transfer.requestedAt)}</p>
                  </div>
                  {transfer.approvedBy && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Approved By</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{transfer.approvedBy}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Approved Date</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{transfer.approvedAt ? formatDate(transfer.approvedAt) : '-'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Source Store</p>
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">{transfer.sourceStore}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center py-2">
                    <ArrowRight className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Destination Store</p>
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">{transfer.destinationStore}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Item Name</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{transfer.itemName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">SKU</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{transfer.itemSku}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Quantity</p>
                    <p className="font-semibold text-blue-600 text-lg">{transfer.quantity} {transfer.unit}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {transfer.notes && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-700 dark:text-gray-300">{transfer.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          {transfer.status === 'Pending' && user?.role === 'admin' && (
            <div className="p-6 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleStatusChange(transfer.id, 'Approved')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve Transfer</span>
                </button>
                <button
                  onClick={() => handleStatusChange(transfer.id, 'Rejected')}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-all flex items-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Transfer</span>
                </button>
                <button
                  onClick={() => handleEdit(transfer)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Request</span>
                </button>
              </div>
            </div>
          )}

          {transfer.status === 'Approved' && (
            <div className="p-6 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowDeliveryModal({ transferId: transfer.id, deliveryNote: '' })}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Issue Delivery</span>
                </button>
              </div>
            </div>
          )}

          {transfer.status === 'Delivery Issued' && (
            <div className="p-6 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleStatusChange(transfer.id, 'In Transit')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
                >
                  <Truck className="w-4 h-4" />
                  <span>Mark In Transit</span>
                </button>
              </div>
            </div>
          )}

          {transfer.status === 'In Transit' && (
            <div className="p-6 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleStatusChange(transfer.id, 'Delivered')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2"
                >
                  <Package className="w-4 h-4" />
                  <span>Mark Delivered</span>
                </button>
              </div>
            </div>
          )}

          {transfer.status === 'Delivered' && (
            <div className="p-6 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowGRModal({ transferId: transfer.id, grNumber: '' })}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete GR</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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
              <span>Back to Transfers</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {editingTransfer ? 'Edit Transfer Request' : 'Create Transfer Request'}
            </h1>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Request ID
              </label>
              <input
                type="text"
                value={formData.transferRequestId}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                readOnly
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Store *
                </label>
                <select
                  value={formData.sourceStore}
                  onChange={(e) => setFormData(prev => ({ ...prev, sourceStore: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Source Store</option>
                  {stores.map(store => (
                    <option key={store} value={store}>{store}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination Store *
                </label>
                <select
                  value={formData.destinationStore}
                  onChange={(e) => setFormData(prev => ({ ...prev, destinationStore: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Destination Store</option>
                  {stores.filter(store => store !== formData.sourceStore).map(store => (
                    <option key={store} value={store}>{store}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item *
              </label>
              <select
                value={formData.itemId}
                onChange={(e) => setFormData(prev => ({ ...prev, itemId: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Item</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter quantity to transfer"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter reason for transfer or additional notes"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingTransfer ? 'Update Request' : 'Submit Request'}</span>
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inter-Branch Transfer</h1>
            <p className="text-gray-600 mt-1">Formal transfers between different store branches</p>
          </div>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Transfer Request</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by request ID, item name, or requester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Stores</option>
              {stores.map(store => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Request ID</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Item</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Transfer Route</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Quantity</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Status</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Requested By</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Date</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransfers.map((transfer) => (
                <tr key={transfer.id} className="hover:bg-gray-50 transition-all">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <button
                          onClick={() => setShowDetails(transfer.id)}
                          className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {transfer.transferRequestId}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{transfer.itemName}</p>
                        <p className="text-sm text-gray-500">{transfer.itemSku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm font-medium">
                        {transfer.sourceStore}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                        {transfer.destinationStore}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {transfer.quantity} {transfer.unit}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(transfer.status)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">{transfer.requestedBy}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">{formatDate(transfer.requestedAt)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowDetails(transfer.id)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="View Details"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      {transfer.status === 'Pending' && (
                        <button
                          onClick={() => handleEdit(transfer)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(transfer.id)}
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

      {filteredTransfers.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No transfer requests found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria.</p>
          <button
            onClick={handleAddNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            Create Your First Transfer Request
          </button>
        </div>
      )}
    </div>
      {/* Delivery Issue Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Issue Delivery</h3>
              <button
                onClick={() => setShowDeliveryModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Note Number *
                </label>
                <input
                  type="text"
                  value={showDeliveryModal.deliveryNote}
                  onChange={(e) => setShowDeliveryModal(prev => prev ? { ...prev, deliveryNote: e.target.value } : null)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter delivery note number"
                  required
                />
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  onClick={() => handleIssueDelivery(showDeliveryModal.transferId)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Issue Delivery</span>
                </button>
                <button
                  onClick={() => setShowDeliveryModal(null)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GR Completion Modal */}
      {showGRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Complete Goods Receipt</h3>
              <button
                onClick={() => setShowGRModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GR Number *
                </label>
                <input
                  type="text"
                  value={showGRModal.grNumber}
                  onChange={(e) => setShowGRModal(prev => prev ? { ...prev, grNumber: e.target.value } : null)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter GR number"
                  required
                />
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  onClick={() => handleCompleteGR(showGRModal.transferId)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Complete GR</span>
                </button>
                <button
                  onClick={() => setShowGRModal(null)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}