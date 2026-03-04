import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import apiClient from '@/utils/api';
import { getUser } from '@/utils/auth';
import { toast } from 'sonner';
import { Play, BarChart3, User as UserIcon, MessageSquare, Map } from 'lucide-react';
import Navigation from '@/components/Navigation';
import StudyDeclarationModal from '@/components/StudyDeclarationModal';

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeclaration, setShowDeclaration] = useState(false);

  useEffect(() => {
    const userData = getUser();
    if (!userData) {
      navigate('/auth');
      return;
    }
    setUser(userData);
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [statsRes, sessionRes] = await Promise.all([
        apiClient.get('/dashboard'),
        apiClient.get('/session/active')
      ]);
      setStats(statsRes.data);
      setActiveSession(sessionRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startMaxMode = async () => {
    setShowDeclaration(true);
  };

  const handleDeclarationSubmit = async (declarationData) => {
    try {
      // Start session first
      const sessionResponse = await apiClient.post('/session/start');
      const sessionId = sessionResponse.data.session_id;

      // Submit declaration
      await apiClient.post(`/session/${sessionId}/declare`, declarationData);

      setShowDeclaration(false);
      toast.success('Study topic declared!');
      navigate('/max-mode', { state: { session: sessionResponse.data } });
    } catch (error) {
      toast.error('Failed to start session');
    }
  };

  const continueSession = () => {
    if (activeSession) {
      navigate('/max-mode', { state: { session: activeSession } });
    }
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
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="font-heading font-black text-5xl md:text-6xl uppercase tracking-tighter mb-2" data-testid="home-welcome">
            WELCOME BACK
          </h1>
          <p className="text-zinc-400 text-sm">{user?.name}</p>
        </div>

        {/* Main CTA */}
        <div className="mb-12">
          {activeSession && !activeSession.is_completed ? (
            <Button
              onClick={continueSession}
              className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white rounded-none uppercase tracking-widest font-semibold px-16 py-8 text-xl shadow-[0_0_15px_-3px_rgba(37,99,235,0.3)] border-0 transition-colors duration-100"
              data-testid="continue-session-btn"
            >
              CONTINUE SESSION
            </Button>
          ) : (
            <Button
              onClick={startMaxMode}
              className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white rounded-none uppercase tracking-widest font-semibold px-16 py-8 text-xl shadow-[0_0_15px_-3px_rgba(37,99,235,0.3)] border-0 transition-colors duration-100"
              data-testid="start-max-mode-btn"
            >
              <Play className="mr-3 h-6 w-6" />
              START MAX MODE
            </Button>
          )}
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="stat-card p-6 rounded-sm" data-testid="stat-discipline-score">
              <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">DISCIPLINE SCORE</div>
              <div className="font-mono-display text-3xl font-bold text-white">{stats.discipline_score}</div>
            </div>
            
            <div className="stat-card p-6 rounded-sm" data-testid="stat-streak">
              <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">CURRENT STREAK</div>
              <div className="font-mono-display text-3xl font-bold text-primary">{stats.current_streak}</div>
            </div>
            
            <div className="stat-card p-6 rounded-sm" data-testid="stat-today">
              <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">TODAY</div>
              <div className="font-mono-display text-3xl font-bold text-white">{stats.today_sessions}</div>
            </div>
            
            <div className="stat-card p-6 rounded-sm" data-testid="stat-level">
              <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">LEVEL</div>
              <div className="font-mono-display text-3xl font-bold text-white">{stats.level}</div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="stat-card p-6 rounded-sm text-left hover:bg-zinc-800/60 transition-colors duration-100"
            data-testid="nav-dashboard-btn"
          >
            <BarChart3 className="h-8 w-8 text-primary mb-3" strokeWidth={1.5} />
            <div className="font-heading text-lg uppercase tracking-wider font-semibold mb-1">DASHBOARD</div>
            <div className="text-zinc-400 text-xs">View detailed analytics</div>
          </button>
          
          <button
            onClick={() => navigate('/ai-coach')}
            className="stat-card p-6 rounded-sm text-left hover:bg-zinc-800/60 transition-colors duration-100"
            data-testid="nav-coach-btn"
          >
            <MessageSquare className="h-8 w-8 text-primary mb-3" strokeWidth={1.5} />
            <div className="font-heading text-lg uppercase tracking-wider font-semibold mb-1">AI COACH</div>
            <div className="text-zinc-400 text-xs">Get daily feedback</div>
          </button>
          
          <button
            onClick={() => navigate('/profile')}
            className="stat-card p-6 rounded-sm text-left hover:bg-zinc-800/60 transition-colors duration-100"
            data-testid="nav-profile-btn"
          >
            <UserIcon className="h-8 w-8 text-primary mb-3" strokeWidth={1.5} />
            <div className="font-heading text-lg uppercase tracking-wider font-semibold mb-1">PROFILE</div>
            <div className="text-zinc-400 text-xs">View badges and level</div>
          </button>
          
          <button
            onClick={() => navigate('/knowledge-map')}
            className="stat-card p-6 rounded-sm text-left hover:bg-zinc-800/60 transition-colors duration-100"
            data-testid="nav-knowledge-map-btn"
          >
            <Map className="h-8 w-8 text-primary mb-3" strokeWidth={1.5} />
            <div className="font-heading text-lg uppercase tracking-wider font-semibold mb-1">KNOWLEDGE MAP</div>
            <div className="text-zinc-400 text-xs">Track topic mastery</div>
          </button>
        </div>
      </div>

      {/* Study Declaration Modal */}
      <StudyDeclarationModal
        show={showDeclaration}
        onClose={() => setShowDeclaration(false)}
        onSubmit={handleDeclarationSubmit}
      />
    </div>
  );
};

export default Home;
