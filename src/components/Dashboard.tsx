import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  Sun,
  Moon,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  setActiveItem: (item: string) => void;
}

interface DashboardStats {
  todaySales: number;
  transactionCount: number;
  productCount: number;
  activeUsers: number;
  dayOpened: boolean;
}

export default function Dashboard({ setActiveItem }: DashboardProps) {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    transactionCount: 0,
    productCount: 0,
    activeUsers: 0,
    dayOpened: false
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      // Fetch today's transactions (fallback to empty if table doesn't exist)
      let transactions = [];
      try {
        const { data, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .gte('transaction_date', todayStr)
          .eq('status', 'completed');

        if (!txError) {
          transactions = data || [];
        }
      } catch (error) {
        console.log('Transactions table not available yet');
      }

      // Fetch items count
      const { count: itemCount, error: itemError } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true });

      if (itemError) {
        console.error('Error loading items count:', itemError);
      }

      // Fallback to localStorage if supabase returned nothing
      if (transactions.length === 0) {
        try {
          const localTxRaw = localStorage.getItem('pos_transactions');
          if (localTxRaw) {
            const localTx = JSON.parse(localTxRaw);
            if (Array.isArray(localTx)) {
              const todayDateStr1 = today.toISOString().split('T')[0];
              transactions = localTx.filter((tx: any) => {
                const txDate = (tx.transaction_date || tx.date || '').split('T')[0];
                return txDate === todayDateStr1 && (tx.status === 'completed' || !tx.status);
              });
            }
          }
        } catch (error) {
          console.log('Error reading local transactions');
        }
      }

      // Calculate stats
      const todaySales = transactions?.reduce((sum: number, tx: any) => sum + parseFloat(tx.total || 0), 0) || 0;
      const transactionCount = transactions?.length || 0;

      // Calculate active users from local transactions (unique cashier_names today)
      let activeUsersCount = 0;
      try {
        const localTxRaw = localStorage.getItem('pos_transactions');
        if (localTxRaw) {
          const localTx = JSON.parse(localTxRaw);
          if (Array.isArray(localTx)) {
            const todayDateStr2 = today.toISOString().split('T')[0];
            const cashiers = new Set<string>();
            localTx.forEach((tx: any) => {
              const txDate = (tx.transaction_date || tx.date || '').split('T')[0];
              if (txDate === todayDateStr2 && tx.cashier_name) {
                cashiers.add(tx.cashier_name);
              }
            });
            activeUsersCount = cashiers.size;
          }
        }
      } catch (error) {
        console.log('Error reading local transactions for active users');
      }

      // Check day opening status from localStorage
      let dayOpened = false;
      try {
        const dayOpeningsRaw = localStorage.getItem('dayOpenings');
        if (dayOpeningsRaw) {
          const dayOpenings = JSON.parse(dayOpeningsRaw);
          const now = new Date();
          const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          if (Array.isArray(dayOpenings)) {
            dayOpened = dayOpenings.some((d: any) => {
              const openDate = (d.date || d.opening_date || '').split('T')[0];
              return openDate === todayLocal && d.status === 'Active';
            });
          }
        }
      } catch (error) {
        console.log('Error reading day openings from localStorage');
      }

      setStats({
        todaySales,
        transactionCount,
        productCount: itemCount || 0,
        activeUsers: activeUsersCount,
        dayOpened
      });

      // Get recent transactions for activity
      const { data: recentTx, error: recentError } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .limit(5);

      if (!recentError && recentTx && recentTx.length > 0) {
        setRecentActivity(recentTx);
      } else {
        // Fallback to localStorage
        try {
          const localTxRaw = localStorage.getItem('pos_transactions');
          if (localTxRaw) {
            const localTx = JSON.parse(localTxRaw);
            if (Array.isArray(localTx)) {
              const sorted = [...localTx].sort((a: any, b: any) => {
                const dateA = new Date(a.transaction_date || a.date || 0).getTime();
                const dateB = new Date(b.transaction_date || b.date || 0).getTime();
                return dateB - dateA;
              });
              setRecentActivity(sorted.slice(0, 5));
            }
          }
        } catch (error) {
          console.log('Error reading local transactions for recent activity');
        }
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className={`p-6 space-y-6 min-h-screen transition-colors ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50 dark:bg-gray-900'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
            {getGreeting()}, {user?.firstName}!
          </h1>
          <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600 dark:text-gray-400'}`}>
            Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => loadDashboardData()}
            disabled={loading}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isDarkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <div className={`flex items-center space-x-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <Clock className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Day Opening Status */}
      {!loading && (
        <div className={`flex items-center space-x-3 p-4 rounded-xl border ${
          stats.dayOpened
            ? isDarkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'
            : isDarkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'
        }`}>
          <Sun className={`w-5 h-5 ${stats.dayOpened
            ? isDarkMode ? 'text-green-400' : 'text-green-600'
            : isDarkMode ? 'text-red-400' : 'text-red-600'
          }`} />
          <span className={`text-sm font-medium ${stats.dayOpened
            ? isDarkMode ? 'text-green-300' : 'text-green-800'
            : isDarkMode ? 'text-red-300' : 'text-red-800'
          }`}>
            {stats.dayOpened ? 'Day is opened' : 'Day has not been opened yet'}
          </span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Today\'s Sales',
            value: loading ? '...' : `$${stats.todaySales.toFixed(2)}`,
            icon: DollarSign
          },
          {
            title: 'Transactions',
            value: loading ? '...' : stats.transactionCount.toString(),
            icon: ShoppingBag
          },
          {
            title: 'Products',
            value: loading ? '...' : stats.productCount.toString(),
            icon: Package
          },
          {
            title: 'Active Users',
            value: loading ? '...' : stats.activeUsers.toString(),
            icon: Users
          }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`p-6 rounded-xl border hover:shadow-lg transition-all ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                : 'bg-white border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>{stat.title}</p>
                  <p className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isDarkMode ? 'bg-blue-900' : 'bg-blue-50'
                }`}>
                  <Icon className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <TrendingUp className={`w-4 h-4 mr-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Live data
                </span>
                <span className={`text-sm ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>from yesterday</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className={`lg:col-span-2 rounded-xl border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200 dark:border-gray-700'
        }`}>
          <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}>
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>Recent Activity</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className={`flex items-center space-x-4 p-3 rounded-lg transition-all ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50 dark:bg-gray-900'
                  }`}>
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                        Transaction {activity.invoice_number}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(activity.transaction_date).toLocaleString()}
                        </span>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          by {activity.cashier_name}
                        </span>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                      ${parseFloat(activity.total).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className={`rounded-xl border p-6 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200 dark:border-gray-700'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>Alerts</h3>
            <div className="space-y-3">
              <div className={`flex items-center space-x-3 p-3 border rounded-lg ${
                isDarkMode 
                  ? 'bg-yellow-900 border-yellow-700' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>Low Stock</p>
                  <p className={`text-xs ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>5 products need restocking</p>
                </div>
              </div>
              <div className={`flex items-center space-x-3 p-3 border rounded-lg ${
                isDarkMode 
                  ? 'bg-blue-900 border-blue-700' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <Package className="w-5 h-5 text-blue-600" />
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>Pending Orders</p>
                  <p className={`text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>3 purchase orders awaiting approval</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}