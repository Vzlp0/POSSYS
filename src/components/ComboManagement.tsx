import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowLeft,
  Save,
  X,
  Package,
  DollarSign,
  Percent,
  ShoppingCart,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Combo {
  id: string;
  parent_product_id: string;
  pricing_mode: 'FIXED_PRICE' | 'DISCOUNT_AMOUNT' | 'DISCOUNT_PERCENT' | 'CHEAPEST_FREE' | 'TIERED';
  fixed_price: number;
  percent: number;
  mix_n: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface ComboItem {
  id: string;
  combo_id: string;
  component_product_id: string;
  min_qty: number;
  max_qty: number;
  is_required: boolean;
  allow_substitutes: boolean;
  substitute_group: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  list_price: number;
  product_type: string;
}

interface ComboManagementProps {
  onBack: () => void;
}

export default function ComboManagement({ onBack }: ComboManagementProps) {
  const { user } = useAuth();
  const [combos, setCombos] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCombo, setEditingCombo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    parent_product_id: '',
    pricing_mode: 'FIXED_PRICE' as const,
    fixed_price: 0,
    percent: 0,
    mix_n: 0,
    notes: '',
    items: [] as any[]
  });

  useEffect(() => {
    fetchCombos();
    fetchProducts();
  }, []);

  const fetchCombos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('combos')
        .select(`
          *,
          parent_product:items!combos_parent_product_id_fkey(id, name, sku, list_price),
          combo_items(
            *,
            component_product:items!combo_items_component_product_id_fkey(id, name, sku, list_price)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCombos(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('id, name, sku, list_price, product_type')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
    }
  };

  const handleAddNew = () => {
    setFormData({
      parent_product_id: '',
      pricing_mode: 'FIXED_PRICE',
      fixed_price: 0,
      percent: 0,
      mix_n: 0,
      notes: '',
      items: []
    });
    setEditingCombo(null);
    setShowAddForm(true);
    setError('');
  };

  const handleEdit = (combo: any) => {
    setFormData({
      parent_product_id: combo.parent_product_id,
      pricing_mode: combo.pricing_mode,
      fixed_price: combo.fixed_price || 0,
      percent: combo.percent || 0,
      mix_n: combo.mix_n || 0,
      notes: combo.notes || '',
      items: combo.combo_items || []
    });
    setEditingCombo(combo);
    setShowAddForm(true);
    setError('');
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      if (!formData.parent_product_id) {
        setError('Please select a parent product');
        return;
      }

      if (formData.items.length === 0) {
        setError('Please add at least one component item');
        return;
      }

      const comboData = {
        parent_product_id: formData.parent_product_id,
        pricing_mode: formData.pricing_mode,
        fixed_price: formData.fixed_price,
        percent: formData.percent,
        mix_n: formData.mix_n,
        notes: formData.notes
      };

      let comboId: string;

      if (editingCombo) {
        const { error: updateError } = await supabase
          .from('combos')
          .update(comboData)
          .eq('id', editingCombo.id);

        if (updateError) throw updateError;
        comboId = editingCombo.id;

        // Delete existing combo items
        await supabase
          .from('combo_items')
          .delete()
          .eq('combo_id', comboId);
      } else {
        const { data: newCombo, error: insertError } = await supabase
          .from('combos')
          .insert(comboData)
          .select()
          .single();

        if (insertError) throw insertError;
        comboId = newCombo.id;

        // Update product type
        await supabase
          .from('items')
          .update({ product_type: 'COMBO_FIXED' })
          .eq('id', formData.parent_product_id);
      }

      // Insert combo items
      const comboItems = formData.items.map(item => ({
        combo_id: comboId,
        component_product_id: item.component_product_id,
        min_qty: item.min_qty || 0,
        max_qty: item.max_qty || 1,
        is_required: item.is_required || false,
        allow_substitutes: item.allow_substitutes || false,
        substitute_group: item.substitute_group || null
      }));

      const { error: itemsError } = await supabase
        .from('combo_items')
        .insert(comboItems);

      if (itemsError) throw itemsError;

      await fetchCombos();
      setShowAddForm(false);
      setEditingCombo(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (comboId: string) => {
    if (!confirm('Are you sure you want to delete this combo?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('combos')
        .delete()
        .eq('id', comboId);

      if (error) throw error;
      await fetchCombos();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          component_product_id: '',
          min_qty: 0,
          max_qty: 1,
          is_required: false,
          allow_substitutes: false,
          substitute_group: ''
        }
      ]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const filteredCombos = combos.filter(combo =>
    combo.parent_product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    combo.parent_product?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <span>Back to Combos</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {editingCombo ? 'Edit Combo' : 'Create New Combo'}
            </h1>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Combo Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Product *
              </label>
              <select
                value={formData.parent_product_id}
                onChange={(e) => setFormData(prev => ({ ...prev, parent_product_id: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!!editingCombo}
              >
                <option value="">Select Product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku}) - ${product.list_price}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pricing Mode *
              </label>
              <select
                value={formData.pricing_mode}
                onChange={(e) => setFormData(prev => ({ ...prev, pricing_mode: e.target.value as any }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="FIXED_PRICE">Fixed Price</option>
                <option value="DISCOUNT_AMOUNT">Discount Amount</option>
                <option value="DISCOUNT_PERCENT">Discount Percent</option>
                <option value="CHEAPEST_FREE">Cheapest Free</option>
                <option value="TIERED">Tiered (Mix & Match)</option>
              </select>
            </div>

            {(formData.pricing_mode === 'FIXED_PRICE' || formData.pricing_mode === 'DISCOUNT_AMOUNT' || formData.pricing_mode === 'TIERED') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.pricing_mode === 'TIERED' ? 'Special Price' : formData.pricing_mode === 'FIXED_PRICE' ? 'Fixed Price' : 'Discount Amount'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fixed_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, fixed_price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {formData.pricing_mode === 'DISCOUNT_PERCENT' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Percent
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.percent}
                  onChange={(e) => setFormData(prev => ({ ...prev, percent: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {formData.pricing_mode === 'TIERED' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Quantity (Mix N)
                </label>
                <input
                  type="number"
                  value={formData.mix_n}
                  onChange={(e) => setFormData(prev => ({ ...prev, mix_n: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Additional notes about this combo"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Combo Components</h2>
            <button
              onClick={handleAddItem}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Component</span>
            </button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Component {index + 1}</h3>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product *
                    </label>
                    <select
                      value={item.component_product_id}
                      onChange={(e) => handleItemChange(index, 'component_product_id', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Product</option>
                      {products.filter(p => p.product_type === 'SIMPLE' || p.product_type === 'VARIANT').map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku}) - ${product.list_price}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Qty
                    </label>
                    <input
                      type="number"
                      value={item.min_qty}
                      onChange={(e) => handleItemChange(index, 'min_qty', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Qty
                    </label>
                    <input
                      type="number"
                      value={item.max_qty}
                      onChange={(e) => handleItemChange(index, 'max_qty', parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Substitute Group
                    </label>
                    <input
                      type="text"
                      value={item.substitute_group}
                      onChange={(e) => handleItemChange(index, 'substitute_group', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Optional"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={item.is_required}
                        onChange={(e) => handleItemChange(index, 'is_required', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Required</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={item.allow_substitutes}
                        onChange={(e) => handleItemChange(index, 'allow_substitutes', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Allow Substitutes</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}

            {formData.items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No components added yet. Click "Add Component" to get started.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4">
          <button
            onClick={() => setShowAddForm(false)}
            className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Combo'}</span>
          </button>
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
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Combo Management</h1>
            <p className="text-gray-600 mt-1">Create and manage product combos with special pricing</p>
          </div>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Combo</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search combos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Product</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Pricing Mode</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Components</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Details</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900 dark:text-gray-100">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCombos.map((combo) => (
                <tr key={combo.id} className="hover:bg-gray-50 transition-all">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{combo.parent_product?.name}</p>
                        <p className="text-sm text-gray-500">{combo.parent_product?.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {combo.pricing_mode.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-900 dark:text-gray-100">{combo.combo_items?.length || 0} items</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {combo.pricing_mode === 'FIXED_PRICE' && `Fixed: $${combo.fixed_price}`}
                      {combo.pricing_mode === 'DISCOUNT_AMOUNT' && `Discount: $${combo.fixed_price}`}
                      {combo.pricing_mode === 'DISCOUNT_PERCENT' && `Discount: ${combo.percent}%`}
                      {combo.pricing_mode === 'CHEAPEST_FREE' && 'Cheapest Free'}
                      {combo.pricing_mode === 'TIERED' && `Mix ${combo.mix_n} for $${combo.fixed_price}`}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(combo)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(combo.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
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

      {filteredCombos.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No combos found</h3>
          <p className="text-gray-600 mb-4">Create your first combo to offer special pricing deals</p>
          <button
            onClick={handleAddNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            Create First Combo
          </button>
        </div>
      )}
    </div>
  );
}
