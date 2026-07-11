import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, AlertTriangle, Check, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { applyComboPricing, getAppSettings } from '../lib/comboHelpers';

interface ComboPickerProps {
  productId: string;
  onConfirm: (bundle: ComboBundle) => void;
  onCancel: () => void;
}

export interface ComboBundle {
  bundleId: string;
  parentLine: {
    product_id: string;
    product_name: string;
    qty: number;
    unit_price: number;
    line_discount: number;
    bundle_id: string;
    is_bundle_parent: boolean;
  };
  childLines: Array<{
    product_id: string;
    product_name: string;
    qty: number;
    unit_price: number;
    line_discount: number;
    bundle_id: string;
    is_bundle_parent: boolean;
    list_price: number;
    requires_batch: boolean;
  }>;
  combo: any;
}

export default function ComboPicker({ productId, onConfirm, onCancel }: ComboPickerProps) {
  const [combo, setCombo] = useState<any>(null);
  const [parentProduct, setParentProduct] = useState<any>(null);
  const [comboItems, setComboItems] = useState<any[]>([]);
  const [selectedQuantities, setSelectedQuantities] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComboData();
  }, [productId]);

  const fetchComboData = async () => {
    try {
      setLoading(true);

      // Fetch combo configuration
      const { data: comboData, error: comboError } = await supabase
        .from('combos')
        .select('*')
        .eq('parent_product_id', productId)
        .single();

      if (comboError) throw comboError;
      setCombo(comboData);

      // Fetch parent product
      const { data: productData, error: productError } = await supabase
        .from('items')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) throw productError;
      setParentProduct(productData);

      // Fetch combo items with component product details
      const { data: itemsData, error: itemsError } = await supabase
        .from('combo_items')
        .select(`
          *,
          component_product:items!combo_items_component_product_id_fkey(*)
        `)
        .eq('combo_id', comboData.id);

      if (itemsError) throw itemsError;
      setComboItems(itemsData || []);

      // Initialize quantities with min values
      const initialQtys: { [key: string]: number } = {};
      itemsData?.forEach(item => {
        initialQtys[item.id] = item.is_required ? Math.max(item.min_qty, 1) : item.min_qty;
      });
      setSelectedQuantities(initialQtys);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    const item = comboItems.find(i => i.id === itemId);
    if (!item) return;

    setSelectedQuantities(prev => {
      const currentQty = prev[itemId] || 0;
      const newQty = currentQty + delta;

      // Validate bounds
      if (newQty < item.min_qty) return prev;
      if (item.max_qty && newQty > item.max_qty) return prev;

      return {
        ...prev,
        [itemId]: newQty
      };
    });
  };

  const validateSelection = (): string | null => {
    for (const item of comboItems) {
      const qty = selectedQuantities[item.id] || 0;

      if (item.is_required && qty < item.min_qty) {
        return `${item.component_product.name} is required (min: ${item.min_qty})`;
      }

      if (qty < item.min_qty) {
        return `${item.component_product.name} requires minimum ${item.min_qty}`;
      }

      if (item.max_qty && qty > item.max_qty) {
        return `${item.component_product.name} exceeds maximum ${item.max_qty}`;
      }
    }

    return null;
  };

  const handleConfirm = async () => {
    const validationError = validateSelection();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const bundleId = crypto.randomUUID();
      const settings = await getAppSettings();

      // Prepare child lines
      const childLines = comboItems
        .filter(item => (selectedQuantities[item.id] || 0) > 0)
        .map(item => ({
          product_id: item.component_product.id,
          product_name: item.component_product.name,
          qty: selectedQuantities[item.id],
          unit_price: 0,
          line_discount: 0,
          bundle_id: bundleId,
          is_bundle_parent: false,
          list_price: item.component_product.list_price || 0,
          requires_batch: false // Can be enhanced based on product settings
        }));

      // Prepare parent line
      let parentLine = {
        product_id: parentProduct.id,
        product_name: parentProduct.name,
        qty: 1,
        unit_price: 0,
        line_discount: 0,
        bundle_id: bundleId,
        is_bundle_parent: true
      };

      // Apply pricing
      const pricingResult = applyComboPricing(
        parentLine,
        childLines,
        combo,
        settings.tax_mode
      );

      const bundle: ComboBundle = {
        bundleId,
        parentLine: pricingResult.parent,
        childLines: pricingResult.children,
        combo
      };

      onConfirm(bundle);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const calculateTotal = () => {
    return comboItems.reduce((sum, item) => {
      const qty = selectedQuantities[item.id] || 0;
      const price = item.component_product.list_price || 0;
      return sum + (qty * price);
    }, 0);
  };

  const calculateDiscountedTotal = () => {
    const total = calculateTotal();

    switch (combo?.pricing_mode) {
      case 'FIXED_PRICE':
        return combo.fixed_price;
      case 'DISCOUNT_AMOUNT':
        return Math.max(total - combo.fixed_price, 0);
      case 'DISCOUNT_PERCENT':
        return total * (1 - combo.percent / 100);
      case 'CHEAPEST_FREE':
        const items = comboItems
          .filter(item => (selectedQuantities[item.id] || 0) > 0)
          .map(item => ({
            price: (item.component_product.list_price || 0) * selectedQuantities[item.id]
          }));
        const cheapest = Math.min(...items.map(i => i.price));
        return total - cheapest;
      case 'TIERED':
        const totalQty = Object.values(selectedQuantities).reduce((sum, q) => sum + q, 0);
        return totalQty >= combo.mix_n ? combo.fixed_price : total;
      default:
        return total;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading combo details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Build Your Combo</h3>
              <p className="text-sm text-gray-600 mt-1">{parentProduct?.name}</p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {combo && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                {combo.pricing_mode === 'FIXED_PRICE' && `Fixed Price: $${combo.fixed_price.toFixed(2)}`}
                {combo.pricing_mode === 'DISCOUNT_AMOUNT' && `Save $${combo.fixed_price.toFixed(2)}`}
                {combo.pricing_mode === 'DISCOUNT_PERCENT' && `Save ${combo.percent}%`}
                {combo.pricing_mode === 'CHEAPEST_FREE' && 'Cheapest Item Free!'}
                {combo.pricing_mode === 'TIERED' && `Mix ${combo.mix_n} for $${combo.fixed_price.toFixed(2)}`}
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {comboItems.map(item => {
              const qty = selectedQuantities[item.id] || 0;
              const product = item.component_product;

              return (
                <div
                  key={item.id}
                  className={`border-2 rounded-lg p-4 transition-all ${
                    item.is_required ? 'border-blue-300 bg-blue-50' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{product.name}</h4>
                        {item.is_required && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{product.sku}</p>
                      <p className="text-sm font-medium text-gray-900 mt-2">
                        ${(product.list_price || 0).toFixed(2)} each
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.min_qty > 0 && `Min: ${item.min_qty}`}
                        {item.min_qty > 0 && item.max_qty && ' | '}
                        {item.max_qty && `Max: ${item.max_qty}`}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, -1)}
                        disabled={qty <= item.min_qty}
                        className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-medium">{qty}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, 1)}
                        disabled={item.max_qty && qty >= item.max_qty}
                        className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {qty > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal:</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        ${((product.list_price || 0) * qty).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 dark:bg-gray-900">
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Regular Total:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">${calculateTotal().toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900 dark:text-gray-100">Combo Price:</span>
              <span className="text-xl font-bold text-green-600">
                ${calculateDiscountedTotal().toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600 font-medium">You Save:</span>
              <span className="font-semibold text-green-600">
                ${(calculateTotal() - calculateDiscountedTotal()).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
            >
              <Check className="w-5 h-5" />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
