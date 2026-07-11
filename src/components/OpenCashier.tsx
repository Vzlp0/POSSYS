import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Users,
  CreditCard,
  Gift,
  RefreshCw,
  TrendingUp,
  Eye,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DayOpening } from '../types';

// Users from localStorage
export const mockCashiers: any[] = JSON.parse(localStorage.getItem('pos_users') || '[]');

interface CashierShift {
  id: string;
  employeeId: string;
  employeeName: string;
  startTime: string;
  openingFloat: number;
  openedBy: string;
  status: 'active' | 'closed';
  payments: {
    cash: number;
    credit: number;
    voucher: number;
  };
  transactionCount: number;
}

interface OpenCashierProps {
  onBack: () => void;
}

export default function OpenCashier({ onBack }: OpenCashierProps) {
  const { user, isLoading } = useAuth();
  const [dayOpenings, setDayOpenings] = useState<DayOpening[]>(() => {
    const stored = localStorage.getItem('dayOpenings');
    return stored ? JSON.parse(stored) : [];
  });
  const [formData, setFormData] = useState({
    employeeId: '',
    openingFloat: '0.00'
  });
  const [activeCashiers, setActiveCashiers] = useState<CashierShift[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOpenedShift, setLastOpenedShift] = useState<CashierShift | null>(null);
  const [selectedCashier, setSelectedCashier] = useState<string | null>(null);

  // Filter cashiers who can operate POS (exclude staff role for cashier operations)
  const availableCashiers = mockCashiers.filter(cashier => 
    ['admin', 'manager', 'cashier'].includes(cashier.role)
  );

  // Check if day is open
  const today = new Date().toISOString().split('T')[0];
  const todayOpening = dayOpenings.find(opening => 
    opening.date === today && opening.status === 'Active'
  );
  const isDayOpen = !!todayOpening;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleOpenCashier = () => {
    // Check if day is open first
    if (!isDayOpen) {
      alert('You must open the day and record float + petty cash first.');
      return;
    }

    if (!formData.employeeId || formData.openingFloat === '') {
      alert('Please fill in all required fields');
      return;
    }

    const openingFloat = parseFloat(formData.openingFloat);
    if (openingFloat < 0 || isNaN(openingFloat)) {
      alert('Opening float must be a valid positive number or zero');
      return;
    }

    const selectedEmployee = availableCashiers.find(c => c.id === formData.employeeId);
    if (!selectedEmployee) {
      alert('Please select a valid employee');
      return;
    }

    const newShift: CashierShift = {
      id: Date.now().toString(),
      employeeId: formData.employeeId,
      employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
      startTime: new Date().toISOString(),
      openingFloat: openingFloat,
      openedBy: user?.firstName + ' ' + user?.lastName || 'Unknown',
      status: 'active',
      payments: {
        cash: 0,
        credit: 0,
        voucher: 0
      },
      transactionCount: 0
    };

    setActiveCashiers(prev => [...prev, newShift]);
    setLastOpenedShift(newShift);
    setShowSuccess(true);
    
    // Reset form
    setFormData({
      employeeId: '',
      openingFloat: '0.00'
    });

    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Day Status Warning */}
      {!isDayOpen && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Day Not Open</h3>
              <p className="text-red-700">
                You must open the day and record float + petty cash before any cashier can start their shift.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Day Status Info */}
      {isDayOpen && todayOpening && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">Day is Open</h3>
              <p className="text-green-700">
                Business day opened by {todayOpening.openedBy} with float: {formatCurrency(todayOpening.floatCashOnHand)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Finance</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Open Cashier</h1>
            <p className="text-gray-600 mt-1">Start a new cashier shift with opening float</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && lastOpenedShift && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">Cashier Opened Successfully!</h3>
              <p className="text-green-700">
                {lastOpenedShift.employeeName} started shift at {formatTime(lastOpenedShift.startTime)} 
                with opening float of {formatCurrency(lastOpenedShift.openingFloat)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Open Cashier Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Start New Shift</h2>
              <p className="text-gray-600 dark:text-gray-400">Open a cashier with starting float amount</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Employee</option>
                  {availableCashiers.map(cashier => (
                    <option key={cashier.id} value={cashier.id}>
                      {cashier.firstName} {cashier.lastName} ({cashier.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={new Date().toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                  readOnly
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">Auto-generated timestamp</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opening Float Amount *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.openingFloat}
                  onChange={(e) => setFormData(prev => ({ ...prev, openingFloat: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">Starting cash amount in register (can be zero)</p>
            </div>

            <button
              onClick={handleOpenCashier}
              disabled={!isDayOpen || isLoading || !formData.employeeId || formData.openingFloat === ''}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              <span>
                {isLoading ? 'Opening Cashier...' : !isDayOpen ? 'Day Must Be Opened First' : 'Open Cashier'}
              </span>
            </button>
          </div>
        </div>

        {/* Active Cashiers Display */}
        <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Active Cashiers</h2>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {activeCashiers.filter(shift => shift.status === 'active').length} active
              </span>
            </div>
          </div>
          
          <div className="p-6">
            {activeCashiers.filter(shift => shift.status === 'active').length > 0 ? (
              <div className="space-y-4">
                {activeCashiers
                  .filter(shift => shift.status === 'active')
                  .map((shift) => (
                    <div key={shift.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{shift.employeeName}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                              <span>Started: {formatTime(shift.startTime)}</span>
                              <span>Float: {formatCurrency(shift.openingFloat)}</span>
                              <span>By: {shift.openedBy}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No active cashiers</p>
                <p className="text-sm text-gray-400">Open a cashier to start taking payments</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Instructions</h3>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li>• Select the employee who will be operating the cash register</li>
              <li>• Enter the starting cash amount (opening float) - can be zero</li>
              <li>• Zero float is allowed for cashless operations</li>
              <li>• Multiple cashiers can be opened simultaneously</li>
              <li>• To close cashiers, use Finance → Close Sales for reconciliation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}