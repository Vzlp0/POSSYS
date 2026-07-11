import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Clock, 
  DollarSign, 
  CreditCard, 
  User, 
  Gift, 
  Calculator, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Save,
  Eye,
  X,
  Users,
  Printer,
  Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface CashierShift {
  id: string;
  cashierName: string;
  shiftStart: string;
  shiftEnd?: string;
  businessDate: string;
  openingFloat: number;
  expectedTotals: {
    cash: number;
    credit: number;
    card: number;
    voucher: number;
  };
  transactionCount: number;
  status: 'active' | 'closed';
  invoices?: CashierInvoice[];
}

interface DailyCashSales {
  date: string;
  cashSales: number;
  deposited: number;
  remaining: number;
}

interface CashDeposit {
  id: string;
  date: string;
  amount: number;
  depositedBy: string;
  depositedAt: string;
  notes?: string;
}

interface ReconciliationRecord {
  id: string;
  cashierName: string;
  businessDate: string;
  shiftStart: string;
  shiftEnd: string;
  expectedTotals: {
    cash: number;
    credit: number;
    card: number;
    voucher: number;
  };
  countedTotals: {
    cash: number;
    credit: number;
    card: number;
    voucher: number;
  };
  variance: {
    cash: number;
    credit: number;
    card: number;
    voucher: number;
  };
  notes: string;
  closedBy: string;
  closedAt: string;
  invoices: CashierInvoice[];
}

interface CashierInvoice {
  id: string;
  invoiceNumber: string;
  timestamp: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'credit' | 'voucher';
  paymentAmount: number;
  change: number;
  customerName?: string;
}

// Mock data for active cashier shifts
const mockActiveShifts: CashierShift[] = [
  {
    id: '1',
    cashierName: 'Mike Cashier',
    shiftStart: '2024-12-20T08:00:00Z',
    businessDate: '2024-12-20',
    openingFloat: 200.00,
    expectedTotals: {
      cash: 1250.75,
      credit: 180.25,
      card: 2340.50,
      voucher: 45.00
    },
    transactionCount: 47,
    status: 'active',
    invoices: [
      {
        id: '1',
        invoiceNumber: 'INV-2024-001',
        timestamp: '2024-12-20T08:30:00Z',
        items: [
          { name: 'Coffee Beans - Premium', quantity: 2, unitPrice: 45.00, lineTotal: 90.00 },
          { name: 'Disposable Cups', quantity: 50, unitPrice: 0.25, lineTotal: 12.50 }
        ],
        subtotal: 102.50,
        discount: 0.00,
        tax: 10.25,
        total: 112.75,
        paymentMethod: 'card',
        paymentAmount: 112.75,
        change: 0.00
      },
      {
        id: '2',
        invoiceNumber: 'INV-2024-002',
        timestamp: '2024-12-20T09:15:00Z',
        items: [
          { name: 'Sugar Packets', quantity: 10, unitPrice: 3.50, lineTotal: 35.00 }
        ],
        subtotal: 35.00,
        discount: 5.00,
        tax: 3.00,
        total: 33.00,
        paymentMethod: 'cash',
        paymentAmount: 40.00,
        change: 7.00
      },
      {
        id: '3',
        invoiceNumber: 'INV-2024-003',
        timestamp: '2024-12-20T10:45:00Z',
        items: [
          { name: 'Paper Napkins', quantity: 5, unitPrice: 2.50, lineTotal: 12.50 },
          { name: 'Coffee Beans - Premium', quantity: 1, unitPrice: 45.00, lineTotal: 45.00 }
        ],
        subtotal: 57.50,
        discount: 0.00,
        tax: 5.75,
        total: 63.25,
        paymentMethod: 'credit',
        paymentAmount: 63.25,
        change: 0.00
      }
    ]
  },
  {
    id: '2',
    cashierName: 'Sarah Manager',
    shiftStart: '2024-12-20T09:30:00Z',
    businessDate: '2024-12-20',
    openingFloat: 150.00,
    expectedTotals: {
      cash: 890.25,
      credit: 120.50,
      card: 1560.75,
      voucher: 25.00
    },
    transactionCount: 32,
    status: 'active',
    invoices: [
      {
        id: '4',
        invoiceNumber: 'INV-2024-004',
        timestamp: '2024-12-20T09:45:00Z',
        items: [
          { name: 'Espresso Cup', quantity: 3, unitPrice: 2.50, lineTotal: 7.50 }
        ],
        subtotal: 7.50,
        discount: 0.00,
        tax: 0.75,
        total: 8.25,
        paymentMethod: 'cash',
        paymentAmount: 10.00,
        change: 1.75
      }
    ]
  },
  {
    id: '3',
    cashierName: 'Lisa Staff',
    shiftStart: '2024-12-20T14:00:00Z',
    businessDate: '2024-12-20',
    openingFloat: 100.00,
    expectedTotals: {
      cash: 450.00,
      credit: 65.75,
      card: 780.25,
      voucher: 15.00
    },
    transactionCount: 18,
    status: 'active',
    invoices: [
      {
        id: '5',
        invoiceNumber: 'INV-2024-005',
        timestamp: '2024-12-20T14:30:00Z',
        items: [
          { name: 'Croissant', quantity: 2, unitPrice: 3.75, lineTotal: 7.50 }
        ],
        subtotal: 7.50,
        discount: 0.00,
        tax: 0.75,
        total: 8.25,
        paymentMethod: 'voucher',
        paymentAmount: 8.25,
        change: 0.00
      }
    ]
  }
];

