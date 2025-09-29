import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import OrbitalHub from './components/OrbitalHub';
import Dashboard from './components/Dashboard';
import LeadsList from './components/LeadsList';
import ProjectList from './components/DealList';
import DemoList from './components/TaskList';
import DealsList from './components/DealsList';
import Treasury from './components/Treasury';
import SettingsModal from './components/Settings';
import { useUserRole } from './hooks/useUserRole';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { isAdmin } = useUserRole();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showHub, setShowHub] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setShowHub(false); // Hide hub when navigating to a page
  };

  const handleBackToHub = () => {
    setShowHub(true);
  };

  const renderContent = () => {
    if (showHub) {
      return (
        <OrbitalHub
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'leads':
        return <LeadsList />;
      case 'projects':
        return <ProjectList />;
      case 'demos':
        return <DemoList />;
      case 'deals':
        return <DealsList />;
      case 'treasury':
        return isAdmin ? <Treasury /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black overflow-hidden">
      {!showHub && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={handleBackToHub}
            className="tech-button px-4 py-2 text-white rounded-lg transition-all duration-200 flex items-center space-x-2 hover:scale-105"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
              <img src="/ENVAIRE LOGO.png" alt="Hub" className="w-4 h-4 object-contain" />
            </div>
            <span>Back to Hub</span>
          </button>
        </div>
      )}
      
      <main className={`${showHub ? '' : 'pt-16'} min-h-screen overflow-auto data-grid w-full`}>
        {renderContent()}
      </main>
      
      {/* Global Modals */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;