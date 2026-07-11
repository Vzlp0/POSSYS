import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Clock,
  Building,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DayOpening } from '../types';

interface OpenDayProps {
  onBack: () => void;
}

export default function OpenDay({ onBack }: OpenDayProps) {
  const { user } = useAuth();
  const [dayOpenings, setDayOpenings] = useState<DayOpening[]>(() => {
    const s = localStorage.getItem('dayOpenings');
    return s ? JSON.parse(s) : [];
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    floatCashOnHand: '',
    pettyCashOnHand: ''
  });

  // Persist dayOpenings to localStorage
  useEffect(() => {
    localStorage.setItem('dayOpenings', JSON.stringify(dayOpenings));
  }, [dayOpenings]);

  const todayOpening = dayOpenings.find(opening => opening.date === formData.date);
  const isDayAlreadyOpen = todayOpening && todayOpening.status === 'Active';

  const handleOpenDay = () => {
    if (!formData.floatCashOnHand || !formData.pettyCashOnHand) {
      alert('Please fill in all required fields');
      return;
    }

    const floatAmount = parseFloat(formData.floatCashOnHand);
    const pettyAmount = parseFloat(formData.pettyCashOnHand);

    if (floatAmount < 0 || pettyAmount < 0) {
      alert('Amounts must be positive numbers');
      return;
    }

    if (isDayAlreadyOpen) {
      alert('Day is already open for this date');
      return;
    }

    const openedBy = user?.firstName + ' ' + user?.lastName || 'Unknown User';
    const openedAt = new Date().toISOString();

    // Close any previous active day
    const updatedOpenings = dayOpenings.map(opening =>
      opening.status === 'Active' ? { ...opening, status: 'Closed' as const } : opening
    );

    const newDayOpening: DayOpening = {
      id: Date.now().toString(),
      date: formData.date,
      floatCashOnHand: floatAmount,
      pettyCashOnHand: pettyAmount,
      openedBy,
      openedAt,
      status: 'Active',
    };

    setDayOpenings([newDayOpening, ...updatedOpenings]);

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      floatCashOnHand: '',
      pettyCashOnHand: ''
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
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
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Open Day</h1>
            <p className="text-gray-600 mt-1">Start business day with opening float and petty cash</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">Day Opened Successfully!</h3>
              <p className="text-green-700">
                Business day for {formatDate(formData.date)} has been opened. Cashiers can now start their shifts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Day Status */}
      {isDayAlreadyOpen && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Day Already Open</h3>
              <p className="text-blue-700">
                Business day for {formatDate(todayOpening.date)} is already active.
                Opened by {todayOpening.openedBy} at {formatTime(todayOpening.openedAt)}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm text-blue-600">Float Cash</p>
                  <p className="font-semibold text-blue-900">{formatCurrency(todayOpening.floatCashOnHand)}</p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-sm text-blue-600">Petty Cash</p>
                  <p className="font-semibold text-blue-900">{formatCurrency(todayOpening.pettyCashOnHand)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Open Day Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Open Business Day</h2>
              <p className="text-gray-600 dark:text-gray-400">Record opening float and petty cash amounts</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Float Cash on Hand *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.floatCashOnHand}
                  onChange={(e) => setFormData(prev => ({ ...prev, floatCashOnHand: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">Starting cash amount for cashier operations</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Petty Cash on Hand *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.pettyCashOnHand}
                  onChange={(e) => setFormData(prev => ({ ...prev, pettyCashOnHand: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">Starting petty cash for daily expenses</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opened By
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={user?.firstName + ' ' + user?.lastName || ''}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900"
                  readOnly
                />
              </div>
            </div>

            <button
              onClick={handleOpenDay}
              disabled={isDayAlreadyOpen || !formData.floatCashOnHand || !formData.pettyCashOnHand}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>{isDayAlreadyOpen ? 'Day Already Open' : 'Open Business Day'}</span>
            </button>
          </div>
        </div>

        {/* Day Status Display */}
        <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Day Openings</h2>
          </div>

          <div className="p-6">
            {dayOpenings.length > 0 ? (
              <div className="space-y-4">
                {dayOpenings.slice(0, 5).map((opening) => (
                  <div key={opening.id} className={`p-4 rounded-lg border ${
                    opening.status === 'Active'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          opening.status === 'Active'
                            ? 'bg-green-100'
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          <Clock className={`w-4 h-4 ${
                            opening.status === 'Active'
                              ? 'text-green-600'
                              : 'text-gray-600 dark:text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(opening.date)}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Opened by {opening.openedBy} at {formatTime(opening.openedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          opening.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800 dark:text-gray-200'
                        }`}>
                          {opening.status}
                        </span>
                        <div className="text-sm text-gray-600 mt-1">
                          Float: {formatCurrency(opening.floatCashOnHand)} •
                          Petty: {formatCurrency(opening.pettyCashOnHand)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No day openings recorded</p>
                <p className="text-sm text-gray-400">Open your first business day to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Instructions</h3>
            <ul className="text-yellow-700 space-y-1 text-sm">
              <li>• The business day must be opened before any cashier can start their shift</li>
              <li>• Float Cash on Hand is the total cash available for cashier operations</li>
              <li>• Petty Cash on Hand is for daily expenses and small purchases</li>
              <li>• Only one day can be active at a time</li>
              <li>• All amounts must be counted and verified before opening</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}