import React, { useState, useEffect } from 'react';
import { Monitor, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../hooks/useUserRole';
import { SystemStats } from './MonitoringRoom/types';
import { fetchMonitoringData } from './MonitoringRoom/dataService';
import SystemStatsCards from './MonitoringRoom/SystemStatsCards';

/**
 * Main Monitoring Room Component
 * Acts as a router/coordinator for all monitoring functionality
 * Manages state and coordinates between different monitoring components
 */
const MonitoringRoom: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalLeads: 0,
    totalProjects: 0,
    totalDemos: 0,
    totalDeals: 0,
    activeSalesmen: 0,
    overdueLeads: 0,
    todayActivities: 0,
  });

  useEffect(() => {
    if (isAdmin) {
      loadMonitoringData();
      
      // Auto-refresh every 5 seconds for more real-time updates
      const interval = setInterval(loadMonitoringData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const loadMonitoringData = async () => {
    try {
      setLoading(true);
      const { salesmenMetrics, systemStats } = await fetchMonitoringData();
      setSystemStats(systemStats);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Monitor className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-green-300 mb-2">Access Denied</h2>
          <p className="text-green-400">Only administrators can access the Monitoring Room.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-900 bg-opacity-30 rounded-lg flex items-center justify-center glow-green">
            <Monitor className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-green-300 glow-green">Monitoring Room</h1>
            <p className="text-green-400 mt-1">Real-time system and team performance monitoring</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadMonitoringData}
            className="tech-button text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* System Statistics Cards Component */}
      <SystemStatsCards systemStats={systemStats} />

      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-green-400">Loading monitoring data...</p>
        </div>
      )}
    </div>
  );
};

export default MonitoringRoom;