import React, { useState } from 'react';
import { Search, Plus, Monitor, Clock, AlertCircle, User, Edit, Trash2, Play, CheckCircle, MessageSquare } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { Demo } from '../types';
import DemoForm from './Forms/DemoForm';
import ConfirmationCard from './ConfirmationCard';
import StatusUpdateModal from './StatusUpdateModal';
import { supabase } from '../lib/supabase';

const DemoList: React.FC = () => {
  const { demos, loading, refetch } = useSupabaseData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Demo['status']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Demo['priority']>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingDemo, setEditingDemo] = useState<any>(null);
  const [deletingDemo, setDeletingDemo] = useState<string | null>(null);
  const [updatingDemo, setUpdatingDemo] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ demoId: string; demoName: string } | null>(null);
  const [statusUpdateModal, setStatusUpdateModal] = useState<{ demoId: string; demoName: string } | null>(null);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading demos...</p>
        </div>
      </div>
    );
  }

  const filteredDemos = demos.filter(demo => {
    const matchesSearch = demo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         demo.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || demo.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || demo.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: Demo['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Demo['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: Demo['priority']) => {
    switch (priority) {
      case 'high': return AlertCircle;
      case 'medium': return Clock;
      case 'low': return Monitor;
      default: return Clock;
    }
  };

  const getLeadName = (leadId?: string) => {
    return null; // Leads module removed
  };

  const isOverdue = (dueDate: string, status: Demo['status']) => {
    if (status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const handleEdit = (demo: any) => {
    setEditingDemo(demo);
    setShowForm(true);
  };

  const handleDelete = async (demoId: string) => {
    const demo = demos.find(d => d.id === demoId);
    setConfirmDelete({ demoId, demoName: demo?.title || 'this demo' });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;

    setDeletingDemo(confirmDelete.demoId);
    try {
      const { error } = await supabase
        .from('demos')
        .delete()
        .eq('id', confirmDelete.demoId);
      
      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Error deleting demo:', error);
    } finally {
      setConfirmDelete(null);
      setDeletingDemo(null);
    }
  };

  const handleStatusUpdate = async (demoId: string, newStatus: string) => {
    setUpdatingDemo(demoId);
    try {
      const { error } = await supabase
        .from('demos')
        .update({ status: newStatus })
        .eq('id', demoId);
      
      if (error) throw error;
      refetch();
    } catch (error) {
      console.error('Error updating demo:', error);
    } finally {
      setUpdatingDemo(null);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingDemo(null);
  };

  const handleFormSuccess = () => {
    refetch();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-green-300 glow-green">Demos</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="tech-button px-4 py-2 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Demo</span>
        </button>
      </div>

      {/* Filters */}
      <div className="tech-card rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search demos..."
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
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-4 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Demos Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDemos.map((demo) => {
          const PriorityIcon = getPriorityIcon(demo.priority);
          const leadName = getLeadName(demo.leadId);
          const overdue = isOverdue(demo.dueDate, demo.status);
          
          return (
            <div
              key={demo.id}
              className={`tech-card rounded-xl shadow-sm p-6 hover:glow-green transition-all duration-200 ${
                overdue ? 'border-red-500 glow-green-intense' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    demo.priority === 'high' ? 'bg-red-900 bg-opacity-30' :
                    demo.priority === 'medium' ? 'bg-yellow-900 bg-opacity-30' : 'bg-green-900 bg-opacity-30'
                  }`}>
                    <PriorityIcon className={`w-5 h-5 ${
                      demo.priority === 'high' ? 'text-red-400' :
                      demo.priority === 'medium' ? 'text-yellow-400' : 'text-green-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-300">{demo.title}</h3>
                    <p className="text-sm text-green-400">{demo.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(demo.status)}`}>
                    {demo.status.replace('-', ' ')}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(demo.priority)}`}>
                    {demo.priority}
                  </span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(demo)}
                      className="p-1 text-green-400 hover:text-green-300 transition-colors rounded hover:bg-green-900 hover:bg-opacity-30"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(demo.id)}
                      disabled={deletingDemo === demo.id}
                      className="p-1 text-green-400 hover:text-red-400 transition-colors disabled:opacity-50 rounded hover:bg-red-900 hover:bg-opacity-30"
                    >
                      {deletingDemo === demo.id ? (
                        <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Update Button */}
              <div className="mt-4">
                <button
                  onClick={() => setStatusUpdateModal({ demoId: demo.id, demoName: demo.title })}
                  className="w-full tech-button py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center justify-center space-x-2 text-white bg-blue-600 hover:bg-blue-700"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Status Update</span>
                </button>
              </div>

              {leadName && (
                <div className="flex items-center space-x-2 text-green-400 mb-3">
                  <User className="w-4 h-4 text-green-400" />
                  <span className="text-sm">{leadName}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-green-800">
                <div className="flex items-center space-x-2">
                  <Clock className={`w-4 h-4 ${overdue ? 'text-red-400' : 'text-green-400'}`} />
                  <span className={`text-sm ${overdue ? 'text-red-400 font-medium' : 'text-green-300'}`}>
                    Due: {demo.dueDate}
                    {overdue && ' (Overdue)'}
                  </span>
                </div>
                <span className="text-xs text-green-500">
                  Created {demo.createdAt}
                </span>
              </div>

              {demo.status !== 'completed' && (
                <div className="mt-4">
                  <button 
                    onClick={() => handleStatusUpdate(
                      demo.id, 
                      demo.status === 'pending' ? 'in-progress' : 'completed'
                    )}
                    disabled={updatingDemo === demo.id}
                    className="w-full tech-button py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center justify-center space-x-2 disabled:opacity-50 text-white"
                  >
                    {updatingDemo === demo.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {demo.status === 'pending' ? (
                          <>
                            <Play className="w-4 h-4" />
                            <span>Start Demo</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Mark Complete</span>
                          </>
                        )}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredDemos.length === 0 && (
        <div className="text-center py-12">
          <Monitor className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <p className="text-green-400">No demos found matching your criteria.</p>
        </div>
      )}

      {showForm && (
        <DemoForm
          demo={editingDemo}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      <ConfirmationCard
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Demo"
        message={`Are you sure you want to delete "${confirmDelete?.demoName}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        loading={deletingDemo !== null}
      />

      {statusUpdateModal && (
        <StatusUpdateModal
          isOpen={!!statusUpdateModal}
          onClose={() => setStatusUpdateModal(null)}
          targetType="demo"
          targetId={statusUpdateModal.demoId}
          targetName={statusUpdateModal.demoName}
        />
      )}
    </div>
  );
};


export default DemoList