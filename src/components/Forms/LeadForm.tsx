import React, { useState, useEffect } from 'react';
import { X, Save, User, Building, Phone, Mail, Globe, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Lead } from '../../types';

interface LeadFormProps {
  lead?: Lead | null;
  onClose: () => void;
  onSuccess: () => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ lead, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    status: 'prospect' as Lead['status'],
    revenue: '',
    notes: '',
    call_status: 'not_called' as Lead['call_status'],
    industry: '',
    website: '',
    ceo: '',
    whose_phone: '',
    go_skip: '',
    scheduled_call: ''
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        position: lead.position,
        status: lead.status,
        revenue: lead.revenue,
        notes: lead.notes,
        call_status: lead.call_status,
        industry: lead.industry,
        website: lead.website,
        ceo: lead.ceo,
        whose_phone: lead.whose_phone,
        go_skip: lead.go_skip,
        scheduled_call: lead.scheduled_call ? new Date(lead.scheduled_call).toISOString().slice(0, 16) : ''
      });
    }
  }, [lead]);

  const checkForDuplicateCompany = async (companyName: string): Promise<boolean> => {
    if (!companyName.trim()) return false;
    
    try {
      console.log('🔍 Checking for duplicate company globally:', companyName);
      
      // Check if company already exists GLOBALLY using case-insensitive search
      const query = supabase
        .from('leads')
        .select('id, company, user_id, name')
        .ilike('company', companyName.trim()); // Case-insensitive match
      
      // If editing, exclude the current lead
      if (lead) {
        query.neq('id', lead.id);
      }
      
      const { data: existingLeads, error } = await query;
      
      if (error) {
        console.error('❌ Error checking for global duplicates:', error);
        return false;
      }
      
      console.log('📊 Found existing leads with company name:', existingLeads);
      
      if (existingLeads && existingLeads.length > 0) {
        const existingLead = existingLeads[0];
        const isOwnLead = existingLead.user_id === user?.id;
        console.log('⚠️ Duplicate company found:', {
          ...existingLead,
          isOwnLead,
          currentUserId: user?.id
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Exception during duplicate check:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setDuplicateError(null);

    try {
      // Check for duplicate company
      const isDuplicate = await checkForDuplicateCompany(formData.company);
      
      if (isDuplicate) {
        setDuplicateError(`A lead with company "${formData.company}" already exists in the system (created by another user or yourself). Each company can only exist once globally. Please use a different company name or check if this is a duplicate.`);
        setLoading(false);
        return;
      }

      const leadData = {
        ...formData,
        user_id: user.id,
        company: formData.company.trim(), // Store company name trimmed but preserve case
        last_contact: new Date().toISOString(),
        scheduled_call: formData.scheduled_call ? new Date(formData.scheduled_call).toISOString() : null
      };

      if (lead) {
        // Update existing lead
        const { error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', lead.id);
        
        if (error) throw error;
      } else {
        // Create new lead
        const { error } = await supabase
          .from('leads')
          .insert([leadData]);
        
        if (error) {
          if (error.code === '23505' && error.message.includes('leads_company_unique')) {
            setDuplicateError(`Database constraint: A lead with company "${formData.company}" already exists globally. Please use a different company name.`);
            return;
          }
          throw error;
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving lead:', error);
      alert('Error saving lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
    
    // Clear duplicate error when company name changes
    if (name === 'company' && duplicateError) {
      setDuplicateError(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 data-grid"></div>
      <div className="relative tech-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden glow-green">
        <div className="flex items-center justify-between p-6 border-b border-green-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-900 bg-opacity-30 rounded-lg flex items-center justify-center glow-green">
              <User className="w-4 h-4 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-green-300">
              {lead ? 'Edit Lead' : 'Add New Lead'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-green-400 hover:text-green-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {duplicateError && (
            <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
              {duplicateError}
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">
                Contact Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
                placeholder="Enter contact name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">
                Company *
              </label>
              <input
                type="text"
                name="company"
                required
                value={formData.company}
                onChange={handleInputChange}
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
                placeholder="Enter company name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">
                Position
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
                placeholder="Enter position/title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">
                Industry
              </label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
                placeholder="Enter industry"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
                placeholder="https://company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">
                Revenue
              </label>
              <input
                type="text"
                name="revenue"
                value={formData.revenue}
                onChange={handleInputChange}
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
                placeholder="e.g., €1M, €500K"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">
                CEO
              </label>
              <input
                type="text"
                name="ceo"
                value={formData.ceo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
                placeholder="CEO name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">
                Whose Phone
              </label>
              <input
                type="text"
                name="whose_phone"
                value={formData.whose_phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
                placeholder="Phone owner info"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300"
              >
                <option value="prospect">Prospect</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed-won">Closed Won</option>
                <option value="closed-lost">Closed Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">
                Call Status *
              </label>
              <select
                name="call_status"
                value={formData.call_status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300"
              >
                <option value="not_called">Not Called</option>
                <option value="answered">Answered</option>
                <option value="no_response">No Response</option>
                <option value="voicemail">Voicemail</option>
                <option value="busy">Busy</option>
                <option value="wrong_number">Wrong Number</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">
                Revenue
              </label>
              <input
                type="text"
                name="revenue"
                value={formData.revenue}
                onChange={handleInputChange}
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
                placeholder="e.g., €1M, €500K"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-green-300 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
              placeholder="Enter additional notes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-green-300 mb-2">
              Go/Skip Reason
            </label>
            <input
              type="text"
              name="go_skip"
              value={formData.go_skip}
              onChange={handleInputChange}
              className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
              placeholder="Reason for go/skip decision"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-green-300 mb-2">
              Scheduled Call (SC)
            </label>
            <input
              type="datetime-local"
              name="scheduled_call"
              value={formData.scheduled_call}
              onChange={handleInputChange}
              className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300"
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="text-xs text-green-500 mt-1">Select date and time for scheduled call</p>
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 tech-border text-green-300 rounded-lg hover:bg-green-800 hover:bg-opacity-30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 tech-button text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{lead ? 'Update Lead' : 'Create Lead'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadForm;