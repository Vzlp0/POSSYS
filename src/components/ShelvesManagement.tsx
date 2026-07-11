import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, RefreshCw, Search, Trash2, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Shelf {
  id: string;
  branch_name: string;
  section_name: string;
  shelf_code: string;
  notes: string | null;
}

interface ShelfItem {
  id: string;
  shelf_id: string;
  item_id: string;
  max_capacity: number;
  current_qty: number;
  last_count_date: string | null;
  notes: string | null;
  shelves?: Shelf;
  items?: {
    name: string;
    sku: string;
    name_en?: string;
  };
}

interface ShelvesManagementProps {
  onBack: () => void;
}

export default function ShelvesManagement({ onBack }: ShelvesManagementProps) {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [shelfItems, setShelfItems] = useState<ShelfItem[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddShelfForm, setShowAddShelfForm] = useState(false);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState<string | null>(null);

  const [filterBranch, setFilterBranch] = useState('all');
  const [filterShelf, setFilterShelf] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [shelfFormData, setShelfFormData] = useState({
    branch_name: '',
    section_name: '',
    shelf_code: '',
    notes: ''
  });

  const [itemFormData, setItemFormData] = useState({
    shelf_id: '',
    item_id: '',
    max_capacity: 0,
    current_qty: 0,
    notes: ''
  });

  const [adjustData, setAdjustData] = useState({
    newQty: 0,
    notes: ''
  });

  const [returnData, setReturnData] = useState({
    returnQty: 0,
    storageLocation: 'Returns Storage'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [shelvesResult, shelfItemsResult, itemsResult] = await Promise.all([
        supabase
          .from('shelves')
          .select('*')
          .order('branch_name', { ascending: true }),
        supabase
          .from('shelf_items')
          .select(`
            *,
            shelves (
              branch_name,
              section_name,
              shelf_code,
              notes
            ),
            items (
              name,
              sku,
              name_en
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('items')
          .select('id, name, sku, name_en')
          .order('name_en', { ascending: true})
      ]);

      if (shelvesResult.error) throw shelvesResult.error;
      if (shelfItemsResult.error) throw shelfItemsResult.error;
      if (itemsResult.error) throw itemsResult.error;

      setShelves(shelvesResult.data || []);
      setShelfItems(shelfItemsResult.data || []);
      setItems(itemsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load shelves data');
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (currentQty: number, maxCapacity: number) => {
    if (currentQty >= maxCapacity) return 'Full';
    if (currentQty === 0) return 'Empty';
    return 'Need Refill';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Full': return 'bg-green-100 text-green-800';
      case 'Empty': return 'bg-red-100 text-red-800';
      case 'Need Refill': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800 dark:text-gray-200';
    }
  };

  const handleAddShelf = async () => {
    if (!shelfFormData.branch_name || !shelfFormData.shelf_code) {
      alert('Please fill in branch name and shelf code');
      return;
    }

    try {
      const { error } = await supabase
        .from('shelves')
        .insert({
          branch_name: shelfFormData.branch_name,
          section_name: shelfFormData.section_name,
          shelf_code: shelfFormData.shelf_code,
          notes: shelfFormData.notes || null
        });

      if (error) throw error;

      alert('Shelf added successfully');
      setShowAddShelfForm(false);
      setShelfFormData({
        branch_name: '',
        section_name: '',
        shelf_code: '',
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error adding shelf:', error);
      alert('Failed to add shelf');
    }
  };

  const handleAddItemToShelf = async () => {
    if (!itemFormData.shelf_id || !itemFormData.item_id) {
      alert('Please select a shelf and an item');
      return;
    }

    try {
      const { error } = await supabase
        .from('shelf_items')
        .insert({
          shelf_id: itemFormData.shelf_id,
          item_id: itemFormData.item_id,
          max_capacity: itemFormData.max_capacity,
          current_qty: itemFormData.current_qty,
          notes: itemFormData.notes || null
        });

      if (error) throw error;

      alert('Item added to shelf successfully');
      setShowAddItemForm(false);
      setItemFormData({
        shelf_id: '',
        item_id: '',
        max_capacity: 0,
        current_qty: 0,
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error adding item to shelf:', error);
      alert('Failed to add item to shelf. Item may already exist on this shelf.');
    }
  };

  const handleAdjustCount = async (shelfItemId: string) => {
    try {
      const { error } = await supabase
        .from('shelf_items')
        .update({
          current_qty: adjustData.newQty,
          last_count_date: new Date().toISOString(),
          notes: adjustData.notes || undefined
        })
        .eq('id', shelfItemId);

      if (error) throw error;

      alert('Count adjusted successfully');
      setShowAdjustModal(null);
      setAdjustData({ newQty: 0, notes: '' });
      fetchData();
    } catch (error) {
      console.error('Error adjusting count:', error);
      alert('Failed to adjust count');
    }
  };

  const handleDeleteShelfItem = async (shelfItemId: string) => {
    if (!confirm('Are you sure you want to remove this item from the shelf?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('shelf_items')
        .delete()
        .eq('id', shelfItemId);

      if (error) throw error;

      alert('Item removed from shelf');
      fetchData();
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item from shelf');
    }
  };

  const handleReturnToStorage = async (shelfItemId: string) => {
    if (returnData.returnQty <= 0) {
      alert('Please enter a valid quantity to return');
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('return_shelf_to_storage', {
          p_shelf_item_id: shelfItemId,
          p_storage_location: returnData.storageLocation,
          p_return_qty: returnData.returnQty
        });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        alert('Items returned to storage successfully');
        setShowReturnModal(null);
        setReturnData({ returnQty: 0, storageLocation: 'Returns Storage' });
        fetchData();
      } else {
        alert(result.error || 'Failed to return items');
      }
    } catch (error) {
      console.error('Error returning items:', error);
      alert('Failed to return items to storage');
    }
  };

  const branches = [...new Set(shelfItems.map(si => si.shelves?.branch_name).filter(Boolean))];
  const shelfCodes = [...new Set(shelfItems.map(si => si.shelves?.shelf_code).filter(Boolean))];

  const filteredShelfItems = shelfItems.filter(shelfItem => {
    const status = getStatus(shelfItem.current_qty, shelfItem.max_capacity);
    const matchesBranch = filterBranch === 'all' || shelfItem.shelves?.branch_name === filterBranch;
    const matchesShelf = filterShelf === 'all' || shelfItem.shelves?.shelf_code === filterShelf;
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    const itemName = shelfItem.items?.name_en || shelfItem.items?.name || '';
    const matchesSearch = searchTerm === '' ||
      itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shelfItem.shelves?.shelf_code || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesBranch && matchesShelf && matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600 dark:text-gray-400">Loading shelves...</div>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Shelves Management</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddShelfForm(true)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Shelf</span>
            </button>
            <button
              onClick={() => setShowAddItemForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item to Shelf</span>
            </button>
          </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Shelf</label>
            <select
              value={filterShelf}
              onChange={(e) => setFilterShelf(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Shelves</option>
              {shelfCodes.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="Full">Full</option>
              <option value="Need Refill">Need Refill</option>
              <option value="Empty">Empty</option>
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
                placeholder="Item name or shelf code..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shelf Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Capacity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Count</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredShelfItems.map((shelfItem) => {
                const status = getStatus(shelfItem.current_qty, shelfItem.max_capacity);
                return (
                  <tr key={shelfItem.id} className="hover:bg-gray-50 dark:bg-gray-900">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{shelfItem.shelves?.branch_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{shelfItem.shelves?.section_name}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{shelfItem.shelves?.shelf_code}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {shelfItem.items?.name_en || shelfItem.items?.name || 'N/A'}
                      <div className="text-xs text-gray-500">{shelfItem.items?.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{shelfItem.current_qty}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{shelfItem.max_capacity}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {shelfItem.last_count_date
                        ? new Date(shelfItem.last_count_date).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setShowAdjustModal(shelfItem.id);
                            setAdjustData({ newQty: shelfItem.current_qty, notes: '' });
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
                          title="Adjust count"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Adjust</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowReturnModal(shelfItem.id);
                            setReturnData({ returnQty: shelfItem.current_qty, storageLocation: 'Returns Storage' });
                          }}
                          disabled={shelfItem.current_qty <= 0}
                          className={`font-medium text-sm flex items-center space-x-1 ${
                            shelfItem.current_qty > 0
                              ? 'text-orange-600 hover:text-orange-700'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          title="Return to storage"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteShelfItem(shelfItem.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Remove from shelf"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredShelfItems.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No shelf items found matching your filters
            </div>
          )}
        </div>
      </div>

      {showAddShelfForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Add New Shelf Location</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    value={shelfFormData.branch_name}
                    onChange={(e) => setShelfFormData(prev => ({ ...prev, branch_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Olaya, Kingdom"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section Name
                  </label>
                  <input
                    type="text"
                    value={shelfFormData.section_name}
                    onChange={(e) => setShelfFormData(prev => ({ ...prev, section_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Snacks, Drinks"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shelf Code *
                </label>
                <input
                  type="text"
                  value={shelfFormData.shelf_code}
                  onChange={(e) => setShelfFormData(prev => ({ ...prev, shelf_code: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., A1, B2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={shelfFormData.notes}
                  onChange={(e) => setShelfFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4 mt-6">
              <button
                onClick={handleAddShelf}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700"
              >
                Add Shelf
              </button>
              <button
                onClick={() => setShowAddShelfForm(false)}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddItemForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Add Item to Shelf</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Shelf *
                </label>
                <select
                  value={itemFormData.shelf_id}
                  onChange={(e) => setItemFormData(prev => ({ ...prev, shelf_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Shelf</option>
                  {shelves.map(shelf => (
                    <option key={shelf.id} value={shelf.id}>
                      {shelf.branch_name} - {shelf.shelf_code} ({shelf.section_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Item *
                </label>
                <select
                  value={itemFormData.item_id}
                  onChange={(e) => setItemFormData(prev => ({ ...prev, item_id: e.target.value }))}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemFormData.max_capacity}
                    onChange={(e) => setItemFormData(prev => ({ ...prev, max_capacity: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Quantity
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemFormData.current_qty}
                    onChange={(e) => setItemFormData(prev => ({ ...prev, current_qty: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={itemFormData.notes}
                  onChange={(e) => setItemFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4 mt-6">
              <button
                onClick={handleAddItemToShelf}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Add Item
              </button>
              <button
                onClick={() => setShowAddItemForm(false)}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Adjust Count</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Current Quantity
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={adjustData.newQty}
                  onChange={(e) => setAdjustData(prev => ({ ...prev, newQty: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={adjustData.notes}
                  onChange={(e) => setAdjustData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4 mt-6">
              <button
                onClick={() => handleAdjustCount(showAdjustModal)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Update Count
              </button>
              <button
                onClick={() => {
                  setShowAdjustModal(null);
                  setAdjustData({ newQty: 0, notes: '' });
                }}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Return to Storage</h3>

            {(() => {
              const shelfItem = shelfItems.find(si => si.id === showReturnModal);
              if (!shelfItem) return null;

              return (
                <>
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Item:</span> {shelfItem.items?.name_en || shelfItem.items?.name}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Shelf:</span> {shelfItem.shelves?.shelf_code} - {shelfItem.shelves?.section_name}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Available on Shelf:</span> {shelfItem.current_qty}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity to Return *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={returnData.returnQty}
                        onChange={(e) => setReturnData(prev => ({ ...prev, returnQty: parseFloat(e.target.value) || 0 }))}
                        max={shelfItem.current_qty}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum: {shelfItem.current_qty} units
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Storage Location
                      </label>
                      <input
                        type="text"
                        value={returnData.storageLocation}
                        onChange={(e) => setReturnData(prev => ({ ...prev, storageLocation: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Returns Storage, Main Storage"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 mt-6">
                    <button
                      onClick={() => handleReturnToStorage(showReturnModal)}
                      className="bg-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-700"
                    >
                      Return to Storage
                    </button>
                    <button
                      onClick={() => {
                        setShowReturnModal(null);
                        setReturnData({ returnQty: 0, storageLocation: 'Returns Storage' });
                      }}
                      className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200"
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
