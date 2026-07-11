import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, User, Building2, AlertCircle, CheckCircle, XCircle, FileText, ArrowLeft, Save, X, Trash2, Eye, Edit, RotateCcw } from 'lucide-react';
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

interface PRItem {
  item_id: string;
  item_name: string;
  item_sku: string;
  quantity: number;
  unit: string;
  estimated_cost: number;
}

interface PurchaseRequestsProps {
  onBack: () => void;
  onRedirectToPRStatus?: () => void;
}

export default function PurchaseRequests({ onBack, onRedirectToPRStatus }: PurchaseRequestsProps) {
  const { user } = useAuth();
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [filterRequester, setFilterRequester] = useState<string>('all');
  const [branches, setBranches] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; username: string }>>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewingPRId, setViewingPRId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    branch_id: '',
    priority: 'medium',
    required_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    items: [] as PRItem[]
  });

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnit, setItemUnit] = useState('');

  useEffect(() => {
    fetchBranches();
    fetchUsers();
    fetchItems();
    fetchRequisitions();
  }, [filterStatus, filterBranch, filterRequester]);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBranches(data || []);

      if (data && data.length > 0 && !formData.branch_id) {
        setFormData(prev => ({ ...prev, branch_id: data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchUsers = () => {
    try {
      const stored = localStorage.getItem('pos_users');
      if (stored) setUsers(JSON.parse(stored));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('id, name, sku, unit, cost')
        .eq('show_in_pos', true)
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchRequisitions = async () => {
    try {
      setLoading(true);
      console.log('=== Fetching Purchase Requisitions ===');
      console.log('Filters:', { filterStatus, filterBranch, filterRequester });

      // Fetch PRs without joins - we'll match data in React
      let query = supabase
        .from('purchase_requisitions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (filterBranch !== 'all') {
        query = query.eq('branch_id', filterBranch);
      }

      if (filterRequester !== 'all') {
        query = query.eq('requester_id', filterRequester);
      }

      const { data, error } = await query;

      if (error) {
        console.error('✗ Error fetching PRs:', error);
        throw error;
      }

      console.log('✓ Fetched', data?.length || 0, 'PRs');

      // Fetch items and enrich with user/branch data from already loaded lists
      const prsWithItems = await Promise.all(
        (data || []).map(async (pr) => {
          console.log(`Fetching items for PR ${pr.pr_number}...`);
          const { data: items, error: itemsError } = await supabase
            .from('purchase_requisition_items')
            .select(`
              id,
              quantity,
              unit,
              estimated_cost,
              item:items(id, name, sku)
            `)
            .eq('pr_id', pr.id);

          if (itemsError) {
            console.error(`✗ Error fetching items for PR ${pr.pr_number}:`, itemsError);
          } else {
            console.log(`✓ Fetched ${items?.length || 0} items for PR ${pr.pr_number}`);
          }

          // Match user and branch from already loaded data
          const requester = users.find(u => u.id === pr.requester_id);
          const branch = branches.find(b => b.id === pr.branch_id);

          return {
            ...pr,
            items: items || [],
            requester: requester ? {
              id: requester.id,
              email: requester.email || '',
              username: requester.username || '',
              first_name: '',
              last_name: ''
            } : undefined,
            branch: branch ? {
              id: branch.id,
              name: branch.name,
              code: branch.code
            } : undefined
          };
        })
      );

      console.log('✓ Final PRs with items:', prsWithItems);
      setRequisitions(prsWithItems);
      console.log('=== Fetch Complete ===');
    } catch (error: any) {
      console.error('=== Fetch Failed ===');
      console.error('Error:', error);
      console.error('Error message:', error?.message);
      console.error('Error details:', error?.details);
      alert(`Failed to load requisitions: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const generatePRNumber = async () => {
    const { data, error } = await supabase
      .from('purchase_requisitions')
      .select('pr_number')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return 'PR-0001';
    }

    const lastPR = data[0].pr_number;
    const match = lastPR.match(/PR-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1]) + 1;
      return `PR-${String(nextNum).padStart(4, '0')}`;
    }
    return 'PR-0001';
  };

  const handleAddItem = () => {
    if (!selectedItem || !itemQuantity || !itemUnit) {
      alert('Please select an item and enter quantity and unit');
      return;
    }

    const newItem: PRItem = {
      item_id: selectedItem.id,
      item_name: selectedItem.name,
      item_sku: selectedItem.sku,
      quantity: parseFloat(itemQuantity),
      unit: itemUnit,
      estimated_cost: selectedItem.cost || 0
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setSelectedItem(null);
    setItemQuantity('');
    setItemUnit('');
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSavePR = async () => {
    console.log('=== Starting PR Save ===');
    console.log('User:', user);
    console.log('Form Data:', formData);

    if (!user?.id) {
      const errorMsg = 'Error: User not logged in. Please refresh and log in again.';
      console.error(errorMsg);
      alert(errorMsg);
      return;
    }

    if (!formData.branch_id) {
      const errorMsg = 'Please select a branch';
      console.error(errorMsg);
      alert(errorMsg);
      return;
    }

    if (formData.items.length === 0) {
      const errorMsg = 'Please add at least one item to the requisition';
      console.error(errorMsg);
      alert(errorMsg);
      return;
    }

    try {
      console.log('Step 1: Generating PR Number...');
      const prNumber = await generatePRNumber();
      console.log('✓ Generated PR Number:', prNumber);

      const prInsertData = {
        pr_number: prNumber,
        pr_date: new Date().toISOString().split('T')[0],
        requester_id: user.id,
        branch_id: formData.branch_id,
        status: 'pending',
        priority: formData.priority,
        required_date: formData.required_date,
        notes: formData.notes || null
      };
      console.log('Step 2: Inserting PR with data:', prInsertData);

      const { data: prData, error: prError } = await supabase
        .from('purchase_requisitions')
        .insert(prInsertData)
        .select()
        .single();

      if (prError) {
        console.error('✗ PR Insert Error:', prError);
        console.error('Error details:', JSON.stringify(prError, null, 2));
        throw new Error(`Database error: ${prError.message} (Code: ${prError.code})`);
      }

      console.log('✓ PR created successfully:', prData);

      const itemsToInsert = formData.items.map(item => ({
        pr_id: prData.id,
        item_id: item.item_id,
        quantity: item.quantity,
        unit: item.unit,
        estimated_cost: item.estimated_cost || 0
      }));

      console.log('Step 3: Inserting', itemsToInsert.length, 'items:', itemsToInsert);

      const { data: itemsData, error: itemsError } = await supabase
        .from('purchase_requisition_items')
        .insert(itemsToInsert)
        .select();

      if (itemsError) {
        console.error('✗ Items Insert Error:', itemsError);
        console.error('Error details:', JSON.stringify(itemsError, null, 2));
        throw new Error(`Database error: ${itemsError.message} (Code: ${itemsError.code})`);
      }

      console.log('✓ Items inserted successfully:', itemsData);
      console.log('=== PR Save Complete ===');

      alert(`✓ Purchase Requisition ${prNumber} created successfully!\n\nRedirecting to PR Status Dashboard...`);

      setShowAddForm(false);
      setFormData({
        branch_id: branches[0]?.id || '',
        priority: 'medium',
        required_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
        items: []
      });

      // Redirect to PR Status Dashboard
      if (onRedirectToPRStatus) {
        setTimeout(() => {
          onRedirectToPRStatus();
        }, 500);
      } else {
        // Fallback: refresh list if no redirect callback
        console.log('Refreshing requisitions list...');
        await fetchRequisitions();
        console.log('✓ Requisitions list refreshed');
      }
    } catch (error: any) {
      console.error('=== PR Save Failed ===');
      console.error('Error:', error);
      console.error('Error stack:', error.stack);

      let errorMessage = 'Failed to create Purchase Requisition.\n\n';

      if (error.message) {
        errorMessage += `Error: ${error.message}\n`;
      }

      if (error.code) {
        errorMessage += `Code: ${error.code}\n`;
      }

      errorMessage += '\nPlease check the browser console for more details.';

      alert(errorMessage);
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
    } catch (error) {
      console.error('Error approving PR:', error);
      alert('Failed to approve Purchase Requisition');
    }
  };

  const handleReject = async (prId: string) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      const pr = requisitions.find(r => r.id === prId);
      const { error } = await supabase
        .from('purchase_requisitions')
        .update({
          status: 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          notes: `${pr?.notes || ''}\n\nREJECTION REASON: ${reason}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', prId);

      if (error) throw error;

      alert('Purchase Requisition rejected successfully!');
      fetchRequisitions();
    } catch (error) {
      console.error('Error rejecting PR:', error);
      alert('Failed to reject Purchase Requisition');
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

  const canApproveReject = user?.role === 'admin' || user?.role === 'manager';

  if (showAddForm) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">New Purchase Request</h1>
            <button
              onClick={() => setShowAddForm(false)}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
              <span>Cancel</span>
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  PR Date
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 dark:text-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-set to today</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Branch *
                </label>
                <select
                  value={formData.branch_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, branch_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Required Date *
                </label>
                <input
                  type="date"
                  value={formData.required_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, required_date: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes or requirements..."
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Items</h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Item
                  </label>
                  <select
                    value={selectedItem?.id || ''}
                    onChange={(e) => {
                      const item = items.find(i => i.id === e.target.value);
                      setSelectedItem(item);
                      setItemUnit(item?.unit || '');
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    placeholder="Unit"
                  />
                </div>
              </div>

              <button
                onClick={handleAddItem}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>

              {formData.items.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Items List ({formData.items.length})</h4>
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.item_name} ({item.item_sku})
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Quantity: {item.quantity} {item.unit} | Est. Cost: ${item.estimated_cost}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePR}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Create Purchase Request</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Procurement</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Purchase Requests</h1>
            <p className="text-gray-600 dark:text-gray-400">View and manage purchase requisitions from all branches</p>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New PR</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Requested By
              </label>
              <select
                value={filterRequester}
                onChange={(e) => setFilterRequester(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username}
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
                        {pr.status.toUpperCase()}
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

                  {canApproveReject && pr.status === 'pending' && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleApprove(pr.id)}
                        className="flex items-center space-x-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(pr.id)}
                        className="flex items-center space-x-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
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
