import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, ArrowRight, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StorageBatch {
  id: string;
  branch_name: string;
  location_name: string;
  item_id: string;
  batch_number: string | null;
  qty_on_hand: number;
  expiry_date: string | null;
  last_movement_at: string | null;
  notes: string | null;
  items?: {
    name: string;
    sku: string;
    name_en?: string;
  };
}

interface ShelfItem {
  id: string;
  shelf_id: string;
  item_id: string;
  max_capacity: number;
  current_qty: number;
  shelves?: {
    shelf_code: string;
    section_name: string;
    branch_name: string;
  };
}

interface StorageManagementProps {
  onBack: () => void;
}

export default function StorageManagement({ onBack }: StorageManagementProps) {
  const [batches, setBatches] = useState<StorageBatch[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [shelfItems, setShelfItems] = useState<ShelfItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState<string | null>(null);

  const [filterBranch, setFilterBranch] = useState('all');
  const [filterItem, setFilterItem] = useState('all');
  const [showNearExpiry, setShowNearExpiry] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    branch_name: '',
    location_name: '',
    item_id: '',
    batch_number: '',
    qty_on_hand: 0,
    expiry_date: '',
    notes: ''
  });

  const [moveData, setMoveData] = useState({
    shelf_item_id: '',
    refill_qty: 0
  });

  useEffect(() => {
    fetchBatches();
    fetchItems();
    fetchShelfItems();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('storage_batches')
        .select(`
          *,
          items (
            name,
            sku,
            name_en
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching storage batches:', error);
      alert('Failed to load storage batches');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('id, name, sku, name_en')
        .order('name_en', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchShelfItems = async () => {
    try {
      const { data, error } = await supabase
        .from('shelf_items')
        .select(`
          *,
          shelves (
            shelf_code,
            section_name,
            branch_name
          )
        `);

      if (error) throw error;
      setShelfItems(data || []);
    } catch (error) {
      console.error('Error fetching shelf items:', error);
    }
  };

  const handleAddBatch = async () => {
    if (!formData.branch_name || !formData.location_name || !formData.item_id) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('storage_batches')
        .insert({
          branch_name: formData.branch_name,
          location_name: formData.location_name,
          item_id: formData.item_id,
          batch_number: formData.batch_number || null,
          qty_on_hand: formData.qty_on_hand,
          expiry_date: formData.expiry_date || null,
          notes: formData.notes || null
        });

      if (error) throw error;

      alert('Storage batch added successfully');
      setShowAddForm(false);
      setFormData({
        branch_name: '',
        location_name: '',
        item_id: '',
        batch_number: '',
        qty_on_hand: 0,
        expiry_date: '',
        notes: ''
      });
      fetchBatches();
    } catch (error) {
      console.error('Error adding batch:', error);
      alert('Failed to add storage batch');
    }
  };

  const handleMoveToShelf = async (batchId: string) => {
    if (!moveData.shelf_item_id || moveData.refill_qty <= 0) {
      alert('Please select a shelf item and enter a valid quantity');
      return;
    }

    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    if (moveData.refill_qty > batch.qty_on_hand) {
      alert('Refill quantity exceeds available quantity');
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('move_storage_to_shelf', {
          p_storage_batch_id: batchId,
          p_shelf_item_id: moveData.shelf_item_id,
          p_qty: moveData.refill_qty
        });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        alert('Stock moved to shelf successfully');
        setShowMoveModal(null);
        setMoveData({ shelf_item_id: '', refill_qty: 0 });
        fetchBatches();
        fetchShelfItems();
      } else {
        alert(result.error || 'Failed to move stock');
      }
    } catch (error) {
      console.error('Error moving stock:', error);
      alert('Failed to move stock to shelf');
    }
  };

  const branches = [...new Set(batches.map(b => b.branch_name))];
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const filteredBatches = batches.filter(batch => {
    const matchesBranch = filterBranch === 'all' || batch.branch_name === filterBranch;
    const matchesItem = filterItem === 'all' || batch.item_id === filterItem;

    let matchesExpiry = true;
    if (showNearExpiry && batch.expiry_date) {
      const expiryDate = new Date(batch.expiry_date);
      matchesExpiry = expiryDate <= thirtyDaysFromNow;
    }

    const itemName = batch.items?.name_en || batch.items?.name || '';
    const matchesSearch = searchTerm === '' ||
      itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (batch.batch_number && batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesBranch && matchesItem && matchesExpiry && matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600 dark:text-gray-400">Loading storage...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Inventory</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Storage Management</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Storage Batch</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Item</label>
            <select
              value={filterItem}
              onChange={(e) => setFilterItem(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Items</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name_en || item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Batch or item..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Filter</label>
            <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600">
              <input
                type="checkbox"
                checked={showNearExpiry}
                onChange={(e) => setShowNearExpiry(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Near expiry (30 days)</span>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty On Hand</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Movement</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBatches.map((batch) => {
                const isNearExpiry = batch.expiry_date && new Date(batch.expiry_date) <= thirtyDaysFromNow;
                return (
                  <tr key={batch.id} className="hover:bg-gray-50 dark:bg-gray-900">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{batch.branch_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{batch.location_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {batch.items?.name_en || batch.items?.name || 'N/A'}
                      <div className="text-xs text-gray-500">{batch.items?.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{batch.batch_number || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{batch.qty_on_hand}</td>
                    <td className="px-4 py-3 text-sm">
                      {batch.expiry_date ? (
                        <span className={isNearExpiry ? 'text-red-600 font-medium' : 'text-gray-900 dark:text-gray-100'}>
                          {new Date(batch.expiry_date).toLocaleDateString()}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {batch.last_movement_at
                        ? new Date(batch.last_movement_at).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setShowMoveModal(batch.id);
                          setMoveData({ shelf_item_id: '', refill_qty: batch.qty_on_hand });
                        }}
                        disabled={batch.qty_on_hand <= 0}
                        className={`font-medium text-sm flex items-center space-x-1 ${
                          batch.qty_on_hand > 0
                            ? 'text-blue-600 hover:text-blue-700'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>Move to Shelf</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredBatches.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No storage batches found matching your filters
            </div>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Add Storage Batch</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    value={formData.branch_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, branch_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Olaya, Kingdom"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    value={formData.location_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Main Storage, Back Room A"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item *
                </label>
                <select
                  value={formData.item_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, item_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Item</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name_en || item.name} ({item.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={formData.batch_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, batch_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity on Hand
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.qty_on_hand}
                    onChange={(e) => setFormData(prev => ({ ...prev, qty_on_hand: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4 mt-6">
              <button
                onClick={handleAddBatch}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Add Batch
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Move to Shelf</h3>

            {(() => {
              const batch = batches.find(b => b.id === showMoveModal);
              if (!batch) return null;

              const availableShelfItems = shelfItems.filter(
                si => si.shelves?.branch_name === batch.branch_name && si.item_id === batch.item_id
              );

              return (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Item:</span> {batch.items?.name_en || batch.items?.name}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Available:</span> {batch.qty_on_hand}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Shelf *
                    </label>
                    <select
                      value={moveData.shelf_item_id}
                      onChange={(e) => setMoveData(prev => ({ ...prev, shelf_item_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Shelf</option>
                      {availableShelfItems.map(si => (
                        <option key={si.id} value={si.id}>
                          {si.shelves?.shelf_code} - {si.shelves?.section_name} (Current: {si.current_qty}/{si.max_capacity})
                        </option>
                      ))}
                    </select>
                    {availableShelfItems.length === 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        No shelf items available for this item in {batch.branch_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refill Quantity *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={moveData.refill_qty}
                      onChange={(e) => setMoveData(prev => ({ ...prev, refill_qty: parseFloat(e.target.value) || 0 }))}
                      max={batch.qty_on_hand}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center space-x-4 mt-6">
              <button
                onClick={() => handleMoveToShelf(showMoveModal)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Move Stock
              </button>
              <button
                onClick={() => {
                  setShowMoveModal(null);
                  setMoveData({ shelf_item_id: '', refill_qty: 0 });
                }}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200"
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
