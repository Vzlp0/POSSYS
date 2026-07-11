import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Phone, Mail, MapPin, Calendar, DollarSign, ShoppingBag, CreditCard as Edit, Trash2, Eye, Gift, Coffee, Star, TrendingUp, Settings, BarChart3, Users, RotateCcw } from 'lucide-react';
import { Client, LoyaltyCard as LoyaltyCardType, ClientOrder } from '../types';
import { useAuth } from '../contexts/AuthContext';

// localStorage helpers
const lsGet = <T,>(key: string): T[] => {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
};
const lsSet = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));
const lsAppend = <T,>(key: string, item: T): T[] => {
  const arr = lsGet<T>(key);
  arr.push(item);
  lsSet(key, arr);
  return arr;
};
import LoyaltyCard from './LoyaltyCard';
import LoyaltySettings from './LoyaltySettings';
import LoyaltyReports from './LoyaltyReports';

interface ClientWithLoyalty extends Client {
  loyalty_card?: LoyaltyCardType;
}

export default function ClientRelations() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'clients' | 'settings' | 'reports'>('clients');
  const [clients, setClients] = useState<ClientWithLoyalty[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientWithLoyalty[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithLoyalty | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'clients') {
      fetchClients();
    }
  }, [activeTab]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClients(clients);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = clients.filter(client =>
        client.first_name.toLowerCase().includes(term) ||
        client.last_name.toLowerCase().includes(term) ||
        client.client_number.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.phone?.includes(term)
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  const fetchClients = () => {
    try {
      setIsLoading(true);
      const clientsData = lsGet<Client>('pos_clients')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const loyaltyCards = lsGet<any>('pos_loyalty_cards');

      const clientsWithLoyalty: ClientWithLoyalty[] = clientsData.map(client => ({
        ...client,
        loyalty_card: loyaltyCards.find((lc: any) => lc.client_id === client.id && lc.status === 'active') || undefined
      }));

      setClients(clientsWithLoyalty);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      day: 'numeric'
    });
  };

  const handleViewProfile = (client: ClientWithLoyalty) => {
    setSelectedClient(client);
    setShowProfileModal(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Client Relations & Loyalty</h1>
            <p className="text-gray-600 mt-1">Manage customers and loyalty programs</p>
          </div>
          {activeTab === 'clients' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Client</span>
            </button>
          )}
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'clients'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Clients</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Loyalty Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Loyalty Reports</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === 'clients' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Clients</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{clients.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Loyalty Cards</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {clients.filter(c => c.loyalty_card?.status === 'active').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Coffee className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Rewards Ready</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {clients.filter(c => c.loyalty_card && c.loyalty_card.current_stamps >= c.loyalty_card.stamps_required).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(clients.reduce((sum, c) => sum + c.total_spent, 0))}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-red-200 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <Edit className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Outstanding Balance</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(clients.reduce((sum, c) => sum + (c.current_debt || 0), 0))}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {clients.filter(c => (c.current_debt || 0) > 0).length} customers with debt
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, client number, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading clients...</p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Clients Found</h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'Try adjusting your search' : 'Add your first client to get started'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handleViewProfile(client)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-6 h-6 text-blue-600" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                {client.first_name} {client.last_name}
                              </h3>
                              <span className="text-sm text-gray-500">{client.client_number}</span>
                              {client.loyalty_card && client.loyalty_card.current_stamps >= client.loyalty_card.stamps_required && (
                                <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center space-x-1">
                                  <Gift className="w-3 h-3" />
                                  <span className="text-xs font-medium">Reward Ready</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-6 mt-1">
                              {client.phone && (
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <Phone className="w-3.5 h-3.5 mr-1.5" />
                                  <span>{client.phone}</span>
                                </div>
                              )}
                              {client.email && (
                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                                  <span className="truncate">{client.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6 ml-4">
                          {client.loyalty_card && (
                            <div className="flex items-center space-x-2 bg-amber-50 px-3 py-2 rounded-lg">
                              <Coffee className="w-4 h-4 text-amber-600" />
                              <span className="text-sm font-medium text-amber-800">
                                {client.loyalty_card.current_stamps}/{client.loyalty_card.stamps_required}
                              </span>
                              <div className="flex space-x-1 ml-2">
                                {Array.from({ length: Math.min(6, client.loyalty_card.stamps_required) }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      i < client.loyalty_card!.current_stamps ? 'bg-amber-600' : 'bg-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="text-center px-3">
                            <p className="text-xs text-gray-500">Visits</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{client.total_visits}</p>
                          </div>

                          <div className="text-center px-3">
                            <p className="text-xs text-gray-500">Spent</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(client.total_spent)}</p>
                          </div>

                          <div className="text-center px-3">
                            <p className="text-xs text-gray-500">Balance</p>
                            <p className={`text-lg font-bold ${
                              (client.current_debt || 0) > 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-900 dark:text-gray-100'
                            }`}>
                              {formatCurrency(client.current_debt || 0)}
                            </p>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProfile(client);
                            }}
                            className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all flex items-center space-x-2"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showAddModal && (
              <AddClientModal
                onClose={() => setShowAddModal(false)}
                onSave={fetchClients}
                currentUser={user}
              />
            )}

            {showProfileModal && selectedClient && (
              <ClientProfileModal
                client={selectedClient}
                onClose={() => {
                  setShowProfileModal(false);
                  setSelectedClient(null);
                }}
                onUpdate={fetchClients}
              />
            )}
          </div>
        )}

        {activeTab === 'settings' && <LoyaltySettings />}
        {activeTab === 'reports' && <LoyaltyReports />}
      </div>
    </div>
  );
}

// Keep the existing AddClientModal and ClientProfileModal components below
interface AddClientModalProps {
  onClose: () => void;
  onSave: () => void;
  currentUser: any;
}

function AddClientModal({ onClose, onSave, currentUser }: AddClientModalProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    notes: ''
  });
  const [createLoyaltyCard, setCreateLoyaltyCard] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name) {
      alert('Please enter first and last name');
      return;
    }

    try {
      setIsSubmitting(true);

      const clientId = Date.now().toString();
      const clientNumber = 'CLT-' + Date.now();

      const clientData: any = {
        id: clientId,
        client_number: clientNumber,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || null,
        phone: formData.phone || null,
        date_of_birth: formData.date_of_birth || null,
        address: formData.address || null,
        notes: formData.notes || null,
        status: 'active',
        total_visits: 0,
        total_spent: 0,
        created_at: new Date().toISOString()
      };

      lsAppend('pos_clients', clientData);

      if (createLoyaltyCard) {
        const cardNumber = 'CARD-' + Date.now();

        lsAppend('pos_loyalty_cards', {
          id: Date.now().toString() + '1',
          card_number: cardNumber,
          client_id: clientId,
          program_type: 'coffee_6plus1',
          stamps_required: 6,
          current_stamps: 0,
          completed_cards: 0,
          status: 'active',
          created_at: new Date().toISOString()
        });

        lsAppend('pos_client_loyalty', {
          id: Date.now().toString() + '2',
          client_id: clientId,
          loyalty_type: 'all',
          points_balance: 0,
          points_earned_total: 0,
          points_redeemed_total: 0,
          cashback_balance: 0,
          cashback_earned_total: 0,
          cashback_used_total: 0,
          created_at: new Date().toISOString()
        });
      }

      alert(`Client ${formData.first_name} ${formData.last_name} added successfully!`);
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error adding client:', error);
      alert(`Failed to add client: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add New Client</h2>
            <p className="text-sm text-gray-600 mt-1">Register a new customer and create their loyalty card</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123 Main St, City, State ZIP"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Special preferences, allergies, etc..."
                rows={3}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createLoyaltyCard}
                  onChange={(e) => setCreateLoyaltyCard(e.target.checked)}
                  className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <div>
                  <span className="font-medium text-amber-900">Create Loyalty Card</span>
                  <p className="text-sm text-amber-700">Automatically create a coffee loyalty card (6+1 free)</p>
                </div>
              </label>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex items-center space-x-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Adding Client...' : 'Add Client'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ClientProfileModalProps {
  client: ClientWithLoyalty;
  onClose: () => void;
  onUpdate: () => void;
}

function ClientProfileModal({ client, onClose, onUpdate }: ClientProfileModalProps) {
  const [orderHistory, setOrderHistory] = useState<ClientOrder[]>([]);
  const [returnHistory, setReturnHistory] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingReturns, setIsLoadingReturns] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'orders' | 'returns' | 'loyalty'>('details');

  useEffect(() => {
    fetchOrderHistory();
    fetchReturnHistory();
  }, [client.id]);

  const fetchOrderHistory = () => {
    try {
      setIsLoadingOrders(true);
      const data = lsGet<any>('pos_client_orders')
        .filter((o: any) => o.client_id === client.id)
        .sort((a: any, b: any) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
      setOrderHistory(data);
    } catch (error) {
      console.error('Error fetching order history:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchReturnHistory = () => {
    try {
      setIsLoadingReturns(true);
      const orders = lsGet<any>('pos_client_orders').filter((o: any) => o.client_id === client.id);
      if (orders.length > 0) {
        const orderNumbers = orders.map((o: any) => o.order_number);
        const allReturns = lsGet<any>('pos_returns');
        const allReturnItems = lsGet<any>('pos_return_items');
        const data = allReturns
          .filter((r: any) => orderNumbers.includes(r.invoice_number))
          .map((r: any) => ({ ...r, return_items: allReturnItems.filter((ri: any) => ri.return_id === r.id) }))
          .sort((a: any, b: any) => new Date(b.return_date).getTime() - new Date(a.return_date).getTime());
        setReturnHistory(data);
      }
    } catch (error) {
      console.error('Error fetching return history:', error);
    } finally {
      setIsLoadingReturns(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {client.first_name} {client.last_name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{client.client_number}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'details'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Orders ({orderHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('returns')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'returns'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Returns ({returnHistory.length})
            </button>
            {client.loyalty_card && (
              <button
                onClick={() => setActiveTab('loyalty')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'loyalty'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Loyalty Card
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                  <p className="text-gray-900 mt-1">{client.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                  <p className="text-gray-900 mt-1">{client.email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date of Birth</label>
                  <p className="text-gray-900 mt-1">
                    {client.date_of_birth ? new Date(client.date_of_birth).toLocaleDateString() : 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Member Since</label>
                  <p className="text-gray-900 mt-1">{formatDateTime(client.created_at)}</p>
                </div>
              </div>

              {client.address && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</label>
                  <p className="text-gray-900 mt-1">{client.address}</p>
                </div>
              )}

              {client.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Notes</label>
                  <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">{client.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">Total Visits</p>
                      <p className="text-2xl font-bold text-blue-900">{client.total_visits}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600">Total Spent</p>
                      <p className="text-2xl font-bold text-green-900">{formatCurrency(client.total_spent)}</p>
                    </div>
                  </div>
                </div>
                <div className={`${
                  (client.current_debt || 0) > 0 ? 'bg-red-50' : 'bg-gray-50'
                } rounded-xl p-4`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${
                      (client.current_debt || 0) > 0 ? 'bg-red-100' : 'bg-gray-100'
                    } rounded-xl flex items-center justify-center`}>
                      <Edit className={`w-6 h-6 ${
                        (client.current_debt || 0) > 0 ? 'text-red-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <p className={`text-sm ${
                        (client.current_debt || 0) > 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>Account Balance</p>
                      <p className={`text-2xl font-bold ${
                        (client.current_debt || 0) > 0 ? 'text-red-900' : 'text-gray-900'
                      }`}>{formatCurrency(client.current_debt || 0)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              {isLoadingOrders ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading order history...</p>
                </div>
              ) : orderHistory.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
                  <p className="text-gray-500">This client hasn't made any purchases yet</p>
                </div>
              ) : (
                orderHistory.map((order) => (
                  <div key={order.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{order.order_number}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{formatDateTime(order.order_date)}</p>
                        <p className="text-sm text-gray-500">Cashier: {order.cashier_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(order.total)}</p>
                        {order.loyalty_stamps_earned > 0 && (
                          <p className="text-sm text-amber-600 flex items-center space-x-1">
                            <Coffee className="w-4 h-4" />
                            <span>+{order.loyalty_stamps_earned} stamp{order.loyalty_stamps_earned > 1 ? 's' : ''}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {order.items.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-gray-900 font-medium">{formatCurrency(item.lineTotal)}</span>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200 italic">
                        {order.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="space-y-4">
              {isLoadingReturns ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading return history...</p>
                </div>
              ) : returnHistory.length === 0 ? (
                <div className="text-center py-12">
                  <RotateCcw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Returns</h3>
                  <p className="text-gray-500">This client hasn't returned any items</p>
                </div>
              ) : (
                returnHistory.map((returnRecord) => (
                  <div key={returnRecord.id} className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                          <RotateCcw className="w-4 h-4 text-red-600" />
                          <span>{returnRecord.return_number}</span>
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Original: {returnRecord.invoice_number}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{formatDateTime(returnRecord.return_date)}</p>
                        <p className="text-sm text-gray-500">Processed by: {returnRecord.processed_by}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">-{formatCurrency(returnRecord.total_refund)}</p>
                        <p className="text-sm text-gray-600 capitalize">{returnRecord.refund_method} refund</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      {returnRecord.return_items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">
                            {item.quantity}x {item.item_name}
                          </span>
                          <span className="text-gray-900 font-medium">-{formatCurrency(item.line_total)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-red-200">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Reason:</span> {returnRecord.reason}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'loyalty' && client.loyalty_card && (
            <div className="space-y-6">
              <LoyaltyCard
                current_stamps={client.loyalty_card.current_stamps}
                stamps_required={client.loyalty_card.stamps_required}
                completed_cards={client.loyalty_card.completed_cards}
                size="large"
                showReward={true}
              />

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Loyalty Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Card Number</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{client.loyalty_card.card_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Free Coffees</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{client.loyalty_card.completed_cards}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Current Progress</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {client.loyalty_card.current_stamps}/{client.loyalty_card.stamps_required}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last Stamp</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {client.loyalty_card.last_stamp_at
                        ? formatDateTime(client.loyalty_card.last_stamp_at)
                        : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
