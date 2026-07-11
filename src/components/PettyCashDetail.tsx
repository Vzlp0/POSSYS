import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Wallet,
  Plus,
  Minus,
  Calendar,
  User,
  FileText,
  Search,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PettyCashTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  category: string | null;
  description: string;
  receipt_number: string | null;
  approved_by: string | null;
  transaction_date: string;
  created_at: string;
  created_by: string | null;
}

interface PettyCashDetailProps {
  onBack: () => void;
}

const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Transportation',
  'Meals & Entertainment',
  'Utilities',
  'Maintenance',
  'Miscellaneous'
];

export default function PettyCashDetail({ onBack }: PettyCashDetailProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<PettyCashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [transactionType, setTransactionType] = useState<'expense' | 'addition'>('expense');

  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    receipt_number: '',
    approved_by: ''
  });

  useEffect(() => {
    loadTransactions();
  }, [dateFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('petty_cash')
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
    if (!formData.amount || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      alert('Amount must be greater than zero');
      return;
    }

    try {
      const newTransaction = {
        transaction_type: transactionType,
        amount,
        category: formData.category || null,
        description: formData.description,
        receipt_number: formData.receipt_number || null,
        approved_by: formData.approved_by || null,
        transaction_date: new Date().toISOString(),
        created_by: user?.firstName + ' ' + user?.lastName || 'Unknown'
      };

      const { error: insertError } = await supabase
        .from('petty_cash')
        .insert([newTransaction]);

      if (insertError) throw insertError;

      const { data: balanceData, error: balanceError } = await supabase
        .from('cash_balances')
        .select('balance')
        .eq('cash_type', 'petty_cash')
        .single();

      if (balanceError) throw balanceError;

      const adjustment = transactionType === 'addition' ? amount : -amount;
      const newBalance = (balanceData?.balance || 0) + adjustment;

      const { error: updateError } = await supabase
        .from('cash_balances')
        .update({
          balance: newBalance,
          last_updated: new Date().toISOString(),
          updated_by: user?.firstName + ' ' + user?.lastName || 'Unknown'
        })
        .eq('cash_type', 'petty_cash');

      if (updateError) throw updateError;

      setFormData({
        amount: '',
        category: '',
        description: '',
        receipt_number: '',
        approved_by: ''
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
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.receipt_number && t.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const todayExpenses = transactions
    .filter(t => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(t.transaction_date) >= today && t.transaction_type === 'expense';
    })
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const todayAdditions = transactions
    .filter(t => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(t.transaction_date) >= today && t.transaction_type === 'addition';
    })
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Petty Cash</h1>
            <p className="text-gray-600 mt-1">Manage petty cash expenses and replenishments</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
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
              <p className="text-sm text-green-700">Petty cash transaction has been saved successfully.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Today's Expenses</p>
              <p className="text-3xl font-bold text-red-900 mt-2">{formatCurrency(todayExpenses)}</p>
            </div>
            <div className="w-12 h-12 bg-red-200 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Today's Additions</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{formatCurrency(todayAdditions)}</p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Transactions</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{filteredTransactions.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Add Petty Cash Transaction</h3>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Transaction Type *
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => setTransactionType('expense')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                  transactionType === 'expense'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Minus className="w-5 h-5" />
                  <span>Expense</span>
                </div>
              </button>
              <button
                onClick={() => setTransactionType('addition')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                  transactionType === 'addition'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Addition</span>
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category {transactionType === 'expense' && '*'}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={transactionType === 'expense'}
              >
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the transaction..."
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Number
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.receipt_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, receipt_number: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="RCP-001"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approved By
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.approved_by}
                  onChange={(e) => setFormData(prev => ({ ...prev, approved_by: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Manager name"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 mt-6">
            <button
              onClick={handleSubmit}
              disabled={!formData.amount || !formData.description}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-4">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Date & Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Approved By</th>
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
                        transaction.transaction_type === 'expense'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {transaction.transaction_type === 'expense' ? (
                          <Minus className="w-3 h-3 mr-1" />
                        ) : (
                          <Plus className="w-3 h-3 mr-1" />
                        )}
                        {transaction.transaction_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${
                        transaction.transaction_type === 'expense' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transaction.transaction_type === 'expense' ? '-' : '+'}
                        {formatCurrency(parseFloat(transaction.amount.toString()))}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {transaction.category ? (
                        <span className="text-sm text-gray-900 dark:text-gray-100">{transaction.category}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-900 dark:text-gray-100">{transaction.description}</span>
                    </td>
                    <td className="py-3 px-4">
                      {transaction.approved_by ? (
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">{transaction.approved_by}</span>
                        </div>
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
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No petty cash transactions recorded</p>
              <p className="text-sm text-gray-400">Add your first transaction to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
