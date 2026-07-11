import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Scan,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  DollarSign,
  User,
  Gift,
  Printer,
  ArrowLeft,
  Pause,
  MessageSquare,
  X,
  Package,
  Percent,
  Calculator,
  ChefHat,
  Banknote,
  CheckCircle,
  RotateCcw,
  RefreshCw,
  XCircle,
  FileText,
  AlertTriangle,
  Calendar,
  Save,
  Clock,
  Eye,
  AlertCircle,
  Phone,
  Mail,
  Coffee,
  UserCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mockItems } from './ItemMaster';
import {
  Transaction,
  TransactionItem,
  Payment,
  ReturnRecord,
  ExchangeRecord,
  VoidRecord,
  AuditLogEntry,
  HeldOrder,
  CreateHeldOrderData,
  Client,
  LoyaltyCard as LoyaltyCardType
} from '../types';
import { supabase } from '../lib/supabase';
import { lookupItemByBarcode } from '../lib/barcodeHelpers';
import HoldOrdersModal from './HoldOrdersModal';
import CustomerInfoModal from './CustomerInfoModal';
import ClientLookupModal from './ClientLookupModal';
import LoyaltyCard from './LoyaltyCard';

// Types
interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: string;
  inStock: boolean;
  type?: 'recipe' | 'product';
  batches?: ProductBatch[];
}

interface ProductBatch {
  id: string;
  batchNumber: string;
  expiryDate?: string;
  quantity: number;
  price: number;
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  batchId?: string;
  batchNumber?: string;
  price: number;
  quantity: number;
  lineTotal: number;
  comment?: string;
  recipeModifications?: {
    removedIngredients: string[];
    ingredientNames: string[];
  };
}

interface RecipeIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

// Mock Products Data
const mockProducts: Product[] = [];

// Mock recipe ingredients for products that are recipes
const mockRecipeIngredients: Record<string, RecipeIngredient[]> = {};

// Mock recipes data (from RecipeMaker)
const mockRecipes: any[] = [];

// Fetch POS products from database
const fetchPOSProducts = async (): Promise<Product[]> => {
  try {
    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .eq('show_in_pos', true);

    if (error) throw error;

    return (items || []).map(item => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      price: item.price || 0,
      category: item.category,
      inStock: true,
      type: 'product' as const
    }));
  } catch (error) {
    console.error('Error fetching POS products:', error);
    return [];
  }
};

const categories = ['All', 'Coffee', 'Beverages', 'Pastries'];

type POSMode = 'browse' | 'payment' | 'receipt';

// Browse View Component
interface BrowseViewProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  scanInput: string;
  setScanInput: (input: string) => void;
  filteredProducts: Product[];
  onScan: (input: string) => void;
  onAddToCart: (product: Product, batch?: ProductBatch, quantity?: number) => void;
  setShowBatchModal: (modal: { product: Product; batches: ProductBatch[] } | null) => void;
}

function BrowseView({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  scanInput,
  setScanInput,
  filteredProducts,
  onScan,
  onAddToCart,
  setShowBatchModal
}: BrowseViewProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Coffee':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Beverages':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pastries':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Recipes':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search and Scan Bar */}
      <div className="p-4 bg-white border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1 relative">
            <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="scan-input"
              type="text"
              placeholder="Scan barcode or enter SKU..."
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && scanInput.trim()) {
                  onScan(scanInput.trim());
                }
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {selectedCategory === 'All' && (
          <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">
              Showing items from all categories - Click any item to add to cart
            </p>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-lg ${
                product.inStock
                  ? 'border-gray-200 hover:border-blue-300'
                  : 'border-red-200 bg-red-50 opacity-60'
              }`}
              onClick={() => {
                if (!product.inStock) return;

                if (product.batches && product.batches.length > 1) {
                  setShowBatchModal({ product, batches: product.batches });
                } else {
                  onAddToCart(product, product.batches?.[0]);
                }
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1">
                  {product.type === 'recipe' ? (
                    <ChefHat className="w-4 h-4 text-orange-600" />
                  ) : (
                    <Package className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  product.inStock
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 mb-1 text-sm">{product.name}</h3>
              <p className="text-xs text-gray-500 mb-2">{product.sku}</p>

              <div className="mb-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getCategoryColor(product.category)}`}>
                  {product.category}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-blue-600">
                  ${product.price.toFixed(2)}
                </span>
                {product.inStock && (
                  <Plus className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {product.batches && product.batches.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    {product.batches.length} batch{product.batches.length > 1 ? 'es' : ''} available
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or category filter</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Payment View Component (placeholder)
function PaymentView({ total, balance, payments, onAddPayment, onRemovePayment, onCompleteTransaction, onChargeToAccount, selectedClient, formatCurrency, cart }: any) {
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'card' | 'membership' | 'voucher'>('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [quickAmountMode, setQuickAmountMode] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: DollarSign, color: 'bg-green-600 hover:bg-green-700' },
    { id: 'card', label: 'Card', icon: CreditCard, color: 'bg-blue-600 hover:bg-blue-700' },
    { id: 'membership', label: 'Membership', icon: User, color: 'bg-purple-600 hover:bg-purple-700' },
    { id: 'voucher', label: 'Voucher', icon: Gift, color: 'bg-orange-600 hover:bg-orange-700' }
  ];

  const quickAmounts = [5, 10, 20, 50, 100];

  const handleAddPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (amount > 0 && amount <= balance) {
      onAddPayment(selectedMethod, amount);
      setPaymentAmount('');
    } else if (amount > balance) {
      alert(`Payment amount cannot exceed balance of ${formatCurrency(balance)}`);
    } else {
      alert('Please enter a valid payment amount');
    }
  };

  const handleQuickAmount = (amount: number) => {
    const actualAmount = Math.min(amount, balance);
    setPaymentAmount(actualAmount.toString());
  };

  const handleExactAmount = () => {
    setPaymentAmount(balance.toFixed(2));
  };

  const canCompleteTransaction = Math.abs(balance) < 0.01;
  const change = balance < 0 ? Math.abs(balance) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Payment Header */}
      <div className="p-6 bg-white border-b border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Process Payment</h2>
          <div className="text-4xl font-bold text-blue-600 mb-2">{formatCurrency(total)}</div>
          <p className="text-gray-600 dark:text-gray-400">Total Amount Due</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Payment Summary */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(total)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Amount Paid</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(total - balance)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Remaining Balance</p>
              <p className={`text-xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(balance)}
              </p>
            </div>
            {change > 0 && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Change Due</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(change)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id as any)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:bg-gray-900'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:text-gray-400'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                      {method.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Amount Entry */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter Payment Amount</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={balance}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 border border-gray-300 rounded-lg text-xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>
              <button
                onClick={handleExactAmount}
                className="bg-blue-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-blue-700 transition-all"
              >
                Exact Amount
              </button>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Quick Amounts</p>
              <div className="flex space-x-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickAmount(amount)}
                    disabled={amount > balance}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Payment Button */}
            <button
              onClick={handleAddPayment}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add {selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1)} Payment</span>
            </button>
          </div>
        </div>

        {/* Applied Payments */}
        {payments.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Applied Payments</h3>
            <div className="space-y-3">
              {payments.map((payment, index) => {
                const method = paymentMethods.find(m => m.id === payment.method);
                const Icon = method?.icon || DollarSign;
                
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{payment.method}</p>
                        <p className="text-sm text-gray-500">Payment #{index + 1}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(payment.amount)}</span>
                      <button
                        onClick={() => onRemovePayment(index)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Charge to Account */}
        {selectedClient && cart.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
            <div className="text-center">
              <UserCircle className="w-12 h-12 text-amber-600 dark:text-amber-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-2">Pay Later Option Available</h3>
              <p className="text-amber-700 dark:text-amber-400 mb-2">
                Customer: <span className="font-semibold">{selectedClient.first_name} {selectedClient.last_name}</span>
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-500 mb-4">
                Current Balance: <span className="font-semibold">{formatCurrency(selectedClient.current_debt || 0)}</span>
              </p>
              <button
                onClick={onChargeToAccount}
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center space-x-2 mx-auto"
              >
                <UserCircle className="w-6 h-6" />
                <span>Charge to Account ({formatCurrency(total)})</span>
              </button>
            </div>
          </div>
        )}

        {/* Complete Transaction */}
        {canCompleteTransaction && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">Ready to Complete</h3>
              <p className="text-green-700 mb-4">
                {change > 0 ? `Change due: ${formatCurrency(change)}` : 'Payment complete'}
              </p>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
                >
                  <Eye className="w-6 h-6" />
                  <span>Review Order</span>
                </button>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-all flex items-center justify-center space-x-2"
                >
                  <Printer className="w-6 h-6" />
                  <span>Complete & Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Eye className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Review Order</h3>
                  </div>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-blue-800 font-medium text-center">
                      Please verify all items in this order before completing the transaction
                    </p>
                  </div>

                  {cart && cart.length > 0 ? (
                    <div className="space-y-3">
                      {cart.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">SKU: {item.sku}</p>
                            {item.batchNumber && (
                              <p className="text-xs text-gray-500">Batch: {item.batchNumber}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {item.quantity} x {formatCurrency(item.price)}
                            </p>
                            <p className="text-lg font-bold text-blue-600">
                              {formatCurrency(item.lineTotal)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>No items in cart</p>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4 mt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-lg">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Total Items:</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {cart ? cart.reduce((sum: number, item: any) => sum + item.quantity, 0) : 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-xl pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="font-bold text-gray-900 dark:text-gray-100">Order Total:</span>
                        <span className="font-bold text-blue-600">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50 dark:bg-gray-900">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-all"
                >
                  Close Review
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-10 h-10 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Transaction</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Are you sure you want to complete this transaction?
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Items:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {cart ? cart.reduce((sum: number, item: any) => sum + item.quantity, 0) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Amount Paid:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(balance)}</span>
                  </div>
                  {change > 0 && (
                    <div className="flex justify-between text-lg pt-2 border-t border-gray-300 dark:border-gray-600">
                      <span className="font-semibold text-green-700">Change Due:</span>
                      <span className="font-bold text-green-600">{formatCurrency(change)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    onCompleteTransaction();
                  }}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Confirm</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Receipt View Component with Loyalty Display
function ReceiptView({ receiptData, formatCurrency, formatDate, onBackToBrowse }: any) {
  if (!receiptData) return null;

  // Auto-print receipt when component loads
  useEffect(() => {
    const timer = setTimeout(() => {
      handlePrintReceipt();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      alert('Please allow popups for this site to print receipts');
      return;
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receiptData.id}</title>
          <meta charset="UTF-8">
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            @media print {
              body { margin: 0; padding: 10mm; }
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', monospace;
              max-width: 80mm;
              margin: 0 auto;
              padding: 10mm;
              font-size: 12px;
              line-height: 1.4;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .header h1 {
              margin: 0 0 5px 0;
              font-size: 18px;
              font-weight: bold;
            }
            .header p {
              margin: 2px 0;
              font-size: 11px;
            }
            .section {
              margin: 15px 0;
              padding: 10px 0;
              border-bottom: 1px dashed #999;
            }
            .customer {
              background: #f5f5f5;
              padding: 8px;
              margin: 10px 0;
              border-radius: 4px;
            }
            .items {
              margin: 10px 0;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .item-name {
              flex: 1;
              padding-right: 10px;
            }
            .item-price {
              white-space: nowrap;
            }
            .totals {
              margin-top: 15px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .total-row.grand {
              font-weight: bold;
              font-size: 14px;
              border-top: 2px solid #000;
              padding-top: 8px;
              margin-top: 8px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 11px;
              color: #666;
              border-top: 1px dashed #999;
              padding-top: 10px;
            }
            .loyalty {
              background: #f0f0f0;
              padding: 8px;
              margin: 10px 0;
              border-radius: 4px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RECEIPT</h1>
            <p>${receiptData.id}</p>
            <p>${new Date(receiptData.timestamp).toLocaleString()}</p>
          </div>

          ${receiptData.client ? `
          <div class="customer">
            <strong>Customer:</strong> ${receiptData.client.first_name} ${receiptData.client.last_name}
            ${receiptData.loyaltyStamps > 0 ? `<br/><small>+${receiptData.loyaltyStamps} loyalty stamp${receiptData.loyaltyStamps > 1 ? 's' : ''} earned!</small>` : ''}
          </div>
          ` : ''}

          <div class="section">
            <div class="items">
              ${receiptData.items.map((item: any) => `
                <div class="item">
                  <span class="item-name">${item.quantity}x ${item.name}</span>
                  <span class="item-price">${formatCurrency(item.lineTotal)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(receiptData.subtotal)}</span>
            </div>
            ${receiptData.discount > 0 ? `
            <div class="total-row">
              <span>Discount:</span>
              <span>-${formatCurrency(receiptData.discount)}</span>
            </div>
            ` : ''}
            ${receiptData.vatInclusive > 0 ? `
            <div class="total-row" style="font-size: 11px; color: #666;">
              <span>VAT (Included):</span>
              <span>${formatCurrency(receiptData.vatInclusive)}</span>
            </div>
            ` : ''}
            ${receiptData.vatExclusive > 0 ? `
            <div class="total-row">
              <span>VAT (Added):</span>
              <span>+${formatCurrency(receiptData.vatExclusive)}</span>
            </div>
            ` : ''}
            <div class="total-row grand">
              <span>TOTAL:</span>
              <span>${formatCurrency(receiptData.total)}</span>
            </div>
          </div>

          ${receiptData.client?.loyalty_card ? `
          <div class="loyalty">
            <strong>Loyalty Progress</strong><br/>
            ${receiptData.client.loyalty_card.current_stamps} / ${receiptData.client.loyalty_card.stamps_required} stamps<br/>
            ${receiptData.client.loyalty_card.completed_cards} card${receiptData.client.loyalty_card.completed_cards !== 1 ? 's' : ''} completed
          </div>
          ` : ''}

          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>Please come again</p>
          </div>

          <script>
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            }, 250);
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="bg-white rounded-xl border-2 border-gray-200 max-w-md w-full p-8 space-y-6">
        <div className="text-center border-b border-gray-200 pb-6">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Transaction Complete!</h2>
          <p className="text-gray-600 dark:text-gray-400">{receiptData.id}</p>
          <p className="text-sm text-gray-500 mt-2">{new Date(receiptData.timestamp).toLocaleString()}</p>
        </div>

        {receiptData.client && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">
                {receiptData.client.first_name} {receiptData.client.last_name}
              </span>
            </div>
            {receiptData.loyaltyStamps > 0 && (
              <p className="text-sm text-blue-700 flex items-center space-x-1">
                <Gift className="w-4 h-4" />
                <span>+{receiptData.loyaltyStamps} loyalty stamp{receiptData.loyaltyStamps > 1 ? 's' : ''} earned!</span>
              </p>
            )}
          </div>
        )}

        {receiptData.client?.loyalty_card && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 text-center">Your Loyalty Card</h3>
            <LoyaltyCard
              current_stamps={receiptData.client.loyalty_card.current_stamps}
              stamps_required={receiptData.client.loyalty_card.stamps_required}
              completed_cards={receiptData.client.loyalty_card.completed_cards}
              size="small"
              showReward={true}
            />
          </div>
        )}

        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
          <div className="space-y-2">
            {receiptData.items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{item.quantity}x {item.name}</span>
                <span className="text-gray-900 font-medium">{formatCurrency(item.lineTotal)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
            <span className="font-medium">{formatCurrency(receiptData.subtotal)}</span>
          </div>
          {receiptData.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Discount:</span>
              <span className="font-medium text-green-600">-{formatCurrency(receiptData.discount)}</span>
            </div>
          )}
          {receiptData.vatInclusive > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">VAT (Included):</span>
              <span className="text-gray-600">{formatCurrency(receiptData.vatInclusive)}</span>
            </div>
          )}
          {receiptData.vatExclusive > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">VAT (Added):</span>
              <span className="font-medium text-blue-600">+{formatCurrency(receiptData.vatExclusive)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
            <span>Total:</span>
            <span>{formatCurrency(receiptData.total)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handlePrintReceipt}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center space-x-2"
          >
            <Printer className="w-5 h-5" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={onBackToBrowse}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-all"
          >
            New Transaction
          </button>
        </div>
      </div>
    </div>
  );
}

