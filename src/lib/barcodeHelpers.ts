import { supabase } from './supabase';

export interface BarcodePrefix {
  id: string;
  category: string;
  prefix: string;
  description: string;
  next_sequence: number;
  sequence_length: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BarcodeHistoryEntry {
  id: string;
  item_id: string;
  barcode: string;
  barcode_type: 'internal' | 'supplier';
  supplier_id?: string;
  action: 'created' | 'updated' | 'deleted';
  changed_by: string;
  created_at: string;
}

export async function fetchBarcodePrefixes(): Promise<BarcodePrefix[]> {
  const { data, error } = await supabase
    .from('barcode_prefixes')
    .select('*')
    .eq('is_active', true)
    .order('category');

  if (error) {
    console.error('Error fetching barcode prefixes:', error);
    return [];
  }

  return data || [];
}

export async function generateBarcode(category: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('generate_item_barcode', {
      p_category: category
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error generating barcode:', error);
    return null;
  }
}

export async function lookupItemByBarcode(barcode: string): Promise<any | null> {
  try {
    const cleanBarcode = barcode.trim().toUpperCase();

    const { data: internalMatch, error: internalError } = await supabase
      .from('items')
      .select('*')
      .or(`barcode.eq.${cleanBarcode},sku.eq.${cleanBarcode},manufacturer_barcode.eq.${cleanBarcode}`)
      .maybeSingle();

    if (internalError) throw internalError;
    if (internalMatch) {
      const matchType = internalMatch.manufacturer_barcode?.toUpperCase() === cleanBarcode ? 'manufacturer' : 'internal';
      return {
        ...internalMatch,
        matchType,
        matchedBarcode: cleanBarcode
      };
    }

    const { data: allItems, error: supplierError } = await supabase
      .from('items')
      .select('*');

    if (supplierError) throw supplierError;

    for (const item of allItems || []) {
      if (item.suppliers && Array.isArray(item.suppliers)) {
        for (const supplier of item.suppliers) {
          if (supplier.supplierBarcode?.toUpperCase() === cleanBarcode) {
            return {
              ...item,
              matchType: 'supplier',
              matchedBarcode: cleanBarcode,
              matchedSupplier: supplier.supplierName
            };
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error looking up barcode:', error);
    return null;
  }
}

export async function lookupItemsBySupplierBarcode(
  supplierBarcode: string,
  supplierId?: string
): Promise<any[]> {
  try {
    const cleanBarcode = supplierBarcode.trim().toUpperCase();

    const { data: allItems, error } = await supabase
      .from('items')
      .select('*');

    if (error) throw error;

    const matches: any[] = [];
    for (const item of allItems || []) {
      if (item.suppliers && Array.isArray(item.suppliers)) {
        for (const supplier of item.suppliers) {
          const matchesBarcode = supplier.supplierBarcode?.toUpperCase() === cleanBarcode;
          const matchesSupplier = !supplierId || supplier.supplierId === supplierId;

          if (matchesBarcode && matchesSupplier) {
            matches.push({
              ...item,
              matchedSupplier: supplier.supplierName,
              matchedSupplierId: supplier.supplierId
            });
          }
        }
      }
    }

    return matches;
  } catch (error) {
    console.error('Error looking up supplier barcode:', error);
    return [];
  }
}

export async function logBarcodeHistory(
  itemId: string,
  barcode: string,
  barcodeType: 'internal' | 'supplier',
  action: 'created' | 'updated' | 'deleted',
  changedBy: string = 'user',
  supplierId?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('barcode_history')
      .insert({
        item_id: itemId,
        barcode,
        barcode_type: barcodeType,
        supplier_id: supplierId,
        action,
        changed_by: changedBy
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error logging barcode history:', error);
  }
}

export async function validateBarcodeUniqueness(
  barcode: string,
  excludeItemId?: string
): Promise<{ isUnique: boolean; conflictItem?: any }> {
  try {
    const cleanBarcode = barcode.trim().toUpperCase();

    let query = supabase
      .from('items')
      .select('id, name, sku, barcode')
      .eq('barcode', cleanBarcode);

    if (excludeItemId) {
      query = query.neq('id', excludeItemId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;

    if (data) {
      return { isUnique: false, conflictItem: data };
    }

    return { isUnique: true };
  } catch (error) {
    console.error('Error validating barcode uniqueness:', error);
    return { isUnique: false };
  }
}

export function parseBarcodeComponents(barcode: string): {
  prefix: string;
  sequence: string;
  fullBarcode: string;
} | null {
  const match = barcode.match(/^([A-Z]+)-(\d+)$/);
  if (match) {
    return {
      prefix: match[1],
      sequence: match[2],
      fullBarcode: barcode
    };
  }
  return null;
}

export function formatBarcode(prefix: string, sequence: number, length: number = 5): string {
  return `${prefix}-${sequence.toString().padStart(length, '0')}`;
}

export async function getBarcodeHistory(itemId: string): Promise<BarcodeHistoryEntry[]> {
  try {
    const { data, error } = await supabase
      .from('barcode_history')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching barcode history:', error);
    return [];
  }
}

export function identifyBarcodeType(barcode: string): 'internal' | 'supplier' | 'unknown' {
  const internalPattern = /^[A-Z]{2}-\d{5}$/;

  if (internalPattern.test(barcode)) {
    return 'internal';
  }

  if (barcode.length >= 8 && barcode.length <= 14 && /^\d+$/.test(barcode)) {
    return 'supplier';
  }

  return 'unknown';
}

export function getCategoryFromPrefix(prefix: string): string | null {
  const prefixMap: Record<string, string> = {
    'FD': 'Food',
    'DR': 'Drinks',
    'PK': 'Packaging',
    'EQ': 'Equipment',
    'SP': 'Supplies',
    'TL': 'Tools',
    'GN': 'General'
  };

  return prefixMap[prefix] || null;
}
