import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import apiClient from '@/utils/api';
import { getUser, logout } from '@/utils/auth';
import Navigation from '@/components/Navigation';
import { LogOut, Award } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 font-mono-display">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-12">
          <h1 className="font-heading font-black text-5xl uppercase tracking-tighter" data-testid="profile-title">
            PROFILE
          </h1>
          <Button
            onClick={handleLogout}
            className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-none uppercase tracking-widest font-semibold px-6 py-3 border-0 transition-colors duration-100"
            data-testid="logout-btn"
          >
            <LogOut className="mr-2 h-4 w-4" />
            LOGOUT
          </Button>
        </div>

        {/* User Info */}
        <div className="stat-card p-8 rounded-sm mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">NAME</div>
              <div className="text-white text-2xl font-semibold mb-6">{profile.name}</div>
              
              <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">EMAIL</div>
              <div className="text-white text-lg">{profile.email}</div>
            </div>
            
            <div>
              <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">LEVEL</div>
              <div className="flex items-baseline gap-4 mb-6">
                <div className="font-mono-display text-5xl font-bold text-white">{profile.level}</div>
                <div className="text-zinc-400 text-xl">{profile.level_name.toUpperCase()}</div>
              </div>
              
              <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">DISCIPLINE SCORE</div>
              <div className="font-mono-display text-3xl font-bold text-primary">{profile.discipline_score}</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="stat-card p-6 rounded-sm">
            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">TOTAL SESSIONS</div>
            <div className="font-mono-display text-4xl font-bold text-white">{profile.total_sessions}</div>
          </div>
          
          <div className="stat-card p-6 rounded-sm">
            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">CURRENT STREAK</div>
            <div className="font-mono-display text-4xl font-bold text-primary">{profile.current_streak}</div>
          </div>
          
          <div className="stat-card p-6 rounded-sm">
            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">LONGEST STREAK</div>
            <div className="font-mono-display text-4xl font-bold text-white">{profile.longest_streak}</div>
          </div>
        </div>

        {/* Badges */}
        <div className="stat-card p-8 rounded-sm">
          <div className="flex items-center gap-3 mb-6">
            <Award className="h-6 w-6 text-primary" strokeWidth={1.5} />
            <h2 className="font-heading text-2xl uppercase tracking-wider font-semibold">BADGES</h2>
          </div>
          
          {profile.badges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {profile.badges.map((badge, index) => (
                <div 
                  key={index}
                  className="bg-zinc-800/40 border border-zinc-700 rounded-sm p-4 text-center"
                  data-testid={`badge-${index}`}
                >
                  <div className="text-primary text-2xl mb-2">★</div>
                  <div className="text-zinc-300 text-xs uppercase tracking-wider">{badge}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-zinc-500 text-sm">Complete sessions to earn badges</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
