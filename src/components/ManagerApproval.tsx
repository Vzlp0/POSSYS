import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, FileText, User, Calendar, Building2, AlertCircle, Filter, RotateCcw, Ban, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getStatusLabel, getStatusColor } from '../lib/prHelpers';
import PRDetailView from './PRDetailView';

interface PurchaseRequisition {
  id: string;
  pr_number: string;
  pr_date: string;
  status: string;
  priority: string;
  required_date: string;
  notes: string;
  requester_id: string;
  branch_id: string;
  created_at: string;
  requester?: {
    username: string;
    email: string;
  };
  branch?: {
    name: string;
    code: string;
  };
  items?: Array<{
    id: string;
    quantity: number;
    unit: string;
    estimated_cost: number;
    item: {
      name: string;
      sku: string;
    };
  }>;
}

export default function ManagerApproval() {
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPR, setSelectedPR] = useState<PurchaseRequisition | null>(null);
  const [viewingPRId, setViewingPRId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('pending'); // Default: only show pending PRs for approval
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [branches, setBranches] = useState<Array<{ id: string; name: string; code: string }>>([]);

  useEffect(() => {
    fetchBranches();
    fetchRequisitions();
  }, [filterStatus, filterBranch]);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchRequisitions = async () => {
    try {
      setLoading(true);

      // Manager can view ALL pending PRs for approval (not just from direct reports)
      // This allows managers to approve any PR that needs approval
      let query = supabase
        .from('purchase_requisitions')
        .select(`
          *,
          requester:requester_id(username, email),
          branch:branch_id(name, code)
        `)
        .order('pr_date', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (filterBranch !== 'all') {
        query = query.eq('branch_id', filterBranch);
      }

      const { data, error } = await query;

      if (error) throw error;

      const prsWithItems = await Promise.all(
        (data || []).map(async (pr) => {
          const { data: items } = await supabase
            .from('purchase_requisition_items')
            .select(`
              id,
              quantity,
              unit,
              estimated_cost,
              item:item_id(name, sku)
            `)
            .eq('pr_id', pr.id);

          return { ...pr, items: items || [] };
        })
      );

      setRequisitions(prsWithItems);
    } catch (error) {
      console.error('Error fetching requisitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (prId: string) => {
    if (!confirm('Are you sure you want to approve this Purchase Requisition?\n\nOnce approved, a PO can be created from this PR.')) {
      return;
    }

    try {
      // Change status to 'pending_po' to enable PO creation
      const { error } = await supabase
        .from('purchase_requisitions')
        .update({
          status: 'pending_po',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', prId);

      if (error) throw error;

      alert('Purchase Requisition approved successfully!\n\nPO can now be created from this PR.');
      fetchRequisitions();
      setSelectedPR(null);
    } catch (error) {
      console.error('Error approving PR:', error);
      alert('Failed to approve Purchase Requisition');
    }
  };

  const handleReject = async (prId: string) => {
    const reason = prompt('Please enter rejection reason (REQUIRED):');
    if (!reason || reason.trim() === '') {
      alert('Rejection reason is required!');
      return;
    }

    try {
      const { error } = await supabase
        .from('purchase_requisitions')
        .update({
          status: 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', prId);

      if (error) throw error;

      alert('Purchase Requisition rejected successfully!');
      fetchRequisitions();
      setSelectedPR(null);
    } catch (error) {
      console.error('Error rejecting PR:', error);
      alert('Failed to reject Purchase Requisition');
    }
  };

  const handleRequestChanges = async (prId: string) => {
    const reason = prompt('Please enter what changes are needed (REQUIRED):');
    if (!reason || reason.trim() === '') {
      alert('Change request reason is required!');
      return;
    }

    try {
      const { error } = await supabase
        .from('purchase_requisitions')
        .update({
          status: 'revision_required',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', prId);

      if (error) throw error;

      alert('Change request sent successfully!');
      fetchRequisitions();
      setSelectedPR(null);
    } catch (error) {
      console.error('Error requesting changes:', error);
      alert('Failed to request changes');
    }
  };

  const handleCancel = async (prId: string) => {
    const reason = prompt('Please enter cancellation reason (REQUIRED):');
    if (!reason || reason.trim() === '') {
      alert('Cancellation reason is required!');
      return;
    }

    if (!confirm('Are you sure you want to cancel this PR?')) {
      return;
    }

    try {
      const { error} = await supabase
        .from('purchase_requisitions')
        .update({
          status: 'cancelled',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', prId);

      if (error) throw error;

      alert('Purchase Requisition cancelled successfully!');
      fetchRequisitions();
      setSelectedPR(null);
    } catch (error) {
      console.error('Error cancelling PR:', error);
      alert('Failed to cancel Purchase Requisition');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      case 'pending': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
      case 'draft': return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  if (viewingPRId) {
    return (
      <PRDetailView
        prId={viewingPRId}
        onBack={() => setViewingPRId(null)}
        onRefresh={fetchRequisitions}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Manager Approval</h1>
          <p className="text-gray-600 dark:text-gray-400">Review and approve purchase requisitions from all branches</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Branch
              </label>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : requisitions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No purchase requisitions found matching your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {requisitions.map((pr) => (
              <div
                key={pr.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{pr.pr_number}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pr.status)}`}>
                        {getStatusLabel(pr.status)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(pr.priority)}`}>
                        {pr.priority.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>PR Date: {new Date(pr.pr_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Required: {new Date(pr.required_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <User className="w-4 h-4" />
                        <span>{pr.requester?.username || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Building2 className="w-4 h-4" />
                        <span>{pr.branch?.name || 'Unknown'}</span>
                      </div>
                    </div>

                    {pr.notes && (
                      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        <strong>Notes:</strong> {pr.notes}
                      </p>
                    )}

                    {pr.items && pr.items.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Items ({pr.items.length}):
                        </p>
                        <div className="space-y-1">
                          {pr.items.slice(0, 3).map((item: any) => (
                            <div key={item.id} className="text-sm text-gray-600 dark:text-gray-400 flex justify-between">
                              <span>{item.item?.name} ({item.item?.sku})</span>
                              <span>{item.quantity} {item.unit}</span>
                            </div>
                          ))}
                          {pr.items.length > 3 && (
                            <p className="text-sm text-gray-500 dark:text-gray-500 italic">
                              +{pr.items.length - 3} more items...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {pr.status === 'pending' && (
                    <div className="flex flex-wrap gap-2 ml-4">
                      <button
                        onClick={() => setViewingPRId(pr.id)}
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleApprove(pr.id)}
                        className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(pr.id)}
                        className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleRequestChanges(pr.id)}
                        className="flex items-center space-x-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Request Changes</span>
                      </button>
                      <button
                        onClick={() => handleCancel(pr.id)}
                        className="flex items-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
