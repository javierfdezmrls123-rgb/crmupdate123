import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Building, Calendar, CreditCard, Repeat } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Deal } from '../../types';

interface DealFormProps {
  deal?: Deal | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DealForm: React.FC<DealFormProps> = ({ deal, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    deal_value: 0,
    payment_type: 'one_time' as 'one_time' | 'monthly',
    monthly_amount: 0,
    installation_fee: 0,
    contract_length_months: 0,
    closed_date: new Date().toISOString().split('T')[0],
    status: 'active' as 'active' | 'completed' | 'cancelled',
    salesman_name: '',
    salesman_email: ''
  });

  useEffect(() => {
    if (deal) {
      setFormData({
        title: deal.title,
        company: deal.company,
        description: deal.description,
        deal_value: deal.deal_value,
        payment_type: deal.payment_type,
        monthly_amount: deal.monthly_amount,
        installation_fee: deal.installation_fee,
        contract_length_months: deal.contract_length_months,
        closed_date: deal.closed_date,
        status: deal.status,
        salesman_name: deal.salesman_name,
        salesman_email: deal.salesman_email
      });
    } else if (user) {
      // Set default salesman info for new deals
      setFormData(prev => ({
        ...prev,
        salesman_email: user.email || '',
        salesman_name: user.email?.split('@')[0] || ''
      }));
    }
  }, [deal, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const dealData = {
        ...formData,
        user_id: user.id,
        salesman_name: formData.salesman_name || user.email?.split('@')[0] || '',
        salesman_email: formData.salesman_email || user.email || ''
      };

      if (deal) {
        // Update existing deal
        const { error } = await supabase
          .from('deals')
          .update(dealData)
          .eq('id', deal.id);
        
        if (error) throw error;
      } else {
        // Create new deal
        const { error } = await supabase
          .from('deals')
          .insert([dealData]);
        
        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving deal:', error);
      alert('Error saving deal. Please try again.');
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
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 data-grid"></div>
      <div className="relative tech-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden glow-green">
        <div className="flex items-center justify-between p-6 border-b border-green-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-900 bg-opacity-30 rounded-lg flex items-center justify-center glow-green">
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-green-300">
              {deal ? 'Edit Deal' : 'Add New Deal'}
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
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">
                Deal Title *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
                placeholder="Enter deal title"
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

          <div>
            <label className="block text-sm font-medium text-green-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
              placeholder="Enter deal description"
            />
          </div>

          {/* Financial Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">
                Deal Value (€) *
              </label>
              <input
                type="number"
                name="deal_value"
                required
                min="0"
                step="0.01"
                value={formData.deal_value}
                onChange={handleInputChange}
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">
                Payment Type *
              </label>
              <select
                name="payment_type"
                value={formData.payment_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300"
              >
                <option value="one_time">One-time Payment</option>
                <option value="monthly">Monthly Recurring</option>
              </select>
            </div>
          </div>

          {formData.payment_type === 'monthly' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-green-300 mb-2">
                  Monthly Amount (€) *
                </label>
                <input
                  type="number"
                  name="monthly_amount"
                  required={formData.payment_type === 'monthly'}
                  min="0"
                  step="0.01"
                  value={formData.monthly_amount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-green-300 mb-2">
                  Contract Length (months)
                </label>
                <input
                  type="number"
                  name="contract_length_months"
                  min="0"
                  value={formData.contract_length_months}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
                  placeholder="0"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">
                Installation/Setup Fee (€)
              </label>
              <input
                type="number"
                name="installation_fee"
                min="0"
                step="0.01"
                value={formData.installation_fee}
                onChange={handleInputChange}
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">
                Closed Date *
              </label>
              <input
                type="date"
                name="closed_date"
                required
                value={formData.closed_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-green-300 mb-2">
                Salesman Name
              </label>
              <input
                type="text"
                name="salesman_name"
                value={formData.salesman_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
                placeholder="Enter salesman name"
              />
            </div>
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
                  <span>{deal ? 'Update Deal' : 'Create Deal'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DealForm;