import React, { useState } from 'react';
import { 
  DollarSign, 
  Calculator, 
  CreditCard, 
  FileText, 
  TrendingUp, 
  Users, 
  Clock, 
  Save,
  User,
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import OpenCashier from './OpenCashier';
import CashManagement from './CashManagement';
import CloseSales from './CloseSales';
import OpenDay from './OpenDay';
import CloseDay from './CloseDay';

const financeMenuItems = [
  {
    id: 'open-day',
    label: 'Open Day',
    icon: Clock,
    description: 'Start business day with opening float and petty cash'
  },
  {
    id: 'close-day',
    label: 'Close Day',
    icon: Save,
    description: 'End business day and generate daily report'
  },
  {
    id: 'open-cashier',
    label: 'Open Cashier',
    icon: Users,
    description: 'Start a new cashier shift with opening float'
  },
  {
    id: 'close-cashier',
    label: 'Close Sales',
    icon: Calculator,
    description: 'Close cashier shifts and reconcile payments'
  },
  {
    id: 'cash-management',
    label: 'Cash Management',
    icon: DollarSign,
    description: 'Manage cash deposits and withdrawals'
  },
  {
    id: 'payment-reports',
    label: 'Payment Reports',
    icon: CreditCard,
    description: 'Analyze payment methods and trends'
  },
  {
    id: 'financial-reports',
    label: 'Financial Reports',
    icon: FileText,
    description: 'Revenue, profit, and financial analysis'
  },
  {
    id: 'reconciliation',
    label: 'Daily Reconciliation',
    icon: TrendingUp,
    description: 'Daily sales and cash reconciliation'
  }
];

export default function Finance() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  if (activeSection === 'open-day') {
    return <OpenDay onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === 'close-day') {
    return <CloseDay onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === 'open-cashier') {
    return <OpenCashier onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === 'cash-management') {
    return <CashManagement onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === 'close-cashier') {
    return <CloseSales onBack={() => setActiveSection(null)} />;
  }
  if (activeSection) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => setActiveSection(null)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Finance
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {financeMenuItems.find(item => item.id === activeSection)?.label}
          </h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-gray-600 dark:text-gray-400">This feature is under development.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Finance Management</h1>
          <p className="text-gray-600 mt-1">
            Manage cashier operations, payments, and financial reporting
          </p>
        </div>
      </div>

      {/* Finance Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {financeMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-all">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {item.label}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">$0</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Cashiers</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">0</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transactions</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">0</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Transaction</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">$0</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}