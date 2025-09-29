import React, { useState } from 'react';
import { Search, Plus, Phone, Mail, Building, User, Edit, Trash2, Filter, Globe, Trash, ChevronDown } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useActivityLogger } from '../hooks/useActivityLogger';
import { Lead } from '../types';
import LeadForm from './Forms/LeadForm';
import ConfirmationCard from './ConfirmationCard';
import { supabase } from '../lib/supabase';
import { useUserRole } from '../hooks/useUserRole';

const LeadList: React.FC = () => {
  const { leads, loading, refetch } = useSupabaseData();
  const { logActivity } = useActivityLogger();
  const { isAdmin } = useUserRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Lead['status']>('all');
  const [callStatusFilter, setCallStatusFilter] = useState<'all' | Lead['call_status']>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [deletingLead, setDeletingLead] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [editingStatus, setEditingStatus] = useState<{ leadId: string; field: 'status' | 'call_status' } | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'single' | 'selected' | 'all'; leadId?: string; leadName?: string } | null>(null);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading leads...</p>
        </div>
      </div>
    );
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesCallStatus = callStatusFilter === 'all' || lead.call_status === callStatusFilter;
    const matchesIndustry = industryFilter === 'all' || lead.industry === industryFilter;
    return matchesSearch && matchesStatus && matchesCallStatus && matchesIndustry;
  }).sort((a, b) => {
    // Sort by revenue (highest to lowest)
    const getRevenueValue = (revenue: string) => {
      if (!revenue) return 0;
      const cleanRevenue = revenue.replace(/[^\d.,kmKM]/g, '');
      if (cleanRevenue.toLowerCase().includes('m')) {
        return parseFloat(cleanRevenue.replace(/m/i, '')) * 1000000;
      } else if (cleanRevenue.toLowerCase().includes('k')) {
        return parseFloat(cleanRevenue.replace(/k/i, '')) * 1000;
      } else if (cleanRevenue) {
        return parseFloat(cleanRevenue.replace(/[,]/g, ''));
      }
      return 0;
    };
    
    return getRevenueValue(b.revenue || '') - getRevenueValue(a.revenue || '');
  });

  // Get unique industries for filter
  const industries = Array.from(new Set(leads.map(lead => lead.industry).filter(Boolean)));

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'prospect': return 'bg-blue-100 text-blue-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'proposal': return 'bg-purple-100 text-purple-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closed-won': return 'bg-green-100 text-green-800';
      case 'closed-lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCallStatusColor = (callStatus: Lead['call_status']) => {
    switch (callStatus) {
      case 'answered': return 'bg-green-100 text-green-800';
      case 'no_response': return 'bg-yellow-100 text-yellow-800';
      case 'voicemail': return 'bg-blue-100 text-blue-800';
      case 'busy': return 'bg-orange-100 text-orange-800';
      case 'wrong_number': return 'bg-red-100 text-red-800';
      case 'not_called': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const handleEdit = (lead: any) => {
    logActivity({
      actionType: 'click',
      actionDetails: `Clicked edit button for lead: ${lead.name}`,
      targetType: 'lead',
      targetId: lead.id,
      targetName: lead.name,
      metadata: { company: lead.company, action: 'edit_button' }
    });
    setEditingLead(lead);
    setShowForm(true);
  };

  const handleDelete = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    setConfirmDelete({ type: 'single', leadId, leadName: lead?.name });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;

    if (confirmDelete.type === 'single' && confirmDelete.leadId) {
      const lead = leads.find(l => l.id === confirmDelete.leadId);
      logActivity({
        actionType: 'click',
        actionDetails: `Clicked delete button for lead: ${lead?.name}`,
        targetType: 'lead',
        targetId: confirmDelete.leadId,
        targetName: lead?.name,
        metadata: { action: 'delete_button' }
      });
      
      setDeletingLead(confirmDelete.leadId);
    } else if (confirmDelete.type === 'all') {
      setBulkDeleting(true);
    } else if (confirmDelete.type === 'selected') {
      setDeletingSelected(true);
    }

    try {
      let error;
      
      if (confirmDelete.type === 'single' && confirmDelete.leadId) {
        const lead = leads.find(l => l.id === confirmDelete.leadId);
        logActivity({
          actionType: 'delete',
          actionDetails: `Deleted lead: ${lead?.name}`,
          targetType: 'lead',
          targetId: confirmDelete.leadId,
          targetName: lead?.name,
          metadata: { company: lead?.company }
        });
        
        const result = await supabase
          .from('leads')
          .delete()
          .eq('id', confirmDelete.leadId);
        error = result.error;
      } else if (confirmDelete.type === 'all') {
        const result = await supabase
          .from('leads')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        error = result.error;
      } else if (confirmDelete.type === 'selected') {
        const result = await supabase
          .from('leads')
          .delete()
          .in('id', Array.from(selectedLeads));
        error = result.error;
        setSelectedLeads(new Set());
      }

      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Error deleting lead:', error);
    } finally {
      setConfirmDelete(null);
      setDeletingLead(null);
      setBulkDeleting(false);
      setDeletingSelected(false);
    }
  };

  const handleBulkDelete = async () => {
    setConfirmDelete({ type: 'all' });
  };

  const handleQuickStatusUpdate = async (leadId: string, field: 'status' | 'call_status', value: string) => {
    const lead = leads.find(l => l.id === leadId);
    logActivity({
      actionType: 'edit',
      actionDetails: `Updated ${field} to "${value}" for lead: ${lead?.name}`,
      targetType: 'lead',
      targetId: leadId,
      targetName: lead?.name,
      metadata: { 
        field: field,
        old_value: lead?.[field],
        new_value: value,
        company: lead?.company
      }
    });
    
    try {
      const { error } = await supabase
        .from('leads')
        .update({ [field]: value })
        .eq('id', leadId);
      
      if (error) throw error;
      refetch();
      setEditingStatus(null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const formatRevenue = (revenue: string) => {
    if (!revenue) return '';
    // Convert revenue to proper format with € and add thousand separators
    let cleanRevenue = revenue.replace(/[^\d.,kmKM]/g, '');
    if (cleanRevenue.toLowerCase().includes('k')) {
      const value = parseFloat(cleanRevenue.replace(/k/i, ''));
      return `€${(value * 1000).toLocaleString()}`;
    } else if (cleanRevenue.toLowerCase().includes('m')) {
      const value = parseFloat(cleanRevenue.replace(/m/i, ''));
      return `€${(value * 1000000).toLocaleString()}`;
    } else if (cleanRevenue) {
      const value = parseFloat(cleanRevenue.replace(/[,]/g, ''));
      return `€${value.toLocaleString()}`;
    }
    return '';
  };
  const handleFormClose = () => {
    setShowForm(false);
    setEditingLead(null);
  };

  const handleFormSuccess = () => {
    refetch();
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(lead => lead.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedLeads.size === 0) return;
    setConfirmDelete({ type: 'selected' });
  };

  return (
    <div className="p-3 lg:p-6 space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl lg:text-3xl font-bold text-green-300 glow-green">Leads</h1>
        <div className="flex flex-wrap gap-2 lg:space-x-3">
          {selectedLeads.size > 0 && (
            <button 
              onClick={() => {
                logActivity({
                  actionType: 'click',
                  actionDetails: `Clicked delete selected leads button (${selectedLeads.size} leads)`,
                  targetType: 'button',
                  metadata: { selected_count: selectedLeads.size, action: 'bulk_delete' }
                });
                handleDeleteSelected();
              }}
              disabled={deletingSelected}
              className="tech-button bg-red-600 text-white px-2 lg:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-1 lg:space-x-2 disabled:opacity-50 text-xs lg:text-sm"
            >
              {deletingSelected ? (
                <div className="w-3 h-3 lg:w-4 lg:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
              )}
              <span>Delete Selected ({selectedLeads.size})</span>
            </button>
          )}
          {leads.length > 0 && isAdmin && (
            <button 
              onClick={() => {
                logActivity({
                  actionType: 'click',
                  actionDetails: `Clicked remove all leads button (${leads.length} leads)`,
                  targetType: 'button',
                  metadata: { total_leads: leads.length, action: 'bulk_delete_all' }
                });
                handleBulkDelete();
              }}
              disabled={bulkDeleting}
              className="tech-button bg-red-600 text-white px-2 lg:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-1 lg:space-x-2 disabled:opacity-50 text-xs lg:text-sm"
            >
              {bulkDeleting ? (
                <div className="w-3 h-3 lg:w-4 lg:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash className="w-3 h-3 lg:w-4 lg:h-4" />
              )}
              <span>Remove All ({leads.length})</span>
            </button>
          )}
          <button 
            onClick={() => {
              logActivity({
                actionType: 'click',
                actionDetails: 'Clicked add new lead button',
                targetType: 'button',
                metadata: { action: 'add_lead' }
              });
              setShowForm(true);
            }}
            className="tech-button bg-blue-600 text-white px-2 lg:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-1 lg:space-x-2 text-xs lg:text-sm"
          >
            <Plus className="w-3 h-3 lg:w-4 lg:h-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="tech-card rounded-xl shadow-sm p-3 lg:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 w-3 h-3 lg:w-4 lg:h-4" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value) {
                  logActivity({
                    actionType: 'click',
                    actionDetails: `Searched for: "${e.target.value}"`,
                    targetType: 'filter',
                    metadata: { search_term: e.target.value, action: 'search' }
                  });
                }
              }}
              className="w-full pl-8 lg:pl-10 pr-4 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500 text-sm lg:text-base"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 lg:gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                logActivity({
                  actionType: 'click',
                  actionDetails: `Filtered by status: ${e.target.value}`,
                  targetType: 'filter',
                  metadata: { filter_type: 'status', filter_value: e.target.value }
                });
              }}
              className="px-2 lg:px-4 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 text-sm lg:text-base"
            >
              <option value="all">All Status</option>
              <option value="prospect">Prospect</option>
              <option value="qualified">Qualified</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
              <option value="closed-won">Closed Won</option>
              <option value="closed-lost">Closed Lost</option>
            </select>
            <select
              value={callStatusFilter}
              onChange={(e) => setCallStatusFilter(e.target.value as any)}
              className="px-2 lg:px-4 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 text-sm lg:text-base"
            >
              <option value="all">All Call Status</option>
              <option value="not_called">Not Called</option>
              <option value="answered">Answered</option>
              <option value="no_response">No Response</option>
              <option value="voicemail">Voicemail</option>
              <option value="busy">Busy</option>
              <option value="wrong_number">Wrong Number</option>
            </select>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="px-2 lg:px-4 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 text-sm lg:text-base"
            >
              <option value="all">All Industries</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="tech-card rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto -mx-3 lg:mx-0">
          <table className="w-full">
            <thead className="bg-green-900 bg-opacity-30 border-b border-green-800">
              <tr>
                <th className="text-left py-2 px-1 lg:px-2 font-semibold text-green-300 text-xs">
                  <input
                    type="checkbox"
                    checked={selectedLeads.size > 0 && selectedLeads.size === filteredLeads.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="text-left py-2 px-1 lg:px-2 font-semibold text-green-300 text-xs">Lead</th>
                <th className="text-left py-2 px-1 lg:px-2 font-semibold text-green-300 text-xs hidden lg:table-cell">Company</th>
                <th className="text-left py-2 px-1 lg:px-2 font-semibold text-green-300 text-xs hidden md:table-cell">Contact</th>
                <th className="text-left py-2 px-1 lg:px-2 font-semibold text-green-300 text-xs hidden lg:table-cell">Industry</th>
                <th className="text-left py-2 px-1 lg:px-2 font-semibold text-green-300 text-xs">Status</th>
                <th className="text-left py-2 px-1 lg:px-2 font-semibold text-green-300 text-xs">Call</th>
                <th className="text-left py-2 px-1 lg:px-2 font-semibold text-green-300 text-xs hidden md:table-cell">Revenue</th>
                <th className="text-left py-2 px-1 lg:px-2 font-semibold text-green-300 text-xs hidden lg:table-cell">Contact</th>
                <th className="text-left py-2 px-1 lg:px-2 font-semibold text-green-300 text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, index) => (
                <tr key={lead.id} className={`border-b border-green-800 hover:bg-green-900 hover:bg-opacity-20 transition-colors duration-150 ${
                  selectedLeads.has(lead.id) ? 'bg-green-900 bg-opacity-30' : index % 2 === 0 ? 'bg-transparent' : 'bg-green-900 bg-opacity-10'
                }`}>
                  <td className="py-2 lg:py-3 px-1 lg:px-2">
                    <input
                      type="checkbox"
                      checked={selectedLeads.has(lead.id)}
                      onChange={() => handleSelectLead(lead.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 lg:py-3 px-1 lg:px-2">
                    <div className="flex items-center space-x-1 lg:space-x-2">
                      <div className="w-5 h-5 lg:w-6 lg:h-6 bg-green-900 rounded-full flex items-center justify-center flex-shrink-0 glow-green">
                        <User className="w-2 h-2 lg:w-3 lg:h-3 text-green-400" />
                      </div>
                      <div className="min-w-0 max-w-[80px] lg:max-w-[120px]">
                        <h3 className="font-medium text-green-300 text-xs lg:text-sm truncate">{lead.name || 'No Name'}</h3>
                        {lead.position && (
                          <p className="text-xs text-green-500 truncate hidden lg:block">{lead.position}</p>
                        )}
                        <div className="lg:hidden">
                          <p className="text-xs text-green-400 truncate">{lead.company}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 lg:py-3 px-1 lg:px-2 hidden lg:table-cell">
                    <div className="space-y-1 max-w-[120px] lg:max-w-[160px]">
                      <p className="font-medium text-green-300 text-xs lg:text-sm truncate">{lead.company}</p>
                      {lead.website && (
                        <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 hover:underline flex items-center truncate">
                          <Globe className="w-2 h-2 mr-1 flex-shrink-0" />
                          <span>Site</span>
                        </a>
                      )}
                      {lead.ceo && (
                        <p className="text-xs text-green-500 truncate">CEO: {lead.ceo}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-2 lg:py-3 px-1 lg:px-2 hidden md:table-cell">
                    <div className="space-y-1 max-w-[100px] lg:max-w-[140px]">
                      {lead.email && (
                        <div className="flex items-center space-x-1 min-w-0">
                          <Mail className="w-2 h-2 text-green-400" />
                          <span className="text-xs lg:text-sm text-green-300 truncate">{lead.email}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center space-x-1 min-w-0">
                          <Phone className="w-2 h-2 text-green-400" />
                          <span className="text-xs lg:text-sm text-green-300 truncate">{lead.phone}</span>
                        </div>
                      )}
                      {!lead.email && !lead.phone && (
                        <span className="text-xs lg:text-sm text-green-500">No contact</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 lg:py-3 px-1 lg:px-2 hidden lg:table-cell">
                    {lead.industry && (
                      <span className="inline-block px-1 lg:px-2 py-1 text-xs bg-green-900 text-green-300 rounded max-w-[80px] lg:max-w-[100px] truncate border border-green-700">
                        {lead.industry}
                      </span>
                    )}
                  </td>
                  <td className="py-2 lg:py-3 px-1 lg:px-2">
                    {editingStatus?.leadId === lead.id && editingStatus?.field === 'status' ? (
                      <select
                        value={lead.status}
                        onChange={(e) => handleQuickStatusUpdate(lead.id, 'status', e.target.value)}
                        onBlur={() => setEditingStatus(null)}
                        autoFocus
                        className="text-xs tech-border rounded px-1 py-0.5 focus:ring-2 focus:ring-green-500 w-full min-w-[70px] lg:min-w-[85px] text-green-300"
                      >
                        <option value="prospect">Prospect</option>
                        <option value="qualified">Qualified</option>
                        <option value="proposal">Proposal</option>
                        <option value="negotiation">Negotiation</option>
                        <option value="closed-won">Closed Won</option>
                        <option value="closed-lost">Closed Lost</option>
                      </select>
                    ) : (
                      <select
                        value={lead.status}
                        onChange={(e) => handleQuickStatusUpdate(lead.id, 'status', e.target.value)}
                        className={`px-1 lg:px-2 py-1 text-xs rounded hover:opacity-80 transition-opacity ${getStatusColor(lead.status)} min-w-[70px] lg:min-w-[90px] border-0 cursor-pointer`}
                      >
                        <option value="prospect">Prospect</option>
                        <option value="qualified">Qualified</option>
                        <option value="proposal">Proposal</option>
                        <option value="negotiation">Negotiation</option>
                        <option value="closed-won">Closed Won</option>
                        <option value="closed-lost">Closed Lost</option>
                      </select>
                    )}
                  </td>
                  <td className="py-2 lg:py-3 px-1 lg:px-2">
                    <select
                      value={lead.call_status}
                      onChange={(e) => handleQuickStatusUpdate(lead.id, 'call_status', e.target.value)}
                      className={`px-1 lg:px-2 py-1 text-xs rounded hover:opacity-80 transition-opacity ${getCallStatusColor(lead.call_status)} min-w-[70px] lg:min-w-[85px] border-0 cursor-pointer`}
                    >
                      <option value="not_called">Not Called</option>
                      <option value="answered">Answered</option>
                      <option value="no_response">No Response</option>
                      <option value="voicemail">Voicemail</option>
                      <option value="busy">Busy</option>
                      <option value="wrong_number">Wrong Number</option>
                    </select>
                  </td>
                  <td className="py-2 lg:py-3 px-1 lg:px-2 hidden md:table-cell">
                    <div className="space-y-1 max-w-[60px] lg:max-w-[70px]">
                      {lead.revenue ? (
                        <div className="text-xs lg:text-sm font-medium text-green-300 truncate">
                          {formatRevenue(lead.revenue)}
                        </div>
                      ) : (
                        <span className="text-xs lg:text-sm text-green-500">No revenue</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 lg:py-3 px-1 lg:px-2 hidden lg:table-cell">
                    <span className="text-xs lg:text-sm text-green-300 max-w-[60px] lg:max-w-[70px] truncate">
                      {new Date(lead.lastContact).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </td>
                  <td className="py-2 lg:py-3 px-1 lg:px-2">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(lead)}
                        className="p-1 lg:p-1.5 text-green-400 hover:text-green-300 transition-colors rounded hover:bg-green-900 hover:bg-opacity-30"
                      >
                        <Edit className="w-3 h-3 lg:w-4 lg:h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(lead.id)}
                        disabled={deletingLead === lead.id}
                        className="p-1 lg:p-1.5 text-green-400 hover:text-red-400 transition-colors disabled:opacity-50 rounded hover:bg-red-900 hover:bg-opacity-30"
                      >
                        {deletingLead === lead.id ? (
                          <div className="w-3 h-3 lg:w-4 lg:h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-12">
          <User className="w-8 h-8 lg:w-12 lg:h-12 text-green-400 mx-auto mb-4" />
          <p className="text-green-400">No leads found matching your criteria.</p>
        </div>
      )}

      {showForm && (
        <LeadForm
          lead={editingLead}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      <ConfirmationCard
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title={
          confirmDelete?.type === 'single' ? 'Delete Lead' :
          confirmDelete?.type === 'selected' ? 'Delete Selected Leads' :
          'Delete All Leads'
        }
        message={
          confirmDelete?.type === 'single' ? `Are you sure you want to delete "${confirmDelete.leadName}"? This action cannot be undone.` :
          confirmDelete?.type === 'selected' ? `Are you sure you want to delete ${selectedLeads.size} selected leads? This action cannot be undone.` :
          `Are you sure you want to delete ALL ${leads.length} leads? This action cannot be undone.`
        }
        confirmText="Delete"
        type="danger"
        loading={deletingLead !== null || bulkDeleting || deletingSelected}
      />
    </div>
  );
};

export default LeadList;