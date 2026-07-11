import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Package,
  AlertTriangle,
  FileText,
  Eye,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ApprovalItem {
  id: string;
  type: 'requisition' | 'stock_adjustment';
  requestId: string;
  title: string;
  requestedBy: string;
  requestDate: string;
  store: string;
  urgency: 'Normal' | 'Urgent' | 'Critical';
  status: 'Submitted' | 'Approved' | 'Rejected' | 'On Hold';
  itemCount: number;
  totalValue?: string;
  description: string;
  submittedAt: string;
}

export default function Approvals() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('submitted');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = () => {
    try {
      setLoading(true);
      const items: ApprovalItem[] = [];

      // Load from pos_approvals
      const approvalsRaw = localStorage.getItem('pos_approvals');
      if (approvalsRaw) {
        const parsed = JSON.parse(approvalsRaw);
        if (Array.isArray(parsed)) {
          parsed.forEach((row: any) => {
            if (['submitted', 'pending_approval', 'Submitted'].includes(row.status)) {
              items.push({
                id: row.id,
                type: row.type || 'requisition',
                requestId: row.request_number || row.requestId || `REQ-${String(row.id).slice(0, 6).toUpperCase()}`,
                title: row.title || row.description || 'Purchase Requisition',
                requestedBy: row.requested_by_name || row.requested_by || row.requestedBy || 'Unknown',
                requestDate: row.created_at || row.request_date || row.requestDate || new Date().toISOString(),
                store: row.store_name || row.store || 'Main Store',
                urgency: (row.urgency || 'Normal') as 'Normal' | 'Urgent' | 'Critical',
                status: 'Submitted',
                itemCount: row.item_count || row.itemCount || 0,
                totalValue: row.total_value ? `$${parseFloat(row.total_value).toFixed(2)}` : row.totalValue,
                description: row.description || row.notes || '',
                submittedAt: row.created_at || row.submitted_at || row.submittedAt || new Date().toISOString(),
              });
            }
          });
        }
      }

      // Also load from pos_purchase_requisitions
      const prsRaw = localStorage.getItem('pos_purchase_requisitions');
      if (prsRaw) {
        const parsed = JSON.parse(prsRaw);
        if (Array.isArray(parsed)) {
          parsed.forEach((row: any) => {
            if (['submitted', 'pending_approval'].includes(row.status) && !items.find(i => i.id === row.id)) {
              items.push({
                id: row.id,
                type: 'requisition',
                requestId: row.request_number || `REQ-${String(row.id).slice(0, 6).toUpperCase()}`,
                title: row.title || row.description || 'Purchase Requisition',
                requestedBy: row.requested_by_name || row.requested_by || 'Unknown',
                requestDate: row.created_at || row.request_date || new Date().toISOString(),
                store: row.store_name || row.store || 'Main Store',
                urgency: (row.urgency || 'Normal') as 'Normal' | 'Urgent' | 'Critical',
                status: 'Submitted',
                itemCount: row.item_count || 0,
                totalValue: row.total_value ? `$${parseFloat(row.total_value).toFixed(2)}` : undefined,
                description: row.description || row.notes || '',
                submittedAt: row.created_at || row.submitted_at || new Date().toISOString(),
              });
            }
          });
        }
      }

      setApprovals(items);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApprovalStatus = (id: string, newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      };
      if (approvalComment.trim()) {
        updateData.review_comment = approvalComment;
      }

      // Update in pos_approvals
      const approvalsRaw = localStorage.getItem('pos_approvals');
      if (approvalsRaw) {
        const parsed = JSON.parse(approvalsRaw);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((item: any) =>
            item.id === id ? { ...item, ...updateData } : item
          );
          localStorage.setItem('pos_approvals', JSON.stringify(updated));
        }
      }

      // Update in pos_purchase_requisitions
      const prsRaw = localStorage.getItem('pos_purchase_requisitions');
      if (prsRaw) {
        const parsed = JSON.parse(prsRaw);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((item: any) =>
            item.id === id ? { ...item, ...updateData } : item
          );
          localStorage.setItem('pos_purchase_requisitions', JSON.stringify(updated));
        }
      }

      // Remove from local list since it's no longer pending
      setApprovals(prev => prev.filter(item => item.id !== id));
      setShowDetails(null);
      setApprovalComment('');
    } catch (error) {
      console.error('Error updating approval:', error);
    }
  };

  const handleApprove = (id: string) => {
    updateApprovalStatus(id, 'approved');
  };

  const handleReject = (id: string) => {
    if (!approvalComment.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    updateApprovalStatus(id, 'rejected');
  };

  const handleHold = (id: string) => {
    updateApprovalStatus(id, 'on_hold');
  };

  const filteredApprovals = approvals.filter(item => {
    const matchesSearch = 
      item.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesUrgency = selectedUrgency === 'all' || item.urgency === selectedUrgency;
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'submitted' && item.status === 'Submitted') ||
      (selectedStatus === 'approved' && item.status === 'Approved') ||
      (selectedStatus === 'rejected' && item.status === 'Rejected') ||
      (selectedStatus === 'on_hold' && item.status === 'On Hold');
    
    return matchesSearch && matchesType && matchesUrgency && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Submitted': { color: 'bg-blue-100 text-blue-800', icon: Clock },
      'Approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Rejected': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'On Hold': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    
    return (
      <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        <span>{status}</span>
      </div>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig = {
      'Normal': 'bg-green-100 text-green-800',
      'Urgent': 'bg-yellow-100 text-yellow-800',
      'Critical': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${urgencyConfig[urgency as keyof typeof urgencyConfig]}`}>
        {urgency}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    return type === 'requisition' ? Package : FileText;
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

  const pendingCount = approvals.filter(item => item.status === 'Submitted').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Approvals</h1>
          <p className="text-gray-600 mt-1">
            Review and approve requisitions and stock adjustments
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium">
                {pendingCount} pending approval{pendingCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by request ID, title, or requester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="requisition">Requisitions</option>
                <option value="stock_adjustment">Stock Adjustments</option>
              </select>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="submitted">Pending Approval</option>
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="on_hold">On Hold</option>
            </select>
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Urgency</option>
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-4">
        {filteredApprovals.map((item) => {
          const TypeIcon = getTypeIcon(item.type);
          
          return (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TypeIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {item.requestId}
                      </span>
                      {getUrgencyBadge(item.urgency)}
                    </div>
                    
                    <p className="text-gray-600 mb-3">{item.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">By: {item.requestedBy}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{formatDate(item.requestDate)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{item.itemCount} items</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          {item.store}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {getStatusBadge(item.status)}
                  {item.status === 'Submitted' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowDetails(item.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Review</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredApprovals.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No approvals found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Approval Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            {(() => {
              const item = approvals.find(a => a.id === showDetails);
              if (!item) return null;
              
              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{item.requestId}</p>
                    </div>
                    <button
                      onClick={() => setShowDetails(null)}
                      className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Requested By
                        </label>
                        <p className="text-gray-900 dark:text-gray-100">{item.requestedBy}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Store
                        </label>
                        <p className="text-gray-900 dark:text-gray-100">{item.store}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Request Date
                        </label>
                        <p className="text-gray-900 dark:text-gray-100">{formatDate(item.requestDate)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Urgency
                        </label>
                        {getUrgencyBadge(item.urgency)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{item.description}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Items Count
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{item.itemCount} items requested</p>
                    </div>

                    {/* Items Details */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Requested Items
                      </label>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        {item.type === 'requisition' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-white rounded border">
                              <div className="flex-1 grid grid-cols-4 gap-4">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">Coffee Beans - Premium Blend</p>
                                  <p className="text-sm text-gray-500">ITM-001</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Quantity</p>
                                  <p className="font-medium">10 kg</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Stock on Hand</p>
                                  <p className="font-medium">25 kg</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Est. Cost</p>
                                  <p className="font-medium">$450.00</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white rounded border">
                              <div className="flex-1 grid grid-cols-4 gap-4">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">Disposable Cups - 12oz</p>
                                  <p className="text-sm text-gray-500">ITM-002</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Quantity</p>
                                  <p className="font-medium">500 pcs</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Stock on Hand</p>
                                  <p className="font-medium">200 pcs</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Est. Cost</p>
                                  <p className="font-medium">$125.00</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {item.type === 'stock_adjustment' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-white rounded border">
                              <div className="flex-1 grid grid-cols-4 gap-4">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">Sugar Packets</p>
                                  <p className="text-sm text-gray-500">ITM-004</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Adjustment</p>
                                  <p className="font-medium text-red-600">-5 box</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Stock</p>
                                  <p className="font-medium">15 box</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Reason</p>
                                  <p className="font-medium text-sm">Damaged</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {item.totalValue && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estimated Value
                        </label>
                        <p className="text-gray-900 font-semibold">{item.totalValue}</p>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments (Optional for approval, Required for rejection)
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                      <textarea
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add your comments here..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-all flex items-center space-x-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleHold(item.id)}
                      className="bg-yellow-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-yellow-700 transition-all flex items-center space-x-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Hold</span>
                    </button>
                    <button
                      onClick={() => setShowDetails(null)}
                      className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-all"
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
    </div>
  );
}