import React, { useState, useEffect } from 'react';
import { Users, Target, Monitor, BarChart3, DollarSign, Vault, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../hooks/useUserRole';

interface OrbitalHubProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onShowSettings: () => void;
}

interface HubModule {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  glowColor: string;
  angle: number;
  radius: number;
  adminOnly?: boolean;
}

const OrbitalHub: React.FC<OrbitalHubProps> = ({
  activeTab,
  onTabChange,
  onShowSettings,
}) => {
  const { signOut, user } = useAuth();
  const { isAdmin } = useUserRole();
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const [animationOffset, setAnimationOffset] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Animation loop for orbital movement
  useEffect(() => {
    if (isMobile) return; // No animation on mobile
    
    const interval = setInterval(() => {
      setAnimationOffset(prev => (prev + 0.1) % 360); // Very slow clockwise rotation
    }, 50); // Update every 50ms for ultra smooth animation

    return () => clearInterval(interval);
  }, [isMobile]);

  // Main modules arranged in orbit
  const mainModules: HubModule[] = [
   { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'from-blue-500 to-cyan-500', glowColor: 'shadow-blue-500/50', angle: 0, radius: isMobile ? 100 : 200 },
   { id: 'leads', label: 'Leads', icon: Users, color: 'from-green-500 to-emerald-500', glowColor: 'shadow-green-500/50', angle: isMobile ? 90 : 72, radius: isMobile ? 100 : 200 },
   { id: 'projects', label: 'Projects', icon: Target, color: 'from-purple-500 to-violet-500', glowColor: 'shadow-purple-500/50', angle: isMobile ? 180 : 144, radius: isMobile ? 100 : 200 },
   { id: 'demos', label: 'Demos', icon: Monitor, color: 'from-orange-500 to-amber-500', glowColor: 'shadow-orange-500/50', angle: isMobile ? 270 : 216, radius: isMobile ? 100 : 200 },
   { id: 'deals', label: 'Deals', icon: DollarSign, color: 'from-pink-500 to-rose-500', glowColor: 'shadow-pink-500/50', angle: isMobile ? 45 : 288, radius: isMobile ? 100 : 200 },
  ];

  // Utility modules in outer orbit
  const utilityModules: HubModule[] = [
   { id: 'treasury', label: 'Treasury', icon: Vault, color: 'from-indigo-500 to-purple-600', glowColor: 'shadow-indigo-500/50', angle: isMobile ? 30 : 0, radius: isMobile ? 140 : 320, adminOnly: true },
   { id: 'settings', label: 'Settings', icon: Settings, color: 'from-gray-500 to-slate-500', glowColor: 'shadow-gray-500/50', angle: isMobile ? 90 : 60, radius: isMobile ? 140 : 320 },
   { id: 'logout', label: 'Sign Out', icon: LogOut, color: 'from-red-600 to-red-700', glowColor: 'shadow-red-600/50', angle: isMobile ? 150 : 120, radius: isMobile ? 140 : 320 },
  ];

  const getModulePosition = (angle: number, radius: number) => {
    const adjustedAngle = isMobile ? angle : (angle + animationOffset) % 360;
    const radian = (adjustedAngle * Math.PI) / 180;
    const x = Math.cos(radian) * radius;
    const y = Math.sin(radian) * radius;
    return { x, y };
  };

  const handleModuleClick = (moduleId: string) => {
    if (isMobile) {
      setMobileMenuOpen(false); // Close menu after selection
    }
    
    switch (moduleId) {
      case 'settings':
        onShowSettings();
        break;
      case 'logout':
        signOut();
        break;
      default:
        onTabChange(moduleId);
    }
  };

  const handleCentralButtonClick = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    }
  };

  const renderMobileMenu = () => {
    if (!isMobile || !mobileMenuOpen) return null;

    const allModules = [...mainModules, ...utilityModules.filter(m => !m.adminOnly || isAdmin)];

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-gradient-to-br from-gray-900 via-green-900 to-black rounded-2xl p-6 max-w-sm w-full mx-4 border border-green-500/30">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-green-300 mb-2">Navigation Menu</h2>
            <p className="text-green-400 text-sm">Choose where to go</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            {allModules.map((module) => {
              const Icon = module.icon;
              
              return (
                <button
                  key={module.id}
                  onClick={() => handleModuleClick(module.id)}
                  className={`
                    relative p-4 rounded-xl bg-gradient-to-br ${module.color}
                    flex flex-col items-center justify-center space-y-2
                    hover:scale-105 transition-all duration-200
                    shadow-lg hover:shadow-xl ${module.glowColor}
                    border border-white/20
                  `}
                >
                  <Icon className="w-6 h-6 text-white drop-shadow-lg" />
                  <span className="text-white text-xs font-medium text-center">
                    {module.label}
                  </span>
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close Menu
          </button>
        </div>
      </div>
    );
  };
  const renderModule = (module: HubModule) => {
    if (module.adminOnly && !isAdmin) return null;
    if (isMobile) return null; // Don't render individual modules on mobile

    const position = getModulePosition(module.angle, module.radius);
    const Icon = module.icon;
    const isActive = activeTab === module.id;
    const isHovered = hoveredModule === module.id;

    return (
      <div
        key={module.id}
        className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
        style={{
          left: `calc(50% + ${position.x}px)`,
          top: `calc(50% + ${position.y}px)`,
        }}
        onMouseEnter={() => setHoveredModule(module.id)}
        onMouseLeave={() => setHoveredModule(null)}
      >
        <button
          onClick={() => handleModuleClick(module.id)}
          className={`
            relative ${isMobile ? 'w-10 h-10' : 'w-20 h-20'} rounded-full bg-gradient-to-br ${module.color}
            flex items-center justify-center transition-all duration-300
            hover:shadow-2xl ${module.glowColor} hover:scale-110
            ${isActive ? 'ring-4 ring-white/50 shadow-2xl ' + module.glowColor : ''}
            ${isHovered ? 'shadow-2xl ' + module.glowColor : 'shadow-lg shadow-black/50'}
            backdrop-blur-sm border border-white/20
            ${isHovered ? 'scale-110' : 'scale-100'}
          `}
        >
          <Icon className={`${isMobile ? 'w-4 h-4' : 'w-8 h-8'} text-white drop-shadow-lg`} />
          
          {/* Pulse animation for active module */}
          {isActive && (
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
          )}
        </button>

        {/* Module Label */}
        <div className={`
          absolute ${isMobile ? 'top-14' : 'top-24'} left-1/2 transform -translate-x-1/2
          px-3 py-1 rounded-full bg-black/80 backdrop-blur-sm
          text-white ${isMobile ? 'text-xs' : 'text-sm'} font-medium whitespace-nowrap
          transition-all duration-300 border border-white/20
          ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        `}>
          {module.label}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-green-900 to-black overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent,rgba(34,197,94,0.1),transparent)]"></div>
      </div>

      {/* Tech Grid Pattern */}
      <div className="absolute inset-0 data-grid opacity-30">
      </div>

      {/* Central Hub */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Central Core */}
          <button
            onClick={handleCentralButtonClick}
            className={`relative ${isMobile ? 'w-24 h-24' : 'w-32 h-32'} rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/50 border-4 border-white/30 backdrop-blur-sm overflow-hidden transition-all duration-200 ${isMobile ? 'hover:scale-105 active:scale-95' : ''}`}
          >
            {/* Rotating Scanner Background */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-900 via-green-900 to-black"></div>
            <div className="absolute inset-0 rounded-full scan-line"></div>
            
            <img 
              src="/ENVAIRE LOGO.png" 
              alt="Envaire Logo" 
              className={`relative z-10 ${isMobile ? 'w-12 h-12' : 'w-16 h-16'} object-contain drop-shadow-lg`}
             onError={(e) => {
               console.error('Logo failed to load:', e);
               e.currentTarget.style.display = 'none';
             }}
            />
            
            {/* Mobile tap indicator */}
            {isMobile && (
              <div className="absolute bottom-1 text-white text-xs font-medium opacity-80">
                TAP
              </div>
            )}
          </button>

          {/* Orbital Rings */}
          {!isMobile && (
            <>
              <div 
                className="absolute inset-0 rounded-full border border-green-500/30 animate-spin" 
                style={{ 
                  width: '440px', 
                  height: '440px', 
                  left: '-154px', 
                  top: '-154px', 
                  animationDuration: '20s' 
                }}
              ></div>
              <div 
                className="absolute inset-0 rounded-full border border-green-500/20 animate-spin" 
                style={{ 
                  width: '680px', 
                  height: '680px', 
                  left: '-274px', 
                  top: '-274px', 
                  animationDuration: '30s', 
                  animationDirection: 'reverse' 
                }}
              ></div>
            </>
          )}
          {!isMobile && (
            <div 
              className="absolute inset-0 rounded-full border border-green-500/30 animate-spin" 
              style={{ 
               width: '440px', 
               height: '440px', 
               left: '-154px', 
               top: '-154px', 
                animationDuration: '20s' 
              }}
            ></div>
          )}
          {!isMobile && (
            <></>
          )}

        </div>

        {/* Main Modules */}
        {mainModules.map(renderModule)}

        {/* Utility Modules */}
        {utilityModules.map(renderModule)}
      </div>

      {/* Mobile Menu */}
      {renderMobileMenu()}
    </div>
  );
};

export default OrbitalHub;