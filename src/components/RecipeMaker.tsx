import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  ArrowLeft,
  Save,
  X,
  Package,
  Calculator,
  ChefHat,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  FileText
} from 'lucide-react';
import { Recipe, RecipeIngredient, Item } from '../types';

interface RecipeMakerProps {
  onBack: () => void;
}

const RECIPES_KEY = 'pos_recipes';
const ITEMS_KEY = 'pos_items';

const SAMPLE_ITEMS: Item[] = [
  { id: 'sample-1', name: 'Flour', sku: 'FLR-001', unit: 'kg', category: 'Ingredients', quantity: 100, reorderPoint: 10, suppliers: [{ cost: 1.50 }] } as any,
  { id: 'sample-2', name: 'Sugar', sku: 'SGR-001', unit: 'kg', category: 'Ingredients', quantity: 50, reorderPoint: 5, suppliers: [{ cost: 2.00 }] } as any,
  { id: 'sample-3', name: 'Butter', sku: 'BTR-001', unit: 'kg', category: 'Ingredients', quantity: 30, reorderPoint: 5, suppliers: [{ cost: 5.00 }] } as any,
  { id: 'sample-4', name: 'Eggs', sku: 'EGG-001', unit: 'pcs', category: 'Ingredients', quantity: 200, reorderPoint: 20, suppliers: [{ cost: 0.25 }] } as any,
  { id: 'sample-5', name: 'Milk', sku: 'MLK-001', unit: 'L', category: 'Ingredients', quantity: 40, reorderPoint: 10, suppliers: [{ cost: 1.20 }] } as any,
];

