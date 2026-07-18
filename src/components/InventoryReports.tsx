import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  DollarSign,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Clock,
  BarChart3,
  Building,
  Truck,
  MapPin,
  Filter,
  Search,
  Eye,
  FileSpreadsheet,
  FileImage
} from 'lucide-react';


interface InventoryReportsProps {
  onBack: () => void;
}

const reportTypes = [
  {
    id: 'stock-valuation',
    title: 'Stock Valuation Report',
    description: 'Qty, Unit Price, Total Value, Grand Total',
    icon: DollarSign,
    color: 'bg-green-50 border-green-200 text-green-800'
  },
  {
    id: 'low-stock',
    title: 'Low Stock Report',
    description: 'Items with Qty < Minimum Stock',
    icon: AlertTriangle,
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  },
  {
    id: 'out-of-stock',
    title: 'Out-of-Stock Report',
    description: 'Items with zero quantity',
    icon: TrendingDown,
    color: 'bg-red-50 border-red-200 text-red-800'
  },
  {
    id: 'stock-movement',
    title: 'Stock Movement Report',
    description: 'Select date range for movements',
    icon: BarChart3,
    color: 'bg-blue-50 border-blue-200 text-blue-800'
  },
  {
    id: 'aging',
    title: 'Aging Report',
    description: 'Group by days in stock: 0-30, 31-60, 61-90',
    icon: Clock,
    color: 'bg-purple-50 border-purple-200 text-purple-800'
  },
  {
    id: 'expiry',
    title: 'Expiry Report',
    description: 'Items near expiry or expired',
    icon: Calendar,
    color: 'bg-orange-50 border-orange-200 text-orange-800'
  },
  {
    id: 'movement-analysis',
    title: 'Slow vs Fast Moving Items',
    description: 'Based on sales in last 30 days',
    icon: TrendingUp,
    color: 'bg-indigo-50 border-indigo-200 text-indigo-800'
  },
  {
    id: 'category-wise',
    title: 'Category-wise Stock Report',
    description: 'Group by category with totals',
    icon: Package,
    color: 'bg-teal-50 border-teal-200 text-teal-800'
  },
  {
    id: 'supplier-wise',
    title: 'Supplier-wise Stock Report',
    description: 'Group by supplier with totals',
    icon: Truck,
    color: 'bg-pink-50 border-pink-200 text-pink-800'
  },
  {
    id: 'location-wise',
    title: 'Location-wise Stock Report',
    description: 'Group by location with totals',
    icon: MapPin,
    color: 'bg-cyan-50 border-cyan-200 text-cyan-800'
  }
];

