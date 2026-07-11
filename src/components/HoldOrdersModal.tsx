import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Clock,
  User,
  Phone,
  ShoppingCart,
  DollarSign,
  Play,
  Trash2,
  FileText,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { HeldOrder } from '../types';
import { supabase } from '../lib/supabase';

interface HoldOrdersModalProps {
  onClose: () => void;
  onResumeOrder: (order: HeldOrder) => void;
  currentCashierId: string;
}

export default function HoldOrdersModal({ onClose, onResumeOrder, currentCashierId }: HoldOrdersModalProps) {
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<HeldOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<HeldOrder | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchHeldOrders();

    const subscription = supabase
      .channel('held_orders_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'held_orders' },
        () => {
          fetchHeldOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOrders(heldOrders);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = heldOrders.filter(order =>
        order.hold_number.toLowerCase().includes(term) ||
        order.customer_name?.toLowerCase().includes(term) ||
        order.customer_phone?.toLowerCase().includes(term) ||
        order.cashier_name.toLowerCase().includes(term)
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, heldOrders]);

  const fetchHeldOrders = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('held_orders')
        .select('*')
        .eq('status', 'active')
        .order('held_at', { ascending: false });

      if (error) throw error;
      setHeldOrders(data || []);
    } catch (error) {
      console.error('Error fetching held orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('held_orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: currentCashierId
        })
        .eq('id', orderId);

      if (error) throw error;

      setShowDeleteConfirm(null);
      fetchHeldOrders();
    } catch (error) {
      console.error('Error deleting held order:', error);
      alert('Failed to delete held order. Please try again.');
    }
  };

  const getOrderAge = (heldAt: string) => {
    const now = new Date();
    const held = new Date(heldAt);
    const diffMs = now.getTime() - held.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getAgeColor = (heldAt: string) => {
    const now = new Date();
    const held = new Date(heldAt);
    const diffHours = (now.getTime() - held.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) return 'text-green-600 bg-green-50';
    if (diffHours < 4) return 'text-blue-600 bg-blue-50';
    if (diffHours < 8) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedOrder) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Order Details</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrder.hold_number}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cashier</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{selectedOrder.cashier_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Held At</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{formatDateTime(selectedOrder.held_at)}</p>
              </div>
              {selectedOrder.customer_name && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{selectedOrder.customer_name}</p>
                </div>
              )}
              {selectedOrder.customer_phone && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{selectedOrder.customer_phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Collect Method</p>
                <p className="font-medium text-gray-900 capitalize">{selectedOrder.collect_method}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Order Age</p>
                <p className={`font-medium ${getAgeColor(selectedOrder.held_at).split(' ')[0]}`}>
                  {getOrderAge(selectedOrder.held_at)}
                </p>
              </div>
            </div>

            {selectedOrder.customer_notes && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Customer Notes</p>
                <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded-lg">{selectedOrder.customer_notes}</p>
              </div>
            )}

            {selectedOrder.order_notes && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Order Notes</p>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedOrder.order_notes}</p>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Items</h3>
              <div className="space-y-3">
                {selectedOrder.cart_items.map((item: any, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                        <p className="text-xs text-gray-500">{item.sku}</p>
                        {item.comment && (
                          <p className="text-xs text-green-600 italic mt-1">"{item.comment}"</p>
                        )}
                        {item.recipeModifications && (
                          <p className="text-xs text-orange-600 mt-1">
                            No: {item.recipeModifications.ingredientNames.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(item.lineTotal)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="font-medium">{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.discount_type !== 'none' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Discount ({selectedOrder.discount_type === 'percent' ? `${selectedOrder.discount_value}%` : 'Amount'}):
                  </span>
                  <span className="font-medium text-green-600">
                    -{formatCurrency(
                      selectedOrder.discount_type === 'percent'
                        ? (selectedOrder.subtotal * selectedOrder.discount_value) / 100
                        : selectedOrder.discount_value
                    )}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex items-center space-x-4">
            <button
              onClick={() => {
                onResumeOrder(selectedOrder);
                setSelectedOrder(null);
                onClose();
              }}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Resume Order</span>
            </button>
            <button
              onClick={() => setSelectedOrder(null)}
              className="bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-all"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Held Orders</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{filteredOrders.length} active order{filteredOrders.length !== 1 ? 's' : ''} on hold</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by hold number, customer name, phone, or cashier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading held orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Held Orders</h3>
              <p className="text-gray-500">
                {searchTerm ? 'No orders match your search criteria' : 'There are no orders on hold at the moment'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{order.hold_number}</h3>
                      <p className={`text-xs font-medium px-2 py-1 rounded-full inline-block mt-1 ${getAgeColor(order.held_at)}`}>
                        {getOrderAge(order.held_at)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(order.id);
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Cancel Order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <User className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {order.customer_name || 'No customer name'}
                      </span>
                    </div>
                    {order.customer_phone && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{order.customer_phone}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <ShoppingCart className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{order.cart_items.length} item{order.cart_items.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="text-xs">{formatDateTime(order.held_at)}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
                      <span className="text-lg font-bold text-blue-600">{formatCurrency(order.total)}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-3">
                    Cashier: {order.cashier_name}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onResumeOrder(order);
                        onClose();
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all flex items-center justify-center space-x-1"
                    >
                      <Play className="w-4 h-4" />
                      <span>Resume</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                      className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Cancel Held Order?</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Are you sure you want to cancel this held order? The order will be permanently removed from the active holds list.
              </p>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleDeleteOrder(showDeleteConfirm)}
                  className="flex-1 bg-red-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-red-700 transition-all"
                >
                  Yes, Cancel Order
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Keep Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
