import React, { useState, useEffect } from 'react';
import { X, Save, MessageSquare, Clock, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { StatusUpdate } from '../types';

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'demo' | 'project';
  targetId: string;
  targetName: string;
}

const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName
}) => {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [fetchingUpdates, setFetchingUpdates] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchStatusUpdates();
    }
  }, [isOpen, targetId]);

  const fetchStatusUpdates = async () => {
    setFetchingUpdates(true);
    try {
      const { data, error } = await supabase
        .from('status_updates')
        .select('*')
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStatusUpdates(data || []);
    } catch (error) {
      console.error('Error fetching status updates:', error);
    } finally {
      setFetchingUpdates(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !comment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('status_updates')
        .insert([{
          user_id: user.id,
          target_type: targetType,
          target_id: targetId,
          comment: comment.trim()
        }]);

      if (error) throw error;

      setComment('');
      await fetchStatusUpdates(); // Refresh the list
    } catch (error) {
      console.error('Error adding status update:', error);
      alert('Error adding status update. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUpdate = async (updateId: string) => {
    try {
      const { error } = await supabase
        .from('status_updates')
        .delete()
        .eq('id', updateId);

      if (error) throw error;
      await fetchStatusUpdates(); // Refresh the list
    } catch (error) {
      console.error('Error deleting status update:', error);
      alert('Error deleting status update. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 data-grid"></div>
      <div className="relative tech-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden glow-green">
        <div className="flex items-center justify-between p-6 border-b border-green-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-900 bg-opacity-30 rounded-lg flex items-center justify-center glow-green">
              <MessageSquare className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-green-300">Status Updates</h2>
              <p className="text-sm text-green-400">{targetName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-green-400 hover:text-green-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Add New Status Update */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-green-300 mb-2">
                Add Status Update
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                required
                className="w-full px-3 py-2 tech-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-green-300 placeholder-green-500"
                placeholder="Enter your status update comment..."
              />
            </div>
            <button
              type="submit"
              disabled={loading || !comment.trim()}
              className="tech-button text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Add Update</span>
                </>
              )}
            </button>
          </form>

          {/* Status Updates List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-300 flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Update History</span>
            </h3>

            {fetchingUpdates ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-green-400 text-sm">Loading updates...</p>
              </div>
            ) : statusUpdates.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-green-400">No status updates yet.</p>
                <p className="text-green-500 text-sm">Add the first update above!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {statusUpdates.map((update) => (
                  <div
                    key={update.id}
                    className="tech-card rounded-lg p-4 border border-green-500 glow-green"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-900 bg-opacity-30 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-green-400" />
                        </div>
                        <span className="text-sm text-green-400">
                          {user?.email?.split('@')[0] || 'User'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-green-500">
                          {new Date(update.created_at).toLocaleDateString()} at{' '}
                          {new Date(update.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {update.user_id === user?.id && (
                          <button
                            onClick={() => handleDeleteUpdate(update.id)}
                            className="text-red-400 hover:text-red-300 transition-colors text-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-green-300 text-sm leading-relaxed">
                      {update.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusUpdateModal;