import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Package, 
  ChefHat,
  ArrowLeft,
  Save,
  X,
  Trash2,
  Edit,
  RotateCcw,
  Monitor,
  Settings,
  Calendar,
  MessageSquare,
  RefreshCw
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  image?: string;
  category: string;
  isMenuEnabled: boolean;
  showPrice: boolean;
  sortOrder: number;
  availableQty: number;
  autoOOS: boolean;
  manualOOS: boolean;
  isOOS: boolean;
  type: 'item' | 'recipe';
  manualOOSReason?: string;
  manualOOSUntil?: string;
}

interface OOSOverride {
  id: string;
  itemId: string;
  reason: string;
  until?: string;
  createdBy: string;
  createdAt: string;
}

const mockMenuItems: MenuItem[] = [];

const categories = ['All Categories', 'Coffee', 'Beverages', 'Pastries', 'Specialty', 'Tools'];
const statusOptions = ['All Status', 'In Stock', 'Low Stock', 'Out of Stock (Auto)', 'Out of Stock (Manual)'];

interface MenuAdminProps {
  onBack: () => void;
}

export default function MenuAdmin({ onBack }: MenuAdminProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showOOSModal, setShowOOSModal] = useState<{
    itemId: string;
    itemName: string;
    action: 'mark' | 'clear';
  } | null>(null);
  const [oosForm, setOOSForm] = useState({
    reason: '',
    until: ''
  });
  const [showToast, setShowToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleToggleMenuEnabled = (itemId: string) => {
    setMenuItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, isMenuEnabled: !item.isMenuEnabled }
        : item
    ));
    
    const item = menuItems.find(i => i.id === itemId);
    showToastMessage(
      `${item?.name} ${item?.isMenuEnabled ? 'hidden from' : 'shown on'} menu`,
      'success'
    );
  };

  const handleToggleShowPrice = (itemId: string) => {
    setMenuItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, showPrice: !item.showPrice }
        : item
    ));
    
    const item = menuItems.find(i => i.id === itemId);
    showToastMessage(
      `Price ${item?.showPrice ? 'hidden' : 'shown'} for ${item?.name}`,
      'success'
    );
  };

  const handleMarkOOS = (itemId: string, itemName: string) => {
    setShowOOSModal({ itemId, itemName, action: 'mark' });
    setOOSForm({ reason: '', until: '' });
  };

  const handleClearOOS = (itemId: string, itemName: string) => {
    setMenuItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            manualOOS: false, 
            isOOS: item.autoOOS, // Keep auto OOS if applicable
            manualOOSReason: undefined,
            manualOOSUntil: undefined
          }
        : item
    ));
    
    showToastMessage(`Manual OOS cleared for ${itemName}`, 'success');
  };

  const handleSaveOOS = () => {
    if (!showOOSModal || !oosForm.reason.trim()) {
      showToastMessage('Please provide a reason for marking out of stock', 'error');
      return;
    }

    setMenuItems(prev => prev.map(item => 
      item.id === showOOSModal.itemId 
        ? { 
            ...item, 
            manualOOS: true, 
            isOOS: true,
            manualOOSReason: oosForm.reason,
            manualOOSUntil: oosForm.until || undefined
          }
        : item
    ));

    showToastMessage(`${showOOSModal.itemName} marked as out of stock`, 'success');
    setShowOOSModal(null);
    setOOSForm({ reason: '', until: '' });
  };

  const handleBulkAction = (action: 'mark_oos' | 'clear_oos' | 'show_menu' | 'hide_menu') => {
    if (selectedItems.length === 0) {
      showToastMessage('Please select items first', 'error');
      return;
    }

    let updateCount = 0;
    
    setMenuItems(prev => prev.map(item => {
      if (selectedItems.includes(item.id)) {
        updateCount++;
        switch (action) {
          case 'mark_oos':
            return { 
              ...item, 
              manualOOS: true, 
              isOOS: true,
              manualOOSReason: 'Bulk action - marked out of stock'
            };
          case 'clear_oos':
            return { 
              ...item, 
              manualOOS: false, 
              isOOS: item.autoOOS,
              manualOOSReason: undefined,
              manualOOSUntil: undefined
            };
          case 'show_menu':
            return { ...item, isMenuEnabled: true };
          case 'hide_menu':
            return { ...item, isMenuEnabled: false };
          default:
            return item;
        }
      }
      return item;
    }));

    setSelectedItems([]);
    showToastMessage(`Bulk action applied to ${updateCount} items`, 'success');
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  const getStatusInfo = (item: MenuItem) => {
    if (item.isOOS) {
      if (item.manualOOS) {
        return {
          label: 'Out of Stock (Manual)',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertTriangle
        };
      } else {
        return {
          label: 'Out of Stock (Auto)',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertTriangle
        };
      }
    } else if (item.availableQty < 10) {
      return {
        label: 'Low Stock',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock
      };
    } else {
      return {
        label: 'In Stock',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle
      };
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All Categories' || item.category === selectedCategory;
    
    let matchesStatus = true;
    if (selectedStatus !== 'All Status') {
      const statusInfo = getStatusInfo(item);
      matchesStatus = statusInfo.label === selectedStatus;
    }
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Menu Administration</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-gray-600 dark:text-gray-400">Menu Screens</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">Menu Admin</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Sync from POS</span>
          </button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Display Settings</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{menuItems.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">On Menu</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {menuItems.filter(item => item.isMenuEnabled).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {menuItems.filter(item => item.isOOS).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Manual OOS</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">
                {menuItems.filter(item => item.manualOOS).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by item name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="font-medium text-blue-800">
                {selectedItems.length} item(s) selected
              </span>
              <button
                onClick={() => setSelectedItems([])}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('mark_oos')}
                className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-all"
              >
                Mark OOS
              </button>
              <button
                onClick={() => handleBulkAction('clear_oos')}
                className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-all"
              >
                Clear OOS
              </button>
              <button
                onClick={() => handleBulkAction('show_menu')}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
              >
                Show on Menu
              </button>
              <button
                onClick={() => handleBulkAction('hide_menu')}
                className="bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-all"
              >
                Hide from Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-4 px-6">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Item</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Category</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Price</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Available Qty</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Status</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Menu Display</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const statusInfo = getStatusInfo(item);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-all">
                    <td className="py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(prev => [...prev, item.id]);
                          } else {
                            setSelectedItems(prev => prev.filter(id => id !== item.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                              {item.type === 'recipe' ? (
                                <ChefHat className="w-6 h-6 text-blue-600" />
                              ) : (
                                <Package className="w-6 h-6 text-blue-600" />
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.sku}</p>
                          {item.type === 'recipe' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mt-1">
                              <ChefHat className="w-3 h-3" />
                              <span>Recipe</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(item.price)}</span>
                        <button
                          onClick={() => handleToggleShowPrice(item.id)}
                          className={`p-1 rounded transition-all ${
                            item.showPrice 
                              ? 'text-green-600 hover:bg-green-50' 
                              : 'text-gray-400 hover:bg-gray-50 dark:bg-gray-900'
                          }`}
                          title={item.showPrice ? 'Hide price on menu' : 'Show price on menu'}
                        >
                          {item.showPrice ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{item.availableQty}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusInfo.label}</span>
                        </div>
                        {item.manualOOS && item.manualOOSReason && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            <p>Reason: {item.manualOOSReason}</p>
                            {item.manualOOSUntil && (
                              <p>Until: {formatDate(item.manualOOSUntil)}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleMenuEnabled(item.id)}
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                            item.isMenuEnabled
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {item.isMenuEnabled ? (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>Shown</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>Hidden</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        {item.manualOOS ? (
                          <button
                            onClick={() => handleClearOOS(item.id, item.name)}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-all flex items-center space-x-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Clear OOS</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkOOS(item.id, item.name)}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-all flex items-center space-x-1"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            <span>Mark OOS</span>
                          </button>
                        )}
                        <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Mark OOS Modal */}
      {showOOSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mark Out of Stock</h3>
              <button
                onClick={() => setShowOOSModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">{showOOSModal.itemName}</span>
              </p>
              <p className="text-sm text-gray-500">This will hide the item from menu displays</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason *
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <textarea
                    value={oosForm.reason}
                    onChange={(e) => setOOSForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter reason for marking out of stock..."
                    rows={3}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Until (Optional)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="datetime-local"
                    value={oosForm.until}
                    onChange={(e) => setOOSForm(prev => ({ ...prev, until: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to mark as out of stock indefinitely
                </p>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  onClick={handleSaveOOS}
                  className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-all flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Mark Out of Stock</span>
                </button>
                <button
                  onClick={() => setShowOOSModal(null)}
                  className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 ${
          showToast.type === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          {showToast.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span className="font-medium">{showToast.message}</span>
        </div>
      )}
    </div>
  );
}