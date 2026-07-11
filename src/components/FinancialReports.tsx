import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  Calendar,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface FinancialReportsProps {
  onBack: () => void;
}

type TabType = 'pnl' | 'cashflow' | 'daily';
type DateRange = '7' | '30' | '90' | 'custom';

interface PnLData {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  transactionCount: number;
}

interface CashFlowEntry {
  method: string;
  total: number;
  count: number;
}

interface DailySummaryEntry {
  date: string;
  total: number;
  count: number;
}

interface Transaction {
  id: string;
  invoice_number: string;
  transaction_date: string;
  cashier_name: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  items: { item_id: string; item_name: string; quantity: number; unit_price: number; line_total: number }[];
  payments: { payment_method: string; amount: number }[];
}

export default function FinancialReports({ onBack }: FinancialReportsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('pnl');
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(true);

  const [pnlData, setPnlData] = useState<PnLData>({ totalRevenue: 0, totalCost: 0, grossProfit: 0, transactionCount: 0 });
  const [cashFlowData, setCashFlowData] = useState<CashFlowEntry[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummaryEntry[]>([]);

  const getDateRange = (): { start: Date; end: Date } => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    if (dateRange === 'custom' && customStart && customEnd) {
      const s = new Date(customStart);
      s.setHours(0, 0, 0, 0);
      const e = new Date(customEnd);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }

    const days = parseInt(dateRange);
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);

    return { start, end };
  };

  const getFilteredTransactions = (): Transaction[] => {
    const raw = localStorage.getItem('pos_transactions');
    if (!raw) return [];
    try {
      const all: Transaction[] = JSON.parse(raw);
      const { start, end } = getDateRange();
      return all.filter(tx => {
        const d = new Date(tx.transaction_date);
        return d >= start && d <= end && tx.status === 'completed';
      });
    } catch {
      return [];
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, dateRange, customStart, customEnd]);

  const loadData = () => {
    setLoading(true);
    const transactions = getFilteredTransactions();

    if (activeTab === 'pnl') {
      loadPnL(transactions);
    } else if (activeTab === 'cashflow') {
      loadCashFlow(transactions);
    } else {
      loadDailySummary(transactions);
    }
    setLoading(false);
  };

  const loadPnL = (transactions: Transaction[]) => {
    const totalRevenue = transactions.reduce((sum, tx) => sum + Number(tx.total || 0), 0);
    const totalCost = totalRevenue * 0.6; // Estimate costs as 60% of revenue
    setPnlData({
      totalRevenue,
      totalCost,
      grossProfit: totalRevenue - totalCost,
      transactionCount: transactions.length
    });
  };

  const loadCashFlow = (transactions: Transaction[]) => {
    const grouped: Record<string, { total: number; count: number }> = {};
    transactions.forEach(tx => {
      (tx.payments || []).forEach(p => {
        const method = p.payment_method || 'unknown';
        if (!grouped[method]) grouped[method] = { total: 0, count: 0 };
        grouped[method].total += Number(p.amount || 0);
        grouped[method].count += 1;
      });
    });

    const entries: CashFlowEntry[] = Object.entries(grouped).map(([method, data]) => ({
      method,
      total: data.total,
      count: data.count
    }));

    setCashFlowData(entries);
  };

  const loadDailySummary = (transactions: Transaction[]) => {
    const grouped: Record<string, { total: number; count: number }> = {};
    transactions.forEach(tx => {
      const date = new Date(tx.transaction_date).toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = { total: 0, count: 0 };
      grouped[date].total += Number(tx.total || 0);
      grouped[date].count += 1;
    });

    const entries: DailySummaryEntry[] = Object.entries(grouped)
      .map(([date, data]) => ({ date, total: data.total, count: data.count }))
      .sort((a, b) => b.date.localeCompare(a.date));

    setDailySummary(entries);
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const tabs = [
    { id: 'pnl' as TabType, label: 'Profit & Loss', icon: TrendingUp },
    { id: 'cashflow' as TabType, label: 'Cash Flow', icon: CreditCard },
    { id: 'daily' as TabType, label: 'Daily Summary', icon: BarChart3 },
  ];

  const cashTotal = cashFlowData.reduce((sum, e) => sum + e.total, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Financial Reports</h1>
            <p className="text-gray-600 mt-1">Revenue, costs, and cash flow analysis</p>
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className={`flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-400" />
          {[
            { value: '7', label: '7 Days' },
            { value: '30', label: '30 Days' },
            { value: '90', label: '90 Days' },
            { value: 'custom', label: 'Custom' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setDateRange(opt.value as DateRange)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dateRange === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
          {dateRange === 'custom' && (
            <div className="flex items-center space-x-2 ml-2">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-3">Loading report data...</p>
            </div>
          ) : (
            <>
              {/* Profit & Loss */}
              {activeTab === 'pnl' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Total Revenue</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">{formatCurrency(pnlData.totalRevenue)}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingDown className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium text-red-800">Est. Cost (60%)</span>
                      </div>
                      <p className="text-2xl font-bold text-red-900">{formatCurrency(pnlData.totalCost)}</p>
                    </div>
                    <div className={`rounded-xl p-5 border ${pnlData.grossProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className={`w-5 h-5 ${pnlData.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                        <span className={`text-sm font-medium ${pnlData.grossProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>Gross Profit</span>
                      </div>
                      <p className={`text-2xl font-bold ${pnlData.grossProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>{formatCurrency(pnlData.grossProfit)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <BarChart3 className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-800">Transactions</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{pnlData.transactionCount}</p>
                    </div>
                  </div>
                  {pnlData.totalRevenue > 0 && (
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Profit Margin</p>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${pnlData.grossProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(Math.abs(pnlData.grossProfit / pnlData.totalRevenue * 100), 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {(pnlData.grossProfit / pnlData.totalRevenue * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cash Flow */}
              {activeTab === 'cashflow' && (
                <div className="space-y-6">
                  {cashFlowData.length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No payment data found for this period</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Total Collected</span>
                          </div>
                          <p className="text-2xl font-bold text-green-900">{formatCurrency(cashTotal)}</p>
                        </div>
                        {cashFlowData.find(e => e.method === 'cash') && (
                          <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <Banknote className="w-5 h-5 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">Cash</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-900">
                              {formatCurrency(cashFlowData.find(e => e.method === 'cash')?.total || 0)}
                            </p>
                          </div>
                        )}
                        {cashFlowData.find(e => e.method === 'card') && (
                          <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <CreditCard className="w-5 h-5 text-purple-600" />
                              <span className="text-sm font-medium text-purple-800">Card</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-900">
                              {formatCurrency(cashFlowData.find(e => e.method === 'card')?.total || 0)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="pb-3 text-sm font-medium text-gray-500">Payment Method</th>
                              <th className="pb-3 text-sm font-medium text-gray-500 text-right">Transactions</th>
                              <th className="pb-3 text-sm font-medium text-gray-500 text-right">Total Amount</th>
                              <th className="pb-3 text-sm font-medium text-gray-500 text-right">% of Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cashFlowData.map(entry => (
                              <tr key={entry.method} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 text-sm font-medium text-gray-900 capitalize">{entry.method}</td>
                                <td className="py-3 text-sm text-gray-600 text-right">{entry.count}</td>
                                <td className="py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(entry.total)}</td>
                                <td className="py-3 text-sm text-gray-600 text-right">
                                  {cashTotal > 0 ? ((entry.total / cashTotal) * 100).toFixed(1) : 0}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Daily Summary */}
              {activeTab === 'daily' && (
                <div className="space-y-4">
                  {dailySummary.length === 0 ? (
                    <div className="text-center py-12">
                      <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No transaction data found for this period</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="pb-3 text-sm font-medium text-gray-500">Date</th>
                            <th className="pb-3 text-sm font-medium text-gray-500 text-right">Transactions</th>
                            <th className="pb-3 text-sm font-medium text-gray-500 text-right">Total Sales</th>
                            <th className="pb-3 text-sm font-medium text-gray-500 text-right">Avg per Transaction</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailySummary.map(entry => (
                            <tr key={entry.date} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 text-sm font-medium text-gray-900">{formatDate(entry.date)}</td>
                              <td className="py-3 text-sm text-gray-600 text-right">{entry.count}</td>
                              <td className="py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(entry.total)}</td>
                              <td className="py-3 text-sm text-gray-600 text-right">
                                {formatCurrency(entry.count > 0 ? entry.total / entry.count : 0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-300">
                            <td className="py-3 text-sm font-bold text-gray-900">Total</td>
                            <td className="py-3 text-sm font-bold text-gray-900 text-right">
                              {dailySummary.reduce((sum, e) => sum + e.count, 0)}
                            </td>
                            <td className="py-3 text-sm font-bold text-gray-900 text-right">
                              {formatCurrency(dailySummary.reduce((sum, e) => sum + e.total, 0))}
                            </td>
                            <td className="py-3 text-sm font-bold text-gray-900 text-right">
                              {formatCurrency(
                                dailySummary.reduce((sum, e) => sum + e.total, 0) /
                                Math.max(dailySummary.reduce((sum, e) => sum + e.count, 0), 1)
                              )}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
