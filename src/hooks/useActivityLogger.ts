import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LogActivityParams {
  actionType: 'click' | 'view' | 'edit' | 'create' | 'delete' | 'call' | 'email' | 'navigate';
  actionDetails: string;
  targetType: 'lead' | 'project' | 'demo' | 'button' | 'form' | 'page' | 'filter';
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, any>;
}

export const useActivityLogger = () => {
  const { user } = useAuth();

  const logActivity = async ({
    actionType,
    actionDetails,
    targetType,
    targetId,
    targetName,
    metadata = {}
  }: LogActivityParams) => {
    if (!user) return;

    console.log('Logging activity:', { 
      actionType, 
      actionDetails, 
      targetType, 
      user: user.email,
      timestamp: new Date().toISOString()
    });

    try {
      // Get user agent and IP (IP will be null in browser for privacy)
      const userAgent = navigator.userAgent;
      
      const { error } = await supabase.from('activity_logs').insert([{
        user_id: user.id,
        user_email: user.email || '',
        action_type: actionType,
        action_details: actionDetails,
        target_type: targetType,
        target_id: targetId,
        target_name: targetName,
        metadata: {
          ...metadata,
          page_url: window.location.href,
          page_title: document.title
        },
        user_agent: userAgent,
        timestamp: new Date().toISOString()
      }]);
      
      if (error) {
        console.error('Activity logging failed:', error);
      } else {
        console.log('✅ Activity logged successfully for:', user.email);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  // Auto-log page views
  useEffect(() => {
    if (user) {
      logActivity({
        actionType: 'view',
        actionDetails: `Viewed page: ${document.title}`,
        targetType: 'page',
        targetName: window.location.pathname
      });
    }
  }, [user, window.location.pathname]);

  return { logActivity };
};