export default function RecipeMaker({ onBack }: RecipeMakerProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipes();
    loadItems();
  }, []);

  const loadRecipes = () => {
    try {
      setLoading(true);
      const stored = localStorage.getItem(RECIPES_KEY);
      const parsed: Recipe[] = stored ? JSON.parse(stored) : [];
      // Recalculate totalCost for each recipe
      const mapped = parsed.map(r => ({
        ...r,
        totalCost: (r.ingredients || []).reduce((sum, ing) => sum + (ing.lineCost || 0), 0)
      }));
      setRecipes(mapped);
    } catch (error) {
      console.error('Error loading recipes:', error);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = () => {
    try {
      const stored = localStorage.getItem(ITEMS_KEY);
      const parsed: Item[] = stored ? JSON.parse(stored) : [];
      setItems(parsed.length > 0 ? parsed : SAMPLE_ITEMS);
    } catch (error) {
      console.error('Error loading items:', error);
      setItems(SAMPLE_ITEMS);
    }
  };

  const saveRecipesToStorage = (updated: Recipe[]) => {
    localStorage.setItem(RECIPES_KEY, JSON.stringify(updated));
    setRecipes(updated);
  };

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    notes: '',
    showInPOS: true,
    ingredients: [] as RecipeIngredient[]
  });
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    itemId: '',
    quantity: '',
    unit: ''
  });

  const handleNewRecipe = () => {
    setSelectedRecipe(null);
    setIsEditing(true);
    setFormData({
      name: '',
      notes: '',
      showInPOS: true,
      ingredients: []
    });
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsEditing(true);
    setFormData({
      name: recipe.name,
      notes: recipe.notes,
      showInPOS: recipe.showInPOS,
      ingredients: [...recipe.ingredients]
    });
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsEditing(false);
  };

  const handleAddIngredient = () => {
    if (!newIngredient.itemId || !newIngredient.quantity) {
      alert('Please select an item and enter quantity');
      return;
    }

    const selectedItem = items.find(item => item.id === newIngredient.itemId);
    if (!selectedItem) return;

    // Get unit cost from item suppliers (use first supplier or default price)
    const unitCost = selectedItem.suppliers?.[0]?.cost || 0;
    const quantity = parseFloat(newIngredient.quantity);
    const unit = newIngredient.unit || selectedItem.unit;

    const ingredient: RecipeIngredient = {
      id: Date.now().toString(),
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      itemSku: selectedItem.sku,
      quantity,
      unit,
      unitCost,
      lineCost: quantity * unitCost
    };

    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, ingredient]
    }));

    setNewIngredient({ itemId: '', quantity: '', unit: '' });
    setShowAddIngredient(false);
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(ing => ing.id !== ingredientId)
    }));
  };

  const handleUpdateIngredientQuantity = (ingredientId: string, newQuantity: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(ing =>
        ing.id === ingredientId
          ? { ...ing, quantity: newQuantity, lineCost: newQuantity * ing.unitCost }
          : ing
      )
    }));
  };

  const calculateTotalCost = () => {
    return formData.ingredients.reduce((sum, ing) => sum + ing.lineCost, 0);
  };

  const handleSaveRecipe = () => {
    if (!formData.name.trim()) {
      alert('Please enter a recipe name');
      return;
    }

    if (formData.ingredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }

    const now = new Date().toISOString();
    const totalCost = calculateTotalCost();

    if (selectedRecipe) {
      // Update existing recipe
      const updated = recipes.map(r =>
        r.id === selectedRecipe.id
          ? {
              ...r,
              name: formData.name,
              notes: formData.notes,
              showInPOS: formData.showInPOS,
              ingredients: formData.ingredients,
              totalCost,
              updatedAt: now
            }
          : r
      );
      saveRecipesToStorage(updated);
      setSelectedRecipe({ ...selectedRecipe, name: formData.name, notes: formData.notes, showInPOS: formData.showInPOS, ingredients: formData.ingredients, totalCost, updatedAt: now });
    } else {
      // Create new recipe
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        name: formData.name,
        notes: formData.notes,
        showInPOS: formData.showInPOS,
        ingredients: formData.ingredients,
        totalCost,
        createdAt: now,
        updatedAt: now
      };
      const updated = [...recipes, newRecipe];
      saveRecipesToStorage(updated);
      setSelectedRecipe(newRecipe);
    }

    setIsEditing(false);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      const updated = recipes.filter(recipe => recipe.id !== recipeId);
      saveRecipesToStorage(updated);
      if (selectedRecipe?.id === recipeId) {
        setSelectedRecipe(null);
        setIsEditing(false);
      }
    }
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="h-screen bg-gray-100 grid grid-cols-12">
      {/* Left Panel - Recipe List */}
      <div className="col-span-4 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Inventory</span>
            </button>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Recipe Maker</h1>
          <p className="text-gray-600 text-sm">Create and manage recipes</p>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* New Recipe Button */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handleNewRecipe}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Recipe</span>
          </button>
        </div>

        {/* Recipe List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="space-y-3">
              {filteredRecipes.map((recipe) => {
                const isSelected = selectedRecipe?.id === recipe.id;

                return (
                  <div
                    key={recipe.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:bg-gray-900'
                    }`}
                    onClick={() => handleSelectRecipe(recipe)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <ChefHat className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{recipe.name}</p>
                          <p className="text-sm text-gray-500">
                            {recipe.ingredients.length} ingredient(s)
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(recipe.totalCost)}</p>
                        <p className="text-xs text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatDate(recipe.updatedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Updated {formatDate(recipe.updatedAt)}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRecipe(recipe);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRecipe(recipe.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredRecipes.length === 0 && (
              <div className="text-center py-8">
                <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recipes found</p>
                <p className="text-sm text-gray-400">Create your first recipe to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Recipe Builder/Viewer */}
      <div className="col-span-8 flex flex-col">
        {isEditing ? (
          /* Recipe Builder */
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {selectedRecipe ? 'Edit Recipe' : 'New Recipe'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {selectedRecipe ? 'Update recipe details and ingredients' : 'Create a new recipe with ingredients'}
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Recipe Name */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recipe Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipe Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter recipe name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes/Instructions
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add preparation notes or instructions"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Ingredients</h3>
                  <button
                    onClick={() => setShowAddIngredient(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Ingredient</span>
                  </button>
                </div>

                {/* Add Ingredient Form */}
                {showAddIngredient && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Item *
                        </label>
                        <select
                          value={newIngredient.itemId}
                          onChange={(e) => setNewIngredient(prev => ({ ...prev, itemId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select an item</option>
                          {items.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.sku})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newIngredient.quantity}
                          onChange={(e) => setNewIngredient(prev => ({ ...prev, quantity: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex items-end space-x-2">
                        <button
                          onClick={handleAddIngredient}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setShowAddIngredient(false)}
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ingredients Table */}
                {formData.ingredients.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Item</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Quantity</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Unit Cost</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Line Cost</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {formData.ingredients.map((ingredient) => (
                          <tr key={ingredient.id}>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{ingredient.itemName}</p>
                                <p className="text-sm text-gray-500">{ingredient.itemSku}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={ingredient.quantity}
                                  onChange={(e) => handleUpdateIngredientQuantity(ingredient.id, parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400">{ingredient.unit}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-900 dark:text-gray-100">{formatCurrency(ingredient.unitCost)}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(ingredient.lineCost)}</span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleRemoveIngredient(ingredient.id)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <td colSpan={3} className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                            Total Recipe Cost:
                          </td>
                          <td className="py-3 px-4 font-bold text-lg text-blue-600">
                            {formatCurrency(calculateTotalCost())}
                          </td>
                          <td className="py-3 px-4"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm">No ingredients added yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Add Ingredient" to get started.</p>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <button
                  onClick={handleSaveRecipe}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>{selectedRecipe ? 'Update Recipe' : 'Save Recipe'}</span>
                </button>
              </div>
            </div>
          </>
        ) : selectedRecipe ? (
          /* Recipe Viewer */
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{selectedRecipe.name}</h2>
                  <p className="text-gray-600 mt-1">
                    {selectedRecipe.ingredients.length} ingredients • Total cost: {formatCurrency(selectedRecipe.totalCost)}
                  </p>
                </div>
                <button
                  onClick={() => handleEditRecipe(selectedRecipe)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Recipe</span>
                </button>
              </div>
            </div>

            {/* Recipe Details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Recipe Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recipe Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(selectedRecipe.totalCost)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Ingredients</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{selectedRecipe.ingredients.length} items</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{formatDate(selectedRecipe.updatedAt)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">POS Visibility:</span>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      selectedRecipe.showInPOS
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800 dark:text-gray-200'
                    }`}>
                      {selectedRecipe.showInPOS ? 'Available in POS' : 'Internal Use Only'}
                    </span>
                  </div>
                </div>
                {selectedRecipe.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 mb-2">Notes/Instructions</p>
                    <p className="text-gray-900 dark:text-gray-100">{selectedRecipe.notes}</p>
                  </div>
                )}
              </div>

              {/* Ingredients List */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingredients</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Item</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Quantity</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Unit Cost</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Line Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedRecipe.ingredients.map((ingredient) => (
                        <tr key={ingredient.id}>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Package className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{ingredient.itemName}</p>
                                <p className="text-sm text-gray-500">{ingredient.itemSku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-900 dark:text-gray-100">{ingredient.quantity} {ingredient.unit}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-900 dark:text-gray-100">{formatCurrency(ingredient.unitCost)}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(ingredient.lineCost)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <td colSpan={3} className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-gray-100">
                          Total Recipe Cost:
                        </td>
                        <td className="py-3 px-4 font-bold text-lg text-blue-600">
                          {formatCurrency(selectedRecipe.totalCost)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* No Recipe Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChefHat className="w-10 h-10 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Recipe Maker</h2>
              <p className="text-gray-600 mb-6">
                Create recipes by combining inventory items with automatic cost calculation.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  Select a recipe from the left panel or create a new one to get started.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
