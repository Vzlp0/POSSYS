import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Coins,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  User,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Settings
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FloatTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  cashier_name: string | null;
  cashier_id: string | null;
  variance: number;
  notes: string | null;
  transaction_date: string;
  created_at: string;
  created_by: string | null;
}

interface FloatCashDetailProps {
  onBack: () => void;
}

export default function FloatCashDetail({ onBack }: FloatCashDetailProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<FloatTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [transactionType, setTransactionType] = useState<'distribution' | 'collection' | 'adjustment'>('distribution');

  const [formData, setFormData] = useState({
    amount: '',
    cashier_name: '',
    variance: '',
    notes: ''
  });

  useEffect(() => {
    loadTransactions();
  }, [dateFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('float_cash')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (dateFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('transaction_date', today.toISOString());
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('transaction_date', weekAgo.toISOString());
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('transaction_date', monthAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.amount) {
      alert('Please fill in the amount');
      return;
    }

    if ((transactionType === 'distribution' || transactionType === 'collection') && !formData.cashier_name) {
      alert('Please enter cashier name');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      alert('Amount must be greater than zero');
      return;
    }

    const variance = formData.variance ? parseFloat(formData.variance) : 0;

    try {
      const newTransaction = {
        transaction_type: transactionType,
        amount,
        cashier_name: formData.cashier_name || null,
        cashier_id: user?.id || null,
        variance,
        notes: formData.notes || null,
        transaction_date: new Date().toISOString(),
        created_by: user?.firstName + ' ' + user?.lastName || 'Unknown'
      };

      const { error: insertError } = await supabase
        .from('float_cash')
        .insert([newTransaction]);

      if (insertError) throw insertError;

      const { data: balanceData, error: balanceError } = await supabase
        .from('cash_balances')
        .select('balance')
        .eq('cash_type', 'float')
        .single();

      if (balanceError) throw balanceError;

      let adjustment = 0;
      if (transactionType === 'distribution') {
        adjustment = -amount;
      } else if (transactionType === 'collection') {
        adjustment = amount - variance;
      } else if (transactionType === 'adjustment') {
        adjustment = amount;
      }

      const newBalance = (balanceData?.balance || 0) + adjustment;

      const { error: updateError } = await supabase
        .from('cash_balances')
        .update({
          balance: newBalance,
          last_updated: new Date().toISOString(),
          updated_by: user?.firstName + ' ' + user?.lastName || 'Unknown'
        })
        .eq('cash_type', 'float');

      if (updateError) throw updateError;

      setFormData({
        amount: '',
        cashier_name: '',
        variance: '',
        notes: ''
      });

      setShowAddForm(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      loadTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTransactions = transactions.filter(t =>
    (t.cashier_name && t.cashier_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const todayDistributions = transactions
    .filter(t => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(t.transaction_date) >= today && t.transaction_type === 'distribution';
    })
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const todayCollections = transactions
    .filter(t => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(t.transaction_date) >= today && t.transaction_type === 'collection';
    })
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const totalVariance = transactions
    .filter(t => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(t.transaction_date) >= today && t.transaction_type === 'collection';
    })
    .reduce((sum, t) => sum + parseFloat(t.variance.toString()), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Cash Management</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Float Management</h1>
            <p className="text-gray-600 mt-1">Track float distributions and collections</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="text-sm font-semibold text-green-800">Transaction Recorded!</h3>
              <p className="text-sm text-green-700">Float transaction has been saved successfully.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Today's Distributions</p>
              <p className="text-3xl font-bold text-red-900 mt-2">{formatCurrency(todayDistributions)}</p>
            </div>
            <div className="w-12 h-12 bg-red-200 rounded-lg flex items-center justify-center">
              <ArrowDownCircle className="w-6 h-6 text-red-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Today's Collections</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{formatCurrency(todayCollections)}</p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
              <ArrowUpCircle className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br p-6 rounded-xl border ${
          totalVariance === 0
            ? 'from-gray-50 to-gray-100 border-gray-200 dark:border-gray-700'
            : totalVariance > 0
            ? 'from-yellow-50 to-yellow-100 border-yellow-200'
            : 'from-red-50 to-red-100 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                totalVariance === 0 ? 'text-gray-700' : totalVariance > 0 ? 'text-yellow-700' : 'text-red-700'
              }`}>
                Total Variance
              </p>
              <p className={`text-3xl font-bold mt-2 ${
                totalVariance === 0 ? 'text-gray-900 dark:text-gray-100' : totalVariance > 0 ? 'text-yellow-900' : 'text-red-900'
              }`}>
                {formatCurrency(Math.abs(totalVariance))}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              totalVariance === 0 ? 'bg-gray-200' : totalVariance > 0 ? 'bg-yellow-200' : 'bg-red-200'
            }`}>
              <AlertTriangle className={`w-6 h-6 ${
                totalVariance === 0 ? 'text-gray-700' : totalVariance > 0 ? 'text-yellow-700' : 'text-red-700'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Add Float Transaction</h3>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Transaction Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTransactionType('distribution')}
                className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                  transactionType === 'distribution'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <ArrowDownCircle className="w-5 h-5" />
                  <span className="text-sm">Distribution</span>
                </div>
              </button>
              <button
                onClick={() => setTransactionType('collection')}
                className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                  transactionType === 'collection'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <ArrowUpCircle className="w-5 h-5" />
                  <span className="text-sm">Collection</span>
                </div>
              </button>
              <button
                onClick={() => setTransactionType('adjustment')}
                className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                  transactionType === 'adjustment'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <Settings className="w-5 h-5" />
                  <span className="text-sm">Adjustment</span>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {transactionType === 'distribution' && 'Float amount given to cashier'}
                {transactionType === 'collection' && 'Float amount returned by cashier'}
                {transactionType === 'adjustment' && 'Adjustment amount (positive or negative)'}
              </p>
            </div>

            {(transactionType === 'distribution' || transactionType === 'collection') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cashier Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.cashier_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, cashier_name: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}

            {transactionType === 'collection' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variance
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.variance}
                    onChange={(e) => setFormData(prev => ({ ...prev, variance: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Difference between expected and actual (positive = short, negative = over)
                </p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 mt-6">
            <button
              onClick={handleSubmit}
              disabled={!formData.amount || ((transactionType === 'distribution' || transactionType === 'collection') && !formData.cashier_name)}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Save Transaction
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Transaction History</h2>

            <div className="flex items-center space-x-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-4">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Date & Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Cashier</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Variance</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:bg-gray-900">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">{formatDateTime(transaction.transaction_date)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        transaction.transaction_type === 'distribution'
                          ? 'bg-red-100 text-red-800'
                          : transaction.transaction_type === 'collection'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {transaction.transaction_type === 'distribution' && <ArrowDownCircle className="w-3 h-3 mr-1" />}
                        {transaction.transaction_type === 'collection' && <ArrowUpCircle className="w-3 h-3 mr-1" />}
                        {transaction.transaction_type === 'adjustment' && <Settings className="w-3 h-3 mr-1" />}
                        {transaction.transaction_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${
                        transaction.transaction_type === 'distribution'
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}>
                        {transaction.transaction_type === 'distribution' ? '-' : '+'}
                        {formatCurrency(parseFloat(transaction.amount.toString()))}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {transaction.cashier_name ? (
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">{transaction.cashier_name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {parseFloat(transaction.variance.toString()) !== 0 ? (
                        <span className={`font-semibold ${
                          parseFloat(transaction.variance.toString()) > 0 ? 'text-yellow-600' : 'text-blue-600'
                        }`}>
                          {formatCurrency(parseFloat(transaction.variance.toString()))}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {transaction.notes ? (
                        <span className="text-sm text-gray-600 dark:text-gray-400">{transaction.notes}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Coins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No float transactions recorded</p>
              <p className="text-sm text-gray-400">Add your first float transaction to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
