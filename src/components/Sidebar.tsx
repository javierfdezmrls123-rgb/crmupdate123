import React from 'react';
import { useState, useEffect } from 'react';
import { Users, Target, Monitor, BarChart3, Settings, LogOut, Eye, DollarSign, Vault } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../hooks/useUserRole';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onShowSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  onShowSettings, 
}) => {
  const { signOut, user } = useAuth();
  const { userRole, isAdmin, isSalesman } = useUserRole();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'projects', label: 'Projects', icon: Target },
    { id: 'demos', label: 'Demos', icon: Monitor },
    { id: 'deals', label: 'Deals', icon: DollarSign },
  ];

  const adminMenuItems = [
    { id: 'treasury', label: 'Treasury', icon: Vault },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="w-full lg:w-64 tech-card shadow-lg h-auto lg:h-full flex flex-col circuit-pattern">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-center">
          <img 
            src="/ENVAIRE LOGO.png" 
            alt="Envaire Logo" 
            className="w-16 h-16 lg:w-20 lg:h-20 object-contain"
          />
        </div>
        {user?.email && (
          <p className="text-xs lg:text-sm text-green-300 mt-2 truncate text-center lg:text-left">{user.email}</p>
        )}
        {userRole && (
          <div className="mt-2">
            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
              isAdmin 
                ? 'bg-red-900 text-red-300 border border-red-500' 
                : 'bg-green-900 text-green-300 border border-green-500'
            }`}>
              {userRole.role}
            </span>
          </div>
        )}
      </div>
      
      <nav className="flex-1 p-2 lg:p-4 data-grid">
        <ul className="space-y-1 lg:space-y-2 flex lg:flex-col overflow-x-auto lg:overflow-x-visible">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id} className="flex-shrink-0 lg:flex-shrink">
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-center lg:justify-start space-x-2 lg:space-x-3 px-2 lg:px-4 py-2 lg:py-3 rounded-lg transition-all duration-200 text-xs lg:text-base ${
                    activeTab === item.id
                      ? 'bg-green-900 text-green-400 border-r-2 border-green-500 glow-green'
                      : 'text-green-300 hover:bg-green-800 hover:text-green-200'
                  }`}
                >
                  <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="font-medium hidden lg:inline">{item.label}</span>
                  <span className="font-medium lg:hidden text-xs">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
        
        {/* Admin-only menu items */}
        {isAdmin && (
          <>
            <div className="mt-4 lg:mt-6 pt-2 lg:pt-4 border-t border-gray-200">
              <div className="text-xs text-green-500 px-2 lg:px-4 py-1 mb-2 hidden lg:block">
                Admin Only
              </div>
              <ul className="space-y-1 lg:space-y-2">
                {adminMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => onTabChange(item.id)}
                        className={`w-full flex items-center justify-center lg:justify-start space-x-2 lg:space-x-3 px-2 lg:px-4 py-2 lg:py-3 rounded-lg transition-all duration-200 text-xs lg:text-base ${
                          activeTab === item.id
                            ? 'bg-purple-900 text-purple-400 border-r-2 border-purple-500 glow-green'
                            : 'text-green-300 hover:bg-green-800 hover:text-green-200'
                        }`}
                      >
                        <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                        <span className="font-medium hidden lg:inline">{item.label}</span>
                        <span className="font-medium lg:hidden text-xs">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </nav>
      
      <div className="p-2 lg:p-4 border-t border-green-800">
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center justify-center lg:justify-start space-x-2 lg:space-x-3 px-2 lg:px-4 py-2 lg:py-3 text-green-300 hover:bg-green-800 hover:text-green-200 rounded-lg transition-all duration-200 mb-2 text-xs lg:text-sm"
        >
          <LogOut className="w-4 h-4 lg:w-5 lg:h-5 text-green-400" />
          <span className="font-medium hidden lg:inline">Sign Out</span>
        </button>
        <button 
          onClick={onShowSettings}
          className="w-full flex items-center justify-center lg:justify-start space-x-2 lg:space-x-3 px-2 lg:px-4 py-2 lg:py-3 text-green-300 hover:bg-green-800 hover:text-green-200 rounded-lg transition-all duration-200 text-xs lg:text-sm"
        >
          <Settings className="w-4 h-4 lg:w-5 lg:h-5 text-green-400" />
          <span className="font-medium hidden lg:inline">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;