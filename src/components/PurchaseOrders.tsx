import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  FileText,
  X,
  Save,
  Edit,
  Trash2,
  Package,
  User,
  Building,
  Calendar,
  DollarSign,
  Filter,
  Search
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const lsGet = <T,>(key: string, fallback: T): T => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const lsSet = (key: string, val: unknown) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name?: string;
  branch_id: string;
  branch_name?: string;
  pr_id?: string;
  pr_number?: string;
  status: string;
  order_date: string;
  expected_delivery_date?: string;
  total_amount: number;
  payment_terms?: string;
  notes?: string;
  created_at: string;
  items?: POItem[];
}

interface POItem {
  id: string;
  item_id: string;
  item_name: string;
  item_sku: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  subtotal: number;
}

interface PR {
  id: string;
  pr_number: string;
  requester_name: string;
  branch_id: string;
  branch_name: string;
  status: string;
  priority: string;
  pr_date: string;
  items: PRItem[];
}

interface PRItem {
  id: string;
  item_id: string;
  item_name: string;
  item_sku: string;
  quantity: number;
  unit: string;
  estimated_cost: number;
}

interface PurchaseOrdersProps {
  onBack: () => void;
  onRedirectToPOStatus?: () => void;
  preSelectedPR?: PR | null;
}

