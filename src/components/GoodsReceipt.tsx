import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  ArrowLeft,
  Save,
  X,
  Package,
  Calendar,
  User,
  Building,
  FileText,
  Eye,
  Printer,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Camera,
  Upload,
  Scan,
  Zap,
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Sample purchase orders so the component isn't blank on first use
const SAMPLE_PURCHASE_ORDERS = [
  {
    id: 'po-1',
    poNumber: 'PO-001',
    supplierName: 'Coffee Beans Co.',
    supplierId: 'sup-1',
    createdDate: '2024-12-15',
    status: 'Open',
    items: [
      { id: 'poi-1', itemId: 'item-1', itemName: 'Coffee Beans - Premium Blend', itemCode: 'ITM-001', orderedQuantity: 100, alreadyReceived: 0, unitPrice: 45.00, unit: 'kg', status: 'Open', isExpiryTracked: true },
      { id: 'poi-2', itemId: 'item-2', itemName: 'Disposable Cups 12oz', itemCode: 'ITM-002', orderedQuantity: 2000, alreadyReceived: 0, unitPrice: 0.25, unit: 'pcs', status: 'Open', isExpiryTracked: false }
    ]
  },
  {
    id: 'po-2',
    poNumber: 'PO-002',
    supplierName: 'Fresh Dairy Supplies',
    supplierId: 'sup-2',
    createdDate: '2024-12-18',
    status: 'Open',
    items: [
      { id: 'poi-3', itemId: 'item-3', itemName: 'Full Cream Milk', itemCode: 'ITM-003', orderedQuantity: 200, alreadyReceived: 0, unitPrice: 3.50, unit: 'liters', status: 'Open', isExpiryTracked: true },
      { id: 'poi-4', itemId: 'item-4', itemName: 'Whipped Cream', itemCode: 'ITM-004', orderedQuantity: 50, alreadyReceived: 0, unitPrice: 8.00, unit: 'cans', status: 'Open', isExpiryTracked: true }
    ]
  }
];

// Helper to load Purchase Orders from localStorage
function fetchPurchaseOrders() {
  try {
    const stored = localStorage.getItem('pos_purchase_orders');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading POs from localStorage:', e);
  }
  // Seed with sample data so the component isn't blank
  localStorage.setItem('pos_purchase_orders', JSON.stringify(SAMPLE_PURCHASE_ORDERS));
  return SAMPLE_PURCHASE_ORDERS;
}

// Helper to load GR history from localStorage
function fetchGRHistory() {
  try {
    const stored = localStorage.getItem('pos_gr_history');
    if (stored) return JSON.parse(stored) as any[];
  } catch (e) {
    console.error('Error reading GR history from localStorage:', e);
  }
  return [];
}

const locations = [
  'Warehouse - Section A1',
  'Warehouse - Section B2',
  'KC Store - Main Floor',
  'Olaya Store - Main Floor',
  'Display Area 1'
];

// Global batch-expiry mapping and sequence counters
let batchExpiryMapping: Record<string, Record<string, string>> = {};
let itemSequenceCounters: Record<string, number> = {};

interface GoodsReceiptProps {
  onBack: () => void;
}

export default function GoodsReceipt({ onBack }: GoodsReceiptProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'history' | 'create-from-po' | 'smart-capture'>('create-from-po');
  
  // History tab state
  const [grHistory, setGrHistory] = useState<any[]>([]);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('All');
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [showViewModal, setShowViewModal] = useState<string | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create from PO tab state
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [poSearchTerm, setPoSearchTerm] = useState('');
  const [poStatusFilter, setPoStatusFilter] = useState('Open/Partially Received');
  const [selectedPO, setSelectedPO] = useState<any>(null);
  
  // GR Form state
  const [formData, setFormData] = useState({
    grNumber: '',
    grDate: new Date().toISOString().split('T')[0],
    supplierName: '',
    supplierId: '',
    deliveryLocation: '',
    items: [] as any[],
    notes: ''
  });
  
  const [showBatchModal, setShowBatchModal] = useState<{
    itemId: string;
    itemCode: string;
    isExpiryTracked: boolean;
    batchNumber: string;
    expiryDate: string;
    quantity: string;
  } | null>(null);

  // Smart Capture state
  const [smartCaptureData, setSmartCaptureData] = useState({
    selectedPO: null as any,
    capturedImage: null as string | null,
    isProcessing: false,
    recognizedData: null as any,
    extractedItems: [] as any[],
    confidence: 0,
    needsReview: false
  });
  const [showImageModal, setShowImageModal] = useState(false);
  const [showPOSelectionModal, setShowPOSelectionModal] = useState(false);
  const [showExtraQuantityModal, setShowExtraQuantityModal] = useState<{
    item: any;
    recognizedQty: number;
    poQty: number;
    extraQty: number;
  } | null>(null);

  // Load data from localStorage
  const loadData = () => {
    setLoading(true);
    try {
      const posData = fetchPurchaseOrders();
      const grData = fetchGRHistory();
      setPurchaseOrders(posData);
      setGrHistory(grData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const generateGRNumber = () => {
    const nextNumber = grHistory.length + 1;
    return `GR-${nextNumber.toString().padStart(3, '0')}`;
  };

  // Smart Capture Functions
  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setSmartCaptureData(prev => ({ 
          ...prev, 
          capturedImage: imageData,
          isProcessing: true,
          recognizedData: null,
          extractedItems: []
        }));
        processInvoiceImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const processInvoiceImage = async (imageData: string) => {
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock recognition results
    const mockRecognizedData = {
      supplierName: 'Coffee Beans Co.',
      invoiceNumber: 'INV-CB-2024-001',
      invoiceDate: '2024-12-20',
      totalAmount: 2450.00,
      items: [
        {
          description: 'Coffee Beans - Premium Blend',
          quantity: 50,
          unit: 'kg',
          unitPrice: 45.00,
          lineTotal: 2250.00,
          confidence: 0.95,
          matchedItemId: '1',
          matchedItemCode: 'ITM-001'
        },
        {
          description: 'Disposable Cups 12oz',
          quantity: 800,
          unit: 'pcs',
          unitPrice: 0.25,
          lineTotal: 200.00,
          confidence: 0.88,
          matchedItemId: '2',
          matchedItemCode: 'ITM-002'
        }
      ]
    };

    setSmartCaptureData(prev => ({
      ...prev,
      isProcessing: false,
      recognizedData: mockRecognizedData,
      extractedItems: mockRecognizedData.items,
      confidence: 0.92,
      needsReview: mockRecognizedData.items.some(item => item.confidence < 0.9)
    }));
  };

  const handleSelectPOForSmart = (po: any) => {
    setSmartCaptureData(prev => ({ ...prev, selectedPO: po }));
    setShowPOSelectionModal(false);
  };

  const handleApplySmartGR = () => {
    if (!smartCaptureData.recognizedData) return;

    const { recognizedData, selectedPO } = smartCaptureData;
    
    // Check for extra quantities
    const itemsWithExtra: any[] = [];
    
    recognizedData.items.forEach((recognizedItem: any) => {
      if (selectedPO) {
        const poItem = selectedPO.items.find((item: any) => 
          item.itemId === recognizedItem.matchedItemId
        );
        
        if (poItem && recognizedItem.quantity > poItem.orderedQuantity) {
          itemsWithExtra.push({
            item: recognizedItem,
            recognizedQty: recognizedItem.quantity,
            poQty: poItem.orderedQuantity,
            extraQty: recognizedItem.quantity - poItem.orderedQuantity
          });
        }
      }
    });

    if (itemsWithExtra.length > 0) {
      setShowExtraQuantityModal(itemsWithExtra[0]);
      return;
    }

    // Apply the GR
    applySmartGRData();
  };

  const applySmartGRData = () => {
    const { recognizedData, selectedPO } = smartCaptureData;
    
    const grItems = recognizedData.items.map((item: any) => ({
      id: item.matchedItemId,
      itemId: item.matchedItemId,
      itemName: item.description,
      itemCode: item.matchedItemCode,
      orderedQuantity: selectedPO ? 
        selectedPO.items.find((poItem: any) => poItem.itemId === item.matchedItemId)?.orderedQuantity || item.quantity
        : item.quantity,
      alreadyReceived: 0,
      receivedQuantity: item.quantity,
      unitPrice: item.unitPrice,
      unit: item.unit,
      status: 'Open',
      isExpiryTracked: false,
      batches: []
    }));

    setFormData({
      grNumber: generateGRNumber(),
      grDate: recognizedData.invoiceDate,
      supplierName: recognizedData.supplierName,
      supplierId: selectedPO?.supplierId || '',
      deliveryLocation: locations[0],
      items: grItems,
      notes: `Smart capture from invoice ${recognizedData.invoiceNumber}`
    });

    setSelectedPO(selectedPO);
    setActiveTab('create-from-po');
    
    // Reset smart capture
    setSmartCaptureData({
      selectedPO: null,
      capturedImage: null,
      isProcessing: false,
      recognizedData: null,
      extractedItems: [],
      confidence: 0,
      needsReview: false
    });
  };

  const handleExtraQuantityAction = (action: 'apply_to_current' | 'create_new_gr' | 'ignore') => {
    if (!showExtraQuantityModal) return;

    const { item, poQty, extraQty } = showExtraQuantityModal;

    switch (action) {
      case 'apply_to_current':
        // Apply only PO quantity to current GR
        setSmartCaptureData(prev => ({
          ...prev,
          extractedItems: prev.extractedItems.map(extractedItem =>
            extractedItem.matchedItemId === item.matchedItemId
              ? { ...extractedItem, quantity: poQty }
              : extractedItem
          )
        }));
        break;
      case 'create_new_gr':
        // Will be handled after applying current GR
        alert(`Extra quantity of ${extraQty} ${item.unit} will be processed in a separate GR`);
        break;
      case 'ignore':
        // Keep original quantity
        break;
    }

    setShowExtraQuantityModal(null);
    applySmartGRData();
  };

  const generateBatchNumber = (itemCode: string, expiryDate: string | null): string => {
    const expiryKey = expiryDate || 'NO-EXPIRY';
    
    if (!batchExpiryMapping[itemCode]) {
      batchExpiryMapping[itemCode] = {};
    }
    
    if (batchExpiryMapping[itemCode][expiryKey]) {
      return batchExpiryMapping[itemCode][expiryKey];
    }
    
    if (!itemSequenceCounters[itemCode]) {
      itemSequenceCounters[itemCode] = 1;
    } else {
      itemSequenceCounters[itemCode]++;
    }
    
    const batchNumber = `${itemCode}-${itemSequenceCounters[itemCode].toString().padStart(3, '0')}`;
    batchExpiryMapping[itemCode][expiryKey] = batchNumber;
    
    return batchNumber;
  };

  const handleSelectPO = (po: any) => {
    const openItems = po.items.filter((item: any) => item.status === 'Open').map((item: any) => ({
      ...item,
      receivedQuantity: 0,
      batches: []
    }));

    setFormData({
      grNumber: generateGRNumber(),
      grDate: new Date().toISOString().split('T')[0],
      supplierName: po.supplierName,
      supplierId: po.supplierId,
      deliveryLocation: locations[0],
      items: openItems,
      notes: ''
    });
    setSelectedPO(po);
  };

  const handleNewGRWithoutPO = () => {
    setFormData({
      grNumber: generateGRNumber(),
      grDate: new Date().toISOString().split('T')[0],
      supplierName: '',
      supplierId: '',
      deliveryLocation: locations[0],
      items: [],
      notes: ''
    });
    setSelectedPO(null);
  };

  const handleAddBatch = () => {
    if (!showBatchModal) return;

    const { itemId, itemCode, isExpiryTracked, expiryDate, quantity } = showBatchModal;
    
    if (!quantity || parseInt(quantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    if (isExpiryTracked && (!expiryDate || new Date(expiryDate) < new Date())) {
      alert('Please enter a valid future expiry date');
      return;
    }

    const batchNumber = generateBatchNumber(itemCode, isExpiryTracked ? expiryDate : null);
    
    const newBatch = {
      id: Date.now().toString(),
      batchNumber,
      quantity: parseInt(quantity),
      expiryDate: isExpiryTracked ? expiryDate : null,
      locationName: formData.deliveryLocation
    };

    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, batches: [...item.batches, newBatch] }
          : item
      )
    }));

    setShowBatchModal(null);
  };

  const handleRemoveBatch = (itemId: string, batchId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, batches: item.batches.filter((batch: any) => batch.id !== batchId) }
          : item
      )
    }));
  };

  const handleReceivedQuantityChange = (itemId: string, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, receivedQuantity: quantity }
          : item
      )
    }));
  };

  const handleSaveGR = () => {
    // Validation
    const itemsWithQuantity = formData.items.filter(item => item.receivedQuantity > 0);

    if (itemsWithQuantity.length === 0) {
      alert('Please enter received quantities for at least one item');
      return;
    }

    // Validate batches
    for (const item of itemsWithQuantity) {
      const totalBatchQuantity = item.batches.reduce((sum: number, batch: any) => sum + batch.quantity, 0);

      if (totalBatchQuantity !== item.receivedQuantity) {
        alert(`Batch quantities for ${item.itemName} must equal received quantity (${item.receivedQuantity})`);
        return;
      }
    }

    // Calculate total
    const total = itemsWithQuantity.reduce((sum, item) => sum + (item.receivedQuantity * item.unitPrice), 0);

    try {
      const grId = 'gr-' + Date.now();

      // Build GR items for history
      const grItems: any[] = [];
      const itemMap = new Map<string, any>();
      for (const item of itemsWithQuantity) {
        for (const batch of item.batches) {
          const key = item.itemId;
          if (!itemMap.has(key)) {
            itemMap.set(key, {
              id: item.id,
              itemName: item.itemName,
              itemCode: item.itemCode,
              receivedQuantity: 0,
              unitPrice: item.unitPrice,
              unit: item.unit,
              batches: []
            });
          }
          const entry = itemMap.get(key)!;
          entry.receivedQuantity += batch.quantity;
          entry.batches.push({
            id: batch.id,
            batchNumber: batch.batchNumber || '',
            quantity: batch.quantity,
            expiryDate: batch.expiryDate || null,
            locationName: batch.locationName || formData.deliveryLocation || 'Stock Room'
          });
        }
      }

      const newGR = {
        id: grId,
        grNumber: formData.grNumber,
        supplierName: formData.supplierName,
        grDate: formData.grDate,
        status: 'Completed',
        total,
        items: Array.from(itemMap.values())
      };

      // 1. Save GR to localStorage
      const existingGRs = fetchGRHistory();
      existingGRs.unshift(newGR);
      localStorage.setItem('pos_gr_history', JSON.stringify(existingGRs));

      // 2. Update stock levels in localStorage
      const stockRaw = localStorage.getItem('pos_stock_levels');
      const stockLevels: Record<string, number> = stockRaw ? JSON.parse(stockRaw) : {};
      for (const item of itemsWithQuantity) {
        stockLevels[item.itemId] = (stockLevels[item.itemId] || 0) + item.receivedQuantity;
      }
      localStorage.setItem('pos_stock_levels', JSON.stringify(stockLevels));

      // 3. Update PO status in localStorage
      if (selectedPO) {
        const allPOs = fetchPurchaseOrders();
        const updatedPOs = allPOs.map((po: any) => {
          if (po.id !== selectedPO.id) return po;

          const updatedItems = po.items.map((poItem: any) => {
            const received = itemsWithQuantity.find((i: any) => i.id === poItem.id);
            if (!received) return poItem;
            const newAlreadyReceived = (poItem.alreadyReceived || 0) + received.receivedQuantity;
            const remaining = poItem.orderedQuantity - newAlreadyReceived;
            return {
              ...poItem,
              alreadyReceived: newAlreadyReceived,
              status: remaining > 0 ? 'Open' : 'Closed'
            };
          });

          const allClosed = updatedItems.every((i: any) => i.status === 'Closed');
          const someReceived = updatedItems.some((i: any) => (i.alreadyReceived || 0) > 0);

          return {
            ...po,
            items: updatedItems,
            status: allClosed ? 'Closed' : someReceived ? 'Partially Received' : po.status
          };
        });
        localStorage.setItem('pos_purchase_orders', JSON.stringify(updatedPOs));
      }

      // Reload data from localStorage
      loadData();

      // Reset form
      setFormData({
        grNumber: '',
        grDate: new Date().toISOString().split('T')[0],
        supplierName: '',
        supplierId: '',
        deliveryLocation: '',
        items: [],
        notes: ''
      });
      setSelectedPO(null);

      alert('Goods Receipt saved successfully!');
    } catch (err) {
      console.error('Unexpected error saving GR:', err);
      alert('An unexpected error occurred while saving the Goods Receipt.');
    }
  };

  const handleViewGR = (grId: string) => {
    setShowViewModal(grId);
  };

  const handleReprintGR = (gr: any) => {
    const tags: any[] = [];
    
    gr.items.forEach((item: any) => {
      item.batches.forEach((batch: any) => {
        tags.push({
          itemName: item.itemName,
          itemCode: item.itemCode,
          batchNumber: batch.batchNumber,
          quantity: batch.quantity,
          unit: item.unit,
          expiryDate: batch.expiryDate,
          locationName: batch.locationName
        });
      });
    });
    
    setShowPrintPreview(tags);
  };

  const handlePrintTags = () => {
    // In a real app, this would send to printer
    alert(`Printing ${showPrintPreview.length} batch tags...`);
    setShowPrintPreview([]);
  };

  // Filter functions
  const filteredGRHistory = grHistory.filter(gr => {
    const matchesSearch = 
      gr.grNumber.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
      gr.supplierName.toLowerCase().includes(historySearchTerm.toLowerCase());
    
    const matchesDate = !historyDateFilter || gr.grDate === historyDateFilter;
    const matchesStatus = historyStatusFilter === 'All' || gr.status === historyStatusFilter;
    
    return matchesSearch && matchesDate && matchesStatus;
  });

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = 
      po.poNumber.toLowerCase().includes(poSearchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(poSearchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (poStatusFilter === 'Open/Partially Received') {
      matchesStatus = po.status === 'Open' || po.status === 'Partially Received';
    } else if (poStatusFilter !== 'All') {
      matchesStatus = po.status === poStatusFilter;
    }
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredGRHistory.length / itemsPerPage);
  const startIndex = (historyCurrentPage - 1) * itemsPerPage;
  const paginatedGRHistory = filteredGRHistory.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
            <span>Back to Inventory</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Goods Receipt</h1>
            <p className="text-gray-600 mt-1">Receive and record incoming inventory</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleNewGRWithoutPO}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New GR (without PO)</span>
          </button>
          <button
            onClick={() => loadData()}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('create-from-po')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                activeTab === 'create-from-po'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:border-gray-600'
              }`}
            >
              Create from PO
            </button>
            <button
              onClick={() => setActiveTab('smart-capture')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all flex items-center space-x-2 ${
                activeTab === 'smart-capture'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:border-gray-600'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Smart Capture</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:border-gray-600'
              }`}
            >
              GR History
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'smart-capture' ? (
            <div className="space-y-6">
              {/* Smart Capture Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-blue-900">Smart Invoice Capture</h2>
                    <p className="text-blue-700 mt-1">
                      Upload an invoice image and let AI automatically extract quantities and details
                    </p>
                  </div>
                </div>
              </div>

              {!smartCaptureData.capturedImage ? (
                /* Image Upload */
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-all">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Invoice</h3>
                  <p className="text-gray-600 mb-6">
                    Take a photo, upload an image, or upload a PDF of the supplier invoice for automatic processing
                  </p>
                  
                  <div className="flex items-center justify-center space-x-4">
                    <label className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all cursor-pointer flex items-center space-x-2">
                      <Upload className="w-5 h-5" />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleImageCapture}
                        className="hidden"
                      />
                    </label>
                    <label className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all cursor-pointer flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Upload PDF</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleImageCapture}
                        className="hidden"
                      />
                    </label>
                    <label className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-all cursor-pointer flex items-center space-x-2">
                      <Camera className="w-5 h-5" />
                      <span>Take Photo</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        capture="environment"
                        onChange={handleImageCapture}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  <div className="mt-6 text-sm text-gray-500">
                    <p>Supported formats: JPG, PNG, HEIC, WebP, PDF</p>
                    <p>For best results, ensure the invoice is well-lit and clearly visible</p>
                  </div>
                </div>
              ) : smartCaptureData.isProcessing ? (
                /* Processing */
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Invoice...</h3>
                  <p className="text-gray-600 mb-4">
                    AI is analyzing the image and extracting invoice details
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        <span>Detecting text and layout...</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        <span>Extracting supplier information...</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        <span>Identifying items and quantities...</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        <span>Matching with inventory...</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : smartCaptureData.recognizedData ? (
                /* Recognition Results */
                <div className="space-y-6">
                  {/* Confidence Score */}
                  <div className={`p-4 rounded-lg border ${
                    smartCaptureData.confidence >= 0.9 
                      ? 'bg-green-50 border-green-200' 
                      : smartCaptureData.confidence >= 0.7 
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {smartCaptureData.confidence >= 0.9 ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : smartCaptureData.confidence >= 0.7 ? (
                          <AlertTriangle className="w-6 h-6 text-yellow-600" />
                        ) : (
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        )}
                        <div>
                          <h3 className={`font-semibold ${
                            smartCaptureData.confidence >= 0.9 ? 'text-green-800' :
                            smartCaptureData.confidence >= 0.7 ? 'text-yellow-800' : 'text-red-800'
                          }`}>
                            Recognition Confidence: {Math.round(smartCaptureData.confidence * 100)}%
                          </h3>
                          <p className={`text-sm ${
                            smartCaptureData.confidence >= 0.9 ? 'text-green-700' :
                            smartCaptureData.confidence >= 0.7 ? 'text-yellow-700' : 'text-red-700'
                          }`}>
                            {smartCaptureData.confidence >= 0.9 
                              ? 'High confidence - Ready to apply'
                              : smartCaptureData.confidence >= 0.7 
                              ? 'Medium confidence - Please review'
                              : 'Low confidence - Manual review required'
                            }
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowImageModal(true)}
                        className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all flex items-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Image</span>
                      </button>
                    </div>
                  </div>

                  {/* Recognized Invoice Details */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recognized Invoice Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{smartCaptureData.recognizedData.supplierName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{smartCaptureData.recognizedData.invoiceNumber}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(smartCaptureData.recognizedData.invoiceDate)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                        <p className="font-semibold text-green-600">{formatCurrency(smartCaptureData.recognizedData.totalAmount)}</p>
                      </div>
                    </div>
                  </div>

                  {/* PO Selection */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Purchase Order (Optional)</h3>
                      <button
                        onClick={() => setShowPOSelectionModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Select PO</span>
                      </button>
                    </div>
                    {smartCaptureData.selectedPO ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-blue-900">{smartCaptureData.selectedPO.poNumber}</p>
                            <p className="text-sm text-blue-700">{smartCaptureData.selectedPO.supplierName}</p>
                          </div>
                          <button
                            onClick={() => setSmartCaptureData(prev => ({ ...prev, selectedPO: null }))}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                        <p className="text-gray-600 dark:text-gray-400">No PO selected - will create standalone GR</p>
                      </div>
                    )}
                  </div>

                  {/* Extracted Items */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Extracted Items</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Item</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Quantity</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Unit Price</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Line Total</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Confidence</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Match</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {smartCaptureData.extractedItems.map((item, index) => (
                            <tr key={index}>
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">{item.description}</p>
                                  {item.matchedItemCode && (
                                    <p className="text-sm text-gray-500">Matched: {item.matchedItemCode}</p>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newQuantity = parseInt(e.target.value) || 0;
                                    setSmartCaptureData(prev => ({
                                      ...prev,
                                      extractedItems: prev.extractedItems.map((extractedItem, i) =>
                                        i === index ? { ...extractedItem, quantity: newQuantity } : extractedItem
                                      )
                                    }));
                                  }}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{item.unit}</span>
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => {
                                    const newPrice = parseFloat(e.target.value) || 0;
                                    setSmartCaptureData(prev => ({
                                      ...prev,
                                      extractedItems: prev.extractedItems.map((extractedItem, i) =>
                                        i === index ? { ...extractedItem, unitPrice: newPrice, lineTotal: newPrice * extractedItem.quantity } : extractedItem
                                      )
                                    }));
                                  }}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(item.lineTotal)}</span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 rounded-full ${
                                    item.confidence >= 0.9 ? 'bg-green-400' :
                                    item.confidence >= 0.7 ? 'bg-yellow-400' : 'bg-red-400'
                                  }`}></div>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">{Math.round(item.confidence * 100)}%</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {item.matchedItemId ? (
                                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Matched
                                  </span>
                                ) : (
                                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    No Match
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <button className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-all">
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setSmartCaptureData(prev => ({
                                        ...prev,
                                        extractedItems: prev.extractedItems.filter((_, i) => i !== index)
                                      }));
                                    }}
                                    className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setSmartCaptureData({
                          selectedPO: null,
                          capturedImage: null,
                          isProcessing: false,
                          recognizedData: null,
                          extractedItems: [],
                          confidence: 0,
                          needsReview: false
                        })}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center space-x-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Start Over</span>
                      </button>
                      <button
                        onClick={() => setShowImageModal(true)}
                        className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-200 transition-all flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Review Image</span>
                      </button>
                    </div>
                    <div className="flex items-center space-x-4">
                      {smartCaptureData.needsReview && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                          <p className="text-sm text-yellow-800 font-medium">
                            ⚠️ Some items have low confidence - please review
                          </p>
                        </div>
                      )}
                      <button
                        onClick={handleApplySmartGR}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center space-x-2"
                      >
                        <Zap className="w-5 h-5" />
                        <span>Apply to GR</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : activeTab === 'history' ? (
            <div className="space-y-6">
              {/* History Filters */}
              <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by GR Number or Supplier..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="date"
                    value={historyDateFilter}
                    onChange={(e) => setHistoryDateFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={historyStatusFilter}
                    onChange={(e) => setHistoryStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="All">All Status</option>
                    <option value="Completed">Completed</option>
                    <option value="Partially Received">Partially Received</option>
                  </select>
                </div>
              </div>

              {/* GR History Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">GR Number</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Supplier</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">GR Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Total</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedGRHistory.map((gr) => (
                      <tr key={gr.id} className="hover:bg-gray-50 dark:bg-gray-900">
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{gr.grNumber}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-900 dark:text-gray-100">{gr.supplierName}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-900 dark:text-gray-100">{formatDate(gr.grDate)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            gr.status === 'Completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {gr.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(gr.total)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewGR(gr.id)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReprintGR(gr)}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              title="Reprint"
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredGRHistory.length)} of {filteredGRHistory.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setHistoryCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={historyCurrentPage === 1}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:bg-gray-900"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {historyCurrentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setHistoryCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={historyCurrentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:bg-gray-900"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {!selectedPO ? (
                <>
                  {/* PO Filters */}
                  <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search by PO Number or Supplier..."
                        value={poSearchTerm}
                        onChange={(e) => setPoSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center space-x-4">
                      <select
                        value={poStatusFilter}
                        onChange={(e) => setPoStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Open/Partially Received">Open/Partially Received</option>
                        <option value="All">All</option>
                        <option value="Open">Open</option>
                        <option value="Partially Received">Partially Received</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  {/* PO Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">PO Number</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Supplier</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Created Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Lines</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredPOs.map((po) => {
                          const openLines = po.items.filter(item => item.status === 'Open').length;
                          const totalLines = po.items.length;
                          
                          return (
                            <tr key={po.id} className="hover:bg-gray-50 dark:bg-gray-900">
                              <td className="py-3 px-4">
                                <span className="font-medium text-gray-900 dark:text-gray-100">{po.poNumber}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-gray-900 dark:text-gray-100">{po.supplierName}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-gray-900 dark:text-gray-100">{formatDate(po.createdDate)}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                  po.status === 'Open' 
                                    ? 'bg-green-100 text-green-800' 
                                    : po.status === 'Partially Received'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800 dark:text-gray-200'
                                }`}>
                                  {po.status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-gray-900 dark:text-gray-100">{openLines}/{totalLines}</span>
                              </td>
                              <td className="py-3 px-4">
                                <button
                                  onClick={() => handleSelectPO(po)}
                                  disabled={openLines === 0}
                                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Select
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                /* GR Form */
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Create Goods Receipt from {selectedPO.poNumber}
                    </h2>
                    <button
                      onClick={() => setSelectedPO(null)}
                      className="text-gray-600 hover:text-gray-800 dark:text-gray-200"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* GR Header */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GR Number
                      </label>
                      <input
                        type="text"
                        value={formData.grNumber}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GR Date
                      </label>
                      <input
                        type="date"
                        value={formData.grDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, grDate: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supplier
                      </label>
                      <input
                        type="text"
                        value={formData.supplierName}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                        readOnly
                      />
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Item</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Ordered</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Already Received</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Received</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Unit Price</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Batches</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {formData.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{item.itemName}</p>
                                <p className="text-sm text-gray-500">{item.itemCode}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-900 dark:text-gray-100">{item.orderedQuantity} {item.unit}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-900 dark:text-gray-100">{item.alreadyReceived} {item.unit}</span>
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                value={item.receivedQuantity}
                                onChange={(e) => handleReceivedQuantityChange(item.id, parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min="0"
                                max={item.orderedQuantity - item.alreadyReceived}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-900 dark:text-gray-100">{formatCurrency(item.unitPrice)}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                {item.batches.map((batch: any) => (
                                  <div key={batch.id} className="flex items-center space-x-2 text-sm">
                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                      {batch.batchNumber}
                                    </span>
                                    <span>{batch.quantity}</span>
                                    {batch.expiryDate && (
                                      <span className="text-gray-500">
                                        Exp: {formatDate(batch.expiryDate)}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => handleRemoveBatch(item.id, batch.id)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {item.receivedQuantity > 0 && (
                                <button
                                  onClick={() => {
                                    const batchNumber = generateBatchNumber(item.itemCode, item.isExpiryTracked ? new Date().toISOString().split('T')[0] : null);
                                    setShowBatchModal({
                                      itemId: item.id,
                                      itemCode: item.itemCode,
                                      isExpiryTracked: item.isExpiryTracked,
                                      batchNumber,
                                      expiryDate: '',
                                      quantity: ''
                                    });
                                  }}
                                  className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-all"
                                >
                                  Add Batch
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Save Button */}
                  <div className="flex items-center justify-end space-x-4">
                    <button
                      onClick={handleSaveGR}
                      className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Goods Receipt</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {showImageModal && smartCaptureData.capturedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Invoice Image</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="text-center">
              <img
                src={smartCaptureData.capturedImage}
                alt="Captured Invoice"
                className="max-w-full max-h-96 mx-auto rounded-lg border border-gray-200 dark:border-gray-700"
              />
            </div>
            <div className="flex justify-end pt-6">
              <button
                onClick={() => setShowImageModal(false)}
                className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PO Selection Modal */}
      {showPOSelectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Select Purchase Order</h3>
              <button
                onClick={() => setShowPOSelectionModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Select a PO to validate quantities against. Extra quantities will be handled separately.
                </p>
              </div>
              
              {filteredPOs.map((po) => (
                <button
                  key={po.id}
                  onClick={() => handleSelectPOForSmart(po)}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{po.poNumber}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{po.supplierName}</p>
                      <p className="text-sm text-gray-500">{po.items.length} items</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Created: {formatDate(po.createdDate)}</p>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        po.status === 'Open' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {po.status}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
              
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowPOSelectionModal(false)}
                  className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extra Quantity Modal */}
      {showExtraQuantityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Extra Quantity Detected</h3>
              <button
                onClick={() => setShowExtraQuantityModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Quantity Mismatch</span>
                </div>
                <p className="text-sm text-yellow-700">
                  <strong>{showExtraQuantityModal.item.description}</strong>
                </p>
                <div className="mt-2 space-y-1 text-sm text-yellow-700">
                  <p>• PO Quantity: {showExtraQuantityModal.poQty} {showExtraQuantityModal.item.unit}</p>
                  <p>• Invoice Quantity: {showExtraQuantityModal.recognizedQty} {showExtraQuantityModal.item.unit}</p>
                  <p>• Extra Quantity: {showExtraQuantityModal.extraQty} {showExtraQuantityModal.item.unit}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">How would you like to handle the extra quantity?</p>
                
                <button
                  onClick={() => handleExtraQuantityAction('apply_to_current')}
                  className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <span>Apply PO quantity only ({showExtraQuantityModal.poQty} {showExtraQuantityModal.item.unit})</span>
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-blue-200 mt-1">Ignore extra quantity for now</p>
                </button>
                
                <button
                  onClick={() => handleExtraQuantityAction('create_new_gr')}
                  className="w-full bg-green-600 text-white p-3 rounded-lg font-medium hover:bg-green-700 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <span>Create separate GR for extra quantity</span>
                    <Plus className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-green-200 mt-1">Handle {showExtraQuantityModal.extraQty} {showExtraQuantityModal.item.unit} separately</p>
                </button>
                
                <button
                  onClick={() => handleExtraQuantityAction('ignore')}
                  className="w-full bg-gray-600 text-white p-3 rounded-lg font-medium hover:bg-gray-700 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <span>Keep full invoice quantity ({showExtraQuantityModal.recognizedQty} {showExtraQuantityModal.item.unit})</span>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <p className="text-sm text-gray-200 mt-1">Override PO quantity</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Batch</h3>
              <button
                onClick={() => setShowBatchModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Number (Preview)
                </label>
                <input
                  type="text"
                  value={showBatchModal.batchNumber}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                  readOnly
                />
              </div>

              {showBatchModal.isExpiryTracked && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={showBatchModal.expiryDate}
                    onChange={(e) => {
                      const newExpiryDate = e.target.value;
                      const newBatchNumber = generateBatchNumber(showBatchModal.itemCode, newExpiryDate);
                      setShowBatchModal(prev => prev ? { 
                        ...prev, 
                        expiryDate: newExpiryDate,
                        batchNumber: newBatchNumber
                      } : null);
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={showBatchModal.quantity}
                  onChange={(e) => setShowBatchModal(prev => prev ? { ...prev, quantity: e.target.value } : null)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter quantity"
                  min="1"
                  required
                />
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  onClick={handleAddBatch}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all"
                >
                  Add Batch
                </button>
                <button
                  onClick={() => setShowBatchModal(null)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View GR Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            {(() => {
              const gr = grHistory.find(g => g.id === showViewModal);
              if (!gr) return null;

              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Goods Receipt Details</h3>
                    <button
                      onClick={() => setShowViewModal(null)}
                      className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* GR Header */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">GR Number</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{gr.grNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(gr.grDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Supplier</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{gr.supplierName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        gr.status === 'Completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {gr.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                      <p className="font-semibold text-green-600">{formatCurrency(gr.total)}</p>
                    </div>
                  </div>

                  {/* Items and Batches Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Item</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Received Qty</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Unit Price</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Batch No</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Batch Qty</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Expiry</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {gr.items.map((item) => 
                          item.batches.map((batch: any, batchIndex: number) => (
                            <tr key={`${item.id}-${batch.id}`}>
                              {batchIndex === 0 && (
                                <>
                                  <td className="py-3 px-4" rowSpan={item.batches.length}>
                                    <div>
                                      <p className="font-medium text-gray-900 dark:text-gray-100">{item.itemName}</p>
                                      <p className="text-sm text-gray-500">{item.itemCode}</p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4" rowSpan={item.batches.length}>
                                    <span className="text-gray-900 dark:text-gray-100">{item.receivedQuantity} {item.unit}</span>
                                  </td>
                                  <td className="py-3 px-4" rowSpan={item.batches.length}>
                                    <span className="text-gray-900 dark:text-gray-100">{formatCurrency(item.unitPrice)}</span>
                                  </td>
                                </>
                              )}
                              <td className="py-3 px-4">
                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                  {batch.batchNumber}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-gray-900 dark:text-gray-100">{batch.quantity} {item.unit}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-gray-900 dark:text-gray-100">
                                  {batch.expiryDate ? formatDate(batch.expiryDate) : 'N/A'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-gray-900 dark:text-gray-100">{batch.locationName}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button
                      onClick={() => setShowViewModal(null)}
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
    </div>
  );
}