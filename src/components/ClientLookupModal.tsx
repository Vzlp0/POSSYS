import { useState, useEffect } from 'react';
import { Search, X, User, Phone, Mail, Coffee } from 'lucide-react';

interface Client {
  id: string;
  client_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  total_visits: number;
  total_spent: number;
  loyalty_card?: {
    id: string;
    card_number: string;
    current_stamps: number;
    stamps_required: number;
    completed_cards: number;
  };
}

interface ClientLookupModalProps {
  onClose: () => void;
  onSelectClient: (client: Client) => void;
}

export default function ClientLookupModal({ onClose, onSelectClient }: ClientLookupModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClients(clients);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = clients.filter(client =>
        client.first_name.toLowerCase().includes(term) ||
        client.last_name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        client.phone.includes(term) ||
        client.client_number.toLowerCase().includes(term)
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  const loadClients = () => {
    try {
      setLoading(true);
      const allClients: any[] = JSON.parse(localStorage.getItem('pos_clients') || '[]');
      const loyaltyCards: any[] = JSON.parse(localStorage.getItem('pos_loyalty_cards') || '[]');

      const active = allClients
        .filter(c => c.status === 'active' || !c.status)
        .sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''))
        .map(client => ({
          ...client,
          loyalty_card: loyaltyCards.find(lc => lc.client_id === client.id && lc.status === 'active')
        }));

      setClients(active);
      setFilteredClients(active);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Select Customer</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or client number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading customers...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No customers found' : 'No customers yet'}
              </h3>
              <p className="text-gray-500">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Add customers in Client Relations'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => onSelectClient(client)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {client.first_name} {client.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">{client.client_number}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                          <Mail className="w-4 h-4" />
                          <span>{client.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                          <Phone className="w-4 h-4" />
                          <span>{client.phone}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center space-x-4 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{client.total_visits}</span> visits
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(client.total_spent)}</span> spent
                        </span>
                      </div>
                    </div>

                    {client.loyalty_card && (
                      <div className="ml-4 text-right">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          <div className="flex items-center justify-center space-x-1 text-amber-600 mb-1">
                            <Coffee className="w-4 h-4" />
                            <span className="text-xs font-medium">Loyalty Card</span>
                          </div>
                          <p className="text-sm font-bold text-amber-700">
                            {client.loyalty_card.current_stamps}/{client.loyalty_card.stamps_required}
                          </p>
                          {client.loyalty_card.completed_cards > 0 && (
                            <p className="text-xs text-amber-600">
                              {client.loyalty_card.completed_cards} free coffee{client.loyalty_card.completed_cards > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
