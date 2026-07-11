import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Building2, Plus, Search, Edit, Eye, Phone, Mail, MapPin, ArrowLeft,
  DollarSign, FileText, CheckCircle, Clock, AlertCircle, X, Filter,
  CreditCard, Receipt, Package, Calendar, Ban, Check
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  code: string;
  supplier_type: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  vat_number: string | null;
  bank_name: string | null;
  iban: string | null;
  payment_terms: string | null;
  notes: string | null;
  is_active: boolean;
  last_po_date: string | null;
  total_outstanding: number;
  created_at: string;
}

interface SupplierInvoice {
  id: string;
  invoice_number: string;
  supplier_id: string;
  po_id: string | null;
  invoice_date: string;
  invoice_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'paid' | 'partially_paid' | 'unpaid';
  notes: string | null;
  purchase_orders?: { po_number: string };
}

interface SupplierPayment {
  id: string;
  supplier_id: string;
  invoice_id: string | null;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  payment_reference: string | null;
  status: string;
  notes: string | null;
  supplier_invoices?: { invoice_number: string };
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  order_date: string;
  total_amount: number;
  status: string;
  branches?: { name: string };
}

interface SupplierManagementProps {
  onBack: () => void;
}

export default function SupplierManagement({ onBack }: SupplierManagementProps) {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'detail' | 'add' | 'edit'>('list');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'pos' | 'invoices' | 'payments'>('invoices');
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    supplier_type: 'goods',
    contact_person: '',
    email: '',
    phone: '',
    city: '',
    vat_number: '',
    bank_name: '',
    iban: '',
    address: '',
    payment_terms: 'Net 30',
    notes: '',
    is_active: true
  });

  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: '',
    po_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    invoice_amount: '',
    notes: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    invoice_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Bank Transfer',
    payment_reference: '',
    notes: ''
  });

  const supplierTypes = ['goods', 'service', 'cleaning', 'logistics', 'maintenance'];
  const paymentTermsOptions = ['Cash', '7 Days', '15 Days', '30 Days'];

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierDetails = async (supplierId: string) => {
    try {
      const [invoicesRes, paymentsRes, posRes] = await Promise.all([
        supabase
          .from('supplier_invoices')
          .select(`*, purchase_orders(po_number)`)
          .eq('supplier_id', supplierId)
          .order('invoice_date', { ascending: false }),
        supabase
          .from('supplier_payments')
          .select(`*, supplier_invoices(invoice_number)`)
          .eq('supplier_id', supplierId)
          .order('payment_date', { ascending: false }),
        supabase
          .from('purchase_orders')
          .select(`*, branches(name)`)
          .eq('supplier_id', supplierId)
          .order('order_date', { ascending: false })
      ]);

      if (invoicesRes.error) throw invoicesRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      if (posRes.error) throw posRes.error;

      setInvoices(invoicesRes.data || []);
      setPayments(paymentsRes.data || []);
      setPurchaseOrders(posRes.data || []);
    } catch (error) {
      console.error('Error fetching supplier details:', error);
    }
  };

  const handleViewSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    fetchSupplierDetails(supplier.id);
    setView('detail');
  };

  const handleEditSupplier = (supplier: Supplier) => {
    if (!canEdit) {
      alert('You do not have permission to edit suppliers');
      return;
    }
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      code: supplier.code,
      supplier_type: supplier.supplier_type,
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      city: supplier.city || '',
      vat_number: supplier.vat_number || '',
      bank_name: supplier.bank_name || '',
      iban: supplier.iban || '',
      address: supplier.address || '',
      payment_terms: supplier.payment_terms || 'Net 30',
      notes: supplier.notes || '',
      is_active: supplier.is_active
    });
    setView('edit');
  };

  const handleAddSupplier = () => {
    if (!canEdit) {
      alert('You do not have permission to add suppliers');
      return;
    }
    setFormData({
      name: '',
      code: '',
      supplier_type: 'goods',
      contact_person: '',
      email: '',
      phone: '',
      city: '',
      vat_number: '',
      bank_name: '',
      iban: '',
      address: '',
      payment_terms: 'Net 30',
      notes: '',
      is_active: true
    });
    setView('add');
  };

  const validateEmail = (email: string) => {
    return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSaveSupplier = async () => {
    if (!formData.name || !formData.phone) {
      alert('Please fill in Supplier Name and Phone (required fields)');
      return;
    }

    if (formData.email && !validateEmail(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      if (view === 'add') {
        const { error } = await supabase
          .from('suppliers')
          .insert([formData]);
        if (error) throw error;
      } else if (view === 'edit' && selectedSupplier) {
        const { error } = await supabase
          .from('suppliers')
          .update(formData)
          .eq('id', selectedSupplier.id);
        if (error) throw error;
      }

      await fetchSuppliers();
      setView('list');
      setSelectedSupplier(null);
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      alert(`Failed to save supplier: ${error.message || 'Unknown error'}`);
    }
  };

  const handleToggleSupplierStatus = async () => {
    if (!selectedSupplier || !canEdit) return;

    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: !selectedSupplier.is_active })
        .eq('id', selectedSupplier.id);

      if (error) throw error;

      setSelectedSupplier({ ...selectedSupplier, is_active: !selectedSupplier.is_active });
      await fetchSuppliers();
    } catch (error) {
      console.error('Error updating supplier status:', error);
      alert('Failed to update supplier status');
    }
  };

  const handleAddInvoice = async () => {
    if (!selectedSupplier || !canEdit) return;

    if (!invoiceForm.invoice_number || !invoiceForm.invoice_amount) {
      alert('Please fill in Invoice Number and Amount');
      return;
    }

    try {
      const { error } = await supabase
        .from('supplier_invoices')
        .insert([{
          supplier_id: selectedSupplier.id,
          invoice_number: invoiceForm.invoice_number,
          po_id: invoiceForm.po_id || null,
          invoice_date: invoiceForm.invoice_date,
          invoice_amount: parseFloat(invoiceForm.invoice_amount),
          notes: invoiceForm.notes
        }]);

      if (error) throw error;

      await fetchSupplierDetails(selectedSupplier.id);
      await fetchSuppliers();
      setShowInvoiceModal(false);
      setInvoiceForm({
        invoice_number: '',
        po_id: '',
        invoice_date: new Date().toISOString().split('T')[0],
        invoice_amount: '',
        notes: ''
      });
    } catch (error: any) {
      console.error('Error adding invoice:', error);
      alert(`Failed to add invoice: ${error.message || 'Unknown error'}`);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedSupplier || !canEdit) return;

    if (!paymentForm.amount) {
      alert('Please fill in Payment Amount');
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('supplier_payments')
        .insert([{
          supplier_id: selectedSupplier.id,
          invoice_id: paymentForm.invoice_id || null,
          amount: parseFloat(paymentForm.amount),
          payment_date: paymentForm.payment_date,
          payment_method: paymentForm.payment_method,
          payment_reference: paymentForm.payment_reference,
          notes: paymentForm.notes,
          status: 'paid',
          created_by: userData.user?.id
        }]);

      if (error) throw error;

      await fetchSupplierDetails(selectedSupplier.id);
      await fetchSuppliers();
      setShowPaymentModal(false);
      setPaymentForm({
        invoice_id: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'Bank Transfer',
        payment_reference: '',
        notes: ''
      });
    } catch (error: any) {
      console.error('Error adding payment:', error);
      alert(`Failed to add payment: ${error.message || 'Unknown error'}`);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contact_person?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && supplier.is_active) ||
      (filterStatus === 'inactive' && !supplier.is_active);

    const matchesType = filterType === 'all' || supplier.supplier_type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
      case 'partially_paid':
        return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'unpaid':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'partially_paid':
        return <Clock className="w-4 h-4" />;
      case 'unpaid':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Supplier Details View
  if (view === 'detail' && selectedSupplier) {
    const totalPOs = purchaseOrders.length;
    const totalInvoices = invoices.length;
    const lastInvoice = invoices[0];
    const lastPayment = payments[0];

    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="p-6">
          <div className="mb-6">
            <button
              onClick={() => setView('list')}
              className={`flex items-center space-x-2 ${
                isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Suppliers</span>
            </button>
          </div>

          <div className={`rounded-lg border p-6 mb-6 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedSupplier.name}
                  </h2>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    selectedSupplier.is_active
                      ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
                      : 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
                  }`}>
                    {selectedSupplier.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
                    isDarkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {selectedSupplier.supplier_type}
                  </span>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedSupplier.code}
                </p>
              </div>
              <div className="flex space-x-2">
                {canEdit && (
                  <>
                    <button
                      onClick={handleToggleSupplierStatus}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                        selectedSupplier.is_active
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {selectedSupplier.is_active ? <Ban className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      <span>{selectedSupplier.is_active ? 'Deactivate' : 'Activate'}</span>
                    </button>
                    <button
                      onClick={() => handleEditSupplier(selectedSupplier)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-6">
              <div>
                <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Contact Information
                </h3>
                <div className="space-y-2">
                  {selectedSupplier.contact_person && (
                    <div className="flex items-center text-sm">
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        {selectedSupplier.contact_person}
                      </span>
                    </div>
                  )}
                  {selectedSupplier.phone && (
                    <div className="flex items-center text-sm">
                      <Phone className={`w-4 h-4 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        {selectedSupplier.phone}
                      </span>
                    </div>
                  )}
                  {selectedSupplier.email && (
                    <div className="flex items-center text-sm">
                      <Mail className={`w-4 h-4 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        {selectedSupplier.email}
                      </span>
                    </div>
                  )}
                  {selectedSupplier.city && (
                    <div className="flex items-center text-sm">
                      <MapPin className={`w-4 h-4 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        {selectedSupplier.city}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Financial Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Payment Terms: </span>
                    <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                      {selectedSupplier.payment_terms || 'Net 30'}
                    </span>
                  </div>
                  {selectedSupplier.vat_number && (
                    <div>
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>VAT: </span>
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        {selectedSupplier.vat_number}
                      </span>
                    </div>
                  )}
                  {selectedSupplier.bank_name && (
                    <div>
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Bank: </span>
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        {selectedSupplier.bank_name}
                      </span>
                    </div>
                  )}
                  {selectedSupplier.iban && (
                    <div>
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>IBAN: </span>
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        {selectedSupplier.iban}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Additional Information
                </h3>
                <div className="space-y-2 text-sm">
                  {selectedSupplier.address && (
                    <div>
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Address: </span>
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        {selectedSupplier.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedSupplier.notes && (
              <div className={`pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Notes
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedSupplier.notes}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className={`rounded-lg border p-4 ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total POs
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {totalPOs}
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className={`rounded-lg border p-4 ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Invoices
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {totalInvoices}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className={`rounded-lg border p-4 ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Outstanding
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    ${Number(selectedSupplier.total_outstanding || 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className={`rounded-lg border p-4 ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Last Invoice
                  </p>
                  <p className={`text-sm font-medium mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {lastInvoice ? new Date(lastInvoice.invoice_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <Receipt className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className={`rounded-lg border p-4 ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Last Payment
                  </p>
                  <p className={`text-sm font-medium mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {lastPayment ? new Date(lastPayment.payment_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className={`rounded-lg border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('pos')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                    activeTab === 'pos'
                      ? 'border-blue-500 text-blue-600'
                      : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                  }`}
                >
                  Purchase Orders ({purchaseOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                    activeTab === 'invoices'
                      ? 'border-blue-500 text-blue-600'
                      : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                  }`}
                >
                  Invoices ({invoices.length})
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                    activeTab === 'payments'
                      ? 'border-blue-500 text-blue-600'
                      : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                  }`}
                >
                  Payments ({payments.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'pos' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Purchase Orders
                    </h3>
                  </div>
                  {purchaseOrders.length === 0 ? (
                    <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No purchase orders found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                          <tr>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              PO Number
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Date
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Branch
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Amount
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                          {purchaseOrders.map((po) => (
                            <tr key={po.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                              <td className={`px-6 py-4 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {po.po_number}
                              </td>
                              <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {new Date(po.order_date).toLocaleDateString()}
                              </td>
                              <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {po.branches?.name || '-'}
                              </td>
                              <td className={`px-6 py-4 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                ${Number(po.total_amount).toFixed(2)}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                                  po.status === 'completed'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                }`}>
                                  {po.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'invoices' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Invoices
                    </h3>
                    {canEdit && (
                      <button
                        onClick={() => setShowInvoiceModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Invoice</span>
                      </button>
                    )}
                  </div>
                  {invoices.length === 0 ? (
                    <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No invoices found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                          <tr>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Invoice #
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Date
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              PO Number
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Amount
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Paid
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Remaining
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                          {invoices.map((invoice) => (
                            <tr key={invoice.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                              <td className={`px-6 py-4 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {invoice.invoice_number}
                              </td>
                              <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {new Date(invoice.invoice_date).toLocaleDateString()}
                              </td>
                              <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {invoice.purchase_orders?.po_number || '-'}
                              </td>
                              <td className={`px-6 py-4 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                ${Number(invoice.invoice_amount).toFixed(2)}
                              </td>
                              <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                ${Number(invoice.paid_amount).toFixed(2)}
                              </td>
                              <td className={`px-6 py-4 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                ${Number(invoice.remaining_amount).toFixed(2)}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full capitalize ${
                                  getStatusColor(invoice.status)
                                }`}>
                                  {getStatusIcon(invoice.status)}
                                  <span>{invoice.status.replace('_', ' ')}</span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'payments' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Payment History
                    </h3>
                    {canEdit && (
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Payment</span>
                      </button>
                    )}
                  </div>
                  {payments.length === 0 ? (
                    <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No payments recorded</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                          <tr>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Date
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Amount
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Method
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Reference
                            </th>
                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Linked Invoice
                            </th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                          {payments.map((payment) => (
                            <tr key={payment.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                              <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </td>
                              <td className={`px-6 py-4 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                ${Number(payment.amount).toFixed(2)}
                              </td>
                              <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {payment.payment_method || '-'}
                              </td>
                              <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {payment.payment_reference || '-'}
                              </td>
                              <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {payment.supplier_invoices?.invoice_number || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {showInvoiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-lg p-6 max-w-md w-full mx-4 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Add Invoice
                </h3>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className={isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    value={invoiceForm.invoice_number}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    PO Number (Optional)
                  </label>
                  <select
                    value={invoiceForm.po_id}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, po_id: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select PO</option>
                    {purchaseOrders.map(po => (
                      <option key={po.id} value={po.id}>
                        {po.po_number} - ${Number(po.total_amount).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    value={invoiceForm.invoice_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_date: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Invoice Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoiceForm.invoice_amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_amount: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Notes
                  </label>
                  <textarea
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className={`px-4 py-2 rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddInvoice}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-lg p-6 max-w-md w-full mx-4 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Add Payment
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className={isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Linked Invoice (Optional)
                  </label>
                  <select
                    value={paymentForm.invoice_id}
                    onChange={(e) => {
                      const selectedInvoice = invoices.find(inv => inv.id === e.target.value);
                      setPaymentForm({
                        ...paymentForm,
                        invoice_id: e.target.value,
                        amount: selectedInvoice ? String(selectedInvoice.remaining_amount) : ''
                      });
                    }}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select Invoice</option>
                    {invoices.filter(inv => inv.status !== 'paid').map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_number} - Remaining: ${Number(inv.remaining_amount).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Payment Method
                  </label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Check">Check</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Payment Reference
                  </label>
                  <input
                    type="text"
                    value={paymentForm.payment_reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_reference: e.target.value })}
                    placeholder="Transaction ID, Check Number, etc."
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Notes
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className={`px-4 py-2 rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPayment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Add/Edit Form View
  if (view === 'add' || view === 'edit') {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="p-6">
          <div className="mb-6">
            <button
              onClick={() => setView('list')}
              className={`flex items-center space-x-2 ${
                isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Suppliers</span>
            </button>
          </div>

          <div className={`max-w-3xl mx-auto rounded-lg border p-6 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {view === 'add' ? 'Add New Supplier' : 'Edit Supplier'}
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Supplier Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Supplier Type
                  </label>
                  <select
                    value={formData.supplier_type}
                    onChange={(e) => setFormData({ ...formData, supplier_type: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border capitalize ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {supplierTypes.map(type => (
                      <option key={type} value={type} className="capitalize">{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Payment Terms
                  </label>
                  <select
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {paymentTermsOptions.map(term => (
                      <option key={term} value={term}>{term}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    VAT Number
                  </label>
                  <input
                    type="text"
                    value={formData.vat_number}
                    onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  IBAN
                </label>
                <input
                  type="text"
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2 w-4 h-4"
                />
                <label htmlFor="is_active" className={`text-sm ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                <button
                  onClick={() => setView('list')}
                  className={`px-4 py-2 rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSupplier}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {view === 'add' ? 'Add Supplier' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <button
              onClick={onBack}
              className={`flex items-center space-x-2 mb-2 ${
                isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Supplier Management
            </h1>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage suppliers, invoices, and payments
            </p>
          </div>
          {canEdit && (
            <button
              onClick={handleAddSupplier}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Supplier</span>
            </button>
          )}
        </div>

        <div className="mb-4 flex space-x-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search by name, code, phone, or contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className={`px-4 py-2 rounded-lg border ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`px-4 py-2 rounded-lg border capitalize ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">All Types</option>
            {supplierTypes.map(type => (
              <option key={type} value={type} className="capitalize">{type}</option>
            ))}
          </select>
        </div>

        <div className={`rounded-lg border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Supplier Name
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Type
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Contact Person
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Phone
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Last PO
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Outstanding
                  </th>
                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={`px-6 py-8 text-center ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      No suppliers found
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className={`cursor-pointer ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                      onClick={() => handleViewSupplier(supplier)}
                    >
                      <td className={`px-6 py-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <div className="flex items-center">
                          <Building2 className="w-5 h-5 mr-3 text-blue-600" />
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {supplier.code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                          isDarkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {supplier.supplier_type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <div className="text-sm">
                          {supplier.contact_person || '-'}
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {supplier.phone || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          supplier.is_active
                            ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
                            : 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
                        }`}>
                          {supplier.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {supplier.last_po_date ? new Date(supplier.last_po_date).toLocaleDateString() : '-'}
                      </td>
                      <td className={`px-6 py-4 text-sm font-medium ${
                        Number(supplier.total_outstanding) > 0
                          ? 'text-red-600 dark:text-red-400'
                          : isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        ${Number(supplier.total_outstanding || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSupplier(supplier);
                          }}
                          className="text-blue-600 hover:text-blue-700 mr-3"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSupplier(supplier);
                            }}
                            className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
