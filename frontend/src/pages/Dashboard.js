import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/utils/api';
import Navigation from '@/components/Navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
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
        <h1 className="font-heading font-black text-5xl uppercase tracking-tighter mb-12" data-testid="dashboard-title">
          DASHBOARD
        </h1>

        {/* Main Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="stat-card p-6 rounded-sm" data-testid="dashboard-discipline-score">
            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">DISCIPLINE SCORE</div>
            <div className="font-mono-display text-4xl font-bold text-white mb-1">{stats.discipline_score}</div>
            <div className="text-zinc-600 text-xs">LEVEL {stats.level} - {stats.level_name}</div>
          </div>

          <div className="stat-card p-6 rounded-sm" data-testid="dashboard-current-streak">
            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">CURRENT STREAK</div>
            <div className="font-mono-display text-4xl font-bold text-primary mb-1">{stats.current_streak}</div>
            <div className="text-zinc-600 text-xs">DAYS</div>
          </div>

          <div className="stat-card p-6 rounded-sm" data-testid="dashboard-total-sessions">
            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">TOTAL SESSIONS</div>
            <div className="font-mono-display text-4xl font-bold text-white mb-1">{stats.total_sessions}</div>
            <div className="text-zinc-600 text-xs">ALL TIME</div>
          </div>

          <div className="stat-card p-6 rounded-sm" data-testid="dashboard-longest-streak">
            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">LONGEST STREAK</div>
            <div className="font-mono-display text-4xl font-bold text-white mb-1">{stats.longest_streak}</div>
            <div className="text-zinc-600 text-xs">DAYS</div>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="stat-card p-8 rounded-sm mb-8">
          <h2 className="font-heading text-2xl uppercase tracking-wider font-semibold mb-6">WEEKLY CONSISTENCY</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weekly_stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis 
                  dataKey="date" 
                  stroke="#71717a"
                  tick={{ fontSize: 12, fontFamily: 'JetBrains Mono' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { weekday: 'short' });
                  }}
                />
                <YAxis 
                  stroke="#71717a"
                  tick={{ fontSize: 12, fontFamily: 'JetBrains Mono' }}
                />
                <Bar dataKey="sessions" radius={[2, 2, 0, 0]}>
                  {stats.weekly_stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.sessions > 0 ? '#2563eb' : '#27272a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today Stats */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="stat-card p-8 rounded-sm">
            <h2 className="font-heading text-2xl uppercase tracking-wider font-semibold mb-4">TODAY</h2>
            <div className="font-mono-display text-6xl font-bold text-white" data-testid="today-sessions-count">
              {stats.today_sessions}
            </div>
            <div className="text-zinc-400 text-sm mt-2">SESSIONS COMPLETED</div>
          </div>

          <div className="stat-card p-8 rounded-sm">
            <h2 className="font-heading text-2xl uppercase tracking-wider font-semibold mb-4">LEVEL PROGRESS</h2>
            <div className="flex items-baseline gap-4 mb-2">
              <div className="font-mono-display text-6xl font-bold text-white">{stats.level}</div>
              <div className="text-zinc-400 text-lg">{stats.level_name.toUpperCase()}</div>
            </div>
            <div className="text-zinc-500 text-xs mt-2">
              {stats.discipline_score % 1000} / 1000 TO NEXT LEVEL
            </div>
            <div className="mt-4 h-2 bg-zinc-800 rounded-none overflow-hidden">
              <div 
                className="h-full bg-primary"
                style={{ width: `${(stats.discipline_score % 1000) / 10}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
