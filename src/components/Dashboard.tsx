import React from 'react';
import { Users, Target, Monitor, DollarSign, TrendingUp, Clock, CreditCard, Repeat } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import TestNotifications from './TestNotifications';
import { useUserRole } from '../hooks/useUserRole';

const Dashboard: React.FC = () => {
  const { leads, projects, demos, deals, loading } = useSupabaseData();
  const { isAdmin } = useUserRole();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalLeads = leads.length;
  const totalProjects = projects.length;
  const totalDemos = demos.length;
  const completedDemos = demos.filter(d => d.status === 'completed').length;
  const totalDeals = deals.length;
  const activeDeals = deals.filter(d => d.status === 'active').length;
  const monthlyRecurring = deals
    .filter(deal => deal.payment_type === 'monthly' && deal.status === 'active')
    .reduce((sum, deal) => sum + Number(deal.monthly_amount), 0);
  
  // Calculate total revenue from all deals
  const totalRevenue = deals.reduce((sum, deal) => sum + Number(deal.deal_value), 0);
  const oneTimeRevenue = deals
    .filter(deal => deal.payment_type === 'one_time')
    .reduce((sum, deal) => sum + Number(deal.deal_value), 0);
  const installationFees = deals.reduce((sum, deal) => sum + Number(deal.installation_fee), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };
  const stats = [
    {
      title: 'Total Leads',
      value: totalLeads.toString(),
      subtitle: `Active prospects`,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Client Solutions',
      value: totalProjects.toString(),
      subtitle: `Active client projects`,
      icon: Target,
      color: 'bg-green-500',
    },
    {
      title: 'Demos',
      value: totalDemos.toString(),
      subtitle: `${completedDemos} completed`,
      icon: Monitor,
      color: 'bg-purple-500',
    },
    {
      title: 'My Deals',
      value: totalDeals.toString(),
      subtitle: `${activeDeals} active`,
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
  ];

  const recentLeads = leads.slice(0, 3);
  const recentProjects = projects.slice(0, 3);
  const upcomingDemos = demos
    .filter(d => d.status !== 'completed')
    .slice(0, 4);
  const recentDeals = deals.slice(0, 3);

  return (
    <div className="p-3 lg:p-6 space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl lg:text-3xl font-bold text-green-300 glow-green">Dashboard</h1>
        <div className="text-xs lg:text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="tech-card rounded-xl shadow-sm p-3 lg:p-6 hover:glow-green transition-all duration-200 pulse-green"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-green-400">{stat.title}</p>
                  <p className="text-lg lg:text-2xl font-bold text-green-300 mt-1">{stat.value}</p>
                  <p className="text-xs text-green-500 mt-1">{stat.subtitle}</p>
                </div>
                <div className={`w-8 h-8 lg:w-12 lg:h-12 ${stat.color} rounded-lg flex items-center justify-center glow-green`}>
                  <Icon className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly Recurring Revenue Card */}
      {monthlyRecurring > 0 && (
        <div className="tech-card rounded-xl shadow-sm p-4 lg:p-6 border-2 border-green-500 glow-green-intense">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm lg:text-base font-medium text-green-300 flex items-center space-x-2">
                <Repeat className="w-4 h-4 lg:w-5 lg:h-5" />
                <span>Monthly Recurring Revenue</span>
              </p>
              <p className="text-2xl lg:text-3xl font-bold text-green-300 mt-2">{formatCurrency(monthlyRecurring)}</p>
              <p className="text-xs lg:text-sm text-green-400 mt-1">From {activeDeals} active deals</p>
            </div>
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-green-900 bg-opacity-30 rounded-lg flex items-center justify-center glow-green">
              <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8 text-green-400" />
            </div>
          </div>
        </div>
      )}
      {/* Revenue Overview Cards */}
      {totalRevenue > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-6">
          <div className="tech-card rounded-xl shadow-sm p-6 border border-blue-500 pulse-green">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-900 bg-opacity-30 rounded-lg flex items-center justify-center mx-auto mb-3 glow-green">
                <CreditCard className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-sm font-medium text-green-300 mb-2">One-time Revenue</p>
              <p className="text-2xl font-bold text-green-300">{formatCurrency(oneTimeRevenue)}</p>
              <p className="text-xs text-green-400 mt-1">Single payments</p>
            </div>
          </div>

          <div className="tech-card rounded-xl shadow-sm p-6 border border-purple-500 pulse-green">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-900 bg-opacity-30 rounded-lg flex items-center justify-center mx-auto mb-3 glow-green">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-sm font-medium text-green-300 mb-2">Setup/Installation</p>
              <p className="text-2xl font-bold text-green-300">{formatCurrency(installationFees)}</p>
              <p className="text-xs text-green-400 mt-1">Setup fees</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Recent Leads */}
        <div className="tech-card rounded-xl shadow-sm">
          <div className="p-4 lg:p-6 border-b border-green-800">
            <h2 className="text-base lg:text-lg font-semibold text-green-300 flex items-center">
              <Users className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-green-500" />
              Recent Leads
            </h2>
          </div>
          <div className="p-4 lg:p-6 space-y-3 lg:space-y-4">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-3 lg:p-4 bg-green-900 bg-opacity-30 rounded-lg border border-green-800">
                <div>
                  <h3 className="text-sm lg:text-base font-medium text-green-300">{lead.name}</h3>
                  <p className="text-xs lg:text-sm text-green-400">{lead.company}</p>
                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${
                    lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                    lead.status === 'proposal' ? 'bg-purple-100 text-purple-800' :
                    lead.status === 'negotiation' ? 'bg-orange-100 text-orange-800' :
                    lead.status === 'closed-won' ? 'bg-green-100 text-green-800' :
                    lead.status === 'closed-lost' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {lead.status}
                  </span>
                </div>
                <div className="text-right">
                  {lead.revenue && (
                    <p className="text-sm lg:text-base font-bold text-green-300">
                      {lead.revenue}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="tech-card rounded-xl shadow-sm">
          <div className="p-4 lg:p-6 border-b border-green-800">
            <h2 className="text-base lg:text-lg font-semibold text-green-300 flex items-center">
              <Target className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-green-500" />
              Recent Solutions
            </h2>
          </div>
          <div className="p-4 lg:p-6 space-y-3 lg:space-y-4">
            {recentProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-3 lg:p-4 bg-green-900 bg-opacity-30 rounded-lg border border-green-800">
                <div>
                  <h3 className="text-sm lg:text-base font-medium text-green-300">{project.title}</h3>
                  <p className="text-xs lg:text-sm text-green-400">{project.company}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs lg:text-sm text-green-400">{project.expectedCloseDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Deals */}
        <div className="tech-card rounded-xl shadow-sm">
          <div className="p-4 lg:p-6 border-b border-green-800">
            <h2 className="text-base lg:text-lg font-semibold text-green-300 flex items-center">
              <DollarSign className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-green-500" />
              Recent Deals
            </h2>
          </div>
          <div className="p-4 lg:p-6 space-y-3 lg:space-y-4">
            {recentDeals.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-green-400 text-sm">No deals yet</p>
              </div>
            ) : (
              recentDeals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between p-3 lg:p-4 bg-green-900 bg-opacity-30 rounded-lg border border-green-800">
                  <div className="flex-1">
                    <h3 className="text-sm lg:text-base font-medium text-green-300">{deal.title}</h3>
                    <p className="text-xs lg:text-sm text-green-400">{deal.company}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {deal.payment_type === 'monthly' ? (
                        <Repeat className="w-3 h-3 text-green-500" />
                      ) : (
                        <CreditCard className="w-3 h-3 text-green-500" />
                      )}
                      <span className="text-xs text-green-500 capitalize">
                        {deal.payment_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm lg:text-base font-bold text-green-300">
                      {formatCurrency(deal.deal_value)}
                    </p>
                    {deal.payment_type === 'monthly' && (
                      <p className="text-xs text-green-400">
                        {formatCurrency(deal.monthly_amount)}/mo
                      </p>
                    )}
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${
                      deal.status === 'active' ? 'bg-green-100 text-green-800' :
                      deal.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {deal.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Upcoming Demos */}
        <div className="tech-card rounded-xl shadow-sm">
          <div className="p-4 lg:p-6 border-b border-green-800">
            <h2 className="text-base lg:text-lg font-semibold text-green-300 flex items-center">
              <Clock className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-green-500" />
              Upcoming Demos
            </h2>
          </div>
          <div className="p-4 lg:p-6 space-y-3 lg:space-y-4">
            {upcomingDemos.map((demo) => (
              <div key={demo.id} className="flex items-center justify-between p-3 lg:p-4 bg-green-900 bg-opacity-30 rounded-lg border border-green-800">
                <div className="flex-1">
                  <h3 className="text-sm lg:text-base font-medium text-green-300">{demo.title}</h3>
                  <p className="text-xs lg:text-sm text-green-400">{demo.description}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    demo.priority === 'high' ? 'bg-red-100 text-red-800' :
                    demo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {demo.priority}
                  </span>
                  <p className="text-xs text-green-500 mt-1">{demo.dueDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;