export default function PurchaseOrders({ onBack, onRedirectToPOStatus, preSelectedPR }: PurchaseOrdersProps) {
  const { user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [prs, setPRs] = useState<PR[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPRModal, setShowPRModal] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PR | null>(preSelectedPR || null);
  const [showPOForm, setShowPOForm] = useState(!!preSelectedPR);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [prStatusFilter, setPRStatusFilter] = useState('all');

  const [poForm, setPOForm] = useState({
    supplier_id: '',
    expected_delivery_date: '',
    payment_terms: 'Net 30',
    notes: '',
    items: [] as any[]
  });

  // For manual PO item addition
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemQuantity, setItemQuantity] = useState<string>('1');
  const [itemUnitCost, setItemUnitCost] = useState<string>('0');

  useEffect(() => {
    fetchData();
  }, [statusFilter, prStatusFilter]);

  const fetchData = () => {
    setLoading(true);
    fetchPurchaseOrders();
    fetchPRs();
    fetchSuppliers();
    fetchBranches();
    fetchItems();
    setLoading(false);
  };

  const fetchPurchaseOrders = () => {
    try {
      let data: any[] = lsGet('pos_purchase_orders', []);
      if (statusFilter !== 'all') data = data.filter(po => po.status === statusFilter);
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPurchaseOrders(data as PurchaseOrder[]);
    } catch (error) {
      console.error('Error fetching POs:', error);
    }
  };

  const fetchPRs = () => {
    try {
      const allUsers: any[] = lsGet('pos_users', []);
      const allBranches: any[] = lsGet('pos_branches', []);
      let data: any[] = lsGet('pos_purchase_requisitions', []);

      const allowedStatuses = prStatusFilter === 'all'
        ? ['pending', 'approved', 'pending_po']
        : [prStatusFilter];
      data = data.filter(pr => allowedStatuses.includes(pr.status));
      data.sort((a, b) => new Date(b.pr_date || b.created_at).getTime() - new Date(a.pr_date || a.created_at).getTime());

      const enriched = data.map(pr => {
        const requester = allUsers.find(u => u.id === pr.requester_id);
        const branch = allBranches.find(b => b.id === pr.branch_id);
        return {
          id: pr.id,
          pr_number: pr.pr_number,
          requester_name: requester?.username || 'Unknown',
          branch_id: pr.branch_id,
          branch_name: branch?.name || 'Unknown',
          status: pr.status,
          priority: pr.priority,
          pr_date: pr.pr_date || pr.created_at,
          items: (pr.items || []).map((item: any) => ({
            id: item.id,
            item_id: item.item_id,
            item_name: item.item?.name || item.item_name,
            item_sku: item.item?.sku || item.item_sku,
            quantity: item.quantity,
            unit: item.unit,
            estimated_cost: item.estimated_cost
          }))
        };
      });

      setPRs(enriched as PR[]);
    } catch (error: any) {
      console.error('Error fetching PRs:', error);
    }
  };

  const fetchSuppliers = () => {
    try {
      const data: any[] = lsGet('pos_suppliers', []);
      // normalize: suppliers may store name as 'name' or 'supplierName'
      const normalized = data.map(s => ({ ...s, name: s.name || s.supplierName || '' }));
      setSuppliers(normalized.filter(s => s.active !== false).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchBranches = () => {
    try {
      const data: any[] = lsGet('pos_branches', []);
      setBranches(data.filter(b => b.is_active !== false));
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchItems = () => {
    try {
      const data: any[] = lsGet('pos_items', []);
      setItems(data.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleSelectPR = (pr: PR) => {
    if (pr.status === 'po_created') {
      alert('A PO has already been created from this PR.');
      return;
    }

    setSelectedPR(pr);
    setShowPRModal(false);
    setShowPOForm(true);
    setPOForm({
      supplier_id: '',
      expected_delivery_date: '',
      payment_terms: 'Net 30',
      notes: `Created from PR: ${pr.pr_number}`,
      items: pr.items.map(item => ({
        item_id: item.item_id,
        item_name: item.item_name,
        item_sku: item.item_sku,
        quantity: item.quantity,
        unit: item.unit,
        unit_cost: item.estimated_cost
      }))
    });
  };

  const handleCreateManualPO = () => {
    // Create PO without PR (Manual PO)
    setSelectedPR(null);
    setShowPOForm(true);
    setPOForm({
      supplier_id: '',
      expected_delivery_date: '',
      payment_terms: 'Net 30',
      notes: 'Manual PO - Created without Purchase Requisition',
      items: []
    });
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...poForm.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    setPOForm({ ...poForm, items: updatedItems });
  };

  const handleSavePO = () => {
    try {
      const isManualPO = !selectedPR;

      if (!isManualPO && selectedPR?.status !== 'pending_po') {
        alert('Cannot create PO: PR must be approved first');
        return;
      }
      if (!poForm.supplier_id) { alert('Please select a supplier'); return; }
      if (poForm.items.length === 0) { alert('Please add at least one item'); return; }

      const totalAmount = poForm.items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);

      const allPOs: any[] = lsGet('pos_purchase_orders', []);
      const nums = allPOs.map(po => {
        const m = (po.po_number || '').match(/PO-(?:MANUAL-)?(\d+)/);
        return m ? parseInt(m[1]) : 0;
      });
      const nextNumber = nums.length ? Math.max(...nums) + 1 : 1;
      const poNumber = isManualPO
        ? `PO-MANUAL-${String(nextNumber).padStart(4, '0')}`
        : `PO-${String(nextNumber).padStart(4, '0')}`;

      const branchId = selectedPR?.branch_id || branches[0]?.id;
      if (!branchId) { alert('No branch found. Please create a branch first.'); return; }

      const supplier = suppliers.find(s => s.id === poForm.supplier_id);

      const newPO: PurchaseOrder = {
        id: `po_${Date.now()}`,
        po_number: poNumber,
        supplier_id: poForm.supplier_id,
        supplier_name: supplier?.name || supplier?.supplierName || '',
        branch_id: branchId,
        branch_name: branches.find(b => b.id === branchId)?.name || '',
        pr_id: selectedPR?.id,
        pr_number: selectedPR?.pr_number,
        status: 'draft',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: poForm.expected_delivery_date || undefined,
        total_amount: totalAmount,
        payment_terms: poForm.payment_terms,
        notes: isManualPO
          ? `${poForm.notes || ''}\n\n[MANUAL PO by ${user?.username || user?.email}]`
          : poForm.notes,
        created_at: new Date().toISOString(),
        items: poForm.items.map((item, idx) => ({
          id: `poi_${Date.now()}_${idx}`,
          item_id: item.item_id,
          item_name: item.item_name,
          item_sku: item.item_sku,
          quantity: item.quantity,
          unit: item.unit,
          unit_cost: item.unit_cost,
          subtotal: item.quantity * item.unit_cost
        }))
      };

      lsSet('pos_purchase_orders', [...allPOs, newPO]);

      // Update PR status if linked
      if (!isManualPO && selectedPR) {
        const allPRs: any[] = lsGet('pos_purchase_requisitions', []);
        lsSet('pos_purchase_requisitions', allPRs.map(pr =>
          pr.id === selectedPR.id ? { ...pr, status: 'po_created' } : pr
        ));
      }

      alert(isManualPO
        ? 'Manual Purchase Order created successfully!'
        : 'Purchase Order created successfully!');

      setShowPOForm(false);
      setSelectedPR(null);
      setPOForm({ supplier_id: '', expected_delivery_date: '', payment_terms: 'Net 30', notes: '', items: [] });

      if (onRedirectToPOStatus) {
        onRedirectToPOStatus();
      } else {
        fetchData();
      }
    } catch (error: any) {
      console.error('Error creating PO:', error);
      alert(`Failed to create PO: ${error.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      in_transit: 'bg-yellow-100 text-yellow-800',
      received: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getPRStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      approved: 'bg-green-100 text-green-800',
      pending_po: 'bg-yellow-100 text-yellow-800',
      po_created: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (showPOForm) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => {
                setShowPOForm(false);
                setSelectedPR(null);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Purchase Orders</span>
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Create Purchase Order
            </h2>
            {selectedPR ? (
              <p className="text-blue-600 font-medium mb-6">
                From PR: {selectedPR.pr_number}
              </p>
            ) : (
              <div className="mb-6">
                <p className="text-orange-600 font-medium mb-2">
                  ⚠️ Manual PO - Created without PR approval
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This PO bypasses the standard PR approval workflow. Created by: {user?.username || user?.email}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supplier *
                </label>
                <select
                  value={poForm.supplier_id}
                  onChange={(e) => setPOForm({ ...poForm, supplier_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={poForm.expected_delivery_date}
                  onChange={(e) => setPOForm({ ...poForm, expected_delivery_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={poForm.payment_terms}
                  onChange={(e) => setPOForm({ ...poForm, payment_terms: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <input
                  type="text"
                  value={poForm.notes}
                  onChange={(e) => setPOForm({ ...poForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Items
                </h3>
                {!selectedPR && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedItem) {
                        alert('Please select an item first');
                        return;
                      }
                      if (!itemQuantity || parseFloat(itemQuantity) <= 0) {
                        alert('Please enter a valid quantity');
                        return;
                      }
                      setPOForm({
                        ...poForm,
                        items: [
                          ...poForm.items,
                          {
                            item_id: selectedItem.id,
                            item_name: selectedItem.name,
                            item_sku: selectedItem.sku,
                            quantity: parseFloat(itemQuantity),
                            unit: selectedItem.unit || 'pcs',
                            unit_cost: parseFloat(itemUnitCost) || 0
                          }
                        ]
                      });
                      setSelectedItem(null);
                      setItemQuantity('1');
                      setItemUnitCost('0');
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                )}
              </div>
              
              {!selectedPR && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Item
                      </label>
                      <select
                        value={selectedItem?.id || ''}
                        onChange={(e) => {
                          const item = items.find(i => i.id === e.target.value);
                          setSelectedItem(item || null);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="1"
                        min="0.01"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Unit Cost
                      </label>
                      <input
                        type="number"
                        value={itemUnitCost}
                        onChange={(e) => setItemUnitCost(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Item</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">SKU</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Quantity</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Unit</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Unit Cost</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Subtotal</th>
                      {!selectedPR && <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {poForm.items.map((item, index) => (
                      <tr key={index}>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{item.item_name}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{item.item_sku}</td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{item.unit}</td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={item.unit_cost}
                            onChange={(e) => handleUpdateItem(index, 'unit_cost', parseFloat(e.target.value))}
                            className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100 font-medium">
                          ${(item.quantity * item.unit_cost).toFixed(2)}
                        </td>
                        {!selectedPR && (
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => {
                                setPOForm({
                                  ...poForm,
                                  items: poForm.items.filter((_, i) => i !== index)
                                });
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <td colSpan={5} className="py-3 px-4 text-right font-bold text-gray-900 dark:text-gray-100">
                        Total:
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900 dark:text-gray-100">
                        ${poForm.items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowPOForm(false);
                  setSelectedPR(null);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSavePO}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Create Purchase Order</span>
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
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Orders</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPRModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span>Create from PR</span>
            </button>
            <button
              onClick={handleCreateManualPO}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              title="Create PO without PR approval (Override)"
            >
              <Plus className="w-5 h-5" />
              <span>Manual PO</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="PO Number, Supplier..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                PO Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="in_transit">In Transit</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                PR Status
              </label>
              <select
                value={prStatusFilter}
                onChange={(e) => setPRStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All PR Status</option>
                <option value="pending">Pending Approval</option>
                <option value="pending_po">Ready for PO</option>
                <option value="po_created">PO Created</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Loading...</div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">PO Number</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Supplier</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Branch</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">PR Number</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Order Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Total Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {purchaseOrders
                    .filter((po) =>
                      po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      po.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((po) => (
                      <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">{po.po_number}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{po.supplier_name || '-'}</td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{po.branch_name || '-'}</td>
                        <td className="py-3 px-4">
                          {po.pr_number ? (
                            <span className="text-blue-600 font-medium">{po.pr_number}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                          {new Date(po.order_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100 font-medium">
                          ${po.total_amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(po.status)}</td>
                      </tr>
                    ))}
                  {purchaseOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        No purchase orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showPRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full mx-4 max-h-[85vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Select Purchase Requisition</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Choose an approved or pending PR to create a Purchase Order</p>
                </div>
                <button
                  onClick={() => setShowPRModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {prs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">PR Number</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Requester</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Branch</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Items</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {prs.map((pr) => (
                        <tr key={pr.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="font-medium text-gray-900 dark:text-white">{pr.pr_number}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{pr.requester_name}</td>
                          <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{pr.branch_name}</td>
                          <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                            {new Date(pr.pr_date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{pr.items.length}</td>
                          <td className="py-3 px-4">{getPRStatusBadge(pr.status)}</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleSelectPR(pr)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                            >
                              Create PO
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No approved purchase requisitions available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
