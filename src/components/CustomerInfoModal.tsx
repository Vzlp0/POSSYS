import React, { useState } from 'react';
import { X, User, Phone, MessageSquare, Clock, Users } from 'lucide-react';
import ClientLookupModal from './ClientLookupModal';

interface CustomerInfoModalProps {
  onSave: (customerInfo: {
    customer_name?: string;
    customer_phone?: string;
    customer_notes?: string;
  }, selectedClient?: any) => void;
  onQuickHold: () => void;
  onCancel: () => void;
  currentClient?: any;
}

export default function CustomerInfoModal({ onSave, onQuickHold, onCancel, currentClient }: CustomerInfoModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [selectedClient, setSelectedClient] = useState(currentClient || null);
  const [showClientLookup, setShowClientLookup] = useState(false);

  const handleSave = () => {
    const info: any = {};
    if (customerName.trim()) info.customer_name = customerName.trim();
    if (customerPhone.trim()) info.customer_phone = customerPhone.trim();
    if (customerNotes.trim()) info.customer_notes = customerNotes.trim();
    onSave(info, selectedClient);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Hold Order</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Add customer information (optional)</p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Select Customer</span>
              </div>
            </label>
            {selectedClient ? (
              <div className="flex items-center justify-between p-4 border-2 border-blue-500 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedClient.first_name} {selectedClient.last_name}
                  </p>
                  {selectedClient.phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedClient.phone}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClientLookup(true)}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-gray-600 hover:text-blue-600 font-medium"
              >
                + Select from Customer List
              </button>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or enter manually</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Customer Name</span>
              </div>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter customer name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>Phone Number</span>
              </div>
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Special Instructions</span>
              </div>
            </label>
            <textarea
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any special requests or notes..."
              rows={3}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Quick Tip</h4>
                <p className="text-sm text-blue-700">
                  You can skip this step and hold the order quickly without customer details by clicking "Quick Hold" below.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 space-y-3">
          <button
            onClick={handleSave}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
          >
            <Clock className="w-5 h-5" />
            <span>Hold Order with Details</span>
          </button>

          <button
            onClick={onQuickHold}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all"
          >
            Quick Hold (No Details)
          </button>

          <button
            onClick={onCancel}
            className="w-full text-gray-600 py-2 px-4 rounded-lg font-medium hover:text-gray-800 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>

      {showClientLookup && (
        <ClientLookupModal
          onClose={() => setShowClientLookup(false)}
          onSelectClient={(client) => {
            setSelectedClient(client);
            setShowClientLookup(false);
          }}
        />
      )}
    </div>
  );
}
