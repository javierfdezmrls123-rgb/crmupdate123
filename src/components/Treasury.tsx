import React, { useState, useEffect } from 'react';
import { Vault, DollarSign, TrendingUp, Users, Calendar, Building, CreditCard, Repeat, BarChart3, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserRole } from '../hooks/useUserRole';
import { Deal } from '../types';
import DealForm from './Forms/DealForm';
import ConfirmationCard from './ConfirmationCard';

interface SalesmanStats {
  user_id: string;
  email: string;
  name: string;
  totalValue: number;
  monthlyRecurring: number;
  oneTimePayments: number;
  installationFees: number;
  activeDeals: number;
  dealsCount: number;
  thisMonthValue: number;
  deals: Deal[];
}

const Treasury: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [salesmenStats, setSalesmenStats] = useState<SalesmanStats[]>([]);
  const [selectedSalesman, setSelectedSalesman] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'year' | 'quarter' | 'month'>('all');
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [showDealForm, setShowDealForm] = useState(false);
  const [deletingDeal, setDeletingDeal] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ dealId: string; dealTitle: string } | null>(null);

  const { isAdmin } = useUserRole();

  // Overall company stats
  const [companyStats, setCompanyStats] = useState({
    monthlyRecurring: 0,
    totalDeals: 0,
    activeSalesmen: 0,
    thisMonthRevenue: 0
  });

  useEffect(() => {
    if (isAdmin) {
      fetchTreasuryData();
    }
  }, [isAdmin, timeFilter]);

  useEffect(() => {
    calculateStats();
  }, [salesmenStats]);

  const fetchTreasuryData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching treasury data...');

      // Get all deals first
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select('*')
        .order('closed_date', { ascending: false });

      if (dealsError) throw dealsError;
      console.log('📊 Raw deals data from database:', dealsData);
      console.log('📊 Number of deals found:', dealsData?.length || 0);

      if (!dealsData || dealsData.length === 0) {
        setSalesmenStats([]);
        return;
      }

      // Filter deals based on time filter
      const now = new Date();
      let filteredDeals = dealsData;

      if (timeFilter !== 'all') {
        filteredDeals = dealsData.filter(deal => {
          const dealDate = new Date(deal.closed_date);
          
          switch (timeFilter) {
            case 'year':
              return dealDate.getFullYear() === now.getFullYear();
            case 'quarter':
              const currentQuarter = Math.floor(now.getMonth() / 3);
              const dealQuarter = Math.floor(dealDate.getMonth() / 3);
              return dealDate.getFullYear() === now.getFullYear() && dealQuarter === currentQuarter;
            case 'month':
              return dealDate.getFullYear() === now.getFullYear() && 
                     dealDate.getMonth() === now.getMonth();
            default:
              return true;
          }
        });
      }

      console.log(`📊 Filtered deals (${timeFilter}):`, filteredDeals.length);

      // Group deals by salesman
      const salesmenMap = new Map<string, SalesmanStats>();

      filteredDeals.forEach(deal => {
        const salesmanName = deal.salesman_name;
        const salesmanEmail = deal.salesman_email;

        if (!salesmanName || !salesmanEmail) {
          console.warn(`⚠️ No salesman info found for deal: ${deal.title}`);
          return;
        }

        const salesmanKey = salesmanEmail; // Use email as unique key

        console.log(`👤 Processing deal for salesman: ${salesmanName} (${salesmanEmail})`);

        if (!salesmenMap.has(salesmanKey)) {
          salesmenMap.set(salesmanKey, {
            user_id: deal.user_id,
            email: salesmanEmail,
            name: salesmanName,
            totalValue: 0,
            monthlyRecurring: 0,
            oneTimePayments: 0,
            installationFees: 0,
            activeDeals: 0,
            dealsCount: 0,
            thisMonthValue: 0,
            deals: []
          });
        }

        const stats = salesmenMap.get(salesmanKey)!;

        // Add deal value to total
        stats.totalValue += Number(deal.deal_value);
        stats.dealsCount += 1;

        // Add installation fee if exists
        if (deal.installation_fee > 0) {
          stats.installationFees += Number(deal.installation_fee);
        }

        // Handle payment types
        if (deal.payment_type === 'one_time') {
          stats.oneTimePayments += Number(deal.deal_value);
        } else if (deal.payment_type === 'monthly' && deal.status === 'active') {
          stats.monthlyRecurring += Number(deal.monthly_amount);
        }

        if (deal.status === 'active') {
          stats.activeDeals += 1;
        }

        // Always calculate this month value (regardless of time filter)
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const dealDate = new Date(deal.closed_date);
        if (dealDate >= thisMonth) {
          stats.thisMonthValue += Number(deal.deal_value);
        }

        stats.deals.push(deal);
      });

      const salesmenArray = Array.from(salesmenMap.values())
        .sort((a, b) => b.totalValue - a.totalValue);

      console.log('📈 Processed salesmen data:', salesmenArray);
      console.log('📈 Total salesmen found:', salesmenArray.length);
      setSalesmenStats(salesmenArray);

    } catch (error) {
      console.error('Error fetching treasury data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    console.log('🧮 Calculating company stats from:', salesmenStats);
    
    // Calculate company stats from all salesmen data
    const monthlyRecurring = salesmenStats.reduce((sum, s) => sum + s.monthlyRecurring, 0);
    const totalDeals = salesmenStats.reduce((sum, s) => sum + s.dealsCount, 0);
    const thisMonthRevenue = salesmenStats.reduce((sum, s) => sum + s.thisMonthValue, 0);

    const newStats = {
      monthlyRecurring,
      totalDeals,
      activeSalesmen: salesmenStats.length,
      thisMonthRevenue
    };

    console.log('📊 New company stats:', newStats);
    setCompanyStats(newStats);
  };

  const handleEditDeal = (deal: Deal) => {
    console.log('🔧 Admin editing deal:', deal.title);
    setEditingDeal(deal);
    setShowDealForm(true);
  };

  const handleDeleteDeal = (deal: Deal) => {
    console.log('🗑️ Admin requesting delete for deal:', deal.title);
    setConfirmDelete({ dealId: deal.id, dealTitle: deal.title });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;

    console.log('🔥 Admin confirming deletion of deal:', confirmDelete.dealId);
    setDeletingDeal(confirmDelete.dealId);

    try {
      console.log('🗑️ Attempting to delete deal from database...');
      
      // Direct deletion with admin privileges - no restrictions
      const { error: deleteError } = await supabase
        .from('deals')
        .delete()
        .eq('id', confirmDelete.dealId);

      if (deleteError) {
        console.error('❌ Database deletion failed:', deleteError);
        alert(`Failed to delete deal: ${deleteError.message || 'Unknown database error'}`);
        return;
      }

      console.log('✅ Deal deletion command executed successfully');
      alert(`Deal permanently deleted from database!`);
      
      // Refresh treasury data immediately
      await fetchTreasuryData();

    } catch (error) {
      console.error('❌ Unexpected error during deletion:', error);
      alert(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setConfirmDelete(null);
      setDeletingDeal(null);
    }
  };

  const handleDealFormClose = () => {
    setShowDealForm(false);
    setEditingDeal(null);
  };

  const handleDealFormSuccess = async () => {
    console.log('✅ Deal form saved successfully, refreshing treasury...');
    await fetchTreasuryData();
    setShowDealForm(false);
    setEditingDeal(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const selectedSalesmanData = selectedSalesman 
    ? salesmenStats.find(s => s.user_id === selectedSalesman)
    : null;

  if (!isAdmin) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Vault className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-500">Only administrators can access the Treasury.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading treasury data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Vault className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Treasury</h1>
            <p className="text-gray-500 mt-1">Company revenue and sales performance</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="px-4 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300"
          >
            <option value="all">All Time</option>
            <option value="year">This Year</option>
            <option value="quarter">This Quarter</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Company Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="tech-card rounded-xl shadow-sm p-4 pulse-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-400">Monthly Recurring</p>
              <p className="text-2xl font-bold text-green-300">{formatCurrency(companyStats.monthlyRecurring)}</p>
            </div>
            <div className="w-10 h-10 bg-green-900 rounded-lg flex items-center justify-center glow-green">
              <Repeat className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="tech-card rounded-xl shadow-sm p-4 pulse-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-400">Total Deals</p>
              <p className="text-2xl font-bold text-green-300">{companyStats.totalDeals}</p>
            </div>
            <div className="w-10 h-10 bg-green-900 rounded-lg flex items-center justify-center glow-green">
              <BarChart3 className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="tech-card rounded-xl shadow-sm p-4 pulse-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-400">Active Salesmen</p>
              <p className="text-2xl font-bold text-green-300">{companyStats.activeSalesmen}</p>
            </div>
            <div className="w-10 h-10 bg-green-900 rounded-lg flex items-center justify-center glow-green">
              <Users className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="tech-card rounded-xl shadow-sm p-4 pulse-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-400">This Month</p>
              <p className="text-2xl font-bold text-green-300">{formatCurrency(companyStats.thisMonthRevenue)}</p>
            </div>
            <div className="w-10 h-10 bg-green-900 rounded-lg flex items-center justify-center glow-green">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Salesmen Performance Table */}
      <div className="tech-card rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-green-300">Salesmen Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-green-900 bg-opacity-30 border-b border-green-800">
              <tr>
                <th className="text-left py-3 px-6 font-semibold text-green-300">Salesman</th>
                <th className="text-left py-3 px-6 font-semibold text-green-300">Total Revenue</th>
                <th className="text-left py-3 px-6 font-semibold text-green-300">Monthly Recurring</th>
                <th className="text-left py-3 px-6 font-semibold text-green-300">One-time</th>
                <th className="text-left py-3 px-6 font-semibold text-green-300">Installation</th>
                <th className="text-left py-3 px-6 font-semibold text-green-300">Deals</th>
                <th className="text-left py-3 px-6 font-semibold text-green-300">This Month</th>
                <th className="text-left py-3 px-6 font-semibold text-green-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {salesmenStats.map((salesman, index) => (
                <tr key={salesman.user_id} className={`border-b border-green-800 hover:bg-green-900 hover:bg-opacity-20 transition-colors duration-150 ${
                  index % 2 === 0 ? 'bg-transparent' : 'bg-green-900 bg-opacity-10'
                }`}>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-900 rounded-full flex items-center justify-center glow-green">
                        <Users className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-300">{salesman.name}</p>
                        <p className="text-sm text-green-500">{salesman.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-semibold text-green-300">{formatCurrency(salesman.totalValue)}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-green-400 font-medium">{formatCurrency(salesman.monthlyRecurring)}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-green-400 font-medium">{formatCurrency(salesman.oneTimePayments)}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-green-400 font-medium">{formatCurrency(salesman.installationFees)}</p>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <p className="font-medium text-green-300">{salesman.dealsCount} total</p>
                      <p className="text-sm text-green-400">{salesman.activeDeals} active</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-medium text-green-400">{formatCurrency(salesman.thisMonthValue)}</p>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => setSelectedSalesman(
                        selectedSalesman === salesman.user_id ? null : salesman.user_id
                      )}
                      className="tech-button px-3 py-1 text-sm text-white rounded-lg transition-colors"
                    >
                      {selectedSalesman === salesman.user_id ? 'Hide' : 'View'} Deals
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Salesman Details */}
      {selectedSalesmanData && (
        <div className="tech-card rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-green-300">
              {selectedSalesmanData.name}'s Deals ({selectedSalesmanData.deals.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-green-900 bg-opacity-30 border-b border-green-800">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-green-300">Deal</th>
                  <th className="text-left py-3 px-6 font-semibold text-green-300">Company</th>
                  <th className="text-left py-3 px-6 font-semibold text-green-300">Value</th>
                  <th className="text-left py-3 px-6 font-semibold text-green-300">Type</th>
                  <th className="text-left py-3 px-6 font-semibold text-green-300">Status</th>
                  <th className="text-left py-3 px-6 font-semibold text-green-300">Closed Date</th>
                  {isAdmin && (
                    <th className="text-left py-3 px-6 font-semibold text-green-300">Admin Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {selectedSalesmanData.deals.map((deal, index) => (
                  <tr key={deal.id} className={`border-b border-green-800 ${
                    index % 2 === 0 ? 'bg-transparent' : 'bg-green-900 bg-opacity-10'
                  }`}>
                    <td className="py-3 px-6">
                      <div>
                        <p className="font-medium text-green-300">{deal.title}</p>
                        <p className="text-sm text-green-500">{deal.description}</p>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <p className="text-green-300">{deal.company}</p>
                    </td>
                    <td className="py-3 px-6">
                      <div className="space-y-1">
                        <p className="font-semibold text-green-300">{formatCurrency(deal.deal_value)}</p>
                        {deal.payment_type === 'monthly' && (
                          <p className="text-sm text-green-400">{formatCurrency(deal.monthly_amount)}/month</p>
                        )}
                        {deal.installation_fee > 0 && (
                          <p className="text-sm text-green-400">
                            +{formatCurrency(deal.installation_fee)} {deal.payment_type === 'monthly' ? 'setup' : 'installation'}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center space-x-2">
                        {deal.payment_type === 'monthly' ? (
                          <Repeat className="w-4 h-4 text-green-400" />
                        ) : (
                          <CreditCard className="w-4 h-4 text-green-400" />
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm text-green-300 capitalize">
                            {deal.payment_type.replace('_', ' ')}
                          </span>
                          {deal.payment_type === 'monthly' && deal.contract_length_months > 0 && (
                            <span className="text-xs text-green-500">
                              {deal.contract_length_months}mo contract
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        deal.status === 'active' ? 'bg-green-100 text-green-800' :
                        deal.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {deal.status}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-green-400" />
                        <span className="text-green-300">{new Date(deal.closed_date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-6">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditDeal(deal)}
                            className="p-2 text-green-400 hover:text-green-300 transition-colors rounded hover:bg-green-900 hover:bg-opacity-30"
                            title="Edit Deal"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDeal(deal)}
                            disabled={deletingDeal === deal.id}
                            className="p-2 text-green-400 hover:text-red-400 transition-colors disabled:opacity-50 rounded hover:bg-red-900 hover:bg-opacity-30"
                            title="Delete Deal"
                          >
                            {deletingDeal === deal.id ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {salesmenStats.length === 0 && (
        <div className="text-center py-12">
          <Vault className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <p className="text-green-400">No deals found for the selected time period.</p>
        </div>
      )}
      </div>

      {/* Deal Form Modal */}
      {showDealForm && (
        <DealForm
          deal={editingDeal}
          onClose={handleDealFormClose}
          onSuccess={handleDealFormSuccess}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmationCard
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Deal"
        message={`Are you sure you want to permanently delete "${confirmDelete?.dealTitle}"? This action cannot be undone and will remove the deal from all records.`}
        confirmText="Delete Deal"
        type="danger"
        loading={deletingDeal !== null}
      />
    </>
  );
};

export default Treasury;