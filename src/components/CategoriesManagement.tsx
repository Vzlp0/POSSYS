import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Save, X } from 'lucide-react';
interface Category {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  display_order: number;
}

interface CategoriesManagementProps {
  onBack: () => void;
}

const loadCategories = (): Category[] => {
  const stored = localStorage.getItem('pos_categories');
  return stored ? JSON.parse(stored) : [];
};

const saveCategories = (cats: Category[]) => {
  localStorage.setItem('pos_categories', JSON.stringify(cats));
};

export default function CategoriesManagement({ onBack }: CategoriesManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    setCategories(loadCategories().filter(c => c.is_active));
    setLoading(false);
  }, []);

  const handleAddCategory = () => {
    setFormData({ name: '', description: '' });
    setEditingCategory(null);
    setShowAddForm(true);
  };

  const handleEditCategory = (category: Category) => {
    setFormData({ name: category.name, description: category.description || '' });
    setEditingCategory(category);
    setShowAddForm(true);
  };

  const handleSaveCategory = () => {
    if (!formData.name.trim()) {
      alert('Category name is required');
      return;
    }

    let allCats = loadCategories();

    if (editingCategory) {
      allCats = allCats.map(c =>
        c.id === editingCategory.id
          ? { ...c, name: formData.name, description: formData.description }
          : c
      );
    } else {
      const maxOrder = allCats.length > 0
        ? Math.max(...allCats.map(c => c.display_order || 0))
        : 0;

      allCats.push({
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        is_active: true,
        display_order: maxOrder + 1
      });
    }

    saveCategories(allCats);
    setCategories(allCats.filter(c => c.is_active));
    setShowAddForm(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
  };

  const handleDeleteCategory = (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    const allCats = loadCategories().map(c =>
      c.id === id ? { ...c, is_active: false } : c
    );
    saveCategories(allCats);
    setCategories(allCats.filter(c => c.is_active));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Item Master</span>
            </button>
          </div>
          <button
            onClick={handleAddCategory}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span>Add Category</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Categories Management
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading categories...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => (
                <div
                  key={category.id}
                  className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{category.name}</h4>
                    {category.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{category.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 rounded-lg"
                      title="Edit category"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-600 rounded-lg"
                      title="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Food, Drinks, Equipment"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
