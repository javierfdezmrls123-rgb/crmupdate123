import React, { useState, useEffect } from 'react';
import { Bell, X, Clock, User, Building, Phone, Mail, Timer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Lead } from '../types';
import LeadForm from './Forms/LeadForm';

interface LeadNotificationsProps {
  onRefreshLeads: () => void;
}

interface LeadWithTimer extends Lead {
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  isOverdue: boolean;
}

const LeadNotifications: React.FC<LeadNotificationsProps> = ({ onRefreshLeads }) => {
  const { user } = useAuth();
  const [overdueLeads, setOverdueLeads] = useState<LeadWithTimer[]>([]);
  const [allLeads, setAllLeads] = useState<LeadWithTimer[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadWithTimer | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAllLeads, setShowAllLeads] = useState(false);

  useEffect(() => {
    if (user) {
      checkLeadTimers();
      // Update timers every minute for real-time countdown (avoid constant loading flashes)
      const interval = setInterval(checkLeadTimers, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const calculateLeadTimer = (createdAt: string): LeadWithTimer['daysRemaining'] & LeadWithTimer['hoursRemaining'] & LeadWithTimer['minutesRemaining'] & LeadWithTimer['isOverdue'] => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
    const deadlineDate = new Date(createdDate.getTime() + threeDaysInMs);
    
    const timeRemaining = deadlineDate.getTime() - now.getTime();
    
    if (timeRemaining <= 0) {
      // Lead is overdue
      const overdueTime = Math.abs(timeRemaining);
      const overdueDays = Math.floor(overdueTime / (24 * 60 * 60 * 1000));
      const overdueHours = Math.floor((overdueTime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const overdueMinutes = Math.floor((overdueTime % (60 * 60 * 1000)) / (60 * 1000));
      
      return {
        daysRemaining: -overdueDays,
        hoursRemaining: -overdueHours,
        minutesRemaining: -overdueMinutes,
        isOverdue: true
      };
    } else {
      // Lead still has time
      const daysRemaining = Math.floor(timeRemaining / (24 * 60 * 60 * 1000));
      const hoursRemaining = Math.floor((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutesRemaining = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
      
      return {
        daysRemaining,
        hoursRemaining,
        minutesRemaining,
        isOverdue: false
      };
    }
  };

  const checkLeadTimers = async () => {
    if (!user) return;

    // Only show loading on initial load, not on periodic updates
    const isInitialLoad = allLeads.length === 0;
    
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      
      console.log('🔍 Checking lead timers...');

      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['prospect', 'qualified', 'proposal', 'negotiation']) // Include leads that might have scheduled calls
        .not('created_at', 'is', null) // Exclude leads with null created_at
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching leads for timer check:', error);
        return;
      }

      // Transform leads with timer calculations
      const leadsWithTimers: LeadWithTimer[] = leads?.map(lead => {
        // Calculate 3-day prospect timer
        const prospectTimerData = calculateLeadTimer(lead.created_at);
        
        // Calculate scheduled call overdue status
        let scheduledCallOverdue = false;
        let scheduledCallOverdueTime = '';
        
        if (lead.scheduled_call) {
          const scheduledTime = new Date(lead.scheduled_call).getTime();
          const now = Date.now();
          
          if (scheduledTime < now) {
            scheduledCallOverdue = true;
            const overdueMs = now - scheduledTime;
            const overdueDays = Math.floor(overdueMs / (24 * 60 * 60 * 1000));
            const overdueHours = Math.floor((overdueMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            const overdueMinutes = Math.floor((overdueMs % (60 * 60 * 1000)) / (60 * 1000));
            
            if (overdueDays > 0) {
              scheduledCallOverdueTime = `${overdueDays}d ${overdueHours}h ${overdueMinutes}m overdue`;
            } else if (overdueHours > 0) {
              scheduledCallOverdueTime = `${overdueHours}h ${overdueMinutes}m overdue`;
            } else {
              scheduledCallOverdueTime = `${overdueMinutes}m overdue`;
            }
          }
        }
        
        // Calculate overdue severity for 3-day timer
        const overdueMs = Math.abs(prospectTimerData.daysRemaining * 24 * 60 * 60 * 1000 + 
                                   prospectTimerData.hoursRemaining * 60 * 60 * 1000 + 
                                   prospectTimerData.minutesRemaining * 60 * 1000);
        const overdueDays = Math.floor(overdueMs / (24 * 60 * 60 * 1000));
        const isLightOverdue = prospectTimerData.isOverdue && overdueDays < 14; // 3 days to 2 weeks
        const isSevereOverdue = prospectTimerData.isOverdue && overdueDays >= 14; // 2+ weeks
        
        return {
          id: lead.id,
          user_id: lead.user_id,
          name: lead.name,
          email: lead.email || '',
          phone: lead.phone || '',
          company: lead.company,
          position: lead.position || '',
          status: lead.status as Lead['status'],
          revenue: lead.revenue || '',
          lastContact: lead.last_contact,
          notes: lead.notes || '',
          call_status: lead.call_status as Lead['call_status'],
          industry: lead.industry || '',
          website: lead.website || '',
          ceo: lead.ceo || '',
          whose_phone: lead.whose_phone || '',
          go_skip: lead.go_skip || '',
          createdAt: lead.created_at,
          scheduled_call: lead.scheduled_call,
          ...prospectTimerData,
          scheduledCallOverdue,
          scheduledCallOverdueTime,
          isLightOverdue,
          isSevereOverdue,
          overdueDays
        };
      }) || [];

      // Filter overdue leads (either 3-day timer overdue OR scheduled call overdue)
      const overdue = leadsWithTimers.filter(lead => 
        (lead.status === 'prospect' && (lead.isLightOverdue || lead.isSevereOverdue)) || // 3-day timer overdue for prospects
        lead.scheduledCallOverdue // Scheduled call overdue for any status
      );

      console.log(`📊 Found ${overdue.length} overdue leads out of ${leadsWithTimers.length} total leads`);
      
      setAllLeads(leadsWithTimers);
      setOverdueLeads(overdue);
    } catch (error) {
      console.error('Error checking lead timers:', error);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  const formatTimeRemaining = (lead: LeadWithTimer) => {
    // If scheduled call is overdue, prioritize that
    if (lead.scheduledCallOverdue) {
      return `SC: ${lead.scheduledCallOverdueTime}`;
    }
    
    // Otherwise show 3-day timer (only for prospects)
    if (lead.status !== 'prospect') {
      return 'Processed';
    }
    
    if (lead.isOverdue) {
      const days = Math.abs(lead.daysRemaining);
      const hours = Math.abs(lead.hoursRemaining);
      const minutes = Math.abs(lead.minutesRemaining);
      
      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m overdue`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m overdue`;
      } else {
        return `${minutes}m overdue`;
      }
    } else {
      const { daysRemaining, hoursRemaining, minutesRemaining } = lead;
      
      if (daysRemaining > 0) {
        return `${daysRemaining}d ${hoursRemaining}h ${minutesRemaining}m left`;
      } else if (hoursRemaining > 0) {
        return `${hoursRemaining}h ${minutesRemaining}m left`;
      } else {
        return `${minutesRemaining}m left`;
      }
    }
  };

  const handleLeadClick = (lead: LeadWithTimer) => {
    setSelectedLead(lead);
  };

  const handleLeadUpdate = () => {
    setSelectedLead(null);
    checkLeadTimers(); // Refresh lead timers
    onRefreshLeads(); // Refresh main leads list
  };

  const handleCloseForm = () => {
    setSelectedLead(null);
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className={`relative p-2 rounded-lg transition-all duration-200 ${
            overdueLeads.length > 0
              ? 'bg-red-900 bg-opacity-30 text-red-400 hover:bg-red-800 hover:bg-opacity-40 animate-pulse'
              : 'bg-green-900 bg-opacity-30 text-green-400 hover:bg-green-800 hover:bg-opacity-40'
          }`}
        >
          <Timer className="w-5 h-5" />
          {overdueLeads.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {overdueLeads.length > 99 ? '99+' : overdueLeads.length}
            </span>
          )}
        </button>

        {/* Notification Panel */}
        {showPanel && (
          <div className="absolute right-0 top-12 w-96 tech-card rounded-xl shadow-xl border-2 border-green-500 glow-green z-50 max-h-[500px] overflow-hidden">
            <div className="p-4 border-b border-green-800">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-green-300 flex items-center space-x-2 text-sm">
                  <Timer className="w-4 h-4" />
                  <span>Lead Timers</span>
                </h3>
                <button
                  onClick={() => setShowPanel(false)}
                  className="text-green-400 hover:text-green-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-green-400">
                  {overdueLeads.length} overdue • {allLeads.length - overdueLeads.length} pending
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowAllLeads(false)}
                    className={`px-2 py-1 text-xs rounded ${
                      !showAllLeads 
                        ? 'bg-red-900 bg-opacity-30 text-red-300 border border-red-500' 
                        : 'text-green-400 hover:text-green-300'
                    }`}
                  >
                    Overdue ({overdueLeads.length})
                  </button>
                  <button
                    onClick={() => setShowAllLeads(true)}
                    className={`px-2 py-1 text-xs rounded ${
                      showAllLeads 
                        ? 'bg-green-900 bg-opacity-30 text-green-300 border border-green-500' 
                        : 'text-green-400 hover:text-green-300'
                    }`}
                  >
                    All ({allLeads.length})
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-green-400 text-sm">Checking timers...</p>
                </div>
              ) : (!showAllLeads && overdueLeads.length === 0) ? (
                <div className="p-4 text-center">
                  <Timer className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 text-sm">No overdue leads!</p>
                  <p className="text-green-500 text-xs">All leads are up to date</p>
                </div>
              ) : (showAllLeads && allLeads.length === 0) ? (
                <div className="p-4 text-center">
                  <Timer className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 text-sm">No prospect leads!</p>
                  <p className="text-green-500 text-xs">All leads have been processed</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {(showAllLeads ? allLeads : overdueLeads).map((lead) => {
                    const isOverdue = lead.isLightOverdue || lead.isSevereOverdue || lead.scheduledCallOverdue;
                    const isScheduledCallOverdue = lead.scheduledCallOverdue;
                    
                    // Determine colors based on overdue type and severity
                    let cardColor, textColor, subTextColor, iconColor;
                    
                    if (isScheduledCallOverdue || lead.isSevereOverdue) {
                      // Red for scheduled call overdue or 2+ weeks overdue
                      cardColor = 'bg-red-900 bg-opacity-20 border-red-500 hover:bg-red-800 hover:bg-opacity-30';
                      textColor = 'text-red-300';
                      subTextColor = 'text-red-400';
                      iconColor = 'text-red-400';
                    } else if (lead.isLightOverdue) {
                      // Orange for 3-day to 2-week overdue
                      cardColor = 'bg-orange-900 bg-opacity-20 border-orange-500 hover:bg-orange-800 hover:bg-opacity-30';
                      textColor = 'text-orange-300';
                      subTextColor = 'text-orange-400';
                      iconColor = 'text-orange-400';
                    } else {
                      // Green for normal leads
                      cardColor = 'bg-green-900 bg-opacity-20 border-green-500 hover:bg-green-800 hover:bg-opacity-30';
                      textColor = 'text-green-300';
                      subTextColor = 'text-green-400';
                      iconColor = 'text-green-400';
                    }
                    
                    const cardColorFinal = cardColor;
                    
                    return (
                      <button
                        key={lead.id}
                        onClick={() => handleLeadClick(lead)}
                        className={`w-full p-3 border rounded-lg transition-all duration-200 text-left ${cardColorFinal}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-6 h-6 ${
                              isScheduledCallOverdue || lead.isSevereOverdue ? 'bg-red-900' :
                              lead.isLightOverdue ? 'bg-orange-900' : 'bg-green-900'
                            } bg-opacity-30 rounded-full flex items-center justify-center`}>
                              <User className={`w-3 h-3 ${iconColor}`} />
                            </div>
                            <div>
                              <h4 className={`font-medium ${textColor} text-sm`}>{lead.name}</h4>
                              <p className={`${subTextColor} text-xs`}>{lead.company}</p>
                              <p className={`${subTextColor} text-xs capitalize`}>{lead.status}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs ${
                              isScheduledCallOverdue || lead.isSevereOverdue ? 'text-red-400 font-bold' :
                              lead.isLightOverdue ? 'text-orange-400 font-bold' : 'text-green-400'
                            } font-medium`}>
                              {formatTimeRemaining(lead)}
                            </span>
                            {isOverdue && (
                              <div className={`text-xs mt-1 ${
                                isScheduledCallOverdue || lead.isSevereOverdue ? 'text-red-500' : 'text-orange-500'
                              }`}>
                                <Timer className="w-3 h-3 inline mr-1" />
                                {isScheduledCallOverdue ? 'SC OVERDUE' : 
                                 lead.isSevereOverdue ? 'CRITICAL' : 'OVERDUE'}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className={`flex items-center space-x-4 text-xs ${
                          isScheduledCallOverdue || lead.isSevereOverdue ? 'text-red-500' :
                          lead.isLightOverdue ? 'text-orange-500' : 'text-green-500'
                        }`}>
                          {lead.email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-24">{lead.email}</span>
                            </div>
                          )}
                          {lead.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="w-3 h-3" />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className={`mt-2 text-xs ${subTextColor}`}>
                          Created: {new Date(lead.createdAt).toLocaleDateString()} at {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        
                        {lead.revenue && (
                          <div className={`mt-1 text-xs ${textColor} font-medium`}>
                            Revenue: {lead.revenue}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lead Edit Form */}
      {selectedLead && (
        <LeadForm
          lead={selectedLead}
          onClose={handleCloseForm}
          onSuccess={handleLeadUpdate}
        />
      )}
    </>
  );
};

export default LeadNotifications;