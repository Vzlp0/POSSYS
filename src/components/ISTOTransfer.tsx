import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  ArrowLeft,
  Save,
  X,
  Package,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  FileText,
  Eye,
  Printer,
  Send,
  Calendar,
  User,
  MapPin,
  AlertTriangle,
  Edit,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { ISTO, ISTOLine, InventoryMovement } from '../types';
import { useAuth } from '../contexts/AuthContext';


import MyRequests from './MyRequests';

const stores = ['KC', 'Olaya', 'Solitaire', 'Jeddah'];
const currentStore = 'KC'; // This would come from user context

interface ISTOTransferProps {
  onBack: () => void;
}

export default function ISTOTransfer({ onBack }: ISTOTransferProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'incoming' | 'outgoing'>('incoming');
  const [istos, setIstos] = useState<ISTO[]>([]);
  const [localItems, setLocalItems] = useState<any[]>([]);
  const [selectedISTO, setSelectedISTO] = useState<ISTO | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [outgoingTab, setOutgoingTab] = useState<'to-issue' | 'issued'>('to-issue');
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<string | null>(null);
  const [showBatchSelector, setShowBatchSelector] = useState<{
    istoId: string;
    lineId: string;
    itemName: string;
    toIssueQty: number;
  } | null>(null);
  const [showIssueDeliveryModal, setShowIssueDeliveryModal] = useState<string | null>(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    istoNumber: '',
    sourceStore: mode === 'incoming' ? '' : currentStore,
    targetStore: mode === 'incoming' ? currentStore : '',
    notes: '',
    lines: [] as Omit<ISTOLine, 'id'>[]
  });

  const [receiveData, setReceiveData] = useState<{[key: string]: number}>({});

  // Delivery form data
  const [deliveryData, setDeliveryData] = useState({
    deliveryNumber: '',
    issuedAt: new Date().toISOString().split('T')[0],
    driver: '',
    vehicle: '',
    contact: '',
    boxes: '',
    weight: '',
    notes: '',
    driverName: '',
    vehicleInfo: '',
    deliveryNotes: '',
    lines: [] as Array<{
      lineId: string;
      itemId: string;
      itemName: string;
      itemSku: string;
      requestedQty: number;
      alreadyIssuedQty: number;
      remainingQty: number;
      toIssueNow: number;
      selectedBatches: Array<{
        batchNo: string;
        expiryDate: string | null;
        location: string;
        onHand: number;
        issueQty: number;
      }>;
    }>
  });

  // Batch data from localStorage
  const mockSourceBatches: any[] = JSON.parse(localStorage.getItem('pos_stock_levels') || '[]');
  const [showRequestedISTOs, setShowRequestedISTOs] = useState(false);

  // Load items from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('pos_items');
    if (stored) {
      setLocalItems(JSON.parse(stored));
    } else {
      setLocalItems([]);
    }
  }, []);

  // Load ISTOs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('pos_isto_transfers');
    if (stored) {
      setIstos(JSON.parse(stored));
    } else {
      setIstos([]);
    }
  }, []);

  const generateISTONumber = () => {
    const nextNumber = istos.length + 1;
    return `ISTO-${nextNumber.toString().padStart(3, '0')}`;
  };

  const generateDeliveryNumber = () => {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const seq = Math.floor(Math.random() * 999) + 1;
    return `DLV-${today}-${seq.toString().padStart(3, '0')}`;
  };

  const getStatusBadge = (status: ISTO['status']) => {
    const statusConfig = {
      'Draft': { color: 'bg-gray-100 text-gray-800 dark:text-gray-200', icon: Edit },
      'Requested': { color: 'bg-blue-100 text-blue-800', icon: Send },
      'Approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Picked': { color: 'bg-purple-100 text-purple-800', icon: Package },
      'In Transit': { color: 'bg-yellow-100 text-yellow-800', icon: Truck },
      'Delivered': { color: 'bg-orange-100 text-orange-800', icon: MapPin },
      'Received': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Cancelled': { color: 'bg-red-100 text-red-800', icon: XCircle }
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

  // Get ISTOs requested by current user
  const getMyRequestedISTOs = () => {
    return istos.filter(isto => 
      isto.createdBy === (user?.firstName + ' ' + user?.lastName || 'Unknown User')
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

  const handleCreateISTO = () => {
    if (!formData.sourceStore || !formData.targetStore || formData.lines.length === 0) {
      alert('Please fill in all required fields and add at least one line');
      return;
    }

    const createdBy = user?.firstName + ' ' + user?.lastName || 'Unknown User';
    const lastAction = `Requested by ${formData.targetStore}`;
    const newId = Date.now().toString();

    const newISTO: ISTO = {
      id: newId,
      istoNumber: formData.istoNumber || generateISTONumber(),
      sourceStore: formData.sourceStore,
      targetStore: formData.targetStore,
      status: 'Requested',
      lastAction: lastAction,
      lastActionAt: new Date().toISOString(),
      createdBy: createdBy,
      createdAt: new Date().toISOString(),
      notes: formData.notes,
      lines: formData.lines.map((line, index) => ({
        ...line,
        id: (Date.now() + index).toString(),
        receivedQty: 0,
        pickedQty: 0,
        status: 'Open' as const
      }))
    };

    const updatedIstos = [...istos, newISTO];
    setIstos(updatedIstos);
    localStorage.setItem('pos_isto_transfers', JSON.stringify(updatedIstos));
    setShowCreateForm(false);
    setFormData({
      istoNumber: '',
      sourceStore: mode === 'incoming' ? '' : currentStore,
      targetStore: mode === 'incoming' ? currentStore : '',
      notes: '',
      lines: []
    });
  };

  const handleAddLine = () => {
    const newLine: Omit<ISTOLine, 'id'> = {
      itemId: '',
      itemName: '',
      itemSku: '',
      unit: '',
      requestedQty: 0,
      status: 'Open'
    };
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, newLine]
    }));
  };

  const handleUpdateLine = (index: number, field: keyof Omit<ISTOLine, 'id'>, value: any) => {
    if (field === 'itemId') {
      const selectedItem = localItems.find(item => item.id === value);
      if (selectedItem) {
        setFormData(prev => ({
          ...prev,
          lines: prev.lines.map((line, i) => i === index ? {
            ...line,
            itemId: value,
            itemName: selectedItem.name,
            itemSku: selectedItem.sku,
            unit: selectedItem.unit
          } : line)
        }));
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => i === index ? { ...line, [field]: value } : line)
    }));
  };

  const handleRemoveLine = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  };

  const handleReceiveRedirect = (isto: ISTO) => {
    // Store ISTO information for GR page
    const grData = {
      istoNumber: isto.istoNumber,
      sourceStore: isto.sourceStore,
      targetStore: isto.targetStore,
      items: isto.lines.map(line => ({
        itemId: line.itemId,
        itemName: line.itemName,
        itemSku: line.itemSku,
        unit: line.unit,
        requestedQty: line.requestedQty,
        pickedQty: line.pickedQty || 0,
        batchNumber: line.batchNumber,
        expiryDate: line.expiryDate
      }))
    };
    
    // Store in localStorage for GR page to pick up
    localStorage.setItem('pendingISTOReceive', JSON.stringify(grData));
    
    // Navigate to GR page (this would be handled by parent component)
    alert(`Redirecting to GR page to receive ISTO ${isto.istoNumber}. In a real app, this would navigate to the Goods Receipt page with pre-filled data.`);
  };

  const handleApprove = (istoId: string) => {
    const now = new Date().toISOString();
    const updatedIstos = istos.map(isto =>
      isto.id === istoId
        ? { ...isto, status: 'Approved' as const, lastAction: `Approved by ${currentStore}`, lastActionAt: now }
        : isto
    );
    setIstos(updatedIstos);
    localStorage.setItem('pos_isto_transfers', JSON.stringify(updatedIstos));
  };

  const handleReject = (istoId: string) => {
    const now = new Date().toISOString();
    const updatedIstos = istos.map(isto =>
      isto.id === istoId
        ? { ...isto, status: 'Cancelled' as const, lastAction: `Rejected by ${currentStore}`, lastActionAt: now }
        : isto
    );
    setIstos(updatedIstos);
    localStorage.setItem('pos_isto_transfers', JSON.stringify(updatedIstos));
  };

  const handleIssueDelivery = (istoId: string) => {
    const isto = istos.find(i => i.id === istoId);
    if (!isto) return;

    // Initialize delivery data
    const lines = isto.lines.map(line => ({
      lineId: line.id,
      itemId: line.itemId,
      itemName: line.itemName,
      itemSku: line.itemSku,
      requestedQty: line.requestedQty,
      alreadyIssuedQty: line.pickedQty || 0, // Use picked qty as already issued
      remainingQty: line.requestedQty - (line.pickedQty || 0),
      toIssueNow: line.requestedQty - (line.pickedQty || 0),
      selectedBatches: []
    }));

    setDeliveryData({
      deliveryNumber: generateDeliveryNumber(),
      issuedAt: new Date().toISOString().split('T')[0],
      driver: '',
      vehicle: '',
      contact: '',
      boxes: '',
      weight: '',
      notes: '',
      driverName: '',
      vehicleInfo: '',
      deliveryNotes: '',
      lines
    });

    setShowDeliveryModal(istoId);
  };

  const handleSelectBatches = (lineId: string) => {
    const line = deliveryData.lines.find(l => l.lineId === lineId);
    if (!line) return;

    setShowBatchSelector({
      istoId: showDeliveryModal!,
      lineId,
      itemName: line.itemName,
      toIssueQty: line.toIssueNow
    });
  };

  const handleBatchSelection = (batches: typeof deliveryData.lines[0]['selectedBatches']) => {
    if (!showBatchSelector) return;

    setDeliveryData(prev => ({
      ...prev,
      lines: prev.lines.map(line =>
        line.lineId === showBatchSelector.lineId
          ? { ...line, selectedBatches: batches }
          : line
      )
    }));

    setShowBatchSelector(null);
  };

  const handleAutoFillFIFO = (lineId: string) => {
    const line = deliveryData.lines.find(l => l.lineId === lineId);
    if (!line) return;

    const availableBatches = mockSourceBatches
      .filter(batch => batch.itemId === line.itemId)
      .sort((a, b) => {
        // Sort by expiry date (FIFO - oldest first), null expiry goes last
        if (!a.expiryDate && !b.expiryDate) return 0;
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      });

    let remainingToFill = line.toIssueNow;
    const selectedBatches: typeof line.selectedBatches = [];

    for (const batch of availableBatches) {
      if (remainingToFill <= 0) break;

      const issueQty = Math.min(remainingToFill, batch.onHand);
      if (issueQty > 0) {
        selectedBatches.push({
          batchNo: batch.batchNo,
          expiryDate: batch.expiryDate,
          location: batch.location,
          onHand: batch.onHand,
          issueQty
        });
        remainingToFill -= issueQty;
      }
    }

    setDeliveryData(prev => ({
      ...prev,
      lines: prev.lines.map(l =>
        l.lineId === lineId
          ? { ...l, selectedBatches }
          : l
      )
    }));
  };

  const handleConfirmDelivery = () => {
    if (!showDeliveryModal) return;

    // Validation
    if (!deliveryData.deliveryNumber.trim()) {
      alert('Please enter a delivery number');
      return;
    }

    // Check if delivery number is unique
    const existingDelivery = istos.some(isto => isto.deliveryNumber === deliveryData.deliveryNumber);
    if (existingDelivery) {
      alert('Delivery number already exists. Please use a unique number.');
      return;
    }

    // Validate lines and batches
    for (const line of deliveryData.lines) {
      if (line.toIssueNow > 0) {
        const totalBatchQty = line.selectedBatches.reduce((sum, batch) => sum + batch.issueQty, 0);
        if (totalBatchQty !== line.toIssueNow) {
          alert(`Batch quantities for ${line.itemName} must equal the "To Issue Now" quantity (${line.toIssueNow})`);
          return;
        }

        // Check batch constraints
        for (const batch of line.selectedBatches) {
          if (batch.issueQty > batch.onHand) {
            alert(`Issue quantity for batch ${batch.batchNo} exceeds available stock (${batch.onHand})`);
            return;
          }
        }
      }
    }

    const now = new Date().toISOString();

    // Update ISTO with delivery information
    const updatedIstos = istos.map(isto => {
      if (isto.id === showDeliveryModal) {
        return {
          ...isto,
          deliveryNumber: deliveryData.deliveryNumber,
          driverName: deliveryData.driver,
          vehicleInfo: deliveryData.vehicle,
          deliveryNotes: deliveryData.notes,
          lastAction: `Delivery number ${deliveryData.deliveryNumber} issued`,
          lastActionAt: now,
          // Update line quantities
          lines: isto.lines.map(line => {
            const deliveryLine = deliveryData.lines.find(dl => dl.lineId === line.id);
            if (deliveryLine && deliveryLine.toIssueNow > 0) {
              return {
                ...line,
                pickedQty: (line.pickedQty || 0) + deliveryLine.toIssueNow
              };
            }
            return line;
          })
        };
      }
      return isto;
    });
    setIstos(updatedIstos);
    localStorage.setItem('pos_isto_transfers', JSON.stringify(updatedIstos));

    setShowDeliveryModal(null);
    setDeliveryData({
      deliveryNumber: '',
      issuedAt: new Date().toISOString().split('T')[0],
      driver: '',
      vehicle: '',
      contact: '',
      boxes: '',
      weight: '',
      notes: '',
      driverName: '',
      vehicleInfo: '',
      deliveryNotes: '',
      lines: []
    });
  };

  const handleDispatch = (istoId: string) => {
    const now = new Date().toISOString();
    const updatedIstos = istos.map(isto =>
      isto.id === istoId
        ? { ...isto, status: 'In Transit' as const, lastAction: 'Dispatched', lastActionAt: now }
        : isto
    );
    setIstos(updatedIstos);
    localStorage.setItem('pos_isto_transfers', JSON.stringify(updatedIstos));
  };

  const handleMarkDelivered = (istoId: string) => {
    const now = new Date().toISOString();
    const updatedIstos = istos.map(isto =>
      isto.id === istoId
        ? { ...isto, status: 'Delivered' as const, lastAction: 'Delivered', lastActionAt: now }
        : isto
    );
    setIstos(updatedIstos);
    localStorage.setItem('pos_isto_transfers', JSON.stringify(updatedIstos));
  };

  const handleReceive = (istoId: string) => {
    const isto = istos.find(i => i.id === istoId);
    if (!isto) return;

    const now = new Date().toISOString();

    const updatedLines = isto.lines.map(line => {
      const receivedQty = receiveData[line.id] || 0;
      const totalReceived = (line.receivedQty || 0) + receivedQty;
      return {
        ...line,
        receivedQty: totalReceived,
        status: totalReceived >= line.requestedQty ? 'Received' as const : line.status
      };
    });

    const allReceived = updatedLines.every(line => (line.receivedQty || 0) >= line.requestedQty);

    // Update stock levels in localStorage if all received
    if (allReceived) {
      const stockLevels: Array<{itemId: string; store: string; quantity: number}> = JSON.parse(localStorage.getItem('pos_stock_levels') || '[]');

      for (const line of updatedLines) {
        // Decrease source store
        const srcIndex = stockLevels.findIndex(s => s.itemId === line.itemId && s.store === isto.sourceStore);
        if (srcIndex >= 0) {
          stockLevels[srcIndex].quantity = Math.max(0, stockLevels[srcIndex].quantity - line.requestedQty);
        }

        // Increase destination store
        const dstIndex = stockLevels.findIndex(s => s.itemId === line.itemId && s.store === isto.targetStore);
        if (dstIndex >= 0) {
          stockLevels[dstIndex].quantity += line.requestedQty;
        } else {
          stockLevels.push({ itemId: line.itemId, store: isto.targetStore, quantity: line.requestedQty });
        }
      }

      localStorage.setItem('pos_stock_levels', JSON.stringify(stockLevels));
    }

    const updatedIstos = istos.map(i => {
      if (i.id !== istoId) return i;
      return {
        ...i,
        lines: updatedLines,
        status: allReceived ? 'Received' as const : i.status,
        lastAction: allReceived ? 'Fully received' : 'Partially received',
        lastActionAt: now
      };
    });
    setIstos(updatedIstos);
    localStorage.setItem('pos_isto_transfers', JSON.stringify(updatedIstos));

    setShowReceiveModal(null);
    setReceiveData({});
  };

  // Filter ISTOs based on mode and filters
  const getFilteredISTOs = () => {
    let filtered = istos;

    if (mode === 'incoming') {
      filtered = filtered.filter(isto => isto.targetStore === currentStore);
      if (statusFilter === 'active') {
        filtered = filtered.filter(isto => 
          ['Requested', 'Approved', 'In Transit', 'Delivered'].includes(isto.status)
        );
      }
    } else {
      filtered = filtered.filter(isto => isto.sourceStore === currentStore);
      if (outgoingTab === 'to-issue') {
        filtered = filtered.filter(isto => 
          ['Approved', 'Picked'].includes(isto.status) && !isto.deliveryNumber
        );
      } else {
        filtered = filtered.filter(isto => 
          isto.deliveryNumber && ['Picked', 'In Transit', 'Delivered'].includes(isto.status)
        );
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(isto =>
        isto.istoNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        isto.deliveryNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        isto.sourceStore.toLowerCase().includes(searchTerm.toLowerCase()) ||
        isto.targetStore.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredISTOs = getFilteredISTOs();

  // Status Timeline Component
  const StatusTimeline = ({ isto }: { isto: ISTO }) => {
    const statuses = ['Requested', 'Approved', 'Picked', 'In Transit', 'Delivered', 'Received'];
    const currentIndex = statuses.indexOf(isto.status);

    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Status Timeline</h3>
        <div className="space-y-2">
          {statuses.map((status, index) => (
            <div key={status} className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                index <= currentIndex ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className={`text-sm ${
                index <= currentIndex ? 'text-green-700 font-medium' : 'text-gray-500'
              }`}>
                {status}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-900">Last Action</p>
          <p className="text-sm text-blue-700">{isto.lastAction}</p>
          <p className="text-xs text-blue-600 mt-1">{formatDate(isto.lastActionAt)}</p>
        </div>
      </div>
    );
  };

  // My Requests Modal
  if (showRequestedISTOs) {
    const myRequests = getMyRequestedISTOs();
    
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowRequestedISTOs(false)}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to ISTO Transfer</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My ISTO Requests</h1>
              <p className="text-gray-600 mt-1">Track status of your requested transfers</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{myRequests.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">
                  {myRequests.filter(isto => ['Requested', 'Approved', 'Picked'].includes(isto.status)).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Transit</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {myRequests.filter(isto => ['In Transit', 'Delivered'].includes(isto.status)).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {myRequests.filter(isto => isto.status === 'Received').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* My Requests Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Request History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">ISTO Number</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Source → Target</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Lines</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Status</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Last Action</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Created</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {myRequests.map((isto) => (
                  <tr 
                    key={isto.id} 
                    className={`hover:bg-gray-50 transition-all cursor-pointer ${
                      selectedISTO?.id === isto.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedISTO(isto)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{isto.istoNumber}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm font-medium">
                          {isto.sourceStore}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                          {isto.targetStore}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-900 dark:text-gray-100">{isto.lines.length} items</span>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(isto.status)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-900 truncate">{isto.lastAction}</p>
                        <p className="text-xs text-gray-500">{formatDate(isto.lastActionAt)}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-900 dark:text-gray-100">{formatDate(isto.createdAt)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedISTO(isto);
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isto.status === 'Draft' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Edit functionality can be added here
                            }}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {myRequests.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-600 mb-4">You haven't created any ISTO requests yet.</p>
            <button
              onClick={() => {
                setShowRequestedISTOs(false);
                setShowCreateForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all"
            >
              Create Your First ISTO
            </button>
          </div>
        )}
      </div>
    );
  }

  // Create Form Modal
  if (showCreateForm) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to {mode === 'incoming' ? 'Incoming' : 'Outgoing'}</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Create {mode === 'incoming' ? 'Incoming' : 'Outgoing'} ISTO
            </h1>
          </div>

            <button
              onClick={() => setShowRequestedISTOs(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>My Requests</span>
            </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-4xl">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ISTO Number
                </label>
                <input
                  type="text"
                  value={formData.istoNumber || generateISTONumber()}
                  onChange={(e) => setFormData(prev => ({ ...prev, istoNumber: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Store *
                </label>
                <select
                  value={formData.sourceStore}
                  onChange={(e) => setFormData(prev => ({ ...prev, sourceStore: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={mode === 'outgoing'}
                  required
                >
                  <option value="">Select Source Store</option>
                  {stores.filter(store => store !== formData.targetStore).map(store => (
                    <option key={store} value={store}>{store}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Store *
                </label>
                <select
                  value={formData.targetStore}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetStore: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={mode === 'incoming'}
                  required
                >
                  <option value="">Select Target Store</option>
                  {stores.filter(store => store !== formData.sourceStore).map(store => (
                    <option key={store} value={store}>{store}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter any notes for this transfer"
              />
            </div>

            {/* Lines Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Items</h3>
                <button
                  onClick={handleAddLine}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              </div>

              {formData.lines.length > 0 ? (
                <div className="space-y-4">
                  {formData.lines.map((line, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Item *
                          </label>
                          <select
                            value={line.itemId}
                            onChange={(e) => handleUpdateLine(index, 'itemId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            <option value="">Select Item</option>
                            {localItems.map(item => (
                              <option key={item.id} value={item.id}>
                                {item.name} ({item.sku})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Unit
                          </label>
                          <input
                            type="text"
                            value={line.unit}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700"
                            readOnly
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            value={line.requestedQty}
                            onChange={(e) => handleUpdateLine(index, 'requestedQty', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="1"
                            required
                          />
                        </div>

                        <div className="flex items-end">
                          <button
                            onClick={() => handleRemoveLine(index)}
                            className="w-full bg-red-100 text-red-700 px-3 py-2 rounded-lg font-medium hover:bg-red-200 transition-all flex items-center justify-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm">No items added yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Add Item" to get started.</p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCreateISTO}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Create ISTO</span>
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ISTO Transfer</h1>
                <p className="text-gray-600 mt-1">Internal Stock Transfer Orders</p>
              </div>
            </div>
            
            {/* Mode Toggle */}
            <div className="flex items-center space-x-4">
              <div className="bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setMode('incoming')}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    mode === 'incoming'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-100'
                  }`}
                >
                  Incoming
                </button>
                <button
                  onClick={() => setMode('outgoing')}
                  className={`px-4 py-2 rounded-md font-medium transition-all ${
                    mode === 'outgoing'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-100'
                  }`}
                >
                  Outgoing
                </button>
              </div>
              
              <button
                onClick={() => {
                  setFormData({
                    istoNumber: generateISTONumber(),
                    sourceStore: mode === 'incoming' ? '' : currentStore,
                    targetStore: mode === 'incoming' ? currentStore : '',
                    notes: '',
                    lines: []
                  });
                  setShowCreateForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create ISTO</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {/* Outgoing Tabs */}
          {mode === 'outgoing' && (
            <div className="mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setOutgoingTab('to-issue')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                      outgoingTab === 'to-issue'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    To Issue
                  </button>
                  <button
                    onClick={() => setOutgoingTab('issued')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                      outgoingTab === 'issued'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    Issued
                  </button>
                </nav>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by ISTO number, delivery number, or store..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {mode === 'incoming' && (
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="all">All Status</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* ISTO Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">ISTO No</th>
                    {mode === 'outgoing' && outgoingTab === 'issued' && (
                      <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Delivery No</th>
                    )}
                    <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">
                      {mode === 'incoming' ? 'Source Store' : 'Target Store'}
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Created Date</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Last Action</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Total Lines</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredISTOs.map((isto) => (
                    <tr 
                      key={isto.id} 
                      className={`hover:bg-gray-50 transition-all cursor-pointer ${
                        selectedISTO?.id === isto.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedISTO(isto)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{isto.istoNumber}</span>
                        </div>
                      </td>
                      {mode === 'outgoing' && outgoingTab === 'issued' && (
                        <td className="py-4 px-6">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {isto.deliveryNumber || '-'}
                          </span>
                        </td>
                      )}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-gray-100">
                            {mode === 'incoming' ? isto.sourceStore : isto.targetStore}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-gray-100">{formatDate(isto.createdAt)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(isto.status)}
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{isto.lastAction}</p>
                          <p className="text-xs text-gray-500">{formatDate(isto.lastActionAt)}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-900 dark:text-gray-100">{isto.lines.length} lines</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          {/* Incoming Actions */}
                          {mode === 'incoming' && (
                            <>
                              {isto.status === 'Requested' && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApprove(isto.id);
                                    }}
                                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-all"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReject(isto.id);
                                    }}
                                    className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-all"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {(['In Transit', 'Delivered'].includes(isto.status)) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReceiveRedirect(isto);
                                  }}
                                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                                >
                                  Go to GR
                                </button>
                              )}
                            </>
                          )}

                          {/* Outgoing Actions */}
                          {mode === 'outgoing' && (
                            <>
                              {outgoingTab === 'to-issue' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleIssueDelivery(isto.id);
                                  }}
                                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                                >
                                  Issue Delivery
                                </button>
                              )}
                              {outgoingTab === 'issued' && (
                                <>
                                  {isto.status === 'Picked' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDispatch(isto.id);
                                      }}
                                      className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-all"
                                    >
                                      Dispatch
                                    </button>
                                  )}
                                  {isto.status === 'In Transit' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkDelivered(isto.id);
                                      }}
                                      className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-700 transition-all"
                                    >
                                      Mark Delivered
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowDetailsModal(isto.id);
                                    }}
                                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      alert('Print Delivery Note functionality would be implemented here');
                                    }}
                                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                    title="Print Delivery Note"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredISTOs.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No ISTOs found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria.</p>
              <button
                onClick={() => {
                  setFormData({
                    istoNumber: generateISTONumber(),
                    sourceStore: mode === 'incoming' ? '' : currentStore,
                    targetStore: mode === 'incoming' ? currentStore : '',
                    notes: '',
                    lines: []
                  });
                  setShowCreateForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create First ISTO</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Issue Delivery Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Issue Delivery Number</h3>
              <button
                onClick={() => setShowDeliveryModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {(() => {
              const isto = istos.find(i => i.id === showDeliveryModal);
              if (!isto) return null;

              return (
                <div className="space-y-6">
                  {/* Header Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ISTO Number</label>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{isto.istoNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Source Store</label>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{isto.sourceStore}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Store</label>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{isto.targetStore}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issued At</label>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(deliveryData.issuedAt)}</p>
                    </div>
                  </div>

                  {/* Delivery Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Number *
                      </label>
                      <input
                        type="text"
                        value={deliveryData.deliveryNumber}
                        onChange={(e) => setDeliveryData(prev => ({ ...prev, deliveryNumber: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="DLV-YYYYMMDD-001"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Driver/Carrier
                      </label>
                      <input
                        type="text"
                        value={deliveryData.driver}
                        onChange={(e) => setDeliveryData(prev => ({ ...prev, driver: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter driver name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vehicle
                      </label>
                      <input
                        type="text"
                        value={deliveryData.vehicle}
                        onChange={(e) => setDeliveryData(prev => ({ ...prev, vehicle: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Vehicle info"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact
                      </label>
                      <input
                        type="text"
                        value={deliveryData.contact}
                        onChange={(e) => setDeliveryData(prev => ({ ...prev, contact: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Contact number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Boxes/Parcels
                      </label>
                      <input
                        type="number"
                        value={deliveryData.boxes}
                        onChange={(e) => setDeliveryData(prev => ({ ...prev, boxes: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Number of boxes"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Approx. Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={deliveryData.weight}
                        onChange={(e) => setDeliveryData(prev => ({ ...prev, weight: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Weight in kg"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={deliveryData.notes}
                      onChange={(e) => setDeliveryData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Delivery notes"
                      rows={3}
                    />
                  </div>

                  {/* Lines & Batch Picker */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Lines & Batch Selection</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Item</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Requested</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Already Issued</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Remaining</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">To Issue Now</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Batches</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {deliveryData.lines.map((line) => (
                            <tr key={line.lineId}>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">{line.itemName}</p>
                                  <p className="text-sm text-gray-500">{line.itemSku}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{line.requestedQty}</td>
                              <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{line.alreadyIssuedQty}</td>
                              <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{line.remainingQty}</td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  value={line.toIssueNow}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    setDeliveryData(prev => ({
                                      ...prev,
                                      lines: prev.lines.map(l =>
                                        l.lineId === line.lineId
                                          ? { ...l, toIssueNow: Math.min(value, l.remainingQty) }
                                          : l
                                      )
                                    }));
                                  }}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  min="0"
                                  max={line.remainingQty}
                                />
                              </td>
                              <td className="px-4 py-3">
                                {line.selectedBatches.length > 0 ? (
                                  <div className="space-y-1">
                                    {line.selectedBatches.map((batch, index) => (
                                      <div key={index} className="text-xs">
                                        <span className="font-mono bg-gray-100 px-1 rounded">{batch.batchNo}</span>
                                        <span className="ml-1">({batch.issueQty})</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">No batches selected</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleSelectBatches(line.lineId)}
                                    className="bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-700 transition-all"
                                    disabled={line.toIssueNow === 0}
                                  >
                                    Select Batches
                                  </button>
                                  <button
                                    onClick={() => handleAutoFillFIFO(line.lineId)}
                                    className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700 transition-all"
                                    disabled={line.toIssueNow === 0}
                                  >
                                    Auto FIFO
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleConfirmDelivery}
                      className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all"
                    >
                      Confirm Issue
                    </button>
                    <button
                      onClick={() => setShowDeliveryModal(null)}
                      className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Batch Selector Modal */}
      {showBatchSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Select Batches for {showBatchSelector.itemName}
              </h3>
              <button
                onClick={() => setShowBatchSelector(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>To Issue:</strong> {showBatchSelector.toIssueQty} units
              </p>
            </div>

            {(() => {
              const line = deliveryData.lines.find(l => l.lineId === showBatchSelector.lineId);
              if (!line) return null;

              const availableBatches = mockSourceBatches.filter(batch => batch.itemId === line.itemId);
              const [batchSelections, setBatchSelections] = useState(
                line.selectedBatches.map(sb => ({
                  batchNo: sb.batchNo,
                  expiryDate: sb.expiryDate,
                  location: sb.location,
                  onHand: sb.onHand,
                  issueQty: sb.issueQty
                }))
              );

              const totalSelected = batchSelections.reduce((sum, batch) => sum + batch.issueQty, 0);

              return (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Batch No</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Expiry</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Location</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">On Hand</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Issue Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {availableBatches.map((batch) => {
                          const selection = batchSelections.find(s => s.batchNo === batch.batchNo) || {
                            batchNo: batch.batchNo,
                            expiryDate: batch.expiryDate,
                            location: batch.location,
                            onHand: batch.onHand,
                            issueQty: 0
                          };

                          return (
                            <tr key={batch.batchNo}>
                              <td className="px-4 py-3">
                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                  {batch.batchNo}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {batch.expiryDate ? formatDate(batch.expiryDate) : 'N/A'}
                              </td>
                              <td className="px-4 py-3">{batch.location}</td>
                              <td className="px-4 py-3">{batch.onHand}</td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  value={selection.issueQty}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    const maxValue = Math.min(value, batch.onHand);
                                    
                                    setBatchSelections(prev => {
                                      const existing = prev.find(s => s.batchNo === batch.batchNo);
                                      if (existing) {
                                        return prev.map(s => 
                                          s.batchNo === batch.batchNo 
                                            ? { ...s, issueQty: maxValue }
                                            : s
                                        );
                                      } else {
                                        return [...prev, { ...selection, issueQty: maxValue }];
                                      }
                                    });
                                  }}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  min="0"
                                  max={batch.onHand}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Selected: </span>
                      <span className={`font-medium ${totalSelected === showBatchSelector.toIssueQty ? 'text-green-600' : 'text-red-600'}`}>
                        {totalSelected} / {showBatchSelector.toIssueQty}
                      </span>
                    </div>
                    {totalSelected !== showBatchSelector.toIssueQty && (
                      <span className="text-sm text-red-600">
                        Selection must equal "To Issue Now" quantity
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        if (totalSelected === showBatchSelector.toIssueQty) {
                          handleBatchSelection(batchSelections.filter(b => b.issueQty > 0));
                        } else {
                          alert('Total selected quantity must equal the "To Issue Now" quantity');
                        }
                      }}
                      className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all"
                      disabled={totalSelected !== showBatchSelector.toIssueQty}
                    >
                      Save Selection
                    </button>
                    <button
                      onClick={() => setShowBatchSelector(null)}
                      className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Issue Delivery Modal (Simple) */}
      {showIssueDeliveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Issue Delivery Number</h3>
              <button
                onClick={() => setShowIssueDeliveryModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Number *
                </label>
                <input
                  type="text"
                  value={deliveryData.deliveryNumber}
                  onChange={(e) => setDeliveryData(prev => ({ ...prev, deliveryNumber: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver Name
                </label>
                <input
                  type="text"
                  value={deliveryData.driverName}
                  onChange={(e) => setDeliveryData(prev => ({ ...prev, driverName: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter driver name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Info
                </label>
                <input
                  type="text"
                  value={deliveryData.vehicleInfo}
                  onChange={(e) => setDeliveryData(prev => ({ ...prev, vehicleInfo: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter vehicle details"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Notes
                </label>
                <textarea
                  value={deliveryData.deliveryNotes}
                  onChange={(e) => setDeliveryData(prev => ({ ...prev, deliveryNotes: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter delivery notes"
                />
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  onClick={() => {
                    if (!deliveryData.deliveryNumber) {
                      alert('Please enter a delivery number');
                      return;
                    }

                    setIstos(prev => prev.map(isto => 
                      isto.id === showIssueDeliveryModal 
                        ? { 
                            ...isto, 
                            deliveryNumber: deliveryData.deliveryNumber,
                            driverName: deliveryData.driverName,
                            vehicleInfo: deliveryData.vehicleInfo,
                            deliveryNotes: deliveryData.deliveryNotes,
                            lastAction: 'Delivery number issued',
                            lastActionAt: new Date().toISOString()
                          }
                        : isto
                    ));

                    setShowIssueDeliveryModal(null);
                    setDeliveryData({
                      deliveryNumber: '',
                      issuedAt: new Date().toISOString().split('T')[0],
                      driver: '',
                      vehicle: '',
                      contact: '',
                      boxes: '',
                      weight: '',
                      notes: '',
                      driverName: '',
                      vehicleInfo: '',
                      deliveryNotes: '',
                      lines: []
                    });
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all"
                >
                  Issue Delivery
                </button>
                <button
                  onClick={() => setShowIssueDeliveryModal(null)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receive Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            {(() => {
              const isto = istos.find(i => i.id === showReceiveModal);
              if (!isto) return null;

              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Receive Items - {isto.istoNumber}</h3>
                    <button
                      onClick={() => setShowReceiveModal(null)}
                      className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {isto.lines.map((line) => (
                      <div key={line.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{line.itemName}</p>
                            <p className="text-sm text-gray-500">{line.itemSku}</p>
                          </div>
                          <div className="text-right text-sm">
                            <p>Requested: {line.requestedQty} {line.unit}</p>
                            <p>Already Received: {line.receivedQty || 0} {line.unit}</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Receive Quantity
                          </label>
                          <input
                            type="number"
                            value={receiveData[line.id] || ''}
                            onChange={(e) => setReceiveData(prev => ({
                              ...prev,
                              [line.id]: parseInt(e.target.value) || 0
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="0"
                            max={line.requestedQty - (line.receivedQty || 0)}
                            placeholder="Enter quantity to receive"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center space-x-4 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleReceive(isto.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all"
                    >
                      Receive Items
                    </button>
                    <button
                      onClick={() => setShowReceiveModal(null)}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            {(() => {
              const isto = istos.find(i => i.id === showDetailsModal);
              if (!isto) return null;

              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">ISTO Details - {isto.istoNumber}</h3>
                    <button
                      onClick={() => setShowDetailsModal(null)}
                      className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Header Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Source Store</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{isto.sourceStore}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Target Store</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{isto.targetStore}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                      {getStatusBadge(isto.status)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Created By</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{isto.createdBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Created Date</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(isto.createdAt)}</p>
                    </div>
                    {isto.deliveryNumber && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Delivery Number</p>
                        <p className="font-mono text-sm bg-white px-2 py-1 rounded border">
                          {isto.deliveryNumber}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Items Table */}
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Item</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Requested</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Picked</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Received</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {isto.lines.map((line) => (
                          <tr key={line.id}>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{line.itemName}</p>
                                <p className="text-sm text-gray-500">{line.itemSku}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-900 dark:text-gray-100">{line.requestedQty} {line.unit}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-900 dark:text-gray-100">{line.pickedQty || 0} {line.unit}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-900 dark:text-gray-100">{line.receivedQty || 0} {line.unit}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                line.status === 'Received' 
                                  ? 'bg-green-100 text-green-800' 
                                  : line.status === 'Picked'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800 dark:text-gray-200'
                              }`}>
                                {line.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {isto.notes && (
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{isto.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowDetailsModal(null)}
                      className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-all"
                    >
                      Close
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