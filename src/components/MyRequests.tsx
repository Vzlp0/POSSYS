import React, { useState } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  CheckCircle, 
  Truck, 
  Package,
  Calendar,
  User,
  Building,
  Eye,
  Edit
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ISTO } from '../types';

// Mock data for user's requested ISTOs
const mockUserISTOs: ISTO[] = [];

interface MyRequestsProps {
  onBack: () => void;
}

export default function MyRequests({ onBack }: MyRequestsProps) {
  const { user } = useAuth();
  const [selectedISTO, setSelectedISTO] = useState<ISTO | null>(null);
  
  // Filter ISTOs created by current user
  const userISTOs = mockUserISTOs.filter(isto => isto.createdBy === `${user?.firstName} ${user?.lastName}`);

  const getStatusBadge = (status: ISTO['status']) => {
    const statusConfig = {
      'Draft': { color: 'bg-gray-100 text-gray-800 dark:text-gray-200', icon: Edit },
      'Requested': { color: 'bg-blue-100 text-blue-800', icon: Clock },
      'Approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Picked': { color: 'bg-purple-100 text-purple-800', icon: Package },
      'In Transit': { color: 'bg-yellow-100 text-yellow-800', icon: Truck },
      'Delivered': { color: 'bg-indigo-100 text-indigo-800', icon: Package },
      'Received': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Cancelled': { color: 'bg-red-100 text-red-800', icon: Clock }
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        <span>{status}</span>
      </div>
    );
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

  // Calculate summary statistics
  const totalRequests = userISTOs.length;
  const pendingRequests = userISTOs.filter(isto => ['Draft', 'Requested', 'Approved'].includes(isto.status)).length;
  const inTransitRequests = userISTOs.filter(isto => ['Picked', 'In Transit', 'Delivered'].includes(isto.status)).length;
  const completedRequests = userISTOs.filter(isto => isto.status === 'Received').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to ISTO Transfer</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My ISTO Requests</h1>
            <p className="text-gray-600 mt-1">Track your Internal Stock Transfer Orders</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{totalRequests}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">{pendingRequests}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Transit</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{inTransitRequests}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{completedRequests}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Request History</h2>
          </div>
          
          {userISTOs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">ISTO Number</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Route</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Lines</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Created</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {userISTOs.map((isto) => (
                    <tr 
                      key={isto.id} 
                      className={`hover:bg-gray-50 transition-all cursor-pointer ${
                        selectedISTO?.id === isto.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedISTO(isto)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{isto.istoNumber}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm font-medium">
                            {isto.sourceStore}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                            {isto.targetStore}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-900 dark:text-gray-100">{isto.lines.length} items</span>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(isto.status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-gray-100">{formatDate(isto.createdAt)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedISTO(isto);
                          }}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No ISTO Requests</h3>
              <p className="text-gray-600 mb-4">You haven't created any ISTO requests yet.</p>
              <button
                onClick={onBack}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all"
              >
                Create Your First ISTO
              </button>
            </div>
          )}
        </div>

        {/* Status Panel */}
        <div className="bg-white rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {selectedISTO ? 'ISTO Details' : 'Select an ISTO'}
            </h3>
          </div>
          
          {selectedISTO ? (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ISTO Number</label>
                <p className="text-gray-900 font-medium">{selectedISTO.istoNumber}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Route</label>
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 dark:text-gray-100">{selectedISTO.sourceStore} → {selectedISTO.targetStore}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                {getStatusBadge(selectedISTO.status)}
              </div>

              {selectedISTO.deliveryNumber && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Number</label>
                  <p className="text-gray-900 font-mono text-sm">{selectedISTO.deliveryNumber}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Action</label>
                <p className="text-gray-900 text-sm">{selectedISTO.lastAction}</p>
                <p className="text-gray-500 text-xs">{formatDate(selectedISTO.lastActionAt)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Items ({selectedISTO.lines.length})</label>
                <div className="space-y-2">
                  {selectedISTO.lines.map((line) => (
                    <div key={line.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{line.itemName}</p>
                        <p className="text-xs text-gray-500">{line.itemSku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{line.requestedQty} {line.unit}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          line.status === 'Received' ? 'bg-green-100 text-green-800' :
                          line.status === 'Picked' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800 dark:text-gray-200'
                        }`}>
                          {line.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedISTO.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <p className="text-gray-900 text-sm">{selectedISTO.notes}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900 text-sm">{selectedISTO.createdBy}</span>
                </div>
                <p className="text-gray-500 text-xs">{formatDate(selectedISTO.createdAt)}</p>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">Click on any ISTO request to view its details and current status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}