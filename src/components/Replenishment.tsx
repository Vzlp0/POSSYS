import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Search, AlertCircle } from 'lucide-react';

interface ShelfItemNeedingRefill {
  id: string;
  shelf_id: string;
  item_id: string;
  max_capacity: number;
  current_qty: number;
  needed_qty: number;
  shelves?: {
    branch_name: string;
    section_name: string;
    shelf_code: string;
  };
  items?: {
    name: string;
    sku: string;
    name_en?: string;
  };
}

interface StorageBatch {
  id: string;
  branch_name: string;
  location_name: string;
  item_id: string;
  batch_number: string | null;
  qty_on_hand: number;
  expiry_date: string | null;
}

interface ReplenishmentProps {
  onBack: () => void;
}

export default function Replenishment({ onBack }: ReplenishmentProps) {
  const [shelfItems, setShelfItems] = useState<ShelfItemNeedingRefill[]>([]);
  const [storageBatches, setStorageBatches] = useState<StorageBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRefillModal, setShowRefillModal] = useState<string | null>(null);

  const [filterBranch, setFilterBranch] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [refillData, setRefillData] = useState({
    storage_batch_id: '',
    refill_qty: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    try {
      setLoading(true);
      const items: any[] = JSON.parse(localStorage.getItem('pos_items') || '[]');
      const stockLevels: Record<string, number> = JSON.parse(localStorage.getItem('pos_stock_levels') || '{}');
      const grHistory: any[] = JSON.parse(localStorage.getItem('pos_gr_history') || '[]');

      // Build storage batches from GR history
      const batches: StorageBatch[] = grHistory.flatMap((gr: any) =>
        (gr.items || []).flatMap((gi: any) =>
          (gi.batches || []).map((b: any) => ({
            id: b.id || `${gr.id}-${gi.itemCode}-${b.batchNumber}`,
            branch_name: gr.deliveryLocation || 'Main Branch',
            location_name: b.locationName || 'Stock Room',
            item_id: gi.itemId || gi.id,
            batch_number: b.batchNumber || null,
            qty_on_hand: b.quantity || 0,
            expiry_date: b.expiryDate || null
          }))
        )
      );
      setStorageBatches(batches);

      // Items needing refill: items whose stock < min level (default 10)
      const needingRefill: ShelfItemNeedingRefill[] = items
        .map((item: any) => {
          const qty = stockLevels[item.id] || 0;
          const min = item.min_stock || 10;
          return {
            id: item.id,
            shelf_id: '',
            item_id: item.id,
            max_capacity: min,
            current_qty: qty,
            needed_qty: Math.max(0, min - qty),
            shelves: { branch_name: 'Main Branch', section_name: item.category || 'General', shelf_code: item.sku },
            items: { name: item.name, sku: item.sku, name_en: item.name_en }
          };
        })
        .filter(i => i.current_qty < i.max_capacity);

      setShelfItems(needingRefill);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefillFromStorage = (shelfItemId: string) => {
    if (!refillData.storage_batch_id || refillData.refill_qty <= 0) {
      alert('Please select a storage batch and enter a valid quantity');
      return;
    }

    const batch = storageBatches.find(b => b.id === refillData.storage_batch_id);
    if (!batch) return;

    if (refillData.refill_qty > batch.qty_on_hand) {
      alert('Refill quantity exceeds available quantity in storage');
      return;
    }

    // Update stock levels
    const stockLevels: Record<string, number> = JSON.parse(localStorage.getItem('pos_stock_levels') || '{}');
    const item = shelfItems.find(s => s.id === shelfItemId);
    if (item) {
      stockLevels[item.item_id] = (stockLevels[item.item_id] || 0) + refillData.refill_qty;
      localStorage.setItem('pos_stock_levels', JSON.stringify(stockLevels));
    }

    alert('Shelf refilled successfully');
    setShowRefillModal(null);
    setRefillData({ storage_batch_id: '', refill_qty: 0 });
    fetchData();
  };

  const getStatus = (currentQty: number, maxCapacity: number) => {
    if (currentQty === 0) return 'Empty';
    return 'Need Refill';
  };

  const getStatusColor = (status: string) => {
    return status === 'Empty' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800';
  };

  const branches = [...new Set(shelfItems.map(si => si.shelves?.branch_name).filter(Boolean))];
  const sections = [...new Set(shelfItems.map(si => si.shelves?.section_name).filter(Boolean))];

  const filteredShelfItems = shelfItems.filter(shelfItem => {
    const matchesBranch = filterBranch === 'all' || shelfItem.shelves?.branch_name === filterBranch;
    const matchesSection = filterSection === 'all' || shelfItem.shelves?.section_name === filterSection;
    const itemName = shelfItem.items?.name_en || shelfItem.items?.name || '';
    const matchesSearch = searchTerm === '' ||
      itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shelfItem.shelves?.shelf_code || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesBranch && matchesSection && matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600 dark:text-gray-400">Loading replenishment data...</div>
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Replenishment</h1>
            <p className="text-gray-600 mt-1">Shelf items that need refilling from storage</p>
          </div>
          <div className="bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span className="text-lg font-bold text-orange-900">{filteredShelfItems.length}</span>
              <span className="text-sm text-orange-700">items need refill</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sections</option>
              {sections.map(section => (
                <option key={section} value={section}>{section}</option>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Needed</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredShelfItems.map((shelfItem) => {
                const status = getStatus(shelfItem.current_qty, shelfItem.max_capacity);
                const availableBatches = storageBatches.filter(
                  b => b.branch_name === shelfItem.shelves?.branch_name &&
                       b.item_id === shelfItem.item_id &&
                       b.qty_on_hand > 0
                );

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
                    <td className="px-4 py-3 text-sm font-bold text-orange-600">{shelfItem.needed_qty}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setShowRefillModal(shelfItem.id);
                          setRefillData({
                            storage_batch_id: availableBatches[0]?.id || '',
                            refill_qty: Math.min(shelfItem.needed_qty, availableBatches[0]?.qty_on_hand || 0)
                          });
                        }}
                        disabled={availableBatches.length === 0}
                        className={`font-medium text-sm flex items-center space-x-1 ${
                          availableBatches.length > 0
                            ? 'text-blue-600 hover:text-blue-700'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>Refill</span>
                      </button>
                      {availableBatches.length === 0 && (
                        <p className="text-xs text-red-600 mt-1">No stock in storage</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredShelfItems.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-lg font-medium">All shelf items are fully stocked!</p>
              <p className="text-sm mt-1">No shelf items need refilling at this time</p>
            </div>
          )}
        </div>
      </div>

      {showRefillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Refill from Storage</h3>

            {(() => {
              const shelfItem = shelfItems.find(si => si.id === showRefillModal);
              if (!shelfItem) return null;

              const availableBatches = storageBatches.filter(
                b => b.branch_name === shelfItem.shelves?.branch_name &&
                     b.item_id === shelfItem.item_id &&
                     b.qty_on_hand > 0
              );

              return (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Shelf:</span> {shelfItem.shelves?.shelf_code} - {shelfItem.shelves?.section_name}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Item:</span> {shelfItem.items?.name_en || shelfItem.items?.name}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Needed:</span> {shelfItem.needed_qty} units
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Storage Batch *
                    </label>
                    <select
                      value={refillData.storage_batch_id}
                      onChange={(e) => {
                        const batchId = e.target.value;
                        const batch = availableBatches.find(b => b.id === batchId);
                        setRefillData(prev => ({
                          ...prev,
                          storage_batch_id: batchId,
                          refill_qty: batch ? Math.min(shelfItem.needed_qty, batch.qty_on_hand) : 0
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Batch</option>
                      {availableBatches.map(batch => (
                        <option key={batch.id} value={batch.id}>
                          {batch.location_name} - {batch.batch_number || 'No batch'}
                          {' '}(Qty: {batch.qty_on_hand})
                          {batch.expiry_date ? ` - Exp: ${new Date(batch.expiry_date).toLocaleDateString()}` : ''}
                        </option>
                      ))}
                    </select>
                    {availableBatches.length === 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        No stock available in storage for this item
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
                      value={refillData.refill_qty}
                      onChange={(e) => setRefillData(prev => ({ ...prev, refill_qty: parseFloat(e.target.value) || 0 }))}
                      max={(() => {
                        const batch = availableBatches.find(b => b.id === refillData.storage_batch_id);
                        return batch ? batch.qty_on_hand : 0;
                      })()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum: {(() => {
                        const batch = availableBatches.find(b => b.id === refillData.storage_batch_id);
                        return batch ? Math.min(shelfItem.needed_qty, batch.qty_on_hand) : 0;
                      })()} units
                    </p>
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center space-x-4 mt-6">
              <button
                onClick={() => handleRefillFromStorage(showRefillModal)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Refill Shelf
              </button>
              <button
                onClick={() => {
                  setShowRefillModal(null);
                  setRefillData({ storage_batch_id: '', refill_qty: 0 });
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
