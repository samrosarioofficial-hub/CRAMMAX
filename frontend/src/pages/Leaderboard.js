import React, { useState, useEffect } from 'react';
import apiClient from '@/utils/api';
import Navigation from '@/components/Navigation';
import { Trophy, Medal, Award } from 'lucide-react';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await apiClient.get('/leaderboard');
      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-zinc-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-700" />;
    return null;
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
      
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="flex items-center gap-4 mb-12">
          <Trophy className="h-10 w-10 text-primary" strokeWidth={1.5} />
          <h1 className="font-heading font-black text-5xl uppercase tracking-tighter" data-testid="leaderboard-title">
            LEADERBOARD
          </h1>
        </div>

        {leaderboard.length === 0 ? (
          <div className="stat-card p-12 rounded-sm text-center">
            <Award className="h-16 w-16 text-zinc-700 mx-auto mb-4" />
            <div className="text-zinc-400 text-lg mb-2">No one on the leaderboard yet</div>
            <div className="text-zinc-600 text-sm">Enable leaderboard visibility in Settings to compete</div>
          </div>
        ) : (
          <div className="stat-card rounded-sm overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 p-6 border-b border-zinc-800 bg-zinc-900/60">
              <div className="col-span-1 text-zinc-500 text-xs uppercase tracking-wider">Rank</div>
              <div className="col-span-4 text-zinc-500 text-xs uppercase tracking-wider">Name</div>
              <div className="col-span-2 text-zinc-500 text-xs uppercase tracking-wider">Score</div>
              <div className="col-span-2 text-zinc-500 text-xs uppercase tracking-wider">Level</div>
              <div className="col-span-2 text-zinc-500 text-xs uppercase tracking-wider">Streak</div>
              <div className="col-span-1 text-zinc-500 text-xs uppercase tracking-wider">Sessions</div>
            </div>

            {/* Rows */}
            {leaderboard.map((entry, index) => (
              <div
                key={index}
                className={`grid grid-cols-12 gap-4 p-6 border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors duration-100 ${
                  entry.rank <= 3 ? 'bg-zinc-900/30' : ''
                }`}
                data-testid={`leaderboard-entry-${entry.rank}`}
              >
                <div className="col-span-1 flex items-center gap-2">
                  {getRankIcon(entry.rank)}
                  <span className="font-mono-display text-lg font-bold">{entry.rank}</span>
                </div>
                <div className="col-span-4 flex items-center">
                  <span className="text-white text-base">{entry.name}</span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="font-mono-display text-primary text-lg font-bold">{entry.discipline_score}</span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-zinc-300 text-sm">{entry.level} - {entry.level_name}</span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="font-mono-display text-white text-base">{entry.current_streak}</span>
                </div>
                <div className="col-span-1 flex items-center">
                  <span className="font-mono-display text-zinc-400 text-sm">{entry.total_sessions}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 stat-card p-6 rounded-sm">
          <p className="text-zinc-400 text-sm">
            <strong className="text-zinc-300">Note:</strong> Only users who have enabled leaderboard visibility in Settings appear here. Rankings are based on Discipline Score.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
