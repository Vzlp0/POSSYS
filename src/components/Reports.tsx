import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Calendar,
  Download,
  Filter,
  Search,
  FileText,
  AlertTriangle,
  CheckCircle,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus,
  CreditCard,
  Banknote,
  Gift,
  User,
  Award,
  Star,
  TrendingDown,
  Activity,
  Clock,
  Target
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DateRange {
  start: string;
  end: string;
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'inventory' | 'employees' | 'customers'>('overview');
  const [dateRange, setDateRange] = useState('30days');
  const [customDateRange, setCustomDateRange] = useState<DateRange>({ start: '', end: '' });
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State for report data
  const [salesData, setSalesData] = useState<any>(null);
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);

  useEffect(() => {
    loadReportData();
  }, [dateRange, customDateRange, selectedBranch, activeTab]);

  const getDateRangeFilter = () => {
    const now = new Date();
    let startDate: Date;

    if (dateRange === 'custom' && customDateRange.start && customDateRange.end) {
      return { start: customDateRange.start, end: customDateRange.end };
    }

    switch (dateRange) {
      case '7days':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30days':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case '90days':
        startDate = new Date(now.setDate(now.getDate() - 90));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 30));
    }

    return {
      start: startDate.toISOString(),
      end: new Date().toISOString()
    };
  };

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const range = getDateRangeFilter();

      if (activeTab === 'overview' || activeTab === 'sales') {
        await loadSalesData(range);
      }
      if (activeTab === 'overview' || activeTab === 'inventory') {
        await loadInventoryData(range);
      }
      if (activeTab === 'overview' || activeTab === 'employees') {
        await loadEmployeeData(range);
      }
      if (activeTab === 'overview' || activeTab === 'customers') {
        await loadCustomerData(range);
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSalesData = async (range: { start: string; end: string }) => {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        transaction_items (*,items (*))
      `)
      .gte('transaction_date', range.start)
      .lte('transaction_date', range.end)
      .eq('status', 'completed');

    if (selectedBranch !== 'all') {
      query = query.eq('branch_id', selectedBranch);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error loading sales data:', error);
      return;
    }

    // Get payment methods
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .gte('payment_date', range.start)
      .lte('payment_date', range.end);

    // Calculate metrics
    const grossSales = transactions?.reduce((sum, t) => sum + Number(t.subtotal), 0) || 0;
    const totalDiscount = transactions?.reduce((sum, t) => sum + Number(t.discount || 0), 0) || 0;
    const totalTax = transactions?.reduce((sum, t) => sum + Number(t.tax || 0), 0) || 0;
    const netSales = transactions?.reduce((sum, t) => sum + Number(t.total), 0) || 0;
    const totalTransactions = transactions?.length || 0;
    const avgTransactionValue = totalTransactions > 0 ? netSales / totalTransactions : 0;

    // Calculate total cost and profit
    let totalCost = 0;
    transactions?.forEach(t => {
      t.transaction_items?.forEach((item: any) => {
        const cost = Number(item.items?.cost || 0);
        const quantity = Number(item.quantity);
        totalCost += cost * quantity;
      });
    });
    const grossProfit = netSales - totalCost;
    const profitMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

    // Payment method breakdown
    const paymentMethodBreakdown: any = {};
    payments?.forEach(p => {
      const method = p.payment_method;
      if (!paymentMethodBreakdown[method]) {
        paymentMethodBreakdown[method] = { count: 0, amount: 0 };
      }
      paymentMethodBreakdown[method].count++;
      paymentMethodBreakdown[method].amount += Number(p.amount);
    });

    // Voids and returns
    const { data: voidedTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'voided')
      .gte('transaction_date', range.start)
      .lte('transaction_date', range.end);

    const { data: refundedTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'refunded')
      .gte('transaction_date', range.start)
      .lte('transaction_date', range.end);

    const voidedAmount = voidedTransactions?.reduce((sum, t) => sum + Number(t.total), 0) || 0;
    const refundedAmount = refundedTransactions?.reduce((sum, t) => sum + Number(t.total), 0) || 0;

    setSalesData({
      grossSales,
      netSales,
      totalDiscount,
      totalTax,
      totalTransactions,
      avgTransactionValue,
      totalCost,
      grossProfit,
      profitMargin,
      paymentMethodBreakdown,
      voidedCount: voidedTransactions?.length || 0,
      voidedAmount,
      refundedCount: refundedTransactions?.length || 0,
      refundedAmount,
      transactions
    });
  };

  const loadInventoryData = async (range: { start: string; end: string }) => {
    // Get all items with sales data
    const { data: items, error } = await supabase
      .from('items')
      .select('*');

    if (error) {
      console.error('Error loading inventory data:', error);
      return;
    }

    // Get transaction items for the period
    const { data: transactionItems } = await supabase
      .from('transaction_items')
      .select(`
        *,
        transaction:transactions!inner(transaction_date, status)
      `)
      .gte('transaction.transaction_date', range.start)
      .lte('transaction.transaction_date', range.end)
      .eq('transaction.status', 'completed');

    // Calculate sales per item
    const itemSales: any = {};
    transactionItems?.forEach((ti: any) => {
      const itemId = ti.item_id;
      if (!itemSales[itemId]) {
        itemSales[itemId] = {
          quantity: 0,
          revenue: 0,
          profit: 0
        };
      }
      itemSales[itemId].quantity += Number(ti.quantity);
      itemSales[itemId].revenue += Number(ti.total);
    });

    // Combine with item data
    const itemsWithSales = items?.map(item => {
      const sales = itemSales[item.id] || { quantity: 0, revenue: 0, profit: 0 };
      const cost = Number(item.cost || 0);
      const profit = sales.revenue - (sales.quantity * cost);

      return {
        ...item,
        quantitySold: sales.quantity,
        revenue: sales.revenue,
        profit,
        profitMargin: sales.revenue > 0 ? (profit / sales.revenue) * 100 : 0,
        currentStock: Number(item.current_stock_base || 0),
        stockValue: Number(item.current_stock_base || 0) * Number(item.cost || 0)
      };
    }) || [];

    // Sort for top/bottom sellers
    const sortedByQuantity = [...itemsWithSales].sort((a, b) => b.quantitySold - a.quantitySold);
    const sortedByRevenue = [...itemsWithSales].sort((a, b) => b.revenue - a.revenue);
    const sortedByProfit = [...itemsWithSales].sort((a, b) => b.profit - a.profit);

    // Low stock items (where current stock is below 10 units or items with zero stock)
    const lowStockItems = itemsWithSales.filter(item =>
      item.currentStock < 10 && item.show_in_pos
    );

    // Out of stock items
    const outOfStockItems = itemsWithSales.filter(item =>
      item.currentStock === 0 && item.show_in_pos
    );

    // Calculate total inventory value
    const totalInventoryValue = itemsWithSales.reduce((sum, item) => sum + item.stockValue, 0);
    const totalStockUnits = itemsWithSales.reduce((sum, item) => sum + item.currentStock, 0);

    setInventoryData({
      topSellingByQuantity: sortedByQuantity.slice(0, 20),
      topSellingByRevenue: sortedByRevenue.slice(0, 20),
      topSellingByProfit: sortedByProfit.slice(0, 20),
      bottomSelling: sortedByQuantity.slice(-20).reverse(),
      lowStockItems,
      outOfStockItems,
      totalInventoryValue,
      totalStockUnits,
      totalItems: items?.length || 0
    });
  };

  const loadEmployeeData = async (range: { start: string; end: string }) => {
    // Get transactions with cashier info
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('transaction_date', range.start)
      .lte('transaction_date', range.end)
      .eq('status', 'completed');

    if (error) {
      console.error('Error loading employee data:', error);
      return;
    }

    // Group by cashier
    const cashierStats: any = {};
    transactions?.forEach(t => {
      const cashierName = t.cashier_name || 'Unknown';
      if (!cashierStats[cashierName]) {
        cashierStats[cashierName] = {
          name: cashierName,
          transactionCount: 0,
          totalSales: 0,
          totalDiscount: 0,
          avgTransactionValue: 0
        };
      }
      cashierStats[cashierName].transactionCount++;
      cashierStats[cashierName].totalSales += Number(t.total);
      cashierStats[cashierName].totalDiscount += Number(t.discount || 0);
    });

    // Calculate averages
    Object.values(cashierStats).forEach((cashier: any) => {
      cashier.avgTransactionValue = cashier.totalSales / cashier.transactionCount;
    });

    // Sort by performance
    const sortedBySales = Object.values(cashierStats).sort((a: any, b: any) =>
      b.totalSales - a.totalSales
    );

    setEmployeeData({
      cashierStats: sortedBySales,
      totalStaff: Object.keys(cashierStats).length
    });
  };

  const loadCustomerData = async (range: { start: string; end: string }) => {
    // Get all clients with their transactions
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*');

    if (error) {
      console.error('Error loading customer data:', error);
      return;
    }

    // Get transactions for the period
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .gte('transaction_date', range.start)
      .lte('transaction_date', range.end)
      .eq('status', 'completed')
      .not('client_id', 'is', null);

    // Group transactions by client
    const clientStats: any = {};
    transactions?.forEach(t => {
      const clientId = t.client_id;
      if (!clientStats[clientId]) {
        clientStats[clientId] = {
          transactionCount: 0,
          totalSpent: 0,
          lastVisit: t.transaction_date
        };
      }
      clientStats[clientId].transactionCount++;
      clientStats[clientId].totalSpent += Number(t.total);
      if (new Date(t.transaction_date) > new Date(clientStats[clientId].lastVisit)) {
        clientStats[clientId].lastVisit = t.transaction_date;
      }
    });

    // Combine with client data
    const clientsWithStats = clients?.map(client => {
      const stats = clientStats[client.id] || { transactionCount: 0, totalSpent: 0, lastVisit: null };
      return {
        ...client,
        periodTransactions: stats.transactionCount,
        periodSpent: stats.totalSpent,
        lastVisit: stats.lastVisit,
        avgTransactionValue: stats.transactionCount > 0 ? stats.totalSpent / stats.transactionCount : 0
      };
    }) || [];

    // Sort by spending
    const topSpenders = clientsWithStats
      .filter(c => c.periodSpent > 0)
      .sort((a, b) => b.periodSpent - a.periodSpent)
      .slice(0, 50);

    // Get loyalty data
    const { data: loyaltyCards } = await supabase
      .from('loyalty_cards')
      .select('*')
      .eq('status', 'active');

    const activeLoyaltyMembers = loyaltyCards?.length || 0;
    const totalCustomers = clients?.length || 0;
    const loyaltyEngagementRate = totalCustomers > 0 ? (activeLoyaltyMembers / totalCustomers) * 100 : 0;

    // Calculate customer traffic
    const uniqueCustomers = new Set(transactions?.map(t => t.client_id).filter(Boolean)).size;
    const avgVisitFrequency = uniqueCustomers > 0
      ? (transactions?.length || 0) / uniqueCustomers
      : 0;

    setCustomerData({
      topSpenders,
      totalCustomers,
      activeCustomers: uniqueCustomers,
      activeLoyaltyMembers,
      loyaltyEngagementRate,
      avgVisitFrequency,
      totalTransactions: transactions?.length || 0,
      totalRevenue: transactions?.reduce((sum, t) => sum + Number(t.total), 0) || 0
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (current < previous) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive business intelligence and reporting dashboard
          </p>
        </div>
        <div className="flex items-center space-x-4 flex-wrap gap-2">
          {dateRange === 'custom' && (
            <>
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </>
          )}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'sales', label: 'Sales Reports', icon: DollarSign },
              { id: 'inventory', label: 'Inventory Reports', icon: Package },
              { id: 'employees', label: 'Employee Performance', icon: Users },
              { id: 'customers', label: 'Customer Analytics', icon: Award }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all flex items-center space-x-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading report data...</p>
            </div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <OverviewTab
                  salesData={salesData}
                  inventoryData={inventoryData}
                  employeeData={employeeData}
                  customerData={customerData}
                  formatCurrency={formatCurrency}
                  formatPercent={formatPercent}
                />
              )}

              {/* SALES TAB */}
              {activeTab === 'sales' && (
                <SalesTab
                  salesData={salesData}
                  formatCurrency={formatCurrency}
                  formatPercent={formatPercent}
                  exportToCSV={exportToCSV}
                />
              )}

              {/* INVENTORY TAB */}
              {activeTab === 'inventory' && (
                <InventoryTab
                  inventoryData={inventoryData}
                  formatCurrency={formatCurrency}
                  formatPercent={formatPercent}
                  exportToCSV={exportToCSV}
                />
              )}

              {/* EMPLOYEES TAB */}
              {activeTab === 'employees' && (
                <EmployeesTab
                  employeeData={employeeData}
                  formatCurrency={formatCurrency}
                  exportToCSV={exportToCSV}
                />
              )}

              {/* CUSTOMERS TAB */}
              {activeTab === 'customers' && (
                <CustomersTab
                  customerData={customerData}
                  formatCurrency={formatCurrency}
                  formatPercent={formatPercent}
                  formatDate={formatDate}
                  exportToCSV={exportToCSV}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ salesData, inventoryData, employeeData, customerData, formatCurrency, formatPercent }: any) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Net Sales</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(salesData?.netSales || 0)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-200" />
          </div>
          <div className="mt-4 text-sm text-blue-100">
            {salesData?.totalTransactions || 0} transactions
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Gross Profit</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(salesData?.grossProfit || 0)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
          <div className="mt-4 text-sm text-green-100">
            Margin: {formatPercent(salesData?.profitMargin || 0)}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Avg Transaction</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(salesData?.avgTransactionValue || 0)}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-purple-200" />
          </div>
          <div className="mt-4 text-sm text-purple-100">
            Per customer visit
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Inventory Value</p>
              <p className="text-2xl font-bold mt-2">{formatCurrency(inventoryData?.totalInventoryValue || 0)}</p>
            </div>
            <Package className="w-8 h-8 text-orange-200" />
          </div>
          <div className="mt-4 text-sm text-orange-100">
            {inventoryData?.totalStockUnits || 0} units in stock
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Low Stock Alert */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {inventoryData?.lowStockItems?.length || 0}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {inventoryData?.outOfStockItems?.length || 0} items out of stock
          </p>
        </div>

        {/* Top Employees */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Staff</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {employeeData?.totalStaff || 0}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Staff members processing sales
          </p>
        </div>

        {/* Customer Engagement */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {customerData?.activeCustomers || 0}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatPercent(customerData?.loyaltyEngagementRate || 0)} loyalty rate
          </p>
        </div>
      </div>
    </div>
  );
}

// Sales Tab Component
function SalesTab({ salesData, formatCurrency, formatPercent, exportToCSV }: any) {
  if (!salesData) {
    return <div className="text-center py-12 text-gray-600 dark:text-gray-400">No sales data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Sales Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gross Sales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(salesData.grossSales)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Before deductions</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Net Sales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(salesData.netSales)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">After deductions</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gross Profit</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(salesData.grossProfit)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Margin: {formatPercent(salesData.profitMargin)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cost of Goods</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(salesData.totalCost)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total product cost</p>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Payment Method Breakdown</h3>
          <button
            onClick={() => {
              const data = Object.entries(salesData.paymentMethodBreakdown).map(([method, stats]: any) => ({
                payment_method: method,
                transaction_count: stats.count,
                total_amount: stats.amount,
                percentage: ((stats.amount / salesData.netSales) * 100).toFixed(2)
              }));
              exportToCSV(data, 'payment-methods-report');
            }}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-1"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
        <div className="space-y-4">
          {Object.entries(salesData.paymentMethodBreakdown).map(([method, stats]: any) => {
            const percentage = (stats.amount / salesData.netSales) * 100;
            const icon = method === 'cash' ? Banknote : method === 'card' ? CreditCard : method === 'account' ? User : Gift;
            const Icon = icon;

            return (
              <div key={method} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{method}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatPercent(percentage)}</p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(stats.amount)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stats.count} txns</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Returns, Refunds & Voids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Voided Transactions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{salesData.voidedCount}</p>
            </div>
          </div>
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
            {formatCurrency(salesData.voidedAmount)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Refunded Transactions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{salesData.refundedCount}</p>
            </div>
          </div>
          <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
            {formatCurrency(salesData.refundedAmount)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Discounts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(salesData.totalDiscount)}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatPercent((salesData.totalDiscount / salesData.grossSales) * 100)} of gross
          </p>
        </div>
      </div>
    </div>
  );
}

// Inventory Tab Component
function InventoryTab({ inventoryData, formatCurrency, formatPercent, exportToCSV }: any) {
  const [viewMode, setViewMode] = useState<'quantity' | 'revenue' | 'profit'>('revenue');

  if (!inventoryData) {
    return <div className="text-center py-12 text-gray-600 dark:text-gray-400">No inventory data available</div>;
  }

  const getTopSelling = () => {
    switch (viewMode) {
      case 'quantity':
        return inventoryData.topSellingByQuantity;
      case 'revenue':
        return inventoryData.topSellingByRevenue;
      case 'profit':
        return inventoryData.topSellingByProfit;
      default:
        return inventoryData.topSellingByRevenue;
    }
  };

  return (
    <div className="space-y-6">
      {/* Inventory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(inventoryData.totalInventoryValue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total stock value</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {inventoryData.totalItems}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Products in catalog</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-orange-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {inventoryData.lowStockItems.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Need reorder</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {inventoryData.outOfStockItems.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Urgent action needed</p>
        </div>
      </div>

      {/* Top Selling Items */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Selling Items</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Best performing products</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="revenue">By Revenue</option>
              <option value="quantity">By Quantity</option>
              <option value="profit">By Profit</option>
            </select>
            <button
              onClick={() => exportToCSV(getTopSelling(), `top-selling-items-${viewMode}`)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Item</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">SKU</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Qty Sold</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Revenue</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Profit</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Margin</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Stock</th>
              </tr>
            </thead>
            <tbody>
              {getTopSelling().slice(0, 20).map((item: any) => (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{item.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{item.sku}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-gray-100">{item.quantitySold}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-gray-100">{formatCurrency(item.revenue)}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-gray-100">{formatCurrency(item.profit)}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-gray-100">{formatPercent(item.profitMargin)}</td>
                  <td className={`py-3 px-4 text-sm text-right font-medium ${
                    item.currentStock === 0 ? 'text-red-600 dark:text-red-400' :
                    item.currentStock < 10 ? 'text-orange-600 dark:text-orange-400' :
                    'text-green-600 dark:text-green-400'
                  }`}>
                    {item.currentStock}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Selling Items */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Slow Moving Items</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Products with low sales</p>
          </div>
          <button
            onClick={() => exportToCSV(inventoryData.bottomSelling, 'slow-moving-items')}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-1"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Item</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">SKU</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Qty Sold</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Revenue</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Stock</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Stock Value</th>
              </tr>
            </thead>
            <tbody>
              {inventoryData.bottomSelling.slice(0, 10).map((item: any) => (
                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{item.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{item.sku}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-gray-100">{item.quantitySold}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-gray-100">{formatCurrency(item.revenue)}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-gray-100">{item.currentStock}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-gray-100">{formatCurrency(item.stockValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {inventoryData.lowStockItems.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-300">Low Stock Alerts</h3>
              <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">Items requiring immediate attention</p>
            </div>
            <button
              onClick={() => exportToCSV(inventoryData.lowStockItems, 'low-stock-items')}
              className="text-sm text-orange-700 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-orange-200 dark:border-orange-800">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-orange-900 dark:text-orange-300">Item</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-orange-900 dark:text-orange-300">SKU</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-orange-900 dark:text-orange-300">Current Stock</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-orange-900 dark:text-orange-300">Qty Sold</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-orange-900 dark:text-orange-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.lowStockItems.map((item: any) => (
                  <tr key={item.id} className="border-b border-orange-100 dark:border-orange-800/50">
                    <td className="py-3 px-4 text-sm text-orange-900 dark:text-orange-300">{item.name}</td>
                    <td className="py-3 px-4 text-sm text-orange-700 dark:text-orange-400">{item.sku}</td>
                    <td className="py-3 px-4 text-sm text-right font-bold text-orange-900 dark:text-orange-300">{item.currentStock}</td>
                    <td className="py-3 px-4 text-sm text-right text-orange-700 dark:text-orange-400">{item.quantitySold}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.currentStock === 0
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                      }`}>
                        {item.currentStock === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Employees Tab Component
function EmployeesTab({ employeeData, formatCurrency, exportToCSV }: any) {
  if (!employeeData || !employeeData.cashierStats || employeeData.cashierStats.length === 0) {
    return <div className="text-center py-12 text-gray-600 dark:text-gray-400">No employee performance data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Employee Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Staff</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{employeeData.totalStaff}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Staff members processing sales</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Top Performer</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{employeeData.cashierStats[0]?.name}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatCurrency(employeeData.cashierStats[0]?.totalSales || 0)} in sales
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg per Staff</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(
                  employeeData.cashierStats.reduce((sum: number, s: any) => sum + s.totalSales, 0) / employeeData.totalStaff
                )}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Average sales per employee</p>
        </div>
      </div>

      {/* Sales by Employee Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sales by Employee</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Individual performance metrics</p>
          </div>
          <button
            onClick={() => exportToCSV(employeeData.cashierStats, 'employee-performance')}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-1"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Employee</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Transactions</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Total Sales</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Avg Transaction</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Discounts Given</th>
              </tr>
            </thead>
            <tbody>
              {employeeData.cashierStats.map((cashier: any, index: number) => (
                <tr key={cashier.name} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4 text-sm">
                    {index === 0 && <Star className="w-5 h-5 text-yellow-500 inline" />}
                    {index > 0 && <span className="text-gray-600 dark:text-gray-400">#{index + 1}</span>}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">{cashier.name}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-gray-100">{cashier.transactionCount}</td>
                  <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(cashier.totalSales)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(cashier.avgTransactionValue)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(cashier.totalDiscount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Sales Distribution</h3>
        <div className="space-y-4">
          {employeeData.cashierStats.map((cashier: any) => {
            const totalAllSales = employeeData.cashierStats.reduce((sum: number, c: any) => sum + c.totalSales, 0);
            const percentage = (cashier.totalSales / totalAllSales) * 100;

            return (
              <div key={cashier.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{cashier.name}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Customers Tab Component
function CustomersTab({ customerData, formatCurrency, formatPercent, formatDate, exportToCSV }: any) {
  if (!customerData) {
    return <div className="text-center py-12 text-gray-600 dark:text-gray-400">No customer data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Customer Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{customerData.totalCustomers}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">In database</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{customerData.activeCustomers}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Made purchases in period</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Loyalty Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{customerData.activeLoyaltyMembers}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatPercent(customerData.loyaltyEngagementRate)} engagement
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Visit Frequency</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{customerData.avgVisitFrequency.toFixed(1)}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Visits per customer</p>
        </div>
      </div>

      {/* Top Spending Customers */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Spending Customers</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">VIP customers and high-value clients</p>
          </div>
          <button
            onClick={() => exportToCSV(customerData.topSpenders, 'top-spending-customers')}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center space-x-1"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Contact</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Period Visits</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Period Spent</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Lifetime Spent</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Avg Transaction</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Tier</th>
              </tr>
            </thead>
            <tbody>
              {customerData.topSpenders.slice(0, 50).map((customer: any, index: number) => (
                <tr key={customer.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4 text-sm">
                    {index < 3 ? (
                      <Star className="w-5 h-5 text-yellow-500 inline" />
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400">#{index + 1}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {customer.first_name} {customer.last_name}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {customer.email || customer.phone || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-gray-100">{customer.periodTransactions}</td>
                  <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(customer.periodSpent)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(customer.total_spent)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(customer.avgTransactionValue)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      customer.tier === 'platinum' ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900' :
                      customer.tier === 'gold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      customer.tier === 'silver' ? 'bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                    }`}>
                      {customer.tier}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Customer Traffic</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{customerData.totalTransactions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(customerData.totalRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg per Customer</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(customerData.activeCustomers > 0 ? customerData.totalRevenue / customerData.activeCustomers : 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Loyalty Program Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Enrolled Members</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{customerData.activeLoyaltyMembers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Engagement Rate</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatPercent(customerData.loyaltyEngagementRate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Repeat Visit Rate</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatPercent(customerData.activeCustomers > 0 ? (customerData.activeLoyaltyMembers / customerData.activeCustomers) * 100 : 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper import for RotateCcw icon
import { RotateCcw } from 'lucide-react';
