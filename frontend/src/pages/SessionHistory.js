import React, { useState, useEffect } from 'react';
import apiClient from '@/utils/api';
import Navigation from '@/components/Navigation';
import { Clock, Calendar, BookOpen, TrendingUp } from 'lucide-react';

const SessionHistory = () => {
  const [analytics, setAnalytics] = useState({
    daily: null,
    monthly: null,
    yearly: null
  });
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dailyRes, monthlyRes, yearlyRes, historyRes] = await Promise.all([
        apiClient.get('/analytics/daily'),
        apiClient.get('/analytics/monthly'),
        apiClient.get('/analytics/yearly'),
        apiClient.get('/sessions/history?limit=50')
      ]);

      setAnalytics({
        daily: dailyRes.data,
        monthly: monthlyRes.data,
        yearly: yearlyRes.data
      });
      setSessions(historyRes.data.sessions);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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
        <div className="flex items-center gap-4 mb-12">
          <Clock className="h-10 w-10 text-primary" strokeWidth={1.5} />
          <h1 className="font-heading font-black text-5xl uppercase tracking-tighter" data-testid="session-history-title">
            SESSION HISTORY
          </h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="stat-card p-6 rounded-sm" data-testid="card-today-sessions">
            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">SESSIONS TODAY</div>
            <div className="font-mono-display text-4xl font-bold text-white">
              {analytics.daily?.sessions_count || 0}
            </div>
          </div>

          <div className="stat-card p-6 rounded-sm" data-testid="card-today-minutes">
            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">MINUTES TODAY</div>
            <div className="font-mono-display text-4xl font-bold text-primary">
              {analytics.daily?.total_minutes || 0}
            </div>
          </div>

          <div className="stat-card p-6 rounded-sm" data-testid="card-month-sessions">
            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">THIS MONTH</div>
            <div className="font-mono-display text-4xl font-bold text-white">
              {analytics.monthly?.current_month?.sessions_count || 0}
            </div>
            <div className="text-zinc-600 text-xs mt-1">sessions</div>
          </div>

          <div className="stat-card p-6 rounded-sm" data-testid="card-lifetime">
            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">LIFETIME</div>
            <div className="font-mono-display text-4xl font-bold text-white">
              {analytics.yearly?.lifetime_hours || 0}
            </div>
            <div className="text-zinc-600 text-xs mt-1">hours studied</div>
          </div>
        </div>

        {/* Yearly Summary */}
        {analytics.yearly && analytics.yearly.all_years.length > 0 && (
          <div className="stat-card p-8 rounded-sm mb-8">
            <h2 className="font-heading text-2xl uppercase tracking-wider font-semibold mb-6">YEARLY BREAKDOWN</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {analytics.yearly.all_years.map((year) => (
                <div key={year.year} className="bg-zinc-900/40 border border-zinc-800 rounded-sm p-6">
                  <div className="text-zinc-400 text-sm mb-2">{year.year}</div>
                  <div className="font-mono-display text-3xl font-bold text-white mb-2">
                    {year.total_hours}h
                  </div>
                  <div className="text-zinc-500 text-xs">
                    {year.sessions_count} sessions
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session History Table */}
        <div className="stat-card rounded-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-800 bg-zinc-900/60">
            <h2 className="font-heading text-2xl uppercase tracking-wider font-semibold">ALL SESSIONS</h2>
          </div>

          {sessions.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
              <div className="text-zinc-400 text-lg mb-2">No study sessions yet</div>
              <div className="text-zinc-600 text-sm">Complete your first session with AI verification</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-900/40 border-b border-zinc-800">
                  <tr>
                    <th className="text-left px-6 py-4 text-zinc-500 text-xs uppercase tracking-wider font-semibold">Date</th>
                    <th className="text-left px-6 py-4 text-zinc-500 text-xs uppercase tracking-wider font-semibold">Subject</th>
                    <th className="text-left px-6 py-4 text-zinc-500 text-xs uppercase tracking-wider font-semibold">Topic</th>
                    <th className="text-left px-6 py-4 text-zinc-500 text-xs uppercase tracking-wider font-semibold">Duration</th>
                    <th className="text-left px-6 py-4 text-zinc-500 text-xs uppercase tracking-wider font-semibold">Level</th>
                    <th className="text-left px-6 py-4 text-zinc-500 text-xs uppercase tracking-wider font-semibold">Quiz Score</th>
                    <th className="text-left px-6 py-4 text-zinc-500 text-xs uppercase tracking-wider font-semibold">Phases</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session, idx) => (
                    <tr 
                      key={idx}
                      className="border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors duration-100"
                      data-testid={`session-row-${idx}`}
                    >
                      <td className="px-6 py-4 text-zinc-300 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-zinc-600" />
                          {formatDate(session.session_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white text-sm font-medium">
                        {session.subject}
                      </td>
                      <td className="px-6 py-4 text-zinc-300 text-sm">
                        {session.topic}
                      </td>
                      <td className="px-6 py-4 text-primary font-mono-display text-sm font-semibold">
                        {formatDuration(session.duration_minutes)}
                      </td>
                      <td className="px-6 py-4 text-zinc-300 text-sm">
                        Level {session.level_earned}
                      </td>
                      <td className="px-6 py-4 text-zinc-300 font-mono-display text-sm">
                        {session.quiz_score}/5
                      </td>
                      <td className="px-6 py-4 text-zinc-400 text-sm">
                        {session.phases_completed}/4
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Monthly Breakdown */}
        {analytics.monthly && analytics.monthly.all_months.length > 0 && (
          <div className="stat-card p-8 rounded-sm mt-8">
            <h2 className="font-heading text-2xl uppercase tracking-wider font-semibold mb-6">MONTHLY BREAKDOWN</h2>
            <div className="space-y-4">
              {analytics.monthly.all_months.slice(0, 6).map((month) => (
                <div key={month.month} className="flex items-center justify-between py-3 border-b border-zinc-800">
                  <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-zinc-600" />
                    <span className="text-zinc-300 font-semibold">
                      {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="font-mono-display text-lg text-white">{month.sessions_count}</div>
                      <div className="text-zinc-600 text-xs">sessions</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono-display text-lg text-primary">{formatDuration(month.total_minutes)}</div>
                      <div className="text-zinc-600 text-xs">studied</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionHistory;
