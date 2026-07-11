import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Building, 
  Camera, 
  Play, 
  Download, 
  Eye, 
  ArrowLeft,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

// Mock data
const mockBranches = [
  { id: '1', name: 'KC Store', code: 'KC' },
  { id: '2', name: 'Olaya Store', code: 'OL' },
  { id: '3', name: 'Solitaire Store', code: 'SOL' },
  { id: '4', name: 'Jeddah Store', code: 'JED' }
];

const mockCashiers = [
  { id: '1', name: 'Mike Cashier', email: 'cashier@company.com' },
  { id: '2', name: 'Sarah Manager', email: 'manager@company.com' },
  { id: '3', name: 'John Admin', email: 'admin@company.com' }
];

const mockEvents = [
  {
    id: '1',
    createdAt: '2024-12-20T14:30:00Z',
    branchId: '1',
    registerId: 'REG-001',
    cashierId: '1',
    eventType: 'sale',
    invoiceNo: 'INV-2024-001',
    amount: 156.80,
    currency: 'USD',
    payloadJson: {
      items: [
        { name: 'Coffee Beans - Premium', qty: 2, price: 45.00 },
        { name: 'Disposable Cups', qty: 50, price: 0.25 }
      ],
      payment: { method: 'card', amount: 156.80 }
    },
    cameraEvents: [
      {
        id: '1',
        cameraId: '1',
        cameraName: 'Cashier 1',
        captureStatus: 'captured',
        snapshotUrl: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
        clipUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        preSec: 10,
        postSec: 10
      },
      {
        id: '2',
        cameraId: '2',
        cameraName: 'Entrance',
        captureStatus: 'captured',
        snapshotUrl: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg',
        clipUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        preSec: 10,
        postSec: 10
      }
    ]
  },
  {
    id: '2',
    createdAt: '2024-12-20T13:15:00Z',
    branchId: '1',
    registerId: 'REG-001',
    cashierId: '2',
    eventType: 'refund',
    invoiceNo: 'REF-2024-001',
    amount: 45.50,
    currency: 'USD',
    payloadJson: {
      originalInvoice: 'INV-2024-001',
      reason: 'Customer return',
      items: [{ name: 'Coffee Beans - Premium', qty: 1, price: 45.00 }]
    },
    cameraEvents: [
      {
        id: '3',
        cameraId: '1',
        cameraName: 'Cashier 1',
        captureStatus: 'failed',
        errorMessage: 'Camera offline during capture',
        preSec: 10,
        postSec: 10
      }
    ]
  },
  {
    id: '3',
    createdAt: '2024-12-20T12:45:00Z',
    branchId: '2',
    registerId: 'REG-002',
    cashierId: '3',
    eventType: 'void',
    invoiceNo: 'VOID-2024-001',
    amount: 23.75,
    currency: 'USD',
    payloadJson: {
      reason: 'Incorrect order',
      voidedBy: 'manager@company.com'
    },
    cameraEvents: [
      {
        id: '4',
        cameraId: '4',
        cameraName: 'Cashier 1',
        captureStatus: 'captured',
        snapshotUrl: 'https://images.pexels.com/photos/3184293/pexels-photo-3184293.jpeg',
        clipUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        preSec: 10,
        postSec: 10
      }
    ]
  }
];

const eventTypes = ['All Types', 'sale', 'refund', 'void', 'discount', 'price_override', 'cash_drawer_open', 'no_sale'];
const captureStatuses = ['All Status', 'captured', 'failed', 'pending'];

interface CameraEventViewerProps {
  onBack: () => void;
}

