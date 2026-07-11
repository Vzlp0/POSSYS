import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Package,
  ArrowLeft,
  Save,
  X,
  DollarSign,
  Upload,
  Image as ImageIcon,
  Barcode,
  RefreshCw
} from 'lucide-react';
import { Item } from '../types';
import { supabase } from '../lib/supabase';
import { generateBarcode } from '../lib/barcodeHelpers';
import CategoriesManagement from './CategoriesManagement';

export interface ItemSupplier {
  id: string;
  supplierId: string;
  supplierName: string;
  cost: number;
  unit: string;
  supplierBarcode?: string;
  isMarketRange?: boolean;
  leadTimeDays?: number;
  availableForOnlineOrder: boolean;
  paymentTerms?: string;
  deliveryTerms?: string;
  isPreferred?: boolean;
  isMotherSupplier?: boolean;
}


const units = [
  'pcs',
  'kg',
  'g',
  'liter',
  'ml',
  'bottle',
  'box',
  'pack'
];

const baseUnits = [
  'Piece',
  'Kg',
  'Meter',
  'Litre',
  'Pack'
];

const purchaseUnits = [
  'Box',
  'Carton',
  'Bundle',
  'Pack',
  'Piece',
  'Kg',
  'Meter',
  'Litre'
];

interface ItemMasterProps {
  onBack: () => void;
}

