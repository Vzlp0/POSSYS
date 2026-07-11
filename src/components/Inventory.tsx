import React, { useState } from 'react';
import { Package, Plus, FileText, Truck, ClipboardCheck, BarChart3, ArrowRightLeft, Building, ChefHat, ShoppingCart, Calendar, Layers, Boxes, Warehouse, RefreshCcw } from 'lucide-react';
import GoodsReceipt from './GoodsReceipt';
import ISTOTransfer from './ISTOTransfer';
import ExpiryManagement from './ExpiryManagement';
import RecipeMaker from './RecipeMaker';
import InventoryReports from './InventoryReports';
import ShelvesManagement from './ShelvesManagement';
import StorageManagement from './StorageManagement';
import Replenishment from './Replenishment';

const inventoryMenuItems = [
  {
    id: 'goods-receipt',
    label: 'Goods Receipt',
    icon: ClipboardCheck,
    description: 'Receive and record incoming inventory from suppliers'
  },
  {
    id: 'shelves',
    label: 'Shelves',
    icon: Boxes,
    description: 'Manage retail shelves by branch and section'
  },
  {
    id: 'storage',
    label: 'Storage',
    icon: Warehouse,
    description: 'Track stock in storage and backroom locations'
  },
  {
    id: 'replenishment',
    label: 'Replenishment',
    icon: RefreshCcw,
    description: 'Refill shelves that need restocking'
  },
  {
    id: 'isto-transfer',
    label: 'ISTO Transfer',
    icon: Building,
    description: 'Internal Stock Transfer Orders between stores'
  },
  {
    id: 'expiry-management',
    label: 'Expiry Management',
    icon: Calendar,
    description: 'Monitor and manage batch expiry dates'
  },
  {
    id: 'recipe-maker',
    label: 'Recipe Maker',
    icon: ChefHat,
    description: 'Create recipes with automatic cost calculation'
  },
  {
    id: 'combo-management',
    label: 'Combos & Costing',
    icon: Layers,
    description: 'Create combo deals with special pricing and cost tracking'
  },
  {
    id: 'inventory-reports',
    label: 'Inventory Reports',
    icon: BarChart3,
    description: 'Comprehensive inventory analysis and reporting'
  }
];

export default function Inventory() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  if (activeSection === 'goods-receipt') {
    return <GoodsReceipt onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === 'shelves') {
    return <ShelvesManagement onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === 'storage') {
    return <StorageManagement onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === 'replenishment') {
    return <Replenishment onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === 'isto-transfer') {
    return <ISTOTransfer onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === 'expiry-management') {
    return <ExpiryManagement onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === 'recipe-maker') {
    return <RecipeMaker onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === 'inventory-reports') {
    return <InventoryReports onBack={() => setActiveSection(null)} />;
  }

  if (activeSection) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => setActiveSection(null)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Inventory
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {inventoryMenuItems.find(item => item.id === activeSection)?.label}
          </h1>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-gray-600 dark:text-gray-400">This feature is under development.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory Management</h1>
          <p className="text-gray-600 mt-1">
            Manage stock levels, transfers, and process goods receipts
          </p>
        </div>
      </div>

      {/* Inventory Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventoryMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-all">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {item.label}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock Items</p>
              <p className="text-2xl font-bold text-red-600 mt-2">0</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending GRs</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">0</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Transfers</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">0</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}