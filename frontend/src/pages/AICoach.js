import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import apiClient from '@/utils/api';
import Navigation from '@/components/Navigation';
import { MessageSquare, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const AICoach = () => {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchLatestFeedback();
  }, []);

  const fetchLatestFeedback = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/ai-coach/latest');
      setFeedback(response.data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateFeedback = async () => {
    setGenerating(true);
    try {
      const response = await apiClient.post('/ai-coach/generate');
      setFeedback(response.data);
      toast.success('Feedback generated');
    } catch (error) {
      toast.error('Failed to generate feedback');
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="flex items-center gap-4 mb-12">
          <MessageSquare className="h-10 w-10 text-primary" strokeWidth={1.5} />
          <h1 className="font-heading font-black text-5xl uppercase tracking-tighter" data-testid="coach-title">
            AI COACH
          </h1>
        </div>

        {/* Info Section */}
        <div className="stat-card p-8 rounded-sm mb-8">
          <h2 className="font-heading text-xl uppercase tracking-wider font-semibold mb-4">ABOUT YOUR COACH</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-4">
            Your AI coach analyzes your performance daily and provides strict, direct feedback. No soft motivation. Just accountability.
          </p>
          <p className="text-zinc-500 text-xs">
            Feedback is based on: sessions completed, streak consistency, and phase performance.
          </p>
        </div>

        {/* Generate Button */}
        <div className="mb-8">
          <Button
            onClick={generateFeedback}
            disabled={generating}
            className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white rounded-none uppercase tracking-widest font-semibold px-12 py-5 shadow-[0_0_15px_-3px_rgba(37,99,235,0.3)] border-0 transition-colors duration-100"
            data-testid="generate-feedback-btn"
          >
            {generating ? 'GENERATING...' : 'GENERATE TODAY\'S FEEDBACK'}
          </Button>
        </div>

        {/* Feedback Display */}
        {loading ? (
          <div className="text-zinc-400 font-mono-display text-center py-12">LOADING...</div>
        ) : feedback ? (
          <div className="stat-card p-8 rounded-sm" data-testid="feedback-container">
            <div className="flex items-center gap-2 text-zinc-500 text-xs mb-6">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(feedback.date)}</span>
            </div>
            
            <div className="text-white text-xl leading-relaxed font-medium" data-testid="feedback-text">
              {feedback.feedback}
            </div>
          </div>
        ) : (
          <div className="stat-card p-12 rounded-sm text-center">
            <div className="text-zinc-500 text-sm mb-4">No feedback available yet</div>
            <div className="text-zinc-600 text-xs">Generate your first feedback to get started</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AICoach;
