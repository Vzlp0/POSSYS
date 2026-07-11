import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  DollarSign,
  Wallet,
  Coins,
  TrendingUp,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import CashSalesDetail from './CashSalesDetail';
import PettyCashDetail from './PettyCashDetail';
import FloatCashDetail from './FloatCashDetail';

interface CashBalance {
  cash_type: string;
  balance: number;
  last_updated: string;
}

interface CashManagementProps {
  onBack: () => void;
}

export default function CashManagement({ onBack }: CashManagementProps) {
  const [activeView, setActiveView] = useState<'dashboard' | 'cash_sales' | 'petty_cash' | 'float'>('dashboard');
  const [balances, setBalances] = useState<CashBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionCounts, setTransactionCounts] = useState({
    cashSales: 0,
    pettyCash: 0,
    float: 0
  });

  useEffect(() => {
    loadBalances();
    loadTransactionCounts();
  }, []);

  const loadBalances = async () => {
    try {
      const { data, error } = await supabase
        .from('cash_balances')
        .select('*');

      if (error) throw error;
      setBalances(data || []);
    } catch (error) {
      console.error('Error loading balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionCounts = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [cashSalesResult, pettyCashResult, floatResult] = await Promise.all([
        supabase
          .from('cash_sales')
          .select('id', { count: 'exact', head: true })
          .gte('transaction_date', today.toISOString()),
        supabase
          .from('petty_cash')
          .select('id', { count: 'exact', head: true })
          .gte('transaction_date', today.toISOString()),
        supabase
          .from('float_cash')
          .select('id', { count: 'exact', head: true })
          .gte('transaction_date', today.toISOString())
      ]);

      setTransactionCounts({
        cashSales: cashSalesResult.count || 0,
        pettyCash: pettyCashResult.count || 0,
        float: floatResult.count || 0
      });
    } catch (error) {
      console.error('Error loading transaction counts:', error);
    }
  };

  const getBalance = (cashType: string) => {
    const balance = balances.find(b => b.cash_type === cashType);
    return balance?.balance || 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleRefresh = () => {
    setLoading(true);
    loadBalances();
    loadTransactionCounts();
  };

  if (activeView === 'cash_sales') {
    return <CashSalesDetail onBack={() => setActiveView('dashboard')} />;
  }

  if (activeView === 'petty_cash') {
    return <PettyCashDetail onBack={() => setActiveView('dashboard')} />;
  }

  if (activeView === 'float') {
    return <FloatCashDetail onBack={() => setActiveView('dashboard')} />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Finance</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cash Management</h1>
            <p className="text-gray-600 mt-1">Track cash sales, petty cash, and float</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setActiveView('cash_sales')}
          className="bg-white rounded-xl border-2 border-gray-200 hover:border-green-400 hover:shadow-xl transition-all p-6 text-left group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-all">
              <DollarSign className="w-7 h-7 text-green-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-all" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">Cash Sales</h2>
          <p className="text-sm text-gray-600 mb-4">
            Track all sales transactions paid with cash
          </p>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Today's Total</span>
              <span className="text-2xl font-bold text-green-600">
                {loading ? '...' : formatCurrency(getBalance('cash_sales'))}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">Transactions</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{transactionCounts.cashSales}</span>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveView('petty_cash')}
          className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all p-6 text-left group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-all">
              <Wallet className="w-7 h-7 text-blue-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-all" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">Petty Cash</h2>
          <p className="text-sm text-gray-600 mb-4">
            Manage petty cash expenses and replenishments
          </p>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Balance</span>
              <span className="text-2xl font-bold text-blue-600">
                {loading ? '...' : formatCurrency(getBalance('petty_cash'))}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">Today's Transactions</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{transactionCounts.pettyCash}</span>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveView('float')}
          className="bg-white rounded-xl border-2 border-gray-200 hover:border-orange-400 hover:shadow-xl transition-all p-6 text-left group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-all">
              <Coins className="w-7 h-7 text-orange-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-all" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">Float</h2>
          <p className="text-sm text-gray-600 mb-4">
            Track float distributions and collections
          </p>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Balance</span>
              <span className="text-2xl font-bold text-orange-600">
                {loading ? '...' : formatCurrency(getBalance('float'))}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">Today's Movements</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{transactionCounts.float}</span>
            </div>
          </div>
        </button>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total Cash Overview</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Combined view of all cash types</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Cash Sales</span>
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xl font-bold text-green-600 mt-2">
              {loading ? '...' : formatCurrency(getBalance('cash_sales'))}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Petty Cash</span>
              <Wallet className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xl font-bold text-blue-600 mt-2">
              {loading ? '...' : formatCurrency(getBalance('petty_cash'))}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Float</span>
              <Coins className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-xl font-bold text-orange-600 mt-2">
              {loading ? '...' : formatCurrency(getBalance('float'))}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Total Cash in System</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {loading ? '...' : formatCurrency(
                getBalance('cash_sales') + getBalance('petty_cash') + getBalance('float')
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Quick Guide</h3>
        <ul className="text-yellow-700 space-y-1 text-sm">
          <li>• <strong>Cash Sales:</strong> View and track all sales paid in cash</li>
          <li>• <strong>Petty Cash:</strong> Record expenses and add replenishments to petty cash</li>
          <li>• <strong>Float:</strong> Distribute float to cashiers and collect at end of shift</li>
          <li>• Click any window above to see detailed transactions and add new entries</li>
        </ul>
      </div>
    </div>
  );
}