// Mock reconciliation history
const mockReconciliationHistory: ReconciliationRecord[] = [
  {
    id: '1',
    cashierName: 'John Admin',
    businessDate: '2024-12-19',
    shiftStart: '2024-12-19T08:00:00Z',
    shiftEnd: '2024-12-19T16:00:00Z',
    expectedTotals: {
      cash: 1450.00,
      credit: 200.50,
      card: 2100.75,
      voucher: 50.00
    },
    countedTotals: {
      cash: 1445.00,
      credit: 200.50,
      card: 2100.75,
      voucher: 50.00
    },
    variance: {
      cash: -5.00,
      credit: 0.00,
      card: 0.00,
      voucher: 0.00
    },
    notes: 'Cash shortage of $5.00 - customer change error identified',
    closedBy: 'Sarah Manager',
    closedAt: '2024-12-19T16:15:00Z',
    invoices: []
  }
];

interface CloseSalesProps {
  onBack: () => void;
}

export default function CloseSales({ onBack }: CloseSalesProps) {
  const { user } = useAuth();
  const [activeShifts, setActiveShifts] = useState<CashierShift[]>(mockActiveShifts);
  const [reconciliationHistory, setReconciliationHistory] = useState<ReconciliationRecord[]>(mockReconciliationHistory);
  const [selectedBusinessDate, setSelectedBusinessDate] = useState('2024-12-20');
  const [selectedCashier, setSelectedCashier] = useState<CashierShift | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [countedAmounts, setCountedAmounts] = useState({
    cash: '',
    credit: '',
    card: '',
    voucher: ''
  });
  const [cashOnHand, setCashOnHand] = useState(0);
  const [depositAmount, setDepositAmount] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [dailyCashSales, setDailyCashSales] = useState<DailyCashSales[]>([]);
  const [cashDeposits, setCashDeposits] = useState<CashDeposit[]>([]);
  const [selectedDepositDate, setSelectedDepositDate] = useState('');
  const [depositNotes, setDepositNotes] = useState('');

  const tenderTypes = [
    { key: 'cash', label: 'Cash', icon: DollarSign, color: 'text-green-600' },
    { key: 'credit', label: 'Credit', icon: CreditCard, color: 'text-purple-600' },
    { key: 'card', label: 'Card', icon: CreditCard, color: 'text-blue-600' },
    { key: 'voucher', label: 'Voucher', icon: Gift, color: 'text-orange-600' }
  ];

  // Filter shifts by selected business date
  const filteredShifts = activeShifts.filter(shift => shift.businessDate === selectedBusinessDate);

  // Calculate variance
  const calculateVariance = () => {
    if (!selectedCashier) return { cash: 0, card: 0, membership: 0, voucher: 0 };
    
    return {
      cash: (parseFloat(countedAmounts.cash) || 0) - selectedCashier.expectedTotals.cash,
      credit: (parseFloat(countedAmounts.credit) || 0) - selectedCashier.expectedTotals.credit,
      card: (parseFloat(countedAmounts.card) || 0) - selectedCashier.expectedTotals.card,
      voucher: (parseFloat(countedAmounts.voucher) || 0) - selectedCashier.expectedTotals.voucher
    };
  };

  const variance = calculateVariance();
  const hasVariance = Object.values(variance).some(v => Math.abs(v) > 0.01);
  const totalVariance = Object.values(variance).reduce((sum, v) => sum + v, 0);

  const handleCashierSelect = (cashier: CashierShift) => {
    setSelectedCashier(cashier);
    // Calculate cash on hand (opening float + cash sales)
    const calculatedCashOnHand = cashier.openingFloat + cashier.expectedTotals.cash;
    setCashOnHand(calculatedCashOnHand);
    setCountedAmounts({
      cash: cashier.expectedTotals.cash.toFixed(2),
      credit: cashier.expectedTotals.credit.toFixed(2),
      card: cashier.expectedTotals.card.toFixed(2),
      voucher: cashier.expectedTotals.voucher.toFixed(2)
    });
    setDepositAmount('');
    setNotes('');
  };

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid deposit amount');
      return;
    }
    
    if (amount > cashOnHand) {
      alert('Deposit amount cannot exceed cash on hand');
      return;
    }
    
    // Reduce cash on hand by deposit amount
    setCashOnHand(prev => prev - amount);
    
    // Update counted cash amount to reflect deposit
    setCountedAmounts(prev => ({
      ...prev,
      cash: (cashOnHand - amount).toFixed(2)
    }));
    
    setShowDepositModal(false);
    setDepositAmount('');
    
    alert(`Deposit of ${formatCurrency(amount)} recorded. Cash on hand updated.`);
  };

  const printClosingDocument = () => {
    if (!selectedCashier) return;
    
    // Create a new window for printing
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cashier Shift Closing Document</title>
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
          .header-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            text-align: left;
            max-width: 600px;
            margin: 0 auto;
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
          .notes-section {
            margin-top: 30px;
            padding: 15px;
            border: 1px solid #000;
          }
          .signature-section {
            margin-top: 40px;
            border-top: 1px solid #000;
            padding-top: 20px;
          }
          .signature-line {
            display: inline-block;
            width: 200px;
            border-bottom: 1px solid #000;
            margin-bottom: 10px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CASHIER SHIFT CLOSING DOCUMENT</h1>
          <div class="header-info">
            <div><strong>Business Date:</strong> ${selectedCashier.businessDate}</div>
            <div><strong>Cashier:</strong> ${selectedCashier.cashierName}</div>
            <div><strong>Shift Start:</strong> ${formatTime(selectedCashier.shiftStart)}</div>
            <div><strong>Shift End:</strong> ${formatTime(new Date().toISOString())}</div>
            <div><strong>Closed By:</strong> ${user?.firstName} ${user?.lastName}</div>
          </div>
        </div>

        <div class="section">
          <h2>INVOICE DETAILS</h2>
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Time</th>
                <th>Payment Method</th>
                <th>Subtotal</th>
                <th>Tax</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              ${(selectedCashier.invoices || []).map(invoice => `
                <tr>
                  <td>${invoice.invoiceNumber}</td>
                  <td>${formatTime(invoice.timestamp)}</td>
                  <td>${invoice.paymentMethod.toUpperCase()}</td>
                  <td>${formatCurrency(invoice.subtotal)}</td>
                  <td>${formatCurrency(invoice.tax)}</td>
                  <td>${formatCurrency(invoice.total)}</td>
                  <td>${formatCurrency(invoice.paymentAmount)}</td>
                  <td>${formatCurrency(invoice.change)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>PAYMENT SUMMARY</h2>
          <table>
            <thead>
              <tr>
                <th>Payment Type</th>
                <th>Expected</th>
                <th>Counted</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              ${tenderTypes.map(tender => `
                <tr>
                  <td>${tender.label}</td>
                  <td>${formatCurrency(selectedCashier.expectedTotals[tender.key])}</td>
                  <td>${formatCurrency(parseFloat(countedAmounts[tender.key]) || 0)}</td>
                  <td style="color: ${variance[tender.key] >= 0 ? 'green' : 'red'}">${formatCurrency(variance[tender.key])}</td>
                </tr>
              `).join('')}
              <tr style="border-top: 2px solid #000; font-weight: bold;">
                <td>TOTAL</td>
                <td>${formatCurrency(Object.values(selectedCashier.expectedTotals).reduce((sum, v) => sum + v, 0))}</td>
                <td>${formatCurrency(Object.values(countedAmounts).reduce((sum, v) => sum + (parseFloat(v) || 0), 0))}</td>
                <td style="color: ${Object.values(variance).reduce((sum, v) => sum + v, 0) >= 0 ? 'green' : 'red'}">${formatCurrency(Object.values(variance).reduce((sum, v) => sum + v, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        ${notes ? `
          <div class="notes-section">
            <h2>NOTES</h2>
            <p>${notes}</p>
          </div>
        ` : ''}

        <div class="signature-section">
          <h2>SIGNATURES</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px;">
            <div>
              <div class="signature-line"></div>
              <div>Cashier Signature</div>
            </div>
            <div>
              <div class="signature-line"></div>
              <div>Manager Signature</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Create a new window and print
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
      
      // Close window after printing (with delay)
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    } else {
      alert('Please allow pop-ups to print the closing document');
    }
  };

  const handleSubmitCloseout = () => {
    if (!selectedCashier) return;
    
    if (hasVariance && !notes.trim()) {
      alert('Notes are required when there is a variance');
      return;
    }

    // Create reconciliation record
    const reconciliationRecord: ReconciliationRecord = {
      id: Date.now().toString(),
      cashierName: selectedCashier.cashierName,
      businessDate: selectedCashier.businessDate,
      shiftStart: selectedCashier.shiftStart,
      shiftEnd: new Date().toISOString(),
      expectedTotals: selectedCashier.expectedTotals,
      countedTotals: {
        cash: parseFloat(countedAmounts.cash) || 0,
        credit: parseFloat(countedAmounts.credit) || 0,
        card: parseFloat(countedAmounts.card) || 0,
        voucher: parseFloat(countedAmounts.voucher) || 0
      },
      variance,
      notes,
      closedBy: user?.firstName + ' ' + user?.lastName || 'Unknown User',
      closedAt: new Date().toISOString(),
      invoices: selectedCashier.invoices || []
    };

    // Add to history and remove from active shifts
    setReconciliationHistory(prev => [reconciliationRecord, ...prev]);
    setActiveShifts(prev => prev.filter(shift => shift.id !== selectedCashier.id));
    
    // Print the closing document
    printClosingDocument();
    
    // Reset form
    setSelectedCashier(null);
    setCountedAmounts({ cash: '', credit: '', card: '', voucher: '' });
    setNotes('');
    
    alert('Cashier shift closed successfully! Report generated.');
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  // History View
  if (showHistory) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowHistory(false)}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Close Sales</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reconciliation History</h1>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Cashier</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Business Date</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Shift Duration</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Expected Total</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Counted Total</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Variance</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Closed By</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reconciliationHistory.map((record) => {
                  const expectedTotal = Object.values(record.expectedTotals).reduce((sum, v) => sum + v, 0);
                  const countedTotal = Object.values(record.countedTotals).reduce((sum, v) => sum + v, 0);
                  const totalVariance = Object.values(record.variance).reduce((sum, v) => sum + v, 0);
                  
                  return (
                    <tr key={record.id} className="hover:bg-gray-50 dark:bg-gray-900">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{record.cashierName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-900 dark:text-gray-100">{formatDate(record.businessDate)}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          <p className="text-gray-900 dark:text-gray-100">{formatTime(record.shiftStart)} - {formatTime(record.shiftEnd)}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(expectedTotal)}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(countedTotal)}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-1">
                          {(() => {
                            const VarianceIcon = getVarianceIcon(totalVariance);
                            return (
                              <>
                                <VarianceIcon className={`w-4 h-4 ${getVarianceColor(totalVariance)}`} />
                                <span className={`font-medium ${getVarianceColor(totalVariance)}`}>
                                  {formatCurrency(totalVariance)}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-gray-900 dark:text-gray-100">{record.closedBy}</span>
                      </td>
                      <td className="py-4 px-6">
                        <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {reconciliationHistory.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reconciliation history</h3>
            <p className="text-gray-600 dark:text-gray-400">Closed shifts will appear here.</p>
          </div>
        )}
      </div>
    );
  }

  const handleMakeDeposit = (date: string) => {
    const cashSalesData = dailyCashSales.find(d => d.date === date);
    if (!cashSalesData || cashSalesData.remaining <= 0) {
      alert('No cash available for deposit on this date');
      return;
    }
    
    setSelectedDepositDate(date);
    setDepositAmount('');
    setDepositNotes('');
    setShowDepositModal(true);
  };

  const handleDepositSubmit = () => {
    if (!selectedDepositDate || !depositAmount) {
      alert('Please enter a deposit amount');
      return;
    }

    const amount = parseFloat(depositAmount);
    const cashSalesData = dailyCashSales.find(d => d.date === selectedDepositDate);
    
    if (!cashSalesData) {
      alert('Invalid date selected');
      return;
    }

    if (amount <= 0 || amount > cashSalesData.remaining) {
      alert(`Deposit amount must be between $0.01 and ${formatCurrency(cashSalesData.remaining)}`);
      return;
    }

    // Create deposit record
    const newDeposit: CashDeposit = {
      id: Date.now().toString(),
      date: selectedDepositDate,
      amount,
      depositedBy: user?.firstName + ' ' + user?.lastName || 'Unknown User',
      depositedAt: new Date().toISOString(),
      notes: depositNotes
    };

    // Update cash sales data
    setDailyCashSales(prev => prev.map(d => 
      d.date === selectedDepositDate 
        ? { ...d, deposited: d.deposited + amount, remaining: d.remaining - amount }
        : d
    ));

    // Add deposit record
    setCashDeposits(prev => [newDeposit, ...prev]);

    // Reset form and close modal
    setShowDepositModal(false);
    setSelectedDepositDate('');
    setDepositAmount('');
    setDepositNotes('');

    alert(`Deposit of ${formatCurrency(amount)} recorded successfully!`);
  };

  const getTotalCashOnHand = () => {
    return dailyCashSales.reduce((total, day) => total + day.remaining, 0);
  };

  return (
    <div className="h-screen bg-gray-100 grid grid-cols-12">
      {/* Left Panel - Active Cashiers */}
      <div className="col-span-4 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Close Sales</h1>
          <p className="text-gray-600 text-sm">Select a cashier to close their shift</p>
        </div>

        {/* Business Date Selector */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="date"
              value={selectedBusinessDate}
              onChange={(e) => setSelectedBusinessDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Active Cashiers List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Active Cashiers</h2>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
                {filteredShifts.length}
              </span>
            </div>

            <div className="space-y-3">
              {filteredShifts.map((shift) => {
                const totalExpected = Object.values(shift.expectedTotals).reduce((sum, v) => sum + v, 0);
                const isSelected = selectedCashier?.id === shift.id;
                
                return (
                  <button
                    key={shift.id}
                    onClick={() => handleCashierSelect(shift)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{shift.cashierName}</p>
                          <p className="text-sm text-gray-500">
                            Started: {formatTime(shift.shiftStart)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(totalExpected)}</p>
                        <p className="text-sm text-gray-500">{shift.transactionCount} txns</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredShifts.length === 0 && (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No active cashiers for this date</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">Tips</h3>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Count all tender types carefully</li>
                  <li>• Notes required for any variance</li>
                  <li>• Double-check amounts before submitting</li>
                </ul>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowHistory(true)}
            className="w-full mt-4 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center justify-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>View History</span>
          </button>
        </div>
      </div>

      {/* Right Panel - Reconciliation Form */}
      <div className="col-span-8 flex flex-col">
        {selectedCashier ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Close Cashier — {selectedCashier.cashierName}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    End Time: {new Date().toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} • Started: {formatTime(selectedCashier.shiftStart)} • {selectedCashier.transactionCount} transactions
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCashier(null)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Section 1: Expected Totals from Sales Table */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expected Totals (From Sales Table)</h3>
                <p className="text-sm text-gray-600 mb-4">System automatically calculated from recorded sales</p>
                <div className="grid grid-cols-2 gap-4">
                  {tenderTypes.map((tender) => {
                    const Icon = tender.icon;
                    const amount = selectedCashier.expectedTotals[tender.key as keyof typeof selectedCashier.expectedTotals];
                    
                    return (
                      <div key={tender.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-5 h-5 ${tender.color}`} />
                          <span className="font-medium text-gray-900 dark:text-gray-100">{tender.label}</span>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(amount)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total Expected:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(Object.values(selectedCashier.expectedTotals).reduce((sum, v) => sum + v, 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Actual Counted Amounts */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actual Counted Amounts</h3>
                <p className="text-sm text-gray-600 mb-4">Enter the actual amounts counted from the register</p>
                
                {/* Cash on Hand Section */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-blue-900">Cash on Hand</h4>
                      <p className="text-sm text-blue-700">Opening float + cash sales</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-900">{formatCurrency(cashOnHand)}</p>
                      <p className="text-sm text-blue-700">
                        Float: {formatCurrency(selectedCashier.openingFloat)} + Sales: {formatCurrency(selectedCashier.expectedTotals.cash)}
                      </p>
                    </div>
                  </div>
                  
                  {cashOnHand > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-blue-700">Make deposit to reduce cash on hand</p>
                      <button
                        onClick={() => setShowDepositModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Make Deposit</span>
                      </button>
                    </div>
                  )}
                  
                  {cashOnHand === 0 && (
                    <div className="flex items-center space-x-2 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">All cash deposited</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {tenderTypes.map((tender) => {
                    const Icon = tender.icon;
                    
                    return (
                      <div key={tender.key} className="space-y-2">
                        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <Icon className={`w-4 h-4 ${tender.color}`} />
                          <span>{tender.label}</span>
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={countedAmounts[tender.key as keyof typeof countedAmounts]}
                            onChange={(e) => setCountedAmounts(prev => ({
                              ...prev,
                              [tender.key]: e.target.value
                            }))}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total Counted:</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(Object.values(countedAmounts).reduce((sum, v) => sum + (parseFloat(v) || 0), 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Variance Analysis */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Variance Analysis</h3>
                <div className="grid grid-cols-2 gap-4">
                  {tenderTypes.map((tender) => {
                    const Icon = tender.icon;
                    const varianceAmount = variance[tender.key as keyof typeof variance];
                    const VarianceIcon = getVarianceIcon(varianceAmount);
                    
                    return (
                      <div key={tender.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-5 h-5 ${tender.color}`} />
                          <span className="font-medium text-gray-900 dark:text-gray-100">{tender.label}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <VarianceIcon className={`w-4 h-4 ${getVarianceColor(varianceAmount)}`} />
                          <span className={`font-semibold ${getVarianceColor(varianceAmount)}`}>
                            {formatCurrency(varianceAmount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {hasVariance && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">Variance Detected</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Total variance: <span className={`font-semibold ${getVarianceColor(totalVariance)}`}>
                            {formatCurrency(totalVariance)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 4: Notes */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                <p className="text-sm text-gray-600 mb-3">
                  {hasVariance ? 'Notes are required when there is a variance' : 'Optional notes about this shift'}
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter any notes about discrepancies, issues, or observations..."
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-white border-t border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={printClosingDocument}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Preview Document</span>
                  </button>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedCashier(null)}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitCloseout}
                    disabled={hasVariance && !notes.trim()}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-medium flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Close Cashier & Print</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Cashier</h3>
              <p className="text-gray-600 dark:text-gray-400">Choose a cashier from the left panel to begin the closing process</p>
            </div>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Make Cash Deposit</h3>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 font-medium">Cash on Hand:</span>
                  <span className="text-blue-900 font-bold text-lg">{formatCurrency(cashOnHand)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={cashOnHand}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Maximum: {formatCurrency(cashOnHand)}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setDepositAmount(cashOnHand.toFixed(2))}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Deposit All
                </button>
                <button
                  onClick={() => setDepositAmount((cashOnHand / 2).toFixed(2))}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Deposit Half
                </button>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  onClick={handleDeposit}
                  disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Record Deposit</span>
                </button>
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}