export default function InventoryReports({ onBack }: InventoryReportsProps) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [stockData, setStockData] = useState<any[]>([]);
  const [stockMovements, setStockMovements] = useState<any[]>([]);

  // Load stock data from localStorage
  useEffect(() => {
    // Load stock data
    const items: any[] = JSON.parse(localStorage.getItem('pos_items') || '[]');
    const stockLevels: Record<string, number> = JSON.parse(localStorage.getItem('pos_stock_levels') || '{}');

    const mapped = items.map((item: any) => {
      const qty = stockLevels[item.id] || 0;
      return {
        id: item.id,
        itemName: item.name || item.name_en,
        itemSku: item.sku,
        unit: item.unit || 'pcs',
        category: item.category || 'Uncategorized',
        quantity: qty,
        unitPrice: item.standard_cost || item.cost || 0,
        sellingPrice: item.price || 0,
        totalValue: qty * (item.standard_cost || item.cost || 0),
        minStockLevel: item.min_stock || 10,
        location: 'Main Branch',
        supplier: (item.suppliers && item.suppliers[0]?.supplierName) || 'N/A',
        expiryDate: null,
        lastMovementDate: item.updated_at || new Date().toISOString(),
        daysInStock: Math.floor((Date.now() - new Date(item.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)),
        salesLast30Days: 0,
        movementType: qty === 0 ? 'out' : 'slow'
      };
    });
    setStockData(mapped);

    // Load stock movements
    const transactions: any[] = JSON.parse(localStorage.getItem('pos_transactions') || '[]');
    const grHistory: any[] = JSON.parse(localStorage.getItem('pos_gr_history') || '[]');

    const movements: any[] = [];

    transactions.forEach((tx: any) => {
      (tx.items || []).forEach((ti: any, idx: number) => {
        movements.push({
          id: `${tx.id}-${idx}`,
          date: tx.timestamp,
          itemName: ti.itemName || 'Unknown',
          itemSku: ti.sku || '',
          movementType: 'out',
          quantity: ti.quantity,
          unit: 'pcs',
          location: 'POS',
          reference: tx.invoiceNumber || '',
          performedBy: tx.cashierName || 'Unknown'
        });
      });
    });

    grHistory.forEach((gr: any) => {
      (gr.items || []).forEach((gi: any, idx: number) => {
        movements.push({
          id: `${gr.id}-${idx}`,
          date: gr.receivedDate,
          itemName: gi.itemName || 'Unknown',
          itemSku: gi.sku || '',
          movementType: 'in',
          quantity: gi.quantity,
          unit: gi.unit || 'pcs',
          location: 'Stock Room',
          reference: gr.grNumber || '',
          performedBy: gr.receivedBy || 'Receiver'
        });
      });
    });

    movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setStockMovements(movements);
  }, []);

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
      day: 'numeric'
    });
  };

  const exportToExcel = (reportData: any[], filename: string) => {
    // In real app, this would generate actual Excel file
    console.log('Exporting to Excel:', { reportData, filename });
    alert(`Exporting ${filename}.xlsx with ${reportData.length} records`);
  };

  const exportToPDF = (reportData: any[], filename: string) => {
    // In real app, this would generate actual PDF file
    console.log('Exporting to PDF:', { reportData, filename });
    alert(`Exporting ${filename}.pdf with ${reportData.length} records`);
  };

  const generateReport = (reportType: string) => {
    switch (reportType) {
      case 'stock-valuation':
        return stockData.map(item => ({
          itemName: item.itemName,
          itemSku: item.itemSku,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalValue: item.totalValue
        }));
      
      case 'low-stock':
        return stockData.filter(item => item.quantity < item.minStockLevel);
      
      case 'out-of-stock':
        return stockData.filter(item => item.quantity === 0);
      
      case 'stock-movement':
        return stockMovements.filter(movement => {
          const movementDate = new Date(movement.date).toISOString().split('T')[0];
          return movementDate >= dateRange.start && movementDate <= dateRange.end;
        });
      
      case 'aging':
        return stockData.map(item => ({
          ...item,
          ageGroup: item.daysInStock <= 30 ? '0-30 days' :
                   item.daysInStock <= 60 ? '31-60 days' :
                   item.daysInStock <= 90 ? '61-90 days' : '90+ days'
        }));
      
      case 'expiry':
        return stockData.filter(item => {
          if (!item.expiryDate) return false;
          const daysToExpiry = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return daysToExpiry <= 30;
        });
      
      case 'movement-analysis':
        return stockData.map(item => ({
          ...item,
          movementCategory: item.movementType,
          salesVelocity: item.salesLast30Days / 30
        }));
      
      case 'category-wise':
        const categoryGroups = stockData.reduce((acc, item) => {
          if (!acc[item.category]) {
            acc[item.category] = { items: [], totalValue: 0, totalQuantity: 0 };
          }
          acc[item.category].items.push(item);
          acc[item.category].totalValue += item.totalValue;
          acc[item.category].totalQuantity += item.quantity;
          return acc;
        }, {} as any);
        return Object.entries(categoryGroups).map(([category, data]: [string, any]) => ({
          category,
          itemCount: data.items.length,
          totalQuantity: data.totalQuantity,
          totalValue: data.totalValue,
          items: data.items
        }));
      
      case 'supplier-wise':
        const supplierGroups = stockData.reduce((acc, item) => {
          if (!acc[item.supplier]) {
            acc[item.supplier] = { items: [], totalValue: 0, totalQuantity: 0 };
          }
          acc[item.supplier].items.push(item);
          acc[item.supplier].totalValue += item.totalValue;
          acc[item.supplier].totalQuantity += item.quantity;
          return acc;
        }, {} as any);
        return Object.entries(supplierGroups).map(([supplier, data]: [string, any]) => ({
          supplier,
          itemCount: data.items.length,
          totalQuantity: data.totalQuantity,
          totalValue: data.totalValue,
          items: data.items
        }));
      
      case 'location-wise':
        const locationGroups = stockData.reduce((acc, item) => {
          if (!acc[item.location]) {
            acc[item.location] = { items: [], totalValue: 0, totalQuantity: 0 };
          }
          acc[item.location].items.push(item);
          acc[item.location].totalValue += item.totalValue;
          acc[item.location].totalQuantity += item.quantity;
          return acc;
        }, {} as any);
        return Object.entries(locationGroups).map(([location, data]: [string, any]) => ({
          location,
          itemCount: data.items.length,
          totalQuantity: data.totalQuantity,
          totalValue: data.totalValue,
          items: data.items
        }));
      
      default:
        return [];
    }
  };

  const renderReportContent = (reportType: string) => {
    const reportData = generateReport(reportType);
    const reportConfig = reportTypes.find(r => r.id === reportType);

    if (!reportConfig) return null;

    return (
      <div className="space-y-6">
        {/* Report Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{reportConfig.title}</h2>
            <p className="text-gray-600 mt-1">{reportConfig.description}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => exportToExcel(reportData, reportConfig.title)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => exportToPDF(reportData, reportConfig.title)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-all flex items-center space-x-2"
            >
              <FileImage className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Date Range Filter for Stock Movement Report */}
        {reportType === 'stock-movement' && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Report Content */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {reportType === 'stock-valuation' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Item</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">SKU</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Quantity</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Unit Price</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{item.itemName}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{item.itemSku}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{item.quantity} {item.unit}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 px-4 font-semibold text-green-600">{formatCurrency(item.totalValue)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <td colSpan={4} className="py-3 px-4 text-right font-bold text-gray-900 dark:text-gray-100">Grand Total:</td>
                    <td className="py-3 px-4 font-bold text-lg text-green-600">
                      {formatCurrency(stockData.reduce((sum, item) => sum + item.totalValue, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {reportType === 'low-stock' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Item</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Current Stock</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Min Level</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Shortage</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{item.itemName}</p>
                          <p className="text-sm text-gray-500">{item.itemSku}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-red-600 font-medium">{item.quantity} {item.unit}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{item.minStockLevel} {item.unit}</td>
                      <td className="py-3 px-4 text-red-600 font-semibold">
                        {item.minStockLevel - item.quantity} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{item.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'out-of-stock' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Item</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Last Movement</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Supplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{item.itemName}</p>
                          <p className="text-sm text-gray-500">{item.itemSku}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{formatDate(item.lastMovementDate)}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{item.location}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{item.supplier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'stock-movement' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Item</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Movement Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Quantity</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Reference</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Performed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.map((movement: any) => (
                    <tr key={movement.id}>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{formatDate(movement.date)}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{movement.itemName}</p>
                          <p className="text-sm text-gray-500">{movement.itemSku}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          movement.movementType === 'in' ? 'bg-green-100 text-green-800' :
                          movement.movementType === 'out' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {movement.movementType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{movement.quantity} {movement.unit}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{movement.location}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{movement.reference}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{movement.performedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'aging' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Item</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Days in Stock</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Age Group</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Quantity</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{item.itemName}</p>
                          <p className="text-sm text-gray-500">{item.itemSku}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{item.daysInStock} days</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          item.ageGroup === '0-30 days' ? 'bg-green-100 text-green-800' :
                          item.ageGroup === '31-60 days' ? 'bg-yellow-100 text-yellow-800' :
                          item.ageGroup === '61-90 days' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.ageGroup}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{item.quantity} {item.unit}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{formatCurrency(item.totalValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'expiry' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Item</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Quantity</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Expiry Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Days to Expiry</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Value at Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.map((item: any) => {
                    const daysToExpiry = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={item.id}>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{item.itemName}</p>
                            <p className="text-sm text-gray-500">{item.itemSku}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{item.quantity} {item.unit}</td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{formatDate(item.expiryDate)}</td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${
                            daysToExpiry < 0 ? 'text-red-600' :
                            daysToExpiry <= 7 ? 'text-orange-600' :
                            'text-yellow-600'
                          }`}>
                            {daysToExpiry < 0 ? `${Math.abs(daysToExpiry)} days expired` : `${daysToExpiry} days`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{item.location}</td>
                        <td className="py-3 px-4 text-red-600 font-medium">{formatCurrency(item.totalValue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'movement-analysis' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Item</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Current Stock</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Sales (30 days)</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Daily Velocity</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Movement Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Stock Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{item.itemName}</p>
                          <p className="text-sm text-gray-500">{item.itemSku}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{item.quantity} {item.unit}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{item.salesLast30Days}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{item.salesVelocity.toFixed(2)}/day</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          item.movementType === 'fast' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.movementType} moving
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{formatCurrency(item.totalValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(reportType === 'category-wise' || reportType === 'supplier-wise' || reportType === 'location-wise') && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      {reportType === 'category-wise' ? 'Category' :
                       reportType === 'supplier-wise' ? 'Supplier' : 'Location'}
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Item Count</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Total Quantity</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Total Value</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.map((group: any, index: number) => (
                    <tr key={index}>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        {group.category || group.supplier || group.location}
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{group.itemCount} items</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{group.totalQuantity}</td>
                      <td className="py-3 px-4 font-semibold text-green-600">{formatCurrency(group.totalValue)}</td>
                      <td className="py-3 px-4">
                        <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportData.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No data found</h3>
              <p className="text-gray-600 dark:text-gray-400">No records match the current criteria.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Report View
  if (selectedReport) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSelectedReport(null)}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Reports</span>
          </button>
        </div>
        {renderReportContent(selectedReport)}
      </div>
    );
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
            <span>Back to Inventory</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory Reports</h1>
            <p className="text-gray-600 mt-1">Comprehensive inventory analysis and reporting</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Inventory Value</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(stockData.reduce((sum, item) => sum + item.totalValue, 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock Items</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">
                {stockData.filter(item => item.quantity < item.minStockLevel).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {stockData.filter(item => item.quantity === 0).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Items Near Expiry</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">
                {stockData.filter(item => {
                  if (!item.expiryDate) return false;
                  const daysToExpiry = Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return daysToExpiry <= 30;
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`p-6 border-2 rounded-xl hover:shadow-lg transition-all text-left group ${report.color}`}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-white bg-opacity-50 rounded-lg flex items-center justify-center group-hover:bg-opacity-70 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      {report.title}
                    </h3>
                    <p className="text-sm opacity-80">
                      {report.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-medium opacity-70">Click to generate</span>
                  <div className="flex items-center space-x-1 opacity-60">
                    <FileSpreadsheet className="w-4 h-4" />
                    <FileImage className="w-4 h-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => setSelectedReport('low-stock')}
            className="flex items-center space-x-3 p-4 border border-yellow-200 rounded-lg hover:bg-yellow-50 transition-all group"
          >
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-all">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100">Check Low Stock</p>
              <p className="text-sm text-gray-500">Items need restocking</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedReport('expiry')}
            className="flex items-center space-x-3 p-4 border border-orange-200 rounded-lg hover:bg-orange-50 transition-all group"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-all">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100">Expiry Alert</p>
              <p className="text-sm text-gray-500">Items near expiry</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedReport('stock-valuation')}
            className="flex items-center space-x-3 p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-all group"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-all">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100">Stock Valuation</p>
              <p className="text-sm text-gray-500">Total inventory value</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedReport('movement-analysis')}
            className="flex items-center space-x-3 p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-all group"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-all">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 dark:text-gray-100">Movement Analysis</p>
              <p className="text-sm text-gray-500">Fast vs slow moving</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}