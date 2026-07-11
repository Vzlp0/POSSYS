import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  User,
  Receipt,
  Search,
  Plus,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CashSale {
  id: string;
  transaction_id: string;
  amount: number;
  cashier_name: string;
  cashier_id: string | null;
  receipt_number: string | null;
  transaction_date: string;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

interface CashSalesDetailProps {
  onBack: () => void;
}

export default function CashSalesDetail({ onBack }: CashSalesDetailProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<CashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');

  const [formData, setFormData] = useState({
    transaction_id: '',
    amount: '',
    cashier_name: '',
    receipt_number: '',
    notes: ''
  });

  useEffect(() => {
    loadTransactions();
  }, [dateFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('cash_sales')
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
    if (!formData.transaction_id || !formData.amount || !formData.cashier_name) {
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
        transaction_id: formData.transaction_id,
        amount,
        cashier_name: formData.cashier_name,
        cashier_id: user?.id || null,
        receipt_number: formData.receipt_number || null,
        notes: formData.notes || null,
        transaction_date: new Date().toISOString(),
        created_by: user?.firstName + ' ' + user?.lastName || 'Unknown'
      };

      const { error: insertError } = await supabase
        .from('cash_sales')
        .insert([newTransaction]);

      if (insertError) throw insertError;

      const { data: balanceData, error: balanceError } = await supabase
        .from('cash_balances')
        .select('balance')
        .eq('cash_type', 'cash_sales')
        .single();

      if (balanceError) throw balanceError;

      const newBalance = (balanceData?.balance || 0) + amount;

      const { error: updateError } = await supabase
        .from('cash_balances')
        .update({
          balance: newBalance,
          last_updated: new Date().toISOString(),
          updated_by: user?.firstName + ' ' + user?.lastName || 'Unknown'
        })
        .eq('cash_type', 'cash_sales');

      if (updateError) throw updateError;

      setFormData({
        transaction_id: '',
        amount: '',
        cashier_name: '',
        receipt_number: '',
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
    t.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.cashier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.receipt_number && t.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  const todayTotal = transactions
    .filter(t => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(t.transaction_date) >= today;
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cash Sales</h1>
            <p className="text-gray-600 mt-1">Track all sales transactions paid with cash</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Cash Sale</span>
        </button>
      </div>

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="text-sm font-semibold text-green-800">Transaction Added!</h3>
              <p className="text-sm text-green-700">Cash sale has been recorded successfully.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Today's Total</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{formatCurrency(todayTotal)}</p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transactions ({dateFilter})</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{filteredTransactions.length}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Period Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Add New Cash Sale</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction ID *
              </label>
              <input
                type="text"
                value={formData.transaction_id}
                onChange={(e) => setFormData(prev => ({ ...prev, transaction_id: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="TXN-001"
                required
              />
            </div>

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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Number
              </label>
              <div className="relative">
                <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.receipt_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, receipt_number: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="RCP-001"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 mt-6">
            <button
              onClick={handleSubmit}
              disabled={!formData.transaction_id || !formData.amount || !formData.cashier_name}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              <div className="inline-block w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-4">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Date & Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Transaction ID</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Cashier</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Receipt</th>
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
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {transaction.transaction_id}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(parseFloat(transaction.amount.toString()))}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-100">{transaction.cashier_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {transaction.receipt_number ? (
                        <span className="text-sm text-gray-900 dark:text-gray-100">{transaction.receipt_number}</span>
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
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No cash sales recorded</p>
              <p className="text-sm text-gray-400">Add your first cash sale to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