export default function ItemMaster({ onBack }: ItemMasterProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showSupplierModal, setShowSupplierModal] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; description: string; is_active: boolean }>>([]);
  const [showCategoriesPage, setShowCategoriesPage] = useState(false);
  const [arabicModified, setArabicModified] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    name_ar: '',
    sku: '',
    barcode: '',
    manufacturer_barcode: '',
    category: '',
    unit: '',
    price: 0,
    standard_cost: 0,
    vat: 15,
    vat_mode: 'inclusive' as 'inclusive' | 'exclusive',
    average_cost: 0,
    last_purchase_cost: 0,
    markupPercentage: 0,
    isExpiryTracked: false,
    showInPOS: true,
    availableForOnlineOrder: true,
    suppliers: [] as ItemSupplier[],
    image_url: '',
    base_unit: 'Piece',
    purchase_unit: '',
    conversion_factor: 1,
    current_stock_base: 0,
    printed_label_source: 'internal' as 'internal' | 'supplier',
    printed_label_supplier_id: ''
  });

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      alert('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      console.log('Fetched categories:', data);
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleManageCategories = () => {
    setShowCategoriesPage(true);
  };

  const translateToArabic = async (text: string): Promise<string> => {
    if (!text.trim()) return '';

    try {
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=${encodeURIComponent(text)}`);
      const data = await response.json();
      return data[0][0][0] || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  const handleEnglishNameChange = async (value: string) => {
    setFormData(prev => ({ ...prev, name_en: value, name: value }));

    if (!arabicModified && value.trim()) {
      const translated = await translateToArabic(value);
      setFormData(prev => ({ ...prev, name_ar: translated }));
    }
  };

  const generateSKU = () => {
    const nextNumber = items.length + 1;
    return `ITM-${nextNumber.toString().padStart(3, '0')}`;
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      name_en: '',
      name_ar: '',
      sku: generateSKU(),
      barcode: '',
      manufacturer_barcode: '',
      category: '',
      unit: '',
      price: 0,
      standard_cost: 0,
      vat: 15,
      vat_mode: 'inclusive',
      average_cost: 0,
      last_purchase_cost: 0,
      markupPercentage: 0,
      isExpiryTracked: false,
      showInPOS: true,
      availableForOnlineOrder: true,
      suppliers: [],
      image_url: '',
      base_unit: 'Piece',
      purchase_unit: '',
      conversion_factor: 1,
      current_stock_base: 0,
      printed_label_source: 'internal',
      printed_label_supplier_id: ''
    });
    setEditingItem(null);
    setShowAddForm(true);
  };

  const handleEdit = (item: Item) => {
    setArabicModified(true);
    setFormData({
      name: item.name,
      name_en: (item as any).name_en || item.name,
      name_ar: (item as any).name_ar || '',
      sku: item.sku,
      barcode: (item as any).barcode || '',
      manufacturer_barcode: (item as any).manufacturer_barcode || '',
      category: item.category,
      unit: item.unit,
      price: item.price || 0,
      standard_cost: (item as any).standard_cost || item.cost || 0,
      vat: (item as any).vat || 15,
      vat_mode: (item as any).vat_mode || 'inclusive',
      average_cost: (item as any).average_cost || 0,
      last_purchase_cost: (item as any).last_purchase_cost || 0,
      markupPercentage: item.markupPercentage || 0,
      isExpiryTracked: item.isExpiryTracked,
      showInPOS: item.showInPOS,
      availableForOnlineOrder: item.availableForOnlineOrder || false,
      suppliers: item.suppliers || [],
      image_url: (item as any).image_url || '',
      base_unit: (item as any).base_unit || 'Piece',
      purchase_unit: (item as any).purchase_unit || '',
      conversion_factor: (item as any).conversion_factor || 1,
      current_stock_base: (item as any).current_stock_base || 0,
      printed_label_source: (item as any).printed_label_source || 'internal',
      printed_label_supplier_id: (item as any).printed_label_supplier_id || ''
    });
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleSave = async () => {
    if (!formData.name_en || !formData.category || !formData.unit) {
      alert('Please fill in all required fields (English name is required)');
      return;
    }

    if (formData.showInPOS && formData.price <= 0) {
      alert('Please set a selling price for items that show in POS');
      return;
    }

    if (formData.standard_cost > 0 && formData.price > 0 && formData.price < formData.standard_cost) {
      const confirmed = confirm(
        'Warning: Selling price is less than standard cost. This item will sell at a loss. Continue anyway?'
      );
      if (!confirmed) return;
    }

    if (!formData.base_unit) {
      alert('Please select a base unit');
      return;
    }

    if (formData.purchase_unit && formData.conversion_factor <= 0) {
      alert('Conversion factor must be greater than 0');
      return;
    }

    console.log('Saving item with data:', formData);

    try {
      if (editingItem) {
        console.log('Updating item:', editingItem.id);
        const { data, error } = await supabase
          .from('items')
          .update({
            name: formData.name_en,
            name_en: formData.name_en,
            name_ar: formData.name_ar,
            sku: formData.sku,
            barcode: formData.barcode || null,
            manufacturer_barcode: formData.manufacturer_barcode || null,
            category: formData.category,
            unit: formData.unit,
            price: formData.price,
            cost: formData.standard_cost,
            standard_cost: formData.standard_cost,
            vat: formData.vat,
            vat_mode: formData.vat_mode,
            vat_rate: formData.vat,
            average_cost: formData.average_cost,
            last_purchase_cost: formData.last_purchase_cost,
            markup_percentage: formData.markupPercentage,
            last_price_update: new Date().toISOString(),
            is_expiry_tracked: formData.isExpiryTracked,
            show_in_pos: formData.showInPOS,
            available_for_online_order: formData.availableForOnlineOrder,
            suppliers: formData.suppliers,
            image_url: formData.image_url,
            base_unit: formData.base_unit,
            purchase_unit: formData.purchase_unit || null,
            conversion_factor: formData.conversion_factor,
            current_stock_base: formData.current_stock_base,
            printed_label_source: formData.printed_label_source,
            printed_label_supplier_id: formData.printed_label_supplier_id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        console.log('Update successful:', data);
      } else {
        console.log('Inserting new item');
        const { data, error } = await supabase
          .from('items')
          .insert({
            name: formData.name_en,
            name_en: formData.name_en,
            name_ar: formData.name_ar,
            sku: formData.sku,
            barcode: formData.barcode || null,
            manufacturer_barcode: formData.manufacturer_barcode || null,
            category: formData.category,
            unit: formData.unit,
            price: formData.price,
            cost: formData.standard_cost,
            standard_cost: formData.standard_cost,
            vat: formData.vat,
            vat_mode: formData.vat_mode,
            vat_rate: formData.vat,
            average_cost: formData.average_cost,
            last_purchase_cost: formData.last_purchase_cost,
            markup_percentage: formData.markupPercentage,
            last_price_update: new Date().toISOString(),
            is_expiry_tracked: formData.isExpiryTracked,
            show_in_pos: formData.showInPOS,
            available_for_online_order: formData.availableForOnlineOrder,
            suppliers: formData.suppliers,
            image_url: formData.image_url,
            base_unit: formData.base_unit,
            purchase_unit: formData.purchase_unit || null,
            conversion_factor: formData.conversion_factor,
            current_stock_base: formData.current_stock_base,
            printed_label_source: formData.printed_label_source,
            printed_label_supplier_id: formData.printed_label_supplier_id || null
          });

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        console.log('Insert successful:', data);
      }

      console.log('Fetching items...');
      await fetchItems();
      setShowAddForm(false);
      setEditingItem(null);
      alert('Item saved successfully!');
    } catch (error: any) {
      console.error('Error saving item:', error);
      alert(`Failed to save item: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        const { error } = await supabase
          .from('items')
          .delete()
          .eq('id', id);

        if (error) throw error;
        await fetchItems();
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item');
      }
    }
  };

  const handleAddSupplier = () => {
    const newSupplier: ItemSupplier = {
      id: Date.now().toString(),
      supplierId: '',
      supplierName: '',
      cost: 0,
      unit: ''
    };
    setFormData(prev => ({
      ...prev,
      suppliers: [...prev.suppliers, newSupplier]
    }));
  };

  const handleRemoveSupplier = (supplierId: string) => {
    setFormData(prev => ({
      ...prev,
      suppliers: prev.suppliers.filter(supplier => supplier.id !== supplierId)
    }));
  };

  const handleSupplierChange = (supplierId: string, field: keyof ItemSupplier, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      suppliers: prev.suppliers.map(supplier => 
        supplier.id === supplierId 
          ? { ...supplier, [field]: value }
          : supplier
      )
    }));
  };

  const handleSupplierSelect = (supplierId: string, selectedSupplierId: string) => {
    const selectedSupplier = mockSuppliers.find(s => s.supplierId === selectedSupplierId);
    if (selectedSupplier) {
      setFormData(prev => ({
        ...prev,
        suppliers: prev.suppliers.map(supplier => 
          supplier.id === supplierId 
            ? { 
                ...supplier, 
                supplierId: selectedSupplier.supplierId,
                supplierName: selectedSupplier.supplierName
              }
            : supplier
        )
      }));
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  if (showCategoriesPage) {
    return (
      <CategoriesManagement
        onBack={() => {
          setShowCategoriesPage(false);
          fetchCategories();
        }}
      />
    );
  }

  if (showAddForm) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Items</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h1>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name (English) *
                </label>
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={(e) => handleEnglishNameChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter item name in English"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Item Name (Arabic) - اسم المنتج
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name_ar}
                    onChange={(e) => {
                      setArabicModified(true);
                      setFormData(prev => ({ ...prev, name_ar: e.target.value }));
                    }}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                    placeholder="أدخل اسم المنتج بالعربية"
                    dir="rtl"
                    lang="ar"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (formData.name_en.trim()) {
                        const translated = await translateToArabic(formData.name_en);
                        setFormData(prev => ({ ...prev, name_ar: translated }));
                        setArabicModified(false);
                      }
                    }}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    title="Refresh translation"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right" dir="rtl">
                  تمت الترجمة تلقائيًا — يمكنك التعديل
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU / Code
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Auto-generated SKU"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">SKU is auto-generated but can be modified</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Internal Barcode (Your Label)
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                      placeholder="Auto-generated"
                      readOnly
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (formData.category) {
                        const newBarcode = await generateBarcode(formData.category);
                        if (newBarcode) {
                          setFormData(prev => ({ ...prev, barcode: newBarcode }));
                        }
                      } else {
                        alert('Please select a category first');
                      }
                    }}
                    className="p-2.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                    title="Regenerate barcode"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  POS will recognize this barcode on your labels
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Manufacturer Barcode
              </label>
              <div className="relative">
                <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.manufacturer_barcode || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, manufacturer_barcode: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="Scan or type manufacturer's barcode"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                The barcode printed on the product by the manufacturer. POS will recognize both your internal barcode and this one.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Item Image
              </label>
              <div className="space-y-4">
                {formData.image_url ? (
                  <div className="relative">
                    <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                      <img
                        src={formData.image_url}
                        alt="Item preview"
                        className="max-h-48 mx-auto object-contain rounded-lg"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-all">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Click to upload image
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                )}
                {formData.image_url && (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm">
                      <Upload className="w-4 h-4" />
                      <span>Change Image</span>
                    </div>
                  </label>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category *
                </label>
                <button
                  type="button"
                  onClick={handleManageCategories}
                  className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Plus className="w-4 h-4" />
                  <span>Manage Categories</span>
                </button>
              </div>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Unit</option>
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Flexible Units Configuration</h3>
                <p className="text-sm text-gray-600 mt-1">Configure how this item is purchased and stored in inventory</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Unit *
                    </label>
                    <select
                      value={formData.base_unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, base_unit: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {baseUnits.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Unit for inventory storage</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Purchase Unit
                    </label>
                    <select
                      value={formData.purchase_unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchase_unit: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Same as base unit</option>
                      {purchaseUnits.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Unit when ordering</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Conversion Factor *
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={formData.conversion_factor}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 1;
                        setFormData(prev => ({ ...prev, conversion_factor: value }));
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1"
                      disabled={!formData.purchase_unit}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Base units per purchase unit</p>
                  </div>
                </div>

                {formData.purchase_unit && formData.conversion_factor > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Package className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Unit Conversion</p>
                        <p className="text-base font-bold text-blue-700">
                          1 {formData.purchase_unit} = {formData.conversion_factor} {formData.base_unit}
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          When you receive {formData.purchase_unit}s from suppliers, the system will automatically convert to {formData.base_unit}s for inventory tracking.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {formData.current_stock_base > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Package className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-900 mb-2">Current Stock</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-green-600">In Base Units</p>
                            <p className="text-lg font-bold text-green-700">
                              {formData.current_stock_base} {formData.base_unit}
                            </p>
                          </div>
                          {formData.purchase_unit && formData.conversion_factor > 0 && (
                            <div>
                              <p className="text-xs text-green-600">In Purchase Units</p>
                              <p className="text-lg font-bold text-green-700">
                                {(formData.current_stock_base / formData.conversion_factor).toFixed(2)} {formData.purchase_unit}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pricing Information</h3>
                <p className="text-sm text-gray-600 mt-1">Set the standard cost and selling price for this item</p>
              </div>

              <div className="space-y-4">
                {/* Row 1: Selling Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selling Price *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => {
                        const price = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({ ...prev, price }));
                      }}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Price customers pay at POS</p>
                </div>

                {/* Row 2: Cost and VAT Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Standard Cost
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.standard_cost}
                        onChange={(e) => {
                          const standard_cost = parseFloat(e.target.value) || 0;
                          setFormData(prev => ({ ...prev, standard_cost }));
                        }}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Base reference cost</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      VAT %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.vat}
                        onChange={(e) => {
                          const vat = parseFloat(e.target.value) || 0;
                          setFormData(prev => ({ ...prev, vat }));
                        }}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="15.00"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">VAT percentage</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      VAT Mode *
                    </label>
                    <select
                      value={formData.vat_mode}
                      onChange={(e) => setFormData(prev => ({ ...prev, vat_mode: e.target.value as 'inclusive' | 'exclusive' }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="inclusive">Inclusive (INC)</option>
                      <option value="exclusive">Exclusive (EXC)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.vat_mode === 'inclusive' ? 'Price includes VAT' : 'VAT added on top'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Average Cost
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.average_cost}
                        onChange={(e) => {
                          const average_cost = parseFloat(e.target.value) || 0;
                          setFormData(prev => ({ ...prev, average_cost }));
                        }}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-900"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Purchase Cost
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.last_purchase_cost}
                        onChange={(e) => {
                          const last_purchase_cost = parseFloat(e.target.value) || 0;
                          setFormData(prev => ({ ...prev, last_purchase_cost }));
                        }}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-900"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">From last PO</p>
                  </div>
                </div>

                {/* Row 3: Markup */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Markup %
                  </label>
                  <div className="relative max-w-xs">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.markupPercentage}
                      onChange={(e) => {
                        const markupPercentage = parseFloat(e.target.value) || 0;
                        const cost = formData.standard_cost || 0;
                        const calculatedPrice = cost * (1 + markupPercentage / 100);
                        setFormData(prev => ({
                          ...prev,
                          markupPercentage,
                          price: parseFloat(calculatedPrice.toFixed(2))
                        }));
                      }}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Auto-calculate selling price from standard cost</p>
                </div>
              </div>

              {formData.standard_cost > 0 && formData.price > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Profit Margin</p>
                      <p className="text-lg font-semibold text-green-600">
                        ${(formData.price - formData.standard_cost).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Margin %</p>
                      <p className={`text-lg font-semibold ${
                        ((formData.price - formData.standard_cost) / formData.price * 100) > 30
                          ? 'text-green-600'
                          : ((formData.price - formData.standard_cost) / formData.price * 100) > 15
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        {((formData.price - formData.standard_cost) / formData.price * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Status</p>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        formData.price > formData.standard_cost
                          ? 'bg-green-100 text-green-800'
                          : formData.price === formData.standard_cost
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {formData.price > formData.standard_cost ? 'Profitable' : formData.price === formData.standard_cost ? 'Break-even' : 'Loss'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Tracking
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.isExpiryTracked}
                  onChange={(e) => setFormData(prev => ({ ...prev, isExpiryTracked: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Has Expiry</span>
                  <p className="text-sm text-gray-500">Enable expiry date tracking for this item</p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                POS Visibility
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.showInPOS}
                  onChange={(e) => setFormData(prev => ({ ...prev, showInPOS: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show in POS</span>
                  <p className="text-sm text-gray-500">Make this item available for sale in the POS system</p>
                </div>
              </label>
            </div>
            <div className="col-span-2 border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Associated Suppliers (Optional)</h3>
                  <p className="text-sm text-gray-600 mt-1">Link this item with suppliers for procurement and cost tracking</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSupplier}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Supplier</span>
                </button>
              </div>

              {formData.suppliers.length > 0 ? (
                <div className="space-y-4">
                  {formData.suppliers.map((supplier, index) => (
                    <div key={supplier.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="space-y-4">
                        {/* First Row: Supplier, Barcode, Cost and Unit */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Supplier *
                          </label>
                          <div className="space-y-2">
                            <select
                              value={supplier.supplierId}
                              onChange={(e) => handleSupplierSelect(supplier.id, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required={!supplier.isMarketRange}
                              disabled={supplier.isMarketRange}
                            >
                              <option value="">Select Supplier</option>
                              {mockSuppliers.filter(s => s.active).map(s => (
                                <option key={s.supplierId} value={s.supplierId}>
                                  {s.supplierName}
                                </option>
                              ))}
                            </select>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={supplier.isMarketRange}
                                onChange={(e) => handleSupplierChange(supplier.id, 'isMarketRange', e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Market Range</span>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cost *
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={supplier.cost}
                              onChange={(e) => handleSupplierChange(supplier.id, 'cost', parseFloat(e.target.value) || 0)}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Unit *
                          </label>
                          <select
                            value={supplier.unit}
                            onChange={(e) => handleSupplierChange(supplier.id, 'unit', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            <option value="">Select Unit</option>
                            {units.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </div>
                        </div>

                        {/* Second Row: Lead Time and Terms */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Lead Time (Days)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={supplier.leadTimeDays || ''}
                              onChange={(e) => handleSupplierChange(supplier.id, 'leadTimeDays', parseInt(e.target.value) || undefined)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter lead time"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Payment Terms
                            </label>
                            <input
                              type="text"
                              value={supplier.paymentTerms || ''}
                              onChange={(e) => handleSupplierChange(supplier.id, 'paymentTerms', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., Net 30, COD"
                            />
                          </div>
                        </div>

                        {/* Third Row: Delivery Terms and Checkboxes */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Delivery Terms
                            </label>
                            <input
                              type="text"
                              value={supplier.deliveryTerms || ''}
                              onChange={(e) => handleSupplierChange(supplier.id, 'deliveryTerms', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., FOB, CIF"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={supplier.isPreferred}
                                onChange={(e) => handleSupplierChange(supplier.id, 'isPreferred', e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Preferred Supplier</span>
                            </label>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={supplier.isMotherSupplier}
                                onChange={(e) => {
                                  // Only one mother supplier allowed
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      suppliers: prev.suppliers.map(s => 
                                        s.id === supplier.id 
                                          ? { ...s, isMotherSupplier: true }
                                          : { ...s, isMotherSupplier: false }
                                      )
                                    }));
                                  } else {
                                    handleSupplierChange(supplier.id, 'isMotherSupplier', false);
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mother Supplier</span>
                            </label>
                          </div>

                          <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveSupplier(supplier.id)}
                            className="w-full bg-red-100 text-red-700 px-3 py-2 rounded-lg font-medium hover:bg-red-200 transition-all flex items-center justify-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Remove</span>
                          </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No suppliers linked to this item</p>
                  <p className="text-xs text-gray-500 mt-1">Suppliers are optional. You can add them later for procurement tracking.</p>
                  <p className="text-xs text-gray-400 mt-2">Click "Add Supplier" above to link suppliers if needed.</p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4 pt-4">
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{editingItem ? 'Update Item' : 'Save Item'}</span>
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
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
            <span>Back to Procurement</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Item Master</h1>
            <p className="text-gray-600 mt-1">Manage your product catalog and item information</p>
          </div>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Item</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search items by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Item Name</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">SKU</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Category</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Units</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Stock</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Pricing</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Show in POS</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Suppliers</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-all">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {(item as any).image_url ? (
                          <img
                            src={(item as any).image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{(item as any).name_en || item.name}</p>
                        {(item as any).name_ar && (
                          <p className="text-sm text-gray-600 text-right" dir="rtl" lang="ar">
                            {(item as any).name_ar}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {item.sku}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Base:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {(item as any).base_unit || 'Piece'}
                        </span>
                      </div>
                      {(item as any).purchase_unit && (
                        <>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Purchase:</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {(item as any).purchase_unit}
                            </span>
                          </div>
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            1 {(item as any).purchase_unit} = {(item as any).conversion_factor || 1} {(item as any).base_unit || 'Piece'}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Base:</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {((item as any).current_stock_base || 0).toFixed(2)} {(item as any).base_unit || 'Piece'}
                        </span>
                      </div>
                      {(item as any).purchase_unit && (item as any).conversion_factor > 0 && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Purchase:</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {(((item as any).current_stock_base || 0) / ((item as any).conversion_factor || 1)).toFixed(2)} {(item as any).purchase_unit}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Price:</span>
                        <span className="font-semibold text-green-600">
                          ${(item.price || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Cost:</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          ${(item.cost || 0).toFixed(2)}
                        </span>
                      </div>
                      {item.price > 0 && item.cost > 0 && (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          ((item.price - item.cost) / item.price * 100) > 30
                            ? 'bg-green-100 text-green-800'
                            : ((item.price - item.cost) / item.price * 100) > 15
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {((item.price - item.cost) / item.price * 100).toFixed(1)}% margin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      item.showInPOS
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800 dark:text-gray-200'
                    }`}>
                      {item.showInPOS ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 dark:text-gray-100">{item.suppliers?.length || 0}</span>
                      <span className="text-gray-500 text-sm">supplier(s)</span>
                      {(item.suppliers?.length || 0) > 0 && (
                        <button
                          onClick={() => setShowSupplierModal(item.id)}
                          className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium hover:bg-blue-200 transition-all"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria.</p>
          <button
            onClick={handleAddNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            Add Your First Item
          </button>
        </div>
      )}

      {/* Supplier Details Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            {(() => {
              const item = items.find(i => i.id === showSupplierModal);
              if (!item || !item.suppliers || item.suppliers.length === 0) return null;
              
              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Supplier Details</h3>
                      <p className="text-gray-600 dark:text-gray-400">{item.name} ({item.sku})</p>
                    </div>
                    <button
                      onClick={() => setShowSupplierModal(null)}
                      className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Supplier</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Cost</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Unit</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Lead Time</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Payment Terms</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Delivery Terms</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {item.suppliers.map((supplier) => (
                          <tr key={supplier.id}>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  {supplier.isMarketRange ? 'Market Range' : supplier.supplierName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {supplier.isMarketRange ? 'Reference Price' : supplier.supplierId}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-green-600">
                                ${supplier.cost.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-900 dark:text-gray-100">{supplier.unit}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-900 dark:text-gray-100">
                                {supplier.leadTimeDays ? `${supplier.leadTimeDays} days` : '-'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-900 dark:text-gray-100">{supplier.paymentTerms || '-'}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-900 dark:text-gray-100">{supplier.deliveryTerms || '-'}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col space-y-1">
                                {supplier.isMotherSupplier && (
                                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Mother Supplier
                                  </span>
                                )}
                                {supplier.isPreferred && (
                                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Preferred
                                  </span>
                                )}
                                {supplier.isMarketRange && (
                                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    Market Range
                                  </span>
                                )}
                                {!supplier.isMotherSupplier && !supplier.isPreferred && !supplier.isMarketRange && (
                                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:text-gray-200">
                                    Standard
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
                    <button
                      onClick={() => setShowSupplierModal(null)}
                      className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-all"
                    >
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}