import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, FileText, CheckCircle, XCircle, Clock, Truck, X, ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface POItem {
  id: string;
  item_id: string;
  item_name: string;
  item_sku: string;
  quantity: number;
  unit: string;
  unit_cost: number;
}

interface PO {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  branch_id: string;
  branch_name: string;
  pr_id?: string;
  pr_number?: string;
  status: string;
  order_date: string;
  expected_delivery_date?: string;
  total_amount: number;
  payment_terms?: string;
  notes?: string;
  created_at: string;
  items: POItem[];
}

interface POStatusDashboardProps {
  onBack: () => void;
  setActiveItem?: (item: string) => void;
}

const lsGet = <T,>(key: string, fallback: T): T => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const lsSet = (key: string, val: unknown) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

const STATUS_COLORS: Record<string, string> = {
  draft:      'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  submitted:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  approved:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  in_transit: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  received:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  draft:      <FileText className="w-3 h-3" />,
  submitted:  <Clock className="w-3 h-3" />,
  approved:   <CheckCircle className="w-3 h-3" />,
  in_transit: <Truck className="w-3 h-3" />,
  received:   <CheckCircle className="w-3 h-3" />,
  cancelled:  <XCircle className="w-3 h-3" />,
};

export default function POStatusDashboard({ onBack }: POStatusDashboardProps) {
  const { user } = useAuth();
  const [pos, setPOs] = useState<PO[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewPO, setViewPO] = useState<PO | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [prs, setPRs] = useState<any[]>([]);
  const [selectedPR, setSelectedPR] = useState<any>(null);
  const [formSupplier, setFormSupplier] = useState('');
  const [formBranch, setFormBranch] = useState('');
  const [formDelivery, setFormDelivery] = useState('');
  const [formPayment, setFormPayment] = useState('Net 30');
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState<any[]>([]);
  const [selItem, setSelItem] = useState('');
  const [selQty, setSelQty] = useState('1');
  const [selCost, setSelCost] = useState('0');

  useEffect(() => { load(); }, [statusFilter]);

  const load = () => {
    let data: PO[] = lsGet('pos_purchase_orders', []);
    if (statusFilter !== 'all') data = data.filter(p => p.status === statusFilter);
    data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setPOs(data);
  };

  const openForm = () => {
    const allSuppliers: any[] = lsGet('pos_suppliers', []).map((s: any) => ({ ...s, name: s.name || s.supplierName || '' }));
    const allBranches: any[] = lsGet('pos_branches', []).filter((b: any) => b.is_active !== false);
    const allItems: any[] = lsGet('pos_items', []).sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
    const allPRs: any[] = lsGet('pos_purchase_requisitions', []).filter((pr: any) => !['rejected', 'po_created'].includes(pr.status));

    setSuppliers(allSuppliers.filter(s => s.active !== false));
    setBranches(allBranches);
    setItems(allItems);
    setPRs(allPRs);
    setSelectedPR(null);
    setFormSupplier('');
    setFormBranch(allBranches[0]?.id || '');
    setFormDelivery('');
    setFormPayment('Net 30');
    setFormNotes('');
    setFormItems([]);
    setSelItem('');
    setSelQty('1');
    setSelCost('0');
    setShowForm(true);
  };

  const selectPR = (pr: any) => {
    setSelectedPR(pr);
    const allBranches: any[] = lsGet('pos_branches', []);
    const branch = allBranches.find((b: any) => b.id === pr.branch_id);
    setFormBranch(pr.branch_id || '');
    setFormNotes(`From PR: ${pr.pr_number}`);
    setFormItems((pr.items || []).map((item: any) => ({
      item_id: item.item_id,
      item_name: item.item?.name || item.item_name || '',
      item_sku: item.item?.sku || item.item_sku || '',
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      unit_cost: item.estimated_cost || 0,
    })));
  };

  const addItem = () => {
    const found = items.find(i => i.id === selItem);
    if (!found) { alert('Select an item'); return; }
    const qty = parseFloat(selQty);
    if (!qty || qty <= 0) { alert('Enter valid quantity'); return; }
    setFormItems(prev => [...prev, {
      item_id: found.id,
      item_name: found.name || '',
      item_sku: found.sku || '',
      quantity: qty,
      unit: found.unit || 'pcs',
      unit_cost: parseFloat(selCost) || found.cost || 0,
    }]);
    setSelItem(''); setSelQty('1'); setSelCost('0');
  };

  const savePO = () => {
    if (!formSupplier) { alert('Select a supplier'); return; }
    if (!formBranch) { alert('Select a branch'); return; }
    if (formItems.length === 0) { alert('Add at least one item'); return; }

    const allPOs: PO[] = lsGet('pos_purchase_orders', []);
    const nums = allPOs.map(p => parseInt((p.po_number || '').replace(/[^\d]/g, '')) || 0);
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    const poNumber = `PO-${String(next).padStart(4, '0')}`;

    const supplier = suppliers.find(s => s.id === formSupplier);
    const branch = branches.find(b => b.id === formBranch);
    const total = formItems.reduce((s, i) => s + i.quantity * i.unit_cost, 0);

    const newPO: PO = {
      id: `po_${Date.now()}`,
      po_number: poNumber,
      supplier_id: formSupplier,
      supplier_name: supplier?.name || '',
      branch_id: formBranch,
      branch_name: branch?.name || '',
      pr_id: selectedPR?.id,
      pr_number: selectedPR?.pr_number,
      status: 'draft',
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: formDelivery || undefined,
      total_amount: total,
      payment_terms: formPayment,
      notes: formNotes,
      created_at: new Date().toISOString(),
      items: formItems.map((item, idx) => ({ ...item, id: `poi_${Date.now()}_${idx}` })),
    };

    lsSet('pos_purchase_orders', [...allPOs, newPO]);

    // Mark PR as po_created
    if (selectedPR) {
      const allPRs: any[] = lsGet('pos_purchase_requisitions', []);
      lsSet('pos_purchase_requisitions', allPRs.map(pr => pr.id === selectedPR.id ? { ...pr, status: 'po_created' } : pr));
    }

    setShowForm(false);
    load();
    alert(`PO ${poNumber} created!`);
  };

  const updateStatus = (po: PO, newStatus: string) => {
    const all: PO[] = lsGet('pos_purchase_orders', []);
    lsSet('pos_purchase_orders', all.map(p => p.id === po.id ? { ...p, status: newStatus } : p));
    load();
    if (viewPO?.id === po.id) setViewPO({ ...viewPO, status: newStatus });
  };

  const deletePO = (id: string) => {
    if (!confirm('Delete this PO?')) return;
    const all: PO[] = lsGet('pos_purchase_orders', []);
    lsSet('pos_purchase_orders', all.filter(p => p.id !== id));
    setViewPO(null);
    load();
  };

  const filtered = pos.filter(p =>
    !search ||
    (p.po_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.supplier_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.pr_number || '').toLowerCase().includes(search.toLowerCase())
  );

  // ─── PO Detail View ──────────────────────────────────────────────
  if (viewPO) {
    const NEXT_STATUS: Record<string, string> = {
      draft: 'submitted', submitted: 'approved', approved: 'in_transit', in_transit: 'received'
    };
    const next = NEXT_STATUS[viewPO.status];
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button onClick={() => setViewPO(null)} className="flex items-center space-x-2 text-gray-500 hover:text-gray-800 dark:hover:text-white mb-5">
          <ArrowLeft className="w-4 h-4" /><span>Back to POs</span>
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{viewPO.po_number}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Created {new Date(viewPO.created_at).toLocaleDateString()}
                {viewPO.pr_number && <span className="ml-3 text-blue-600 dark:text-blue-400">From {viewPO.pr_number}</span>}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[viewPO.status] || STATUS_COLORS.draft}`}>
                {STATUS_ICONS[viewPO.status]}
                <span>{(viewPO.status || '').replace('_', ' ').toUpperCase()}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div><span className="text-gray-500 dark:text-gray-400">Supplier:</span> <span className="font-medium text-gray-900 dark:text-white ml-2">{viewPO.supplier_name || '-'}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Branch:</span> <span className="font-medium text-gray-900 dark:text-white ml-2">{viewPO.branch_name || '-'}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Order Date:</span> <span className="font-medium text-gray-900 dark:text-white ml-2">{viewPO.order_date ? new Date(viewPO.order_date).toLocaleDateString() : '-'}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Delivery:</span> <span className="font-medium text-gray-900 dark:text-white ml-2">{viewPO.expected_delivery_date ? new Date(viewPO.expected_delivery_date).toLocaleDateString() : '-'}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Payment:</span> <span className="font-medium text-gray-900 dark:text-white ml-2">{viewPO.payment_terms || '-'}</span></div>
            <div><span className="text-gray-500 dark:text-gray-400">Total:</span> <span className="font-bold text-gray-900 dark:text-white ml-2">${(viewPO.total_amount || 0).toFixed(2)}</span></div>
          </div>

          {viewPO.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">{viewPO.notes}</p>}

          <table className="w-full text-sm mb-6">
            <thead><tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 text-gray-500 dark:text-gray-400">Item</th>
              <th className="text-left py-2 text-gray-500 dark:text-gray-400">SKU</th>
              <th className="text-right py-2 text-gray-500 dark:text-gray-400">Qty</th>
              <th className="text-left py-2 pl-2 text-gray-500 dark:text-gray-400">Unit</th>
              <th className="text-right py-2 text-gray-500 dark:text-gray-400">Cost</th>
              <th className="text-right py-2 text-gray-500 dark:text-gray-400">Subtotal</th>
            </tr></thead>
            <tbody>
              {(viewPO.items || []).map(item => (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 text-gray-900 dark:text-white">{item.item_name}</td>
                  <td className="py-2 text-gray-500 dark:text-gray-400">{item.item_sku}</td>
                  <td className="py-2 text-right text-gray-900 dark:text-white">{item.quantity}</td>
                  <td className="py-2 pl-2 text-gray-500 dark:text-gray-400">{item.unit}</td>
                  <td className="py-2 text-right text-gray-900 dark:text-white">${(item.unit_cost || 0).toFixed(2)}</td>
                  <td className="py-2 text-right font-medium text-gray-900 dark:text-white">${(item.quantity * item.unit_cost || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr>
              <td colSpan={5} className="pt-3 text-right font-bold text-gray-900 dark:text-white">Total:</td>
              <td className="pt-3 text-right font-bold text-gray-900 dark:text-white">${(viewPO.total_amount || 0).toFixed(2)}</td>
            </tr></tfoot>
          </table>

          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {next && (
                <button onClick={() => updateStatus(viewPO, next)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  Move to {next.replace('_', ' ').toUpperCase()}
                </button>
              )}
              {viewPO.status !== 'cancelled' && viewPO.status !== 'received' && (
                <button onClick={() => updateStatus(viewPO, 'cancelled')}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm">
                  Cancel PO
                </button>
              )}
            </div>
            <button onClick={() => deletePO(viewPO.id)}
              className="flex items-center space-x-1 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm">
              <Trash2 className="w-4 h-4" /><span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Create Form ─────────────────────────────────────────────────
  if (showForm) {
    const total = formItems.reduce((s, i) => s + i.quantity * i.unit_cost, 0);
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button onClick={() => setShowForm(false)} className="flex items-center space-x-2 text-gray-500 hover:text-gray-800 dark:hover:text-white mb-5">
          <ArrowLeft className="w-4 h-4" /><span>Cancel</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">New Purchase Order</h1>

        {/* Link to PR (optional) */}
        {prs.length > 0 && !selectedPR && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-3">Link to a Purchase Requisition (optional)</p>
            <div className="flex flex-wrap gap-2">
              {prs.map(pr => (
                <button key={pr.id} onClick={() => selectPR(pr)}
                  className="px-3 py-1.5 text-sm border border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40">
                  {pr.pr_number}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedPR && (
          <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-3 mb-6">
            <span className="text-sm text-green-700 dark:text-green-400">Linked to <strong>{selectedPR.pr_number}</strong></span>
            <button onClick={() => { setSelectedPR(null); setFormItems([]); setFormNotes(''); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier *</label>
              <select value={formSupplier} onChange={e => setFormSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch *</label>
              <select value={formBranch} onChange={e => setFormBranch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Delivery</label>
              <input type="date" value={formDelivery} onChange={e => setFormDelivery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Terms</label>
              <input type="text" value={formPayment} onChange={e => setFormPayment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <input type="text" value={formNotes} onChange={e => setFormNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Items</h2>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="col-span-2">
              <select value={selItem} onChange={e => { setSelItem(e.target.value); const i = items.find(x => x.id === e.target.value); if (i) setSelCost(String(i.cost || 0)); }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                <option value="">Select item...</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
              </select>
            </div>
            <input type="number" value={selQty} onChange={e => setSelQty(e.target.value)} placeholder="Qty"
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" min="0.01" step="0.01" />
            <div className="flex space-x-2">
              <input type="number" value={selCost} onChange={e => setSelCost(e.target.value)} placeholder="Cost"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" min="0" step="0.01" />
              <button onClick={addItem} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {formItems.length > 0 && (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-gray-500">Item</th>
                <th className="text-right py-2 text-gray-500">Qty</th>
                <th className="text-right py-2 text-gray-500">Cost</th>
                <th className="text-right py-2 text-gray-500">Subtotal</th>
                <th></th>
              </tr></thead>
              <tbody>
                {formItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 text-gray-900 dark:text-white">{item.item_name}</td>
                    <td className="py-2 text-right">
                      <input type="number" value={item.quantity} min="0.01" step="0.01"
                        onChange={e => { const copy = [...formItems]; copy[idx] = { ...copy[idx], quantity: parseFloat(e.target.value) || 0 }; setFormItems(copy); }}
                        className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right text-sm" />
                    </td>
                    <td className="py-2 text-right">
                      <input type="number" value={item.unit_cost} min="0" step="0.01"
                        onChange={e => { const copy = [...formItems]; copy[idx] = { ...copy[idx], unit_cost: parseFloat(e.target.value) || 0 }; setFormItems(copy); }}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right text-sm" />
                    </td>
                    <td className="py-2 text-right font-medium text-gray-900 dark:text-white">${(item.quantity * item.unit_cost).toFixed(2)}</td>
                    <td className="py-2 pl-2">
                      <button onClick={() => setFormItems(formItems.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr>
                <td colSpan={3} className="pt-3 text-right font-bold text-gray-900 dark:text-white">Total:</td>
                <td className="pt-3 text-right font-bold text-gray-900 dark:text-white">${total.toFixed(2)}</td>
                <td></td>
              </tr></tfoot>
            </table>
          )}
        </div>

        <div className="flex justify-end">
          <button onClick={savePO} className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Save className="w-4 h-4" /><span>Create Purchase Order</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── List View ───────────────────────────────────────────────────
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{pos.length} order{pos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openForm} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /><span>New PO</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search PO, supplier..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="in_transit">In Transit</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No purchase orders</p>
          <p className="text-sm mt-1">Click "New PO" to create your first order</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">PO #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Supplier</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Branch</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">PR #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(po => (
                <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{po.po_number}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{po.supplier_name || '-'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{po.branch_name || '-'}</td>
                  <td className="px-4 py-3 text-blue-600 dark:text-blue-400">{po.pr_number || <span className="text-gray-400 italic text-xs">Manual</span>}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{po.order_date ? new Date(po.order_date).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">${(po.total_amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[po.status] || STATUS_COLORS.draft}`}>
                      {STATUS_ICONS[po.status]}
                      <span>{(po.status || 'draft').replace('_', ' ').toUpperCase()}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setViewPO(po)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
