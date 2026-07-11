import { supabase } from './supabase';

export interface SaleLine {
  id?: string;
  product_id: string;
  product_name?: string;
  qty: number;
  unit_price: number;
  line_discount: number;
  bundle_id?: string;
  is_bundle_parent?: boolean;
  list_price?: number;
}

export interface ComboConfig {
  id: string;
  pricing_mode: 'FIXED_PRICE' | 'DISCOUNT_AMOUNT' | 'DISCOUNT_PERCENT' | 'CHEAPEST_FREE' | 'TIERED';
  fixed_price: number;
  percent: number;
  mix_n: number;
}

export interface AppSettings {
  tax_mode: 'PARENT_PRICED' | 'COMPONENT_PRICED';
  combos_enabled: boolean;
}

/**
 * Fetch app settings from database
 */
export async function getAppSettings(): Promise<AppSettings> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_key, setting_value');

    if (error) throw error;

    const settings: any = {};
    data?.forEach(setting => {
      settings[setting.setting_key] = setting.setting_value === 'true' ? true :
                                      setting.setting_value === 'false' ? false :
                                      setting.setting_value;
    });

    return {
      tax_mode: settings.tax_mode || 'PARENT_PRICED',
      combos_enabled: settings.combos_enabled !== false
    };
  } catch (error) {
    console.error('Error fetching app settings:', error);
    return {
      tax_mode: 'PARENT_PRICED',
      combos_enabled: true
    };
  }
}

/**
 * Apply combo pricing rules to a bundle
 */
export function applyComboPricing(
  parentLine: SaleLine,
  childLines: SaleLine[],
  combo: ComboConfig,
  taxMode: 'PARENT_PRICED' | 'COMPONENT_PRICED'
): { parent: SaleLine; children: SaleLine[] } {
  // Calculate sum of list prices
  const sumList = childLines.reduce((sum, child) => {
    return sum + (child.qty * (child.list_price || 0));
  }, 0);

  let updatedParent = { ...parentLine };
  let updatedChildren = childLines.map(c => ({ ...c }));

  switch (combo.pricing_mode) {
    case 'FIXED_PRICE':
      updatedParent.unit_price = combo.fixed_price;
      updatedParent.line_discount = 0;
      updatedChildren = updatedChildren.map(child => ({
        ...child,
        unit_price: 0,
        line_discount: 0
      }));
      break;

    case 'DISCOUNT_AMOUNT':
      if (taxMode === 'PARENT_PRICED') {
        updatedParent.unit_price = Math.max(sumList - combo.fixed_price, 0);
        updatedParent.line_discount = 0;
        updatedChildren = updatedChildren.map(child => ({
          ...child,
          unit_price: 0,
          line_discount: 0
        }));
      } else {
        updatedParent.unit_price = 0;
        updatedParent.line_discount = 0;
        // Distribute discount proportionally
        const totalDiscount = combo.fixed_price;
        updatedChildren = updatedChildren.map(child => {
          const childListTotal = child.qty * (child.list_price || 0);
          const childShare = sumList > 0 ? childListTotal / sumList : 0;
          const childDiscount = totalDiscount * childShare;
          return {
            ...child,
            unit_price: child.list_price || 0,
            line_discount: childDiscount
          };
        });
      }
      break;

    case 'DISCOUNT_PERCENT':
      const discountMultiplier = 1 - (combo.percent / 100);
      if (taxMode === 'PARENT_PRICED') {
        updatedParent.unit_price = sumList * discountMultiplier;
        updatedParent.line_discount = 0;
        updatedChildren = updatedChildren.map(child => ({
          ...child,
          unit_price: 0,
          line_discount: 0
        }));
      } else {
        updatedParent.unit_price = 0;
        updatedParent.line_discount = 0;
        updatedChildren = updatedChildren.map(child => ({
          ...child,
          unit_price: (child.list_price || 0) * discountMultiplier,
          line_discount: 0
        }));
      }
      break;

    case 'CHEAPEST_FREE':
      // Sort by price to find cheapest
      const sortedByPrice = [...updatedChildren].sort((a, b) => {
        const priceA = (a.list_price || 0) * a.qty;
        const priceB = (b.list_price || 0) * b.qty;
        return priceA - priceB;
      });
      const cheapest = sortedByPrice[0];
      const cheapestTotal = (cheapest.list_price || 0) * cheapest.qty;

      if (taxMode === 'PARENT_PRICED') {
        updatedParent.unit_price = Math.max(sumList - cheapestTotal, 0);
        updatedParent.line_discount = 0;
        updatedChildren = updatedChildren.map(child => ({
          ...child,
          unit_price: 0,
          line_discount: 0
        }));
      } else {
        updatedParent.unit_price = 0;
        updatedParent.line_discount = 0;
        updatedChildren = updatedChildren.map(child => {
          if (child.product_id === cheapest.product_id) {
            return {
              ...child,
              unit_price: 0,
              line_discount: cheapestTotal
            };
          }
          return {
            ...child,
            unit_price: child.list_price || 0,
            line_discount: 0
          };
        });
      }
      break;

    case 'TIERED':
      const totalQty = childLines.reduce((sum, child) => sum + child.qty, 0);
      if (totalQty >= combo.mix_n) {
        updatedParent.unit_price = combo.fixed_price;
      } else {
        updatedParent.unit_price = sumList;
      }
      updatedParent.line_discount = 0;
      updatedChildren = updatedChildren.map(child => ({
        ...child,
        unit_price: 0,
        line_discount: 0
      }));
      break;
  }

  return {
    parent: updatedParent,
    children: updatedChildren
  };
}

