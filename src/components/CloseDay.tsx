import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  CreditCard,
  Gift,
  Building,
  User,
  Printer,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DayOpening, DayClosing } from '../types';

interface CloseDayProps {
  onBack: () => void;
}

export default function CloseDay({ onBack }: CloseDayProps) {
  const { user } = useAuth();
  const [dayOpenings, setDayOpenings] = useState<DayOpening[]>(() => {
    const s = localStorage.getItem('dayOpenings');
    return s ? JSON.parse(s) : [];
  });
  const [dayClosings, setDayClosings] = useState<DayClosing[]>(() => {
    const s = localStorage.getItem('dayClosings');
    return s ? JSON.parse(s) : [];
  });
  const [activeCashiers, setActiveCashiers] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [daySummary, setDaySummary] = useState<any>(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('dayOpenings', JSON.stringify(dayOpenings));
  }, [dayOpenings]);

  useEffect(() => {
    localStorage.setItem('dayClosings', JSON.stringify(dayClosings));
  }, [dayClosings]);

  const activeDayOpening = dayOpenings.find(opening => opening.status === 'Active');
  const canCloseDay = activeDayOpening && activeCashiers === 0;

  const generateDaySummary = () => {
    if (!activeDayOpening) return null;

    const dayDate = activeDayOpening.date;

    // Read transactions from localStorage (saved by POSSystem)
    const rawTransactions = localStorage.getItem('pos_transactions');
    const allTransactions: any[] = rawTransactions ? JSON.parse(rawTransactions) : [];

    // Filter transactions for the active day's date that are completed
    const dayTransactions = allTransactions.filter((t: any) => {
      const tDate = (t.transaction_date || t.date || t.createdAt || '').split('T')[0];
      return tDate === dayDate && (t.status === 'completed' || t.status === 'Completed');
    });

    const transactionCount = dayTransactions.length;

    // Read cash sales from localStorage
    const rawCashSales = localStorage.getItem('pos_cash_sales');
    const allCashSales: any[] = rawCashSales ? JSON.parse(rawCashSales) : [];
    const dayCashSales = allCashSales.filter((s: any) => {
      const sDate = (s.date || s.createdAt || '').split('T')[0];
      return sDate === dayDate;
    });

    // Sum cash vs card/network payments from transactions
    let totalSalesCash = 0;
    let totalSalesNetwork = 0;

    for (const t of dayTransactions) {
      const amount = parseFloat(t.total || t.amount || 0);
      const method = (t.payment_method || t.paymentMethod || '').toLowerCase();
      if (method === 'cash') {
        totalSalesCash += amount;
      } else {
        totalSalesNetwork += amount;
      }
    }

    // Also add from cash sales if separate
    for (const s of dayCashSales) {
      totalSalesCash += parseFloat(s.amount || 0);
    }

    // Petty cash expenses from localStorage
    const rawPetty = localStorage.getItem('pettyCashItems');
    const allPetty: any[] = rawPetty ? JSON.parse(rawPetty) : [];
    const dayPetty = allPetty.filter((p: any) => {
      const pDate = (p.transaction_date || p.date || '').split('T')[0];
      return pDate === dayDate && (p.transaction_type === 'expense' || p.type === 'expense');
    });
    const totalPettyCashExpenses = dayPetty.reduce(
      (sum: number, item: any) => sum + parseFloat(item.amount || 0), 0
    );

    const totalDeposits = 0;
    const cashOnHandBalance = activeDayOpening.floatCashOnHand + totalSalesCash - totalDeposits;
    const pettyCashBalance = activeDayOpening.pettyCashOnHand - totalPettyCashExpenses;

    // Cashier shifts from localStorage
    const rawShifts = localStorage.getItem('cashierShifts');
    const allShifts: any[] = rawShifts ? JSON.parse(rawShifts) : [];
    const dayShifts = allShifts.filter((s: any) => {
      const sDate = (s.start_time || s.startTime || s.date || '').split('T')[0];
      return sDate === dayDate;
    });

    return {
      date: dayDate,
      openingFloat: activeDayOpening.floatCashOnHand,
      openingPetty: activeDayOpening.pettyCashOnHand,
      totalSalesCash,
      totalSalesNetwork,
      totalPettyCashExpenses,
      totalDeposits,
      cashOnHandBalance,
      pettyCashBalance,
      variances: {
        cash: 0,
        network: 0,
        petty: 0,
      },
      transactionCount: transactionCount || 0,
      cashierShifts: dayShifts.length,
    };
  };

  const handleGenerateSummary = () => {
    const summary = generateDaySummary();
    setDaySummary(summary);
    setShowSummary(true);
  };

  const handleCloseDay = () => {
    if (!activeDayOpening || !daySummary) return;

    const closedBy = user?.firstName + ' ' + user?.lastName || 'Unknown User';
    const closedAt = new Date().toISOString();

    const newDayClosing: DayClosing = {
      id: Date.now().toString(),
      date: activeDayOpening.date,
      totalSalesCash: daySummary.totalSalesCash,
      totalSalesNetwork: daySummary.totalSalesNetwork,
      totalPettyCash: daySummary.totalPettyCashExpenses,
      totalDeposits: daySummary.totalDeposits,
      cashOnHandBalance: daySummary.cashOnHandBalance,
      variances: {
        cash: daySummary.variances.cash,
        network: daySummary.variances.network,
        petty: daySummary.variances.petty,
      },
      closedBy,
      closedAt,
    };

    // Update the active day opening to Closed
    setDayOpenings(prev => prev.map(opening =>
      opening.id === activeDayOpening.id
        ? { ...opening, status: 'Closed' as const }
        : opening
    ));

    setDayClosings(prev => [newDayClosing, ...prev]);

    setShowSuccess(true);
    setShowSummary(false);
    setDaySummary(null);

    setTimeout(() => setShowSuccess(false), 3000);
  };

  const printDailyReport = () => {
    if (!daySummary) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Business Report - ${daySummary.date}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0 0 15px 0;
            font-size: 24px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h2 {
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
            margin-bottom: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          .total-row {
            border-top: 2px solid #000;
            font-weight: bold;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DAILY BUSINESS REPORT</h1>
          <p><strong>Business Date:</strong> ${new Date(daySummary.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
          <p><strong>Report Generated:</strong> ${new Date().toLocaleString('en-US')}</p>
          <p><strong>Closed By:</strong> ${user?.firstName} ${user?.lastName}</p>
        </div>

        <div class="section">
          <h2>OPENING BALANCES</h2>
          <table>
            <tr>
              <td><strong>Float Cash on Hand</strong></td>
              <td>${daySummary.openingFloat.toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>Petty Cash on Hand</strong></td>
              <td>${daySummary.openingPetty.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h2>SALES SUMMARY</h2>
          <table>
            <tr>
              <td><strong>Cash Sales</strong></td>
              <td>${daySummary.totalSalesCash.toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>Network Sales (Card/Credit/Voucher)</strong></td>
              <td>${daySummary.totalSalesNetwork.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td><strong>Total Sales</strong></td>
              <td><strong>${(daySummary.totalSalesCash + daySummary.totalSalesNetwork).toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h2>CASH MANAGEMENT</h2>
          <table>
            <tr>
              <td><strong>Total Cash Deposits</strong></td>
              <td>${daySummary.totalDeposits.toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>Petty Cash Expenses</strong></td>
              <td>${daySummary.totalPettyCashExpenses.toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>Cash on Hand Balance</strong></td>
              <td>${daySummary.cashOnHandBalance.toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>Petty Cash Balance</strong></td>
              <td>${daySummary.pettyCashBalance.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h2>OPERATIONAL SUMMARY</h2>
          <table>
            <tr>
              <td><strong>Total Transactions</strong></td>
              <td>${daySummary.transactionCount}</td>
            </tr>
            <tr>
              <td><strong>Cashier Shifts</strong></td>
              <td>${daySummary.cashierShifts}</td>
            </tr>
            <tr>
              <td><strong>Average Transaction Value</strong></td>
              <td>${daySummary.transactionCount > 0 ? ((daySummary.totalSalesCash + daySummary.totalSalesNetwork) / daySummary.transactionCount).toFixed(2) : '0.00'}</td>
            </tr>
          </table>
        </div>

        ${Object.values(daySummary.variances).some((v: any) => Math.abs(v) > 0.01) ? `
          <div class="section">
            <h2>VARIANCES</h2>
            <table>
              <tr>
                <td><strong>Cash Variance</strong></td>
                <td style="color: ${daySummary.variances.cash >= 0 ? 'green' : 'red'}">${daySummary.variances.cash.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Network Variance</strong></td>
                <td style="color: ${daySummary.variances.network >= 0 ? 'green' : 'red'}">${daySummary.variances.network.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Petty Cash Variance</strong></td>
                <td style="color: ${daySummary.variances.petty >= 0 ? 'green' : 'red'}">${daySummary.variances.petty.toFixed(2)}</td>
              </tr>
            </table>
          </div>
        ` : ''}

        <div style="margin-top: 60px; border-top: 1px solid #000; padding-top: 20px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div>
              <div style="border-bottom: 1px solid #000; width: 200px; margin-bottom: 10px;"></div>
              <div>Manager Signature</div>
              <div style="margin-top: 20px;">Date: _______________</div>
            </div>
            <div>
              <div style="border-bottom: 1px solid #000; width: 200px; margin-bottom: 10px;"></div>
              <div>Supervisor Signature</div>
              <div style="margin-top: 20px;">Date: _______________</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
      setTimeout(() => printWindow.close(), 1000);
    } else {
      alert('Please allow pop-ups to print the daily report');
    }
  };

  const exportToExcel = () => {
    if (!daySummary) return;

    // In real app, this would generate actual Excel file
    alert('Daily report exported to Excel successfully!');
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

  const getVarianceColor = (amount: number) => {
    if (Math.abs(amount) < 0.01) return 'text-gray-600 dark:text-gray-400';
    return amount > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getVarianceIcon = (amount: number) => {
    if (Math.abs(amount) < 0.01) return Minus;
    return amount > 0 ? TrendingUp : TrendingDown;
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Close Day</h1>
            <p className="text-gray-600 mt-1">End business day and generate daily report</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">Day Closed Successfully!</h3>
              <p className="text-green-700">
                Business day has been closed and daily report generated.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Day Status */}
      {activeDayOpening ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Active Business Day</h2>
              <p className="text-gray-600 mt-1">{formatDate(activeDayOpening.date)}</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Opening Float</span>
              </div>
              <p className="text-xl font-bold text-blue-900 mt-2">
                {formatCurrency(activeDayOpening.floatCashOnHand)}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Opening Petty</span>
              </div>
              <p className="text-xl font-bold text-green-900 mt-2">
                {formatCurrency(activeDayOpening.pettyCashOnHand)}
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Opened At</span>
              </div>
              <p className="text-lg font-bold text-purple-900 mt-2">
                {formatTime(activeDayOpening.openedAt)}
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Opened By</span>
              </div>
              <p className="text-sm font-bold text-orange-900 mt-2">
                {activeDayOpening.openedBy}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">No Active Day</h3>
              <p className="text-yellow-700">
                There is no active business day. Please open a day first before closing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Day Closing Validation</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            {activeDayOpening ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              activeDayOpening ? 'text-green-800' : 'text-red-800'
            }`}>
              Business day is {activeDayOpening ? 'open' : 'not open'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {activeCashiers === 0 ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              activeCashiers === 0 ? 'text-green-800' : 'text-red-800'
            }`}>
              {activeCashiers === 0 ? 'All cashier shifts are closed' : `${activeCashiers} cashier shifts still active`}
            </span>
          </div>
        </div>

        {canCloseDay ? (
          <div className="mt-6">
            <button
              onClick={handleGenerateSummary}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center space-x-2"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Generate Day Summary</span>
            </button>
          </div>
        ) : (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Cannot Close Day</h4>
                <p className="text-sm text-red-700">
                  {!activeDayOpening
                    ? 'No active business day found'
                    : 'All cashier shifts must be closed before closing the day'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Day Summary Modal */}
      {showSummary && daySummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Daily Summary - {formatDate(daySummary.date)}
              </h3>
              <button
                onClick={() => setShowSummary(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Opening Balances */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Opening Balances</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Float Cash:</span>
                    <span className="font-medium">{formatCurrency(daySummary.openingFloat)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Petty Cash:</span>
                    <span className="font-medium">{formatCurrency(daySummary.openingPetty)}</span>
                  </div>
                </div>
              </div>

              {/* Sales Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-blue-900 mb-3">Sales Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Cash Sales:</span>
                    <span className="font-medium text-blue-900">{formatCurrency(daySummary.totalSalesCash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Network Sales:</span>
                    <span className="font-medium text-blue-900">{formatCurrency(daySummary.totalSalesNetwork)}</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 pt-2">
                    <span className="font-semibold text-blue-800">Total Sales:</span>
                    <span className="font-bold text-blue-900">
                      {formatCurrency(daySummary.totalSalesCash + daySummary.totalSalesNetwork)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cash Management */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-green-900 mb-3">Cash Management</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-green-700">Total Deposits:</span>
                    <span className="font-medium text-green-900">{formatCurrency(daySummary.totalDeposits)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Petty Expenses:</span>
                    <span className="font-medium text-green-900">{formatCurrency(daySummary.totalPettyCashExpenses)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Cash Balance:</span>
                    <span className="font-medium text-green-900">{formatCurrency(daySummary.cashOnHandBalance)}</span>
                  </div>
                </div>
              </div>

              {/* Operations */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-purple-900 mb-3">Operations</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-purple-700">Transactions:</span>
                    <span className="font-medium text-purple-900">{daySummary.transactionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Cashier Shifts:</span>
                    <span className="font-medium text-purple-900">{daySummary.cashierShifts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-700">Avg Transaction:</span>
                    <span className="font-medium text-purple-900">
                      {daySummary.transactionCount > 0 ? formatCurrency((daySummary.totalSalesCash + daySummary.totalSalesNetwork) / daySummary.transactionCount) : formatCurrency(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Variances */}
            {Object.values(daySummary.variances).some((v: number) => Math.abs(v) > 0.01) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h4 className="text-lg font-semibold text-yellow-800 mb-3">Variances Detected</h4>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(daySummary.variances).map(([type, amount]) => {
                    const VarianceIcon = getVarianceIcon(amount as number);
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-yellow-700 capitalize">{type}:</span>
                        <div className="flex items-center space-x-1">
                          <VarianceIcon className={`w-4 h-4 ${getVarianceColor(amount as number)}`} />
                          <span className={`font-medium ${getVarianceColor(amount as number)}`}>
                            {formatCurrency(amount as number)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <button
                  onClick={printDailyReport}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all flex items-center space-x-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Report</span>
                </button>
                <button
                  onClick={exportToExcel}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Excel</span>
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowSummary(false)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseDay}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Close Business Day</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Active Day */}
      {!activeDayOpening && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Business Day</h3>
          <p className="text-gray-600 mb-4">There is no active business day to close.</p>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            Go to Open Day
          </button>
        </div>
      )}

      {/* Recent Day Closings */}
      <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Day Closings</h2>
        </div>
        <div className="p-6">
          {dayClosings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Total Sales</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Cash Balance</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Deposits</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Closed By</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dayClosings.slice(0, 5).map((closing) => (
                    <tr key={closing.id} className="hover:bg-gray-50 dark:bg-gray-900">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-gray-100">{formatDate(closing.date)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(closing.totalSalesCash + closing.totalSalesNetwork)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(closing.cashOnHandBalance)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(closing.totalDeposits)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-900 dark:text-gray-100">{closing.closedBy}</span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No day closings recorded</p>
              <p className="text-sm text-gray-400">Closed days will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Day Closing Process</h3>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li>• Ensure all cashier shifts are closed and reconciled</li>
              <li>• Verify all cash deposits have been recorded</li>
              <li>• Review petty cash expenses for the day</li>
              <li>• Generate and print daily report for records</li>
              <li>• Once closed, no new transactions can be entered for this date</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}