import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, BarChart3, User, MessageSquare, Trophy, Settings as SettingsIcon, Download } from 'lucide-react';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/home', label: 'HOME', icon: HomeIcon },
    { path: '/dashboard', label: 'DASHBOARD', icon: BarChart3 },
    { path: '/leaderboard', label: 'LEADERBOARD', icon: Trophy },
    { path: '/ai-coach', label: 'AI COACH', icon: MessageSquare },
    { path: '/export', label: 'EXPORT', icon: Download },
    { path: '/settings', label: 'SETTINGS', icon: SettingsIcon },
    { path: '/profile', label: 'PROFILE', icon: User }
  ];

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="font-heading font-black text-2xl uppercase tracking-tighter cursor-pointer"
            onClick={() => navigate('/home')}
            data-testid="nav-logo"
          >
            STUDYMAX
          </div>

          {/* Nav Items */}
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-semibold transition-colors duration-100 ${
                    isActive
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-zinc-400 hover:text-zinc-50'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
