import React, { useState, useEffect } from 'react';
import { Search, Plus, DollarSign, Calendar, TrendingUp, Edit, Trash2, Building, CreditCard, Repeat, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Deal } from '../types';
import DealForm from './Forms/DealForm';
import ConfirmationCard from './ConfirmationCard';

const DealsList: React.FC = () => {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Deal['status']>('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'all' | Deal['payment_type']>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deletingDeal, setDeletingDeal] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ dealId: string; dealName: string } | null>(null);

  // Statistics
  const [stats, setStats] = useState({
    monthlyRecurring: 0,
    oneTimePayments: 0,
    installationFees: 0,
    activeDeals: 0,
  });

  useEffect(() => {
    if (user) {
      fetchDeals();
    }
  }, [user]);

  useEffect(() => {
    calculateStats();
  }, [deals]);

  const fetchDeals = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('🔍 Fetching deals for user:', user.id);
      
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', user.id)
        .order('closed_date', { ascending: false });

      if (error) throw error;
      console.log('📊 Fetched deals:', data);
      setDeals(data || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    console.log('🧮 Calculating stats from deals:', deals);
    
    const monthlyRecurring = deals
      .filter(deal => deal.payment_type === 'monthly' && deal.status === 'active')
      .reduce((sum, deal) => sum + Number(deal.monthly_amount), 0);
    
    const oneTimePayments = deals
      .filter(deal => deal.payment_type === 'one_time')
      .reduce((sum, deal) => sum + Number(deal.deal_value) + Number(deal.installation_fee), 0);
    
    const installationFees = deals.reduce((sum, deal) => sum + Number(deal.installation_fee), 0);
    
    const activeDeals = deals.filter(deal => deal.status === 'active').length;
    

    const newStats = {
      monthlyRecurring,
      oneTimePayments,
      installationFees,
      activeDeals,
    };

    console.log('📈 Calculated stats:', {
      ...newStats,
    });
    setStats(newStats);
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || deal.status === statusFilter;
    const matchesPaymentType = paymentTypeFilter === 'all' || deal.payment_type === paymentTypeFilter;
    return matchesSearch && matchesStatus && matchesPaymentType;
  });

  const getStatusColor = (status: Deal['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentTypeIcon = (paymentType: Deal['payment_type']) => {
    return paymentType === 'monthly' ? Repeat : CreditCard;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setShowForm(true);
  };

  const handleDelete = (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    setConfirmDelete({ dealId, dealName: deal?.title || 'this deal' });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;

    setDeletingDeal(confirmDelete.dealId);
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', confirmDelete.dealId);
      
      if (error) throw error;
      fetchDeals();
    } catch (error) {
      console.error('Error deleting deal:', error);
    } finally {
      setConfirmDelete(null);
      setDeletingDeal(null);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingDeal(null);
  };

  const handleFormSuccess = () => {
    fetchDeals();
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-green-300 glow-green">My Deals</h1>
          <p className="text-green-400 mt-1">Track your closed deals and revenue</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="tech-button px-4 py-2 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Deal</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="tech-card rounded-xl shadow-sm p-4 pulse-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-400">Monthly Recurring</p>
              <p className="text-2xl font-bold text-green-300">{formatCurrency(stats.monthlyRecurring)}</p>
            </div>
            <div className="w-10 h-10 bg-green-900 rounded-lg flex items-center justify-center glow-green">
              <Repeat className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="tech-card rounded-xl shadow-sm p-4 pulse-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-400">One-time Payments</p>
              <p className="text-2xl font-bold text-green-300">{formatCurrency(stats.oneTimePayments)}</p>
            </div>
            <div className="w-10 h-10 bg-green-900 rounded-lg flex items-center justify-center glow-green">
              <CreditCard className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="tech-card rounded-xl shadow-sm p-4 pulse-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-400">Installation Fees</p>
              <p className="text-2xl font-bold text-green-300">{formatCurrency(stats.installationFees)}</p>
            </div>
            <div className="w-10 h-10 bg-green-900 rounded-lg flex items-center justify-center glow-green">
              <Building className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="tech-card rounded-xl shadow-sm p-4 pulse-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-400">Active Deals</p>
              <p className="text-2xl font-bold text-green-300">{stats.activeDeals}</p>
            </div>
            <div className="w-10 h-10 bg-green-900 rounded-lg flex items-center justify-center glow-green">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="tech-card rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={paymentTypeFilter}
            onChange={(e) => setPaymentTypeFilter(e.target.value as any)}
            className="px-4 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300"
          >
            <option value="all">All Payment Types</option>
            <option value="one_time">One-time</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {/* Deals Table */}
      <div className="tech-card rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-green-900 bg-opacity-30 border-b border-green-800">
              <tr>
                <th className="text-left py-3 px-6 font-semibold text-green-300">Deal</th>
                <th className="text-left py-3 px-6 font-semibold text-green-300">Company</th>
                <th className="text-left py-3 px-6 font-semibold text-green-300">Value</th>
                <th className="text-left py-3 px-6 font-semibold text-green-300">Payment</th>
                <th className="text-left py-3 px-6 font-semibold text-green-300">Status</th>
                <th className="text-left py-3 px-6 font-semibold text-green-300">Closed Date</th>
                <th className="text-left py-3 px-6 font-semibold text-green-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map((deal, index) => {
                const PaymentIcon = getPaymentTypeIcon(deal.payment_type);
                return (
                  <tr key={deal.id} className={`border-b border-green-800 hover:bg-green-900 hover:bg-opacity-20 transition-colors duration-150 ${
                    index % 2 === 0 ? 'bg-transparent' : 'bg-green-900 bg-opacity-10'
                  }`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-900 rounded-lg flex items-center justify-center glow-green">
                          <DollarSign className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-green-300">{deal.title}</h3>
                          <p className="text-sm text-green-400">{deal.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium text-green-300">{deal.company}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <p className="font-semibold text-green-300">{formatCurrency(deal.deal_value)}</p>
                        {deal.payment_type === 'monthly' && (
                          <p className="text-sm text-green-400">
                            {formatCurrency(deal.monthly_amount)}/month
                            {deal.contract_length_months > 0 && (
                              <span className="text-green-500"> × {deal.contract_length_months}mo</span>
                            )}
                          </p>
                        )}
                        {deal.installation_fee > 0 && (
                          <p className="text-sm text-green-400">
                            +{formatCurrency(deal.installation_fee)} {deal.payment_type === 'monthly' ? 'setup' : 'installation'}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <PaymentIcon className="w-4 h-4 text-green-400" />
                        <div className="flex flex-col">
                          <span className="text-sm text-green-300 capitalize">
                            {deal.payment_type.replace('_', ' ')}
                          </span>
                          {deal.payment_type === 'monthly' && deal.contract_length_months > 0 && (
                            <span className="text-xs text-green-500">
                              {deal.contract_length_months} months
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(deal.status)}`}>
                        {deal.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-green-400" />
                        <span className="text-green-300">{new Date(deal.closed_date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(deal)}
                          className="p-1 text-green-400 hover:text-green-300 transition-colors rounded hover:bg-green-900 hover:bg-opacity-30"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(deal.id)}
                          disabled={deletingDeal === deal.id}
                          className="p-1 text-green-400 hover:text-red-400 transition-colors disabled:opacity-50 rounded hover:bg-red-900 hover:bg-opacity-30"
                        >
                          {deletingDeal === deal.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredDeals.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <p className="text-green-400">No deals found matching your criteria.</p>
        </div>
      )}

      {showForm && (
        <DealForm
          deal={editingDeal}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      <ConfirmationCard
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Deal"
        message={`Are you sure you want to delete "${confirmDelete?.dealName}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        loading={deletingDeal !== null}
      />
    </div>
  );
};

export default DealsList;