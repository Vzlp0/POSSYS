import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Filter, Eye, FileText, CheckCircle, XCircle, Clock, AlertCircle, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PurchaseRequests from './PurchaseRequests';
import PRDetailView from './PRDetailView';
import PurchaseOrders from './PurchaseOrders';

interface PRStatusDashboardProps {
  onBack: () => void;
  setActiveItem?: (item: string) => void;
}

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
  approved_by?: string;
  approved_at?: string;
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

export default function PRStatusDashboard({ onBack, setActiveItem }: PRStatusDashboardProps) {
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewingPRId, setViewingPRId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingPOFromPR, setCreatingPOFromPR] = useState<string | null>(null);

  useEffect(() => {
    fetchRequisitions();
  }, [filterStatus]);

  const fetchRequisitions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('purchase_requisitions')
        .select(`
          *,
          requester:requester_id(username, email),
          branch:branch_id(name, code)
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch items for each PR
      const prsWithItems = await Promise.all(
        (data || []).map(async (pr) => {
          const { data: itemsData } = await supabase
            .from('purchase_requisition_items')
            .select(`
              id,
              quantity,
              unit,
              estimated_cost,
              item:item_id(name, sku)
            `)
            .eq('pr_id', pr.id);

          return {
            ...pr,
            items: itemsData || []
          };
        })
      );

      setRequisitions(prsWithItems as PurchaseRequisition[]);
    } catch (error) {
      console.error('Error fetching PRs:', error);
      alert('Failed to load Purchase Requisitions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      pending_po: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      po_created: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };

    const icons: Record<string, any> = {
      pending: <Clock className="w-3 h-3" />,
      approved: <CheckCircle className="w-3 h-3" />,
      pending_po: <CheckCircle className="w-3 h-3" />,
      po_created: <CheckCircle className="w-3 h-3" />,
      rejected: <XCircle className="w-3 h-3" />
    };

    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.draft}`}>
        {icons[status]}
        <span>{status.replace('_', ' ').toUpperCase()}</span>
      </span>
    );
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-green-600 dark:text-green-400',
      medium: 'text-yellow-600 dark:text-yellow-400',
      high: 'text-orange-600 dark:text-orange-400',
      urgent: 'text-red-600 dark:text-red-400'
    };
    return colors[priority] || colors.medium;
  };

  if (showCreateForm) {
    return (
      <PurchaseRequests 
        onBack={() => {
          setShowCreateForm(false);
          fetchRequisitions();
        }}
        onRedirectToPRStatus={() => {
          setShowCreateForm(false);
          fetchRequisitions();
        }}
      />
    );
  }

  if (creatingPOFromPR) {
    // Find the PR data
    const selectedPRData = requisitions.find(pr => pr.id === creatingPOFromPR);
    if (!selectedPRData) {
      setCreatingPOFromPR(null);
      return null;
    }

    // Prepare PR data for PO creation
    const prForPO = {
      id: selectedPRData.id,
      pr_number: selectedPRData.pr_number,
      requester_name: selectedPRData.requester?.username || 'Unknown',
      branch_id: selectedPRData.branch_id,
      branch_name: selectedPRData.branch?.name || 'Unknown',
      status: selectedPRData.status,
      priority: selectedPRData.priority,
      pr_date: selectedPRData.pr_date,
      items: (selectedPRData.items || []).map((item: any) => ({
        id: item.id,
        item_id: item.item?.id || item.item_id,
        item_name: item.item?.name || 'N/A',
        item_sku: item.item?.sku || 'N/A',
        quantity: item.quantity,
        unit: item.unit,
        estimated_cost: item.estimated_cost
      }))
    };

    return (
      <PurchaseOrders
        onBack={() => setCreatingPOFromPR(null)}
        onRedirectToPOStatus={() => {
          if (setActiveItem) {
            setActiveItem('po-status');
          } else {
            setCreatingPOFromPR(null);
            fetchRequisitions();
          }
        }}
        preSelectedPR={prForPO}
      />
    );
  }

  if (viewingPRId) {
    const selectedPR = requisitions.find(pr => pr.id === viewingPRId);
    return (
      <PRDetailView
        prId={viewingPRId}
        onBack={() => {
          setViewingPRId(null);
          fetchRequisitions();
        }}
        onRefresh={fetchRequisitions}
        onCreatePO={() => {
          setViewingPRId(null);
          setCreatingPOFromPR(viewingPRId);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Requisition Status</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Track and manage your purchase requisitions</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create New PR</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="pending_po">Pending PO</option>
              <option value="po_created">PO Created</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* PR List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        ) : requisitions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Purchase Requisitions</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Get started by creating a new purchase requisition</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create New PR
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">PR Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Requester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Create PO</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {requisitions.map((pr) => (
                    <tr key={pr.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{pr.pr_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{new Date(pr.pr_date).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{pr.branch?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{pr.requester?.username || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(pr.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium capitalize ${getPriorityColor(pr.priority)}`}>
                          {pr.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{pr.items?.length || 0} items</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setViewingPRId(pr.id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {pr.status === 'pending_po' ? (
                          <button
                            onClick={() => setCreatingPOFromPR(pr.id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>Create PO</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {pr.status === 'pending' ? 'Awaiting approval' : 
                             pr.status === 'approved' ? 'Awaiting PO creation' :
                             pr.status === 'po_created' ? 'PO created' :
                             'Not available'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