// Mock transaction data
const mockTransactions: Transaction[] = [];

export default function POSSystem() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [mode, setMode] = useState<POSMode>('browse');
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Load products and transactions from database
  useEffect(() => {
    const loadProducts = async () => {
      setProductsLoading(true);
      const fetchedProducts = await fetchPOSProducts();
      setProducts(fetchedProducts);
      setProductsLoading(false);
    };
    const loadBranches = async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('branch_name');
      if (!error && data) {
        setBranches(data);
        if (data.length > 0) {
          setSelectedBranchId(data[0].id);
        }
      }
    };
    loadProducts();
    loadBranches();
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_items (
            id,
            item_name,
            item_sku,
            quantity,
            unit_price,
            line_total,
            returned_quantity,
            exchanged_quantity
          )
        `)
        .eq('status', 'completed')
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading transactions:', error);
        return;
      }

      if (data) {
        const formattedTransactions: Transaction[] = data.map(tx => ({
          id: tx.id,
          invoiceNumber: tx.invoice_number,
          date: tx.transaction_date,
          cashierName: tx.cashier_name,
          items: tx.transaction_items.map((item: any) => ({
            itemId: item.id,
            itemName: item.item_name,
            itemSku: item.item_sku,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unit_price),
            lineTotal: parseFloat(item.line_total),
            returnedQty: item.returned_quantity,
            exchangedQty: item.exchanged_quantity
          })),
          subtotal: parseFloat(tx.subtotal),
          discount: parseFloat(tx.discount),
          total: parseFloat(tx.total),
          status: 'completed' as const
        }));
        setTransactions(formattedTransactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantityInput, setQuantityInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [scanInput, setScanInput] = useState('');
  const [notes, setNotes] = useState('');
  const [collectMethod, setCollectMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [discount, setDiscount] = useState({ type: 'none' as 'none' | 'percent' | 'amount', value: 0 });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showBatchModal, setShowBatchModal] = useState<{ product: Product; batches: ProductBatch[] } | null>(null);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [showCommentModal, setShowCommentModal] = useState<{ itemId: string; currentComment: string } | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState<{ itemId: string; productId: string; currentModifications: string[] } | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [exchanges, setExchanges] = useState<ExchangeRecord[]>([]);
  const [voids, setVoids] = useState<VoidRecord[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [showHoldOrdersModal, setShowHoldOrdersModal] = useState(false);
  const [showCustomerInfoModal, setShowCustomerInfoModal] = useState(false);
  const [heldOrdersCount, setHeldOrdersCount] = useState(0);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientLookup, setShowClientLookup] = useState(false);
  const [transactionMode, setTransactionMode] = useState<'return' | 'exchange' | 'refund' | 'void' | null>(null);
  const [showTransactionMenu, setShowTransactionMenu] = useState(false);

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountAmount = discount.type === 'percent'
    ? (subtotal * discount.value / 100)
    : discount.type === 'amount' ? discount.value : 0;
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);

  // VAT Calculation - calculate based on items' VAT mode
  let vatInclusiveTotal = 0; // VAT that's already included in prices
  let vatExclusiveTotal = 0; // VAT to be added on top

  const vatAmount = cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return sum;

    const vatRate = (product as any).vat_rate || 15;
    const vatMode = (product as any).vat_mode || 'inclusive';
    const itemTotal = item.lineTotal;
    const discountRatio = subtotal > 0 ? subtotalAfterDiscount / subtotal : 0;
    const itemTotalAfterDiscount = itemTotal * discountRatio;

    let itemVat = 0;
    if (vatMode === 'inclusive') {
      // Price includes VAT: extract VAT from price
      // VAT = Price - (Price / (1 + VAT%))
      itemVat = itemTotalAfterDiscount - (itemTotalAfterDiscount / (1 + vatRate / 100));
      vatInclusiveTotal += itemVat;
    } else {
      // Price excludes VAT: calculate VAT on top
      // VAT = Price * VAT%
      itemVat = itemTotalAfterDiscount * (vatRate / 100);
      vatExclusiveTotal += itemVat;
    }

    return sum + itemVat;
  }, 0);

  // For exclusive VAT, add VAT to subtotal. For inclusive, it's already in the price
  const hasExclusiveVatItems = vatExclusiveTotal > 0;
  const hasInclusiveVatItems = vatInclusiveTotal > 0;

  // Total calculation: inclusive VAT is already in subtotal, exclusive VAT is added
  const total = subtotalAfterDiscount + vatExclusiveTotal;

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = total - totalPaid;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault();
            document.getElementById('scan-input')?.focus();
            break;
          case 'h':
            e.preventDefault();
            handleHold();
            break;
          case 'p':
            e.preventDefault();
            if (cart.length > 0) {
              setMode(mode === 'payment' ? 'browse' : 'payment');
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [mode, cart.length]);

  // Auto-return to browse if cart becomes empty during payment
  useEffect(() => {
    if (mode === 'payment' && cart.length === 0) {
      setMode('browse');
    }
  }, [cart.length, mode]);

  // Initialize comment input when modal opens
  useEffect(() => {
    if (showCommentModal) {
      setCommentInput(showCommentModal.currentComment);
    }
  }, [showCommentModal]);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Cart operations
  const addToCart = useCallback((product: Product, batch?: ProductBatch, quantity?: number) => {
    const qtyToAdd = quantity || parseInt(quantityInput) || 1;
    const cartItemId = `${product.id}-${batch?.id || 'default'}`;
    const existingItem = cart.find(item => item.id === cartItemId);
    
    if (existingItem) {
      updateQuantity(cartItemId, existingItem.quantity + qtyToAdd);
    } else {
      const newItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        name: product.name,
        sku: product.sku,
        batchId: batch?.id,
        batchNumber: batch?.batchNumber,
        price: batch?.price || product.price,
        quantity: qtyToAdd,
        lineTotal: (batch?.price || product.price) * qtyToAdd
      };
      setCart(prev => [...prev, newItem]);
    }
  }, [cart, quantityInput]);

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, lineTotal: item.price * newQuantity }
        : item
    ));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setNotes('');
    setDiscount({ type: 'none', value: 0 });
    setPayments([]);
    setMode('browse');
  };

  useEffect(() => {
    fetchHeldOrdersCount();

    const subscription = supabase
      .channel('held_orders_count_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'held_orders' },
        () => {
          fetchHeldOrdersCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchHeldOrdersCount = async () => {
    try {
      const { count, error } = await supabase
        .from('held_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (error) throw error;
      setHeldOrdersCount(count || 0);
    } catch (error) {
      console.error('Error fetching held orders count:', error);
    }
  };

  const handleHold = () => {
    if (cart.length === 0) {
      alert('Cannot hold an empty cart');
      return;
    }
    setShowCustomerInfoModal(true);
  };

  const saveHeldOrder = async (customerInfo: any = {}, clientFromModal?: any) => {
    if (!user) return;

    try {
      const { data: holdNumberData } = await supabase.rpc('generate_hold_number');

      const clientToSave = clientFromModal || selectedClient;

      const heldOrderData: CreateHeldOrderData = {
        cashier_id: user.id,
        cashier_name: `${user.firstName} ${user.lastName}`,
        customer_name: clientToSave
          ? `${clientToSave.first_name} ${clientToSave.last_name}`
          : customerInfo.customer_name,
        customer_phone: clientToSave?.phone || customerInfo.customer_phone,
        customer_notes: customerInfo.customer_notes,
        cart_items: cart,
        subtotal,
        discount_type: discount.type,
        discount_value: discount.value,
        total,
        collect_method: collectMethod,
        order_notes: notes
      };

      const { data, error } = await supabase
        .from('held_orders')
        .insert({
          ...heldOrderData,
          hold_number: holdNumberData,
          status: 'active',
          client_id: clientToSave?.id || null,
          client_data: clientToSave || null
        })
        .select()
        .single();

      if (error) throw error;

      setShowCustomerInfoModal(false);
      alert(`Order held successfully! Hold Number: ${holdNumberData}`);
      clearCart();
      setSelectedClient(null);
      fetchHeldOrdersCount();
    } catch (error) {
      console.error('Error saving held order:', error);
      alert('Failed to hold order. Please try again.');
    }
  };

  const handleResumeOrder = (order: HeldOrder) => {
    setCart(order.cart_items);
    setNotes(order.order_notes || '');
    setCollectMethod(order.collect_method);
    setDiscount({
      type: order.discount_type,
      value: order.discount_value
    });

    if ((order as any).client_data) {
      setSelectedClient((order as any).client_data);
    }

    updateOrderStatus(order.id, 'resumed', user?.firstName + ' ' + user?.lastName);

    setShowHoldOrdersModal(false);
    alert(`Order ${order.hold_number} resumed successfully!`);
  };

  const updateOrderStatus = async (orderId: string, status: string, resumedBy?: string) => {
    try {
      const updateData: any = { status };
      if (status === 'resumed') {
        updateData.resumed_at = new Date().toISOString();
        updateData.resumed_by = resumedBy;
      }

      const { error } = await supabase
        .from('held_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
      fetchHeldOrdersCount();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleScan = async (input: string) => {
    try {
      const itemData = await lookupItemByBarcode(input);

      if (itemData) {
        const product = products.find(p => p.id === itemData.id || p.sku === itemData.sku);

        if (product) {
          let matchInfo = ' (matched internal barcode)';
          if (itemData.matchType === 'supplier') {
            matchInfo = ` (matched supplier barcode from ${itemData.matchedSupplier})`;
          } else if (itemData.matchType === 'manufacturer') {
            matchInfo = ' (matched manufacturer barcode)';
          }

          console.log(`Found: ${product.name}${matchInfo}`);

          if (product.batches && product.batches.length > 1) {
            setShowBatchModal({ product, batches: product.batches });
          } else {
            addToCart(product, product.batches?.[0]);
          }
          setScanInput('');
        } else {
          const manualProduct = products.find(p =>
            p.sku.toLowerCase() === input.toLowerCase() ||
            p.batches?.some(b => b.batchNumber.toLowerCase() === input.toLowerCase())
          );

          if (manualProduct) {
            if (manualProduct.batches && manualProduct.batches.length > 1) {
              setShowBatchModal({ product: manualProduct, batches: manualProduct.batches });
            } else {
              addToCart(manualProduct, manualProduct.batches?.[0]);
            }
            setScanInput('');
          } else {
            alert('Product not found');
          }
        }
      } else {
        const manualProduct = products.find(p =>
          p.sku.toLowerCase() === input.toLowerCase() ||
          p.batches?.some(b => b.batchNumber.toLowerCase() === input.toLowerCase())
        );

        if (manualProduct) {
          if (manualProduct.batches && manualProduct.batches.length > 1) {
            setShowBatchModal({ product: manualProduct, batches: manualProduct.batches });
          } else {
            addToCart(manualProduct, manualProduct.batches?.[0]);
          }
          setScanInput('');
        } else {
          alert('Product not found - No matching barcode, SKU, or batch number');
        }
      }
    } catch (error) {
      console.error('Error scanning barcode:', error);
      alert('Error scanning barcode. Please try again.');
    }
  };

  const addPayment = (method: Payment['method'], amount: number) => {
    if (amount > 0 && amount <= balance) {
      setPayments(prev => [...prev, { method, amount }]);
    }
  };

  const removePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };

  const completeTransaction = async () => {
    if (Math.abs(balance) < 0.01) {
      const invoiceNumber = `TXN-${Date.now()}`;
      const cashierName = user?.firstName + ' ' + user?.lastName || 'Unknown';

      let coffeeCount = 0;
      cart.forEach(item => {
        if (item.name.toLowerCase().includes('coffee') || item.name.toLowerCase().includes('latte') || item.name.toLowerCase().includes('espresso')) {
          coffeeCount += item.quantity;
        }
      });

      try {
        console.log('Attempting to save transaction...', {
          invoice_number: invoiceNumber,
          cashier_id: user?.id,
          cashier_name: cashierName,
          subtotal,
          discount: discountAmount,
          total
        });

        // Save main transaction to database
        // Note: cashier_id is set to null since mock auth uses string IDs, not UUIDs
        const { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .insert({
            invoice_number: invoiceNumber,
            transaction_date: new Date().toISOString(),
            cashier_id: null,
            cashier_name: cashierName,
            branch_id: selectedBranchId || null,
            subtotal,
            discount: discountAmount,
            tax: vatAmount,
            vat_inclusive: vatInclusiveTotal,
            vat_exclusive: vatExclusiveTotal,
            total,
            status: 'completed'
          })
          .select()
          .single();

        if (transactionError) {
          console.error('Error saving transaction:', transactionError);
          console.error('Error details:', JSON.stringify(transactionError, null, 2));
          alert(`Failed to save transaction: ${transactionError.message || 'Please try again.'}`);
          return;
        }

        console.log('Transaction saved successfully:', transactionData);

        // Save transaction items
        const transactionItems = cart.map(item => ({
          transaction_id: transactionData.id,
          item_id: item.productId,
          item_name: item.name,
          item_sku: item.sku,
          quantity: item.quantity,
          unit_price: item.price,
          line_total: item.lineTotal,
          returned_quantity: 0,
          exchanged_quantity: 0
        }));

        const { error: itemsError } = await supabase
          .from('transaction_items')
          .insert(transactionItems);

        if (itemsError) {
          console.error('Error saving transaction items:', itemsError);
        }

        // Save payments
        const paymentRecords = payments.map(payment => ({
          transaction_id: transactionData.id,
          payment_method: payment.method,
          amount: payment.amount,
          payment_date: new Date().toISOString(),
          is_voided: false
        }));

        const { error: paymentsError } = await supabase
          .from('payments')
          .insert(paymentRecords);

        if (paymentsError) {
          console.error('Error saving payments:', paymentsError);
        }

        // Deduct inventory locally for each sold item
        const localStock: Record<string, number> = JSON.parse(localStorage.getItem('pos_stock_levels') || '{}');
        for (const item of cart) {
          const key = item.productId || item.sku;
          if (key) {
            localStock[key] = Math.max(0, (localStock[key] || 0) - item.quantity);
          }
        }
        localStorage.setItem('pos_stock_levels', JSON.stringify(localStock));

        // Post to local cash sales ledger
        const cashPaymentsLocal = payments.filter(p => p.method === 'cash');
        if (cashPaymentsLocal.length > 0) {
          const cashTotal = cashPaymentsLocal.reduce((sum, p) => sum + p.amount, 0);
          const cashSales: any[] = JSON.parse(localStorage.getItem('pos_cash_sales') || '[]');
          cashSales.push({
            id: Date.now().toString(),
            transaction_id: transactionData.id,
            invoice_number: invoiceNumber,
            amount: cashTotal,
            cashier_name: cashierName,
            sale_date: new Date().toISOString()
          });
          localStorage.setItem('pos_cash_sales', JSON.stringify(cashSales));
        }

        // Save completed transaction locally for cross-module access
        const localTransactions: any[] = JSON.parse(localStorage.getItem('pos_transactions') || '[]');
        localTransactions.push({
          id: transactionData.id,
          invoice_number: invoiceNumber,
          transaction_date: new Date().toISOString(),
          cashier_name: cashierName,
          subtotal,
          discount: discountAmount,
          tax: vatAmount,
          total,
          status: 'completed',
          items: cart.map(ci => ({ item_id: ci.productId, item_name: ci.name, item_sku: ci.sku, quantity: ci.quantity, unit_price: ci.price, line_total: ci.lineTotal })),
          payments: payments.map(p => ({ payment_method: p.method, amount: p.amount }))
        });
        localStorage.setItem('pos_transactions', JSON.stringify(localTransactions));

        // Handle client-specific logic
        if (selectedClient) {
          await supabase.from('client_orders').insert({
            client_id: selectedClient.id,
            order_number: invoiceNumber,
            order_date: new Date().toISOString(),
            items: cart,
            subtotal,
            discount: discountAmount,
            total,
            payment_method: payments.length > 0 ? payments[0].method : 'cash',
            cashier_name: cashierName,
            loyalty_stamps_earned: coffeeCount,
            notes
          });

          await supabase
            .from('clients')
            .update({
              total_visits: selectedClient.total_visits + 1,
              total_spent: selectedClient.total_spent + total
            })
            .eq('id', selectedClient.id);

          if (selectedClient.loyalty_card && coffeeCount > 0) {
            const newStamps = selectedClient.loyalty_card.current_stamps + coffeeCount;
            const stampsRequired = selectedClient.loyalty_card.stamps_required;
            let completedCards = selectedClient.loyalty_card.completed_cards;
            let remainingStamps = newStamps;

            if (newStamps >= stampsRequired) {
              completedCards += Math.floor(newStamps / stampsRequired);
              remainingStamps = newStamps % stampsRequired;
            }

            await supabase
              .from('loyalty_cards')
              .update({
                current_stamps: remainingStamps,
                completed_cards: completedCards,
                last_stamp_at: new Date().toISOString()
              })
              .eq('id', selectedClient.loyalty_card.id);

            await supabase.from('loyalty_transactions').insert({
              loyalty_card_id: selectedClient.loyalty_card.id,
              client_id: selectedClient.id,
              transaction_id: invoiceNumber,
              transaction_type: 'stamp_earned',
              stamps_added: coffeeCount,
              item_name: `${coffeeCount} Coffee${coffeeCount > 1 ? 's' : ''}`,
              transaction_date: new Date().toISOString(),
              cashier_name: cashierName
            });

            selectedClient.loyalty_card.current_stamps = remainingStamps;
            selectedClient.loyalty_card.completed_cards = completedCards;
          }
        }

        const receipt = {
          id: invoiceNumber,
          items: cart,
          subtotal,
          discount: discountAmount,
          vatInclusive: vatInclusiveTotal,
          vatExclusive: vatExclusiveTotal,
          total,
          payments,
          cashier: cashierName,
          timestamp: new Date().toISOString(),
          notes,
          collectMethod,
          client: selectedClient,
          loyaltyStamps: coffeeCount
        };

        setReceiptData(receipt);
        setMode('receipt');

        // Reload transactions
        loadTransactions();

        // Don't auto-clear - let user manually start new transaction
        // setTimeout(() => {
        //   clearCart();
        //   setReceiptData(null);
        //   setSelectedClient(null);
        // }, 5000);
      } catch (error) {
        console.error('Error completing transaction:', error);
        alert('Failed to complete transaction. Please try again.');
      }
    }
  };

  const handleChargeToAccount = async () => {
    if (!selectedClient) {
      alert('Please select a customer to charge to their account.');
      return;
    }

    if (cart.length === 0) {
      alert('Cart is empty. Please add items before charging to account.');
      return;
    }

    if (!confirm(`Charge ${formatCurrency(total)} to ${selectedClient.first_name} ${selectedClient.last_name}'s account?`)) {
      return;
    }

    const invoiceNumber = `TXN-${Date.now()}`;
    const cashierName = user?.firstName + ' ' + user?.lastName || 'Unknown';

    let coffeeCount = 0;
    cart.forEach(item => {
      if (item.name.toLowerCase().includes('coffee') || item.name.toLowerCase().includes('latte') || item.name.toLowerCase().includes('espresso')) {
        coffeeCount += item.quantity;
      }
    });

    try {
      console.log('Charging to account for client:', selectedClient.id);

      // Save main transaction to database
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          invoice_number: invoiceNumber,
          transaction_date: new Date().toISOString(),
          cashier_id: null,
          cashier_name: cashierName,
          branch_id: selectedBranchId || null,
          subtotal,
          discount: discountAmount,
          tax: vatAmount,
          vat_inclusive: vatInclusiveTotal,
          vat_exclusive: vatExclusiveTotal,
          total,
          status: 'completed'
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Error saving transaction:', transactionError);
        alert(`Failed to save transaction: ${transactionError.message || 'Please try again.'}`);
        return;
      }

      console.log('Transaction saved successfully:', transactionData);

      // Save transaction items
      const transactionItems = cart.map(item => ({
        transaction_id: transactionData.id,
        item_id: item.productId,
        item_name: item.name,
        item_sku: item.sku,
        quantity: item.quantity,
        unit_price: item.price,
        line_total: item.lineTotal,
        returned_quantity: 0,
        exchanged_quantity: 0
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(transactionItems);

      if (itemsError) {
        console.error('Error saving transaction items:', itemsError);
      }

      // Save payment as "account" method
      const { error: paymentsError } = await supabase
        .from('payments')
        .insert({
          transaction_id: transactionData.id,
          payment_method: 'account',
          amount: total,
          payment_date: new Date().toISOString(),
          is_voided: false
        });

      if (paymentsError) {
        console.error('Error saving payment:', paymentsError);
      }

      // Update client's debt and total spent
      const newDebt = (selectedClient.current_debt || 0) + total;

      const { error: clientError } = await supabase
        .from('clients')
        .update({
          current_debt: newDebt,
          total_spent: (selectedClient.total_spent || 0) + total,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedClient.id);

      if (clientError) {
        console.error('Error updating client debt:', clientError);
        alert('Transaction saved but failed to update customer account. Please check manually.');
        return;
      }

      // Save client order
      await supabase.from('client_orders').insert({
        client_id: selectedClient.id,
        order_number: invoiceNumber,
        order_date: new Date().toISOString(),
        items: cart,
        subtotal,
        discount: discountAmount,
        total,
        payment_method: 'account',
        cashier_name: cashierName,
        loyalty_stamps_earned: coffeeCount,
        notes
      });

      // Handle loyalty card if applicable
      if (selectedClient.loyalty_card && coffeeCount > 0) {
        const newStamps = selectedClient.loyalty_card.current_stamps + coffeeCount;
        const stampsRequired = selectedClient.loyalty_card.stamps_required;
        let completedCards = selectedClient.loyalty_card.completed_cards;
        let remainingStamps = newStamps;

        if (newStamps >= stampsRequired) {
          completedCards += Math.floor(newStamps / stampsRequired);
          remainingStamps = newStamps % stampsRequired;
        }

        await supabase
          .from('loyalty_cards')
          .update({
            current_stamps: remainingStamps,
            completed_cards: completedCards,
            last_stamp_at: new Date().toISOString()
          })
          .eq('id', selectedClient.loyalty_card.id);

        await supabase.from('loyalty_transactions').insert({
          loyalty_card_id: selectedClient.loyalty_card.id,
          client_id: selectedClient.id,
          transaction_id: invoiceNumber,
          transaction_type: 'stamp_earned',
          stamps_added: coffeeCount,
          item_name: `${coffeeCount} Coffee${coffeeCount > 1 ? 's' : ''}`,
          transaction_date: new Date().toISOString(),
          cashier_name: cashierName
        });
      }

      // Show success message with new balance
      alert(
        `✓ Transaction Charged to Account\n\n` +
        `Customer: ${selectedClient.first_name} ${selectedClient.last_name}\n` +
        `Amount Charged: ${formatCurrency(total)}\n` +
        `Previous Balance: ${formatCurrency(selectedClient.current_debt || 0)}\n` +
        `New Balance: ${formatCurrency(newDebt)}\n\n` +
        `Invoice: ${invoiceNumber}`
      );

      // Update local state
      selectedClient.current_debt = newDebt;

      // Create receipt
      const receipt = {
        id: invoiceNumber,
        items: cart,
        subtotal,
        discount: discountAmount,
        vatInclusive: vatInclusiveTotal,
        vatExclusive: vatExclusiveTotal,
        total,
        payments: [{ method: 'account', amount: total }],
        cashier: cashierName,
        timestamp: new Date().toISOString(),
        notes,
        collectMethod,
        client: selectedClient,
        loyaltyStamps: coffeeCount
      };

      setReceiptData(receipt);
      setMode('receipt');

      // Reload transactions
      loadTransactions();

    } catch (error) {
      console.error('Error charging to account:', error);
      alert('Failed to charge to account. Please try again.');
    }
  };

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
      day: 'numeric'
    });
  };

  const addComment = (itemId: string, comment: string) => {
    setCart(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, comment: comment.trim() || undefined }
        : item
    ));
  };

  const updateRecipeModifications = (itemId: string, removedIngredients: string[]) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const product = products.find(p => p.id === item.productId);
        const ingredients = mockRecipeIngredients[item.productId] || [];
        const ingredientNames = removedIngredients.map(id => 
          ingredients.find(ing => ing.id === id)?.name || ''
        ).filter(Boolean);
        
        return {
          ...item,
          recipeModifications: removedIngredients.length > 0 ? {
            removedIngredients,
            ingredientNames
          } : undefined
        };
      }
      return item;
    }));
  };

  const hasRecipeIngredients = (productId: string) => {
    return mockRecipeIngredients[productId] && mockRecipeIngredients[productId].length > 0;
  };

  const handleReturn = async (returnData: any) => {
    try {
      const returnNumber = `RET-${Date.now()}`;
      const returnRecord: ReturnRecord = {
        id: Date.now().toString(),
        returnNumber,
        ...returnData,
        processedAt: new Date().toISOString()
      };

      // Save return to database
      const { data: returnDbData, error: returnError } = await supabase
        .from('returns')
        .insert({
          return_number: returnNumber,
          transaction_id: returnData.originalTransactionId,
          invoice_number: returnData.originalInvoiceNumber,
          return_date: new Date().toISOString(),
          total_refund: returnData.totalRefund,
          refund_method: returnData.refundMethod,
          reason: returnData.reason,
          processed_by: returnData.processedBy,
          approved_by: returnData.approvedBy,
          status: 'completed'
        })
        .select()
        .single();

      if (returnError) {
        console.error('Error saving return:', returnError);
        alert('Failed to save return. Please try again.');
        return;
      }

      // Update transaction items with returned quantities
      for (const item of returnData.items) {
        // First get the current returned_quantity
        const { data: currentItem } = await supabase
          .from('transaction_items')
          .select('returned_quantity')
          .eq('transaction_id', returnData.originalTransactionId)
          .eq('item_sku', item.itemSku)
          .single();

        const newReturnedQuantity = (currentItem?.returned_quantity || 0) + item.returnQuantity;

        const { error: itemError } = await supabase
          .from('transaction_items')
          .update({
            returned_quantity: newReturnedQuantity
          })
          .eq('transaction_id', returnData.originalTransactionId)
          .eq('item_sku', item.itemSku);

        if (itemError) {
          console.error('Error updating transaction item:', itemError);
        }
      }

      // Save return items
      const returnItems = returnData.items.map((item: any) => ({
        return_id: returnDbData.id,
        item_name: item.itemName,
        item_sku: item.itemSku,
        quantity: item.returnQuantity,
        unit_price: item.unitPrice,
        line_total: item.refundAmount
      }));

      const { error: itemsError } = await supabase
        .from('return_items')
        .insert(returnItems);

      if (itemsError) {
        console.error('Error saving return items:', itemsError);
      }

      setReturns(prev => [...prev, returnRecord]);

      // Reload transactions to show updated quantities
      loadTransactions();

      // Add to audit log
      const auditEntry: AuditLogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        userId: user?.id || '',
        userName: user?.firstName + ' ' + user?.lastName || 'Unknown User',
        action: 'return',
        entityType: 'transaction',
        entityId: returnData.originalTransactionId,
        details: returnData
      };
      setAuditLog(prev => [...prev, auditEntry]);

      alert('Return processed successfully! Receipt will be printed.');
    } catch (error) {
      console.error('Error processing return:', error);
      alert('Failed to process return. Please try again.');
    }
  };

  const handleExchange = (exchangeData: any) => {
    const exchangeRecord: ExchangeRecord = {
      id: Date.now().toString(),
      exchangeNumber: `EXC-${Date.now()}`,
      ...exchangeData,
      processedAt: new Date().toISOString()
    };

    setExchanges(prev => [...prev, exchangeRecord]);
    
    // Add to audit log
    const auditEntry: AuditLogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userId: user?.id || '',
      userName: user?.firstName + ' ' + user?.lastName || 'Unknown User',
      action: 'exchange',
      entityType: 'transaction',
      entityId: exchangeData.originalTransactionId,
      details: exchangeData
    };
    setAuditLog(prev => [...prev, auditEntry]);

    alert('Exchange processed successfully! Receipt will be printed.');
  };

  const handleVoid = (voidData: any) => {
    const voidRecord: VoidRecord = {
      id: Date.now().toString(),
      voidNumber: `VOID-${Date.now()}`,
      ...voidData,
      processedAt: new Date().toISOString()
    };

    setVoids(prev => [...prev, voidRecord]);
    
    // Update transaction status
    setTransactions(prev => prev.map(transaction => 
      transaction.id === voidData.originalTransactionId 
        ? { ...transaction, status: 'voided', voidedBy: voidData.processedBy, voidedAt: new Date().toISOString(), voidReason: voidData.reason }
        : transaction
    ));
    
    // Add to audit log
    const auditEntry: AuditLogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userId: user?.id || '',
      userName: user?.firstName + ' ' + user?.lastName || 'Unknown User',
      action: 'void',
      entityType: 'transaction',
      entityId: voidData.originalTransactionId,
      details: voidData
    };
    setAuditLog(prev => [...prev, auditEntry]);

    alert('Transaction voided successfully! Voided receipt will be printed.');
  };

  // Transaction Mode View
  if (transactionMode) {
    return (
      <div className="h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setTransactionMode(null)}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to POS</span>
              </button>
              <h2 className="text-2xl font-bold text-gray-900 capitalize">{transactionMode}</h2>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                {transactionMode === 'return' && <RotateCcw className="w-12 h-12 text-blue-600" />}
                {transactionMode === 'exchange' && <RefreshCw className="w-12 h-12 text-green-600" />}
                {transactionMode === 'refund' && <DollarSign className="w-12 h-12 text-orange-600" />}
                {transactionMode === 'void' && <XCircle className="w-12 h-12 text-red-600" />}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 capitalize">{transactionMode} Transaction</h3>
              <p className="text-gray-600 mb-8">
                {transactionMode === 'return' && 'Search for a transaction to process returns'}
                {transactionMode === 'exchange' && 'Search for a transaction to exchange items'}
                {transactionMode === 'refund' && 'Search for a transaction to issue a refund'}
                {transactionMode === 'void' && 'Search for a transaction to void'}
              </p>

              <div className="max-w-xl mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter invoice number or receipt ID..."
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                </div>
                <button className="mt-4 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all">
                  Search Transaction
                </button>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h4>
                <div className="space-y-3">
                  {transactions.slice(0, 3).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{transaction.invoiceNumber}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(transaction.timestamp).toLocaleString()}</p>
                          <p className="text-sm text-gray-500">{transaction.items.length} items</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">${transaction.total.toFixed(2)}</p>
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="h-screen bg-gray-100 grid grid-cols-12">
        {/* Left Panel - Cart & Totals (Always Visible) */}
        <div className="col-span-3 bg-white border-r border-gray-200 flex flex-col">
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 mb-3">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cart</h2>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
                {cart.length}
              </span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Branch</label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Cart is empty</p>
              <p className="text-sm text-gray-400">Scan or add items to get started</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                    <p className="text-xs text-gray-500">{item.sku}</p>
                    {item.batchNumber && (
                      <p className="text-xs text-blue-600 font-mono">{item.batchNumber}</p>
                    )}
                    {item.comment && (
                      <p className="text-xs text-green-600 italic">"{item.comment}"</p>
                    )}
                    {item.recipeModifications && (
                      <p className="text-xs text-orange-600">
                        No: {item.recipeModifications.ingredientNames.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setShowCommentModal({ itemId: item.id, currentComment: item.comment || '' })}
                      className="text-blue-500 hover:text-blue-700 p-1"
                      title="Add Comment"
                    >
                      <MessageSquare className="w-3 h-3" />
                    </button>
                    {hasRecipeIngredients(item.productId) && (
                      <button
                        onClick={() => setShowRecipeModal({ 
                          itemId: item.id, 
                          productId: item.productId, 
                          currentModifications: item.recipeModifications?.removedIngredients || [] 
                        })}
                        className="text-orange-500 hover:text-orange-700 p-1"
                        title="Modify Recipe"
                      >
                        <ChefHat className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(item.lineTotal)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(item.price)} each</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer (Optional)</label>
            {selectedClient ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {selectedClient.first_name} {selectedClient.last_name}
                    </p>
                    {selectedClient.loyalty_card && (
                      <div className="flex items-center space-x-1 mt-1">
                        <Coffee className="w-3 h-3 text-amber-600" />
                        <span className="text-xs text-amber-700">
                          {selectedClient.loyalty_card.current_stamps}/{selectedClient.loyalty_card.stamps_required} stamps
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="text-gray-400 hover:text-red-600 p-1"
                    title="Remove Customer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowClientLookup(true)}
                className="w-full bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all flex items-center justify-center space-x-2"
              >
                <User className="w-4 h-4" />
                <span>Add Customer</span>
              </button>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Order notes..."
              rows={2}
            />
          </div>

          {/* Collect Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Collect Method</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setCollectMethod('pickup')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  collectMethod === 'pickup'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pickup
              </button>
              <button
                onClick={() => setCollectMethod('delivery')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  collectMethod === 'delivery'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Delivery
              </button>
            </div>
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
            <div className="flex space-x-2">
              <select
                value={discount.type}
                onChange={(e) => setDiscount({ type: e.target.value as any, value: 0 })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="none">No Discount</option>
                <option value="percent">Percentage</option>
                <option value="amount">Fixed Amount</option>
              </select>
              {discount.type !== 'none' && (
                <input
                  type="number"
                  value={discount.value}
                  onChange={(e) => setDiscount(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  max={discount.type === 'percent' ? 100 : subtotal}
                />
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                <span className="font-medium text-green-600">-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {(vatInclusiveTotal > 0 || vatExclusiveTotal > 0) && (
              <>
                {vatInclusiveTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">VAT (Included):</span>
                    <span className="font-medium text-gray-600">{formatCurrency(vatInclusiveTotal)}</span>
                  </div>
                )}
                {vatExclusiveTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">VAT (Added):</span>
                    <span className="font-medium text-blue-600">+{formatCurrency(vatExclusiveTotal)}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
            {totalPaid > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Paid:</span>
                  <span className="font-medium text-green-600">{formatCurrency(totalPaid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Balance:</span>
                  <span className={`font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(balance)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => cart.length > 0 && setMode('payment')}
              disabled={cart.length === 0}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay {formatCurrency(total)}</span>
            </button>
            
            <div className="flex space-x-2">
              <button
                onClick={handleHold}
                disabled={cart.length === 0}
                className="flex-1 bg-yellow-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-1"
              >
                <Pause className="w-4 h-4" />
                <span>Hold</span>
              </button>
              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
            <p>Shortcuts: Ctrl+F (Scan), Ctrl+H (Hold), Ctrl+P (Pay)</p>
          </div>
        </div>
        </div>


        {/* Right Panel - Main Area (Mode-Driven) */}
        <div className="col-span-9 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Point of Sale</h1>
                {mode === 'payment' && (
                  <button
                    onClick={() => setMode('browse')}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Browse</span>
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Cashier:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{user?.firstName} {user?.lastName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowHoldOrdersModal(true)}
                    className="relative bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-700 transition-all flex items-center space-x-2"
                  >
                    <Clock className="w-5 h-5" />
                    <span>View Holds</span>
                    {heldOrdersCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {heldOrdersCount}
                      </span>
                    )}
                  </button>
                  <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center space-x-2">
                    <Printer className="w-5 h-5" />
                    <span>Print Receipt</span>
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowTransactionMenu(!showTransactionMenu)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center space-x-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>Transactions</span>
                    </button>

                    {showTransactionMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowTransactionMenu(false)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                          <div className="py-2">
                            <button
                              onClick={() => {
                                setTransactionMode('return');
                                setShowTransactionMenu(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center space-x-3 text-gray-700 dark:text-gray-300"
                            >
                              <RotateCcw className="w-5 h-5 text-blue-600" />
                              <div>
                                <div className="font-medium">Return</div>
                                <div className="text-xs text-gray-500">Process item returns</div>
                              </div>
                            </button>

                            <button
                              onClick={() => {
                                setTransactionMode('exchange');
                                setShowTransactionMenu(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors flex items-center space-x-3 text-gray-700 dark:text-gray-300"
                            >
                              <RefreshCw className="w-5 h-5 text-green-600" />
                              <div>
                                <div className="font-medium">Exchange</div>
                                <div className="text-xs text-gray-500">Exchange items</div>
                              </div>
                            </button>

                            <button
                              onClick={() => {
                                setTransactionMode('refund');
                                setShowTransactionMenu(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors flex items-center space-x-3 text-gray-700 dark:text-gray-300"
                            >
                              <DollarSign className="w-5 h-5 text-orange-600" />
                              <div>
                                <div className="font-medium">Refund</div>
                                <div className="text-xs text-gray-500">Issue refund</div>
                              </div>
                            </button>

                            <div className="border-t border-gray-200 my-1"></div>

                            <button
                              onClick={() => {
                                setTransactionMode('void');
                                setShowTransactionMenu(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center space-x-3 text-gray-700 dark:text-gray-300"
                            >
                              <XCircle className="w-5 h-5 text-red-600" />
                              <div>
                                <div className="font-medium">Void</div>
                                <div className="text-xs text-gray-500">Void transaction</div>
                              </div>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>




          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden">
            {mode === 'browse' && (
              <BrowseView
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                scanInput={scanInput}
                setScanInput={setScanInput}
                filteredProducts={filteredProducts}
                onScan={handleScan}
                onAddToCart={addToCart}
                setShowBatchModal={setShowBatchModal}
              />
            )}

            {mode === 'payment' && (
              <PaymentView
                total={total}
                balance={balance}
                payments={payments}
                onAddPayment={addPayment}
                onRemovePayment={removePayment}
                onCompleteTransaction={completeTransaction}
                onChargeToAccount={handleChargeToAccount}
                selectedClient={selectedClient}
                formatCurrency={formatCurrency}
                cart={cart}
              />
            )}

            {mode === 'receipt' && receiptData && (
              <ReceiptView
                receiptData={receiptData}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onBackToBrowse={() => {
                  clearCart();
                  setReceiptData(null);
                  setSelectedClient(null);
                  setMode('browse');
                }}
              />
            )}
          </div>
        </div>




        {/* Comment Modal */}
        {showCommentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Comment</h3>
                <button
                  onClick={() => setShowCommentModal(null)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment / Special Request
                  </label>
                  <textarea
                    value={showCommentModal ? commentInput : ''}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter special instructions..."
                    rows={3}
                    autoFocus
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      if (showCommentModal) {
                        addComment(showCommentModal.itemId, commentInput);
                      }
                      setShowCommentModal(null);
                      setCommentInput('');
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all"
                  >
                    Save Comment
                  </button>
                  <button
                    onClick={() => {
                      setShowCommentModal(null);
                      setCommentInput('');
                    }}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recipe Modification Modal */}
        {showRecipeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Modify Recipe</h3>
                <button
                  onClick={() => setShowRecipeModal(null)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Uncheck ingredients to remove from this order:
                  </p>
                  <div className="space-y-2">
                    {(mockRecipeIngredients[showRecipeModal.productId] || []).map((ingredient) => (
                      <label key={ingredient.id} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked={!showRecipeModal.currentModifications.includes(ingredient.id)}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            const currentRemovals = showRecipeModal.currentModifications;
                            let newRemovals;
                            
                            if (isChecked) {
                              // Remove from removals list (ingredient is included)
                              newRemovals = currentRemovals.filter(id => id !== ingredient.id);
                            } else {
                              // Add to removals list (ingredient is excluded)
                              newRemovals = [...currentRemovals, ingredient.id];
                            }
                            
                            // Update the modal state
                            setShowRecipeModal(prev => prev ? {
                              ...prev,
                              currentModifications: newRemovals
                            } : null);
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{ingredient.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({ingredient.quantity} {ingredient.unit})
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      if (showRecipeModal) {
                        updateRecipeModifications(showRecipeModal.itemId, showRecipeModal.currentModifications);
                        setShowRecipeModal(null);
                      }
                    }}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-all"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setShowRecipeModal(null)}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Batch Selection Modal */}
        {showBatchModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Select Batch</h3>
                <button
                  onClick={() => setShowBatchModal(null)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{showBatchModal.product.name}</h4>
                <p className="text-sm text-gray-500">{showBatchModal.product.sku}</p>
              </div>

              <div className="space-y-3">
                {showBatchModal.batches.map((batch) => (
                  <button
                    key={batch.id}
                    onClick={() => {
                      addToCart(showBatchModal.product, batch);
                      setShowBatchModal(null);
                    }}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{batch.batchNumber}</p>
                        <p className="text-sm text-gray-500">Qty: {batch.quantity}</p>
                        {batch.expiryDate && (
                          <p className="text-sm text-orange-600">
                            Expires: {formatDate(batch.expiryDate)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(batch.price)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {showCustomerInfoModal && (
          <CustomerInfoModal
            onSave={(customerInfo, client) => saveHeldOrder(customerInfo, client)}
            onQuickHold={() => saveHeldOrder()}
            onCancel={() => setShowCustomerInfoModal(false)}
            currentClient={selectedClient}
          />
        )}

        {showHoldOrdersModal && user && (
          <HoldOrdersModal
            onClose={() => setShowHoldOrdersModal(false)}
            onResumeOrder={handleResumeOrder}
            currentCashierId={user.id}
          />
        )}

        {showClientLookup && (
          <ClientLookupModal
            onClose={() => setShowClientLookup(false)}
            onSelectClient={(client) => {
              setSelectedClient(client);
              setShowClientLookup(false);
            }}
          />
        )}
      </div>
  );
}
