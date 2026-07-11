import React, { useState } from 'react';
import { Package, Truck } from 'lucide-react';
import ItemMaster from './ItemMaster';
import SupplierManagement from './SupplierManagement';

const procurementMenuItems = [
  {
    id: 'item-master',
    label: 'Item Master',
    icon: Package,
    description: 'Manage product catalog and item information'
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    icon: Truck,
    description: 'Manage supplier information and contacts'
  }
];

interface ProcurementProps {
  setActiveItem?: (item: string) => void;
}

export default function Procurement({ setActiveItem }: ProcurementProps = {}) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Handle navigation to PR/PO Status from other components
  const handleRedirectToPRStatus = () => {
    if (setActiveItem) {
      setActiveItem('pr-status');
    }
  };

  const handleRedirectToPOStatus = () => {
    if (setActiveItem) {
      setActiveItem('po-status');
    }
  };

  if (activeSection === 'item-master') {
    return <ItemMaster onBack={() => setActiveSection(null)} />;
  }

  if (activeSection === 'suppliers') {
    return <SupplierManagement onBack={() => setActiveSection(null)} />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Procurement System</h1>
        <p className="text-gray-600 mt-1 dark:text-gray-400">
          Master Data Management
        </p>
      </div>

      {/* Procurement Master Data Modules */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Master Data Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {procurementMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all text-left group"
              >
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-all">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                      {item.label}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}