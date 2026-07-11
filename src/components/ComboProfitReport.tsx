import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';

interface ComboProfitReportProps {
  onBack: () => void;
}

export default function ComboProfitReport({ onBack }: ComboProfitReportProps) {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [comboProfitData, setComboProfitData] = useState<any[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchComboProfitData();
  }, [startDate, endDate]);

  const fetchComboProfitData = () => {
    try {
      setLoading(true);

      // Load combos from localStorage
      const combosRaw = localStorage.getItem('pos_combos');
      const combos: any[] = combosRaw ? JSON.parse(combosRaw) : [];

      if (combos.length === 0) {
        setComboProfitData([]);
        return;
      }

      // Load items for cost/price lookup
      const itemsRaw = localStorage.getItem('pos_items');
      const items: any[] = itemsRaw ? JSON.parse(itemsRaw) : [];
      const itemMap = new Map(items.map((i: any) => [i.id, i]));

      // Build a set of combo parent item IDs
      const comboParentIds = new Set(combos.map((c: any) => c.parent_product_id || c.parentProductId || c.id));

      // Load transactions from localStorage
      const txRaw = localStorage.getItem('pos_transactions');
      const transactions: any[] = txRaw ? JSON.parse(txRaw) : [];

      // Filter transactions by date range and completed status
      const filteredTx = transactions.filter((tx: any) => {
        const txDate = (tx.created_at || tx.createdAt || tx.date || '').split('T')[0];
        const status = tx.status || 'completed';
        return txDate >= startDate && txDate <= endDate && status === 'completed';
      });

      // Build profit data from transaction items that match combo parent IDs
      const profitRows: any[] = [];

      for (const tx of filteredTx) {
        const txItems = tx.items || tx.transaction_items || [];
        const txDate = (tx.created_at || tx.createdAt || tx.date || '').split('T')[0];

        for (const txItem of txItems) {
          const itemId = txItem.item_id || txItem.itemId;
          if (!comboParentIds.has(itemId)) continue;

          // Find the combo definition
          const combo = combos.find((c: any) =>
            (c.parent_product_id || c.parentProductId || c.id) === itemId
          );
          if (!combo) continue;

          const comboPrice = Number(txItem.line_total || txItem.lineTotal) ||
            (Number(txItem.quantity) * Number(txItem.unit_price || txItem.unitPrice || txItem.price || 0));

          // Calculate cost from components
          const comboItems = combo.combo_items || combo.comboItems || combo.components || [];
          const componentDetails: any[] = [];
          let totalCost = 0;

          for (const ci of comboItems) {
            const compId = ci.component_product_id || ci.componentProductId || ci.itemId;
            const compItem = itemMap.get(compId);
            const qty = Number(txItem.quantity || 1) * (ci.max_qty || ci.maxQty || ci.quantity || 1);
            const avgCost = compItem ? (Number(compItem.standard_cost || compItem.standardCost || compItem.cost) || 0) : 0;
            const compCost = qty * avgCost;
            totalCost += compCost;

            const listPrice = compItem ? (Number(compItem.list_price || compItem.listPrice || compItem.price) || 0) : 0;

            componentDetails.push({
              product_name: compItem?.name || ci.name || 'Unknown',
              qty,
              avg_cost: avgCost,
              total_cost: compCost,
              list_price: listPrice,
              target_price_same_margin: 0,
              split_price_by_list: 0
            });
          }

          const profit = comboPrice - totalCost;
          const marginRatio = comboPrice > 0 ? profit / comboPrice : 0;

          // Calculate target and split prices per component
          const totalListValue = componentDetails.reduce((s: number, c: any) => s + (c.list_price * c.qty), 0);
          for (const comp of componentDetails) {
            comp.target_price_same_margin = marginRatio >= 1 ? null : comp.avg_cost / (1 - marginRatio);
            const listShare = totalListValue > 0 ? (comp.list_price * comp.qty) / totalListValue : 0;
            comp.split_price_by_list = comboPrice * listShare;
          }

          const bundleId = `${tx.id}-${txItem.id || txItem.itemId || Math.random().toString(36).slice(2)}`;
          const parentItem = itemMap.get(itemId);

          profitRows.push({
            bundle_id: bundleId,
            sale_date: txDate,
            parent_line_id: txItem.id,
            combo_name: parentItem?.name || txItem.item_name || txItem.itemName || txItem.name || 'Unknown Combo',
            combo_price: comboPrice,
            combo_cost: totalCost,
            profit,
            margin_ratio: marginRatio,
            components: componentDetails
          });
        }
      }

      setComboProfitData(profitRows);
    } catch (error) {
      console.error('Error fetching combo profit data:', error);
      setComboProfitData([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (bundleId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bundleId)) {
        newSet.delete(bundleId);
      } else {
        newSet.add(bundleId);
      }
      return newSet;
    });
  };

  const getTotalMetrics = () => {
    return comboProfitData.reduce(
      (acc, row) => ({
        totalRevenue: acc.totalRevenue + row.combo_price,
        totalCost: acc.totalCost + row.combo_cost,
        totalProfit: acc.totalProfit + row.profit
      }),
      { totalRevenue: 0, totalCost: 0, totalProfit: 0 }
    );
  };

  const totals = getTotalMetrics();
  const avgMargin = totals.totalRevenue > 0 ? totals.totalProfit / totals.totalRevenue : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Combo Profit Analysis</h1>
            <p className="text-gray-600 mt-1">Track combo performance and profitability</p>
          </div>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2">
          <Download className="w-5 h-5" />
          <span>Export</span>
        </button>
      </div>

      {/* Date Range Filters */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">${totals.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">${totals.totalCost.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Profit</p>
              <p className="text-xl font-bold text-green-600">${totals.totalProfit.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Margin</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{(avgMargin * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-900 w-12"></th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Date</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Combo</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Price</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Cost</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Profit</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {comboProfitData.map((row) => (
                <React.Fragment key={row.bundle_id}>
                  <tr className="hover:bg-gray-50 transition-all">
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleRow(row.bundle_id)}
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                      >
                        {expandedRows.has(row.bundle_id) ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-100">{row.sale_date}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{row.combo_name}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-900 dark:text-gray-100">${row.combo_price.toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-900 dark:text-gray-100">${row.combo_cost.toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`font-semibold ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${row.profit.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {(row.margin_ratio * 100).toFixed(1)}%
                        </span>
                        {row.margin_ratio >= 0.3 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row - Component Details */}
                  {expandedRows.has(row.bundle_id) && (
                    <tr>
                      <td colSpan={7} className="bg-gray-50 px-6 py-4">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">Component Breakdown</h4>
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Component</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Qty</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Avg Cost</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Total Cost</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">List Price</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Target Price</th>
                                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Split Price</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {row.components.map((comp: any, idx: number) => (
                                  <tr key={idx}>
                                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{comp.product_name}</td>
                                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">{comp.qty}</td>
                                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">${comp.avg_cost.toFixed(2)}</td>
                                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">${comp.total_cost.toFixed(2)}</td>
                                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-100">${comp.list_price.toFixed(2)}</td>
                                    <td className="py-3 px-4 text-sm text-blue-600 font-medium">
                                      {comp.target_price_same_margin ? `$${comp.target_price_same_margin.toFixed(2)}` : 'N/A'}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">${comp.split_price_by_list.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="text-xs text-gray-500 space-y-1">
                            <p><strong>Target Price:</strong> Solo price to maintain same margin as combo</p>
                            <p><strong>Split Price:</strong> Proportional split of combo price by list price share</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {comboProfitData.length === 0 && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No combo sales data found</h3>
          <p className="text-gray-600 dark:text-gray-400">Sales data will appear here once combos are sold</p>
        </div>
      )}
    </div>
  );
}