export default function CameraEventViewer({ onBack }: CameraEventViewerProps) {
  const [events, setEvents] = useState(mockEvents);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedEventType, setSelectedEventType] = useState('All Types');
  const [selectedCashier, setSelectedCashier] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const itemsPerPage = 20;

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.eventType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBranch = selectedBranch === 'all' || event.branchId === selectedBranch;
    const matchesEventType = selectedEventType === 'All Types' || event.eventType === selectedEventType;
    const matchesCashier = selectedCashier === 'all' || event.cashierId === selectedCashier;
    
    const eventDate = new Date(event.createdAt).toISOString().split('T')[0];
    const matchesDateRange = eventDate >= dateRange.start && eventDate <= dateRange.end;
    
    const matchesAmountRange = 
      (!amountRange.min || event.amount >= parseFloat(amountRange.min)) &&
      (!amountRange.max || event.amount <= parseFloat(amountRange.max));
    
    let matchesStatus = true;
    if (selectedStatus !== 'All Status') {
      const hasStatus = event.cameraEvents.some(ce => ce.captureStatus === selectedStatus);
      matchesStatus = hasStatus;
    }
    
    return matchesSearch && matchesBranch && matchesEventType && matchesCashier && 
           matchesDateRange && matchesAmountRange && matchesStatus;
  });

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'sale':
        return 'bg-green-100 text-green-800';
      case 'refund':
        return 'bg-blue-100 text-blue-800';
      case 'void':
        return 'bg-red-100 text-red-800';
      case 'discount':
        return 'bg-yellow-100 text-yellow-800';
      case 'price_override':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:text-gray-200';
    }
  };

  const getCaptureStatusIcon = (status: string) => {
    switch (status) {
      case 'captured':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Time', 'Branch', 'Register', 'Event Type', 'Invoice No', 'Cashier', 'Amount', 'Cameras', 'Status'],
      ...filteredEvents.map(event => {
        const branch = mockBranches.find(b => b.id === event.branchId);
        const cashier = mockCashiers.find(c => c.id === event.cashierId);
        const capturedCount = event.cameraEvents.filter(ce => ce.captureStatus === 'captured').length;
        const totalCameras = event.cameraEvents.length;
        
        return [
          formatDate(event.createdAt),
          branch?.name || '',
          event.registerId,
          event.eventType,
          event.invoiceNo || '',
          cashier?.name || '',
          event.amount.toString(),
          `${capturedCount}/${totalCameras}`,
          capturedCount === totalCameras ? 'Complete' : 'Partial'
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `camera-events-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Camera Event Viewer</h1>
            <p className="text-gray-600 mt-1">Browse and analyze POS events with camera footage</p>
          </div>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Invoice no, keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Branches</option>
              {mockBranches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cashier</label>
            <select
              value={selectedCashier}
              onChange={(e) => setSelectedCashier(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Cashiers</option>
              {mockCashiers.map(cashier => (
                <option key={cashier.id} value={cashier.id}>{cashier.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={amountRange.min}
                onChange={(e) => setAmountRange(prev => ({ ...prev, min: e.target.value }))}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                placeholder="Max"
                value={amountRange.max}
                onChange={(e) => setAmountRange(prev => ({ ...prev, max: e.target.value }))}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Capture Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {captureStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Time</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Branch</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Register</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Event Type</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Invoice No</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Cashier</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Amount</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Cameras</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Preview</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedEvents.map((event) => {
                const branch = mockBranches.find(b => b.id === event.branchId);
                const cashier = mockCashiers.find(c => c.id === event.cashierId);
                const capturedCount = event.cameraEvents.filter(ce => ce.captureStatus === 'captured').length;
                const totalCameras = event.cameraEvents.length;
                const hasSnapshot = event.cameraEvents.some(ce => ce.snapshotUrl);
                
                return (
                  <tr 
                    key={event.id} 
                    className="hover:bg-gray-50 transition-all cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-100">{formatDate(event.createdAt)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-100">{branch?.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {event.registerId}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium capitalize ${getEventTypeColor(event.eventType)}`}>
                        {event.eventType}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-900 dark:text-gray-100">{event.invoiceNo || '-'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-100">{cashier?.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(event.amount)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Camera className="w-4 h-4 text-gray-400" />
                        <span className={`text-sm font-medium ${
                          capturedCount === totalCameras ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {capturedCount}/{totalCameras}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {hasSnapshot ? (
                        <div className="w-12 h-8 bg-gray-200 rounded overflow-hidden">
                          <img
                            src={event.cameraEvents.find(ce => ce.snapshotUrl)?.snapshotUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                          <Camera className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredEvents.length)} of {filteredEvents.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:bg-gray-900"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:bg-gray-900"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {filteredEvents.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Event Details Side Panel */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
          <div className="bg-white w-full max-w-2xl h-full overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Event Details</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedEvent.invoiceNo || selectedEvent.eventType}</p>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Event Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Event Type</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium capitalize ${getEventTypeColor(selectedEvent.eventType)}`}>
                      {selectedEvent.eventType}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(selectedEvent.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
                    <p className="text-gray-900 dark:text-gray-100">{formatDate(selectedEvent.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cashier</p>
                    <p className="text-gray-900 dark:text-gray-100">{mockCashiers.find(c => c.id === selectedEvent.cashierId)?.name}</p>
                  </div>
                </div>
              </div>

              {/* Camera Footage */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Camera Footage</h4>
                <div className="space-y-4">
                  {selectedEvent.cameraEvents.map((cameraEvent: any) => (
                    <div key={cameraEvent.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Camera className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-gray-100">{cameraEvent.cameraName}</span>
                          {getCaptureStatusIcon(cameraEvent.captureStatus)}
                        </div>
                        {cameraEvent.captureStatus === 'captured' && (
                          <div className="flex items-center space-x-2">
                            <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all flex items-center space-x-1">
                              <Play className="w-3 h-3" />
                              <span>Play</span>
                            </button>
                            <button className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-all flex items-center space-x-1">
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {cameraEvent.captureStatus === 'captured' ? (
                        <div className="space-y-3">
                          {/* Video Player */}
                          {cameraEvent.clipUrl && (
                            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                              <video
                                src={cameraEvent.clipUrl}
                                className="w-full h-full"
                                controls
                                preload="metadata"
                              />
                            </div>
                          )}

                          {/* Snapshot */}
                          {cameraEvent.snapshotUrl && (
                            <div className="flex items-center space-x-4">
                              <div className="w-24 h-16 bg-gray-200 rounded overflow-hidden">
                                <img
                                  src={cameraEvent.snapshotUrl}
                                  alt="Snapshot"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Event Snapshot</p>
                                <p className="text-xs text-gray-500">
                                  ±{cameraEvent.preSec}s / +{cameraEvent.postSec}s
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm">
                            {cameraEvent.captureStatus === 'failed' 
                              ? cameraEvent.errorMessage || 'Capture failed'
                              : 'Capture pending'
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* POS Data */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">POS Transaction Data</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedEvent.payloadJson, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Open Invoice</span>
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2">
                  <Activity className="w-4 h-4" />
                  <span>Item Movements</span>
                </button>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-all flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Register Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}