/**
 * Calculate combo cost and profit
 */
export interface ComboCostResult {
  combo_price: number;
  combo_cost: number;
  profit: number;
  margin_ratio: number;
  components: ComponentCost[];
}

export interface ComponentCost {
  product_id: string;
  product_name: string;
  qty: number;
  avg_cost: number;
  total_cost: number;
  list_price: number;
  target_price_same_margin: number | null;
  split_price_by_list: number;
}

export async function calculateComboCost(
  bundleId: string,
  parentLine: SaleLine,
  childLines: SaleLine[]
): Promise<ComboCostResult> {
  // Calculate combo price
  const combo_price = (parentLine.qty * parentLine.unit_price) - parentLine.line_discount;

  // Fetch batch costs for children
  const childCosts = await Promise.all(
    childLines.map(async (child) => {
      let avgCost = 0;
      let totalCost = 0;

      // Try to get batch costs
      if (child.id) {
        const { data: batches } = await supabase
          .from('sale_line_batches')
          .select('qty_from_batch, unit_cost_snapshot')
          .eq('sale_line_id', child.id);

        if (batches && batches.length > 0) {
          const totalQty = batches.reduce((sum, b) => sum + b.qty_from_batch, 0);
          const weightedCost = batches.reduce((sum, b) => sum + (b.qty_from_batch * b.unit_cost_snapshot), 0);
          avgCost = totalQty > 0 ? weightedCost / totalQty : 0;
          totalCost = weightedCost;
        }
      }

      // Fallback to standard cost
      if (avgCost === 0) {
        const { data: product } = await supabase
          .from('items')
          .select('standard_cost')
          .eq('id', child.product_id)
          .single();

        avgCost = product?.standard_cost || 0;
        totalCost = avgCost * child.qty;
      }

      return {
        product_id: child.product_id,
        product_name: child.product_name || '',
        qty: child.qty,
        avg_cost: avgCost,
        total_cost: totalCost,
        list_price: child.list_price || 0,
        target_price_same_margin: 0,
        split_price_by_list: 0
      };
    })
  );

  // Calculate total combo cost
  const combo_cost = childCosts.reduce((sum, c) => sum + c.total_cost, 0);
  const profit = combo_price - combo_cost;
  const margin_ratio = combo_price > 0 ? profit / combo_price : 0;

  // Calculate per-component metrics
  const totalListValue = childCosts.reduce((sum, c) => sum + (c.list_price * c.qty), 0);

  const components = childCosts.map(comp => {
    // Target price to maintain same margin
    const target_price_same_margin = margin_ratio >= 1 ? null : comp.avg_cost / (1 - margin_ratio);

    // Split price proportionally by list price
    const listShare = totalListValue > 0 ? (comp.list_price * comp.qty) / totalListValue : 0;
    const split_price_by_list = combo_price * listShare;

    return {
      ...comp,
      target_price_same_margin,
      split_price_by_list
    };
  });

  return {
    combo_price,
    combo_cost,
    profit,
    margin_ratio,
    components
  };
}

/**
 * Get available batches for a product (FEFO - First Expiry First Out)
 */
export async function getAvailableBatches(productId: string) {
  try {
    const { data, error } = await supabase
      .from('inventory_batches')
      .select('*')
      .eq('product_id', productId)
      .gt('qty_on_hand', 0)
      .order('expiry_date', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching batches:', error);
    return [];
  }
}

/**
 * Allocate quantity to batches and create sale line batches
 */
export async function allocateBatches(
  saleLineId: string,
  productId: string,
  requiredQty: number
): Promise<boolean> {
  try {
    const batches = await getAvailableBatches(productId);

    let remainingQty = requiredQty;
    const allocations = [];

    for (const batch of batches) {
      if (remainingQty <= 0) break;

      const qtyToAllocate = Math.min(remainingQty, batch.qty_on_hand);

      allocations.push({
        sale_line_id: saleLineId,
        batch_no: batch.batch_no,
        qty_from_batch: qtyToAllocate,
        expiry_date: batch.expiry_date,
        unit_cost_snapshot: batch.unit_cost
      });

      // Update batch quantity
      await supabase
        .from('inventory_batches')
        .update({ qty_on_hand: batch.qty_on_hand - qtyToAllocate })
        .eq('id', batch.id);

      remainingQty -= qtyToAllocate;
    }

    if (remainingQty > 0) {
      console.warn(`Could not allocate full quantity. Remaining: ${remainingQty}`);
    }

    // Insert sale line batches
    if (allocations.length > 0) {
      const { error } = await supabase
        .from('sale_line_batches')
        .insert(allocations);

      if (error) throw error;
    }

    return remainingQty === 0;
  } catch (error) {
    console.error('Error allocating batches:', error);
    return false;
  }
}
