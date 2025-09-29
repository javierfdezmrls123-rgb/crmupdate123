import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Lead } from '../types';

interface SchedulingModalProps {
  lead: Lead;
  onClose: () => void;
  onSuccess: () => void;
}

const SchedulingModal: React.FC<SchedulingModalProps> = ({ lead, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (lead.scheduled_call) {
      const scheduledDate = new Date(lead.scheduled_call);
      setSelectedDate(scheduledDate);
      setSelectedTime(scheduledDate.toTimeString().slice(0, 5));
      setCurrentMonth(scheduledDate.getMonth());
      setCurrentYear(scheduledDate.getFullYear());
    }
  }, [lead]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00'
  ];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
  };

  const handleTimeClick = (time: string) => {
    setSelectedTime(time);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;

    setLoading(true);
    try {
      const [hours, minutes] = selectedTime.split(':');
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));

      const { error } = await supabase
        .from('leads')
        .update({ 
          scheduled_call: scheduledDateTime.toISOString()
        })
        .eq('id', lead.id);
      
      if (error) throw error;
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating scheduled call:', error);
      alert('Error updating scheduled call. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearScheduledCall = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ scheduled_call: null })
        .eq('id', lead.id);
      
      if (error) throw error;
      
      setSelectedDate(null);
      setSelectedTime('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error clearing scheduled call:', error);
      alert('Error clearing scheduled call. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    const today = new Date();
    const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && day === today.getDate();
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === currentMonth && 
        selectedDate.getFullYear() === currentYear;
      const isPast = new Date(currentYear, currentMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

      days.push(
        <button
          key={day}
          onClick={() => !isPast && handleDateClick(day)}
          disabled={isPast}
          className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
            isPast 
              ? 'text-gray-500 cursor-not-allowed opacity-50' 
              : isSelected
                ? 'bg-green-600 text-white glow-green scale-110'
                : isToday
                  ? 'bg-green-900 bg-opacity-30 text-green-300 border border-green-500'
                  : 'text-green-300 hover:bg-green-800 hover:bg-opacity-30 hover:scale-105'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 data-grid"></div>
      <div className="relative tech-card rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden glow-green">
        <div className="flex items-center justify-between p-6 border-b border-green-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-900 bg-opacity-30 rounded-lg flex items-center justify-center glow-green">
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-green-300">Schedule Call</h2>
              <p className="text-sm text-green-400">{lead.name} - {lead.company}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-green-400 hover:text-green-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <div className="tech-card rounded-lg p-4 border border-green-500 glow-green">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 text-green-400 hover:text-green-300 hover:bg-green-800 hover:bg-opacity-30 rounded-lg transition-all duration-200"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold text-green-300">
                {months[currentMonth]} {currentYear}
              </h3>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 text-green-400 hover:text-green-300 hover:bg-green-800 hover:bg-opacity-30 rounded-lg transition-all duration-200"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="w-10 h-8 flex items-center justify-center text-xs font-medium text-green-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>
          </div>

          {/* Time Selection Section */}
          <div className="tech-card rounded-lg p-4 border border-green-500 glow-green">
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-green-300">Select Time</h3>
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {timeSlots.map(time => (
                <button
                  key={time}
                  onClick={() => handleTimeClick(time)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedTime === time
                      ? 'bg-green-600 text-white glow-green scale-105'
                      : 'text-green-300 hover:bg-green-800 hover:bg-opacity-30 hover:scale-105 tech-border'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>

            {/* Selected DateTime Preview */}
            {selectedDate && selectedTime && (
              <div className="mt-4 p-3 bg-green-900 bg-opacity-30 border border-green-500 rounded-lg">
                <p className="text-sm text-green-400 mb-1">Selected:</p>
                <p className="text-green-300 font-medium">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} at {selectedTime}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-green-800">
          <div className="flex space-x-3">
            {lead.scheduled_call && (
              <button
                onClick={clearScheduledCall}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 tech-button"
              >
                Clear Schedule
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 tech-border text-green-300 rounded-lg hover:bg-green-800 hover:bg-opacity-30 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedDate || !selectedTime}
              className="flex-1 tech-button text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Add Schedule</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulingModal;