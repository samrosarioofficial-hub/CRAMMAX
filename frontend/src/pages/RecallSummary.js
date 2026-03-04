import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import apiClient from '@/utils/api';
import { toast } from 'sonner';
import { FileText, Send } from 'lucide-react';

const RecallSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionId = location.state?.sessionId;
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const wordCount = content.split(' ').filter(w => w.length > 0).length;

  const handleSubmit = async () => {
    if (wordCount < 80) {
      toast.error('Write at least 80 words');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient.post(`/session/${sessionId}/recall`, {
        content: content
      });

      if (response.data.validated) {
        toast.success('Recall validated!');
        navigate('/quiz', { state: { sessionId } });
      } else {
        toast.error(response.data.feedback);
      }
    } catch (error) {
      toast.error('Failed to submit recall');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8" data-testid="recall-summary-page">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <FileText className="h-16 w-16 text-primary mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="font-heading font-black text-5xl uppercase tracking-tighter mb-4" data-testid="recall-title">
            RECALL SUMMARY
          </h1>
          <p className="text-zinc-400 text-base">
            Write what you remember from this study session.
          </p>
          <p className="text-zinc-500 text-sm mt-2">
            Minimum 80 words. This proves you actually studied.
          </p>
        </div>

        {/* Textarea */}
        <div className="stat-card p-8 rounded-sm mb-6">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write everything you learned... key concepts, definitions, principles, applications..."
            className="bg-zinc-950 border-zinc-800 focus:ring-1 focus:ring-primary rounded-sm min-h-64 text-base"
            data-testid="recall-textarea"
          />
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-zinc-500 text-sm">
              Word count: <span className={`font-mono-display ${wordCount >= 80 ? 'text-primary' : 'text-zinc-400'}`}>{wordCount}</span> / 80
            </div>
            <div className="text-zinc-600 text-xs">
              {wordCount < 80 ? `${80 - wordCount} more words needed` : 'Good to go!'}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="stat-card p-6 rounded-sm mb-8">
          <h3 className="font-heading text-lg uppercase tracking-wider font-semibold mb-3 text-zinc-300">WHY RECALL?</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Active recall forces your brain to retrieve information, proving you learned something. 
            This prevents fake sessions where the timer runs but no studying happens.
          </p>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={submitting || wordCount < 80}
          className="w-full bg-primary hover:bg-primary/90 text-white rounded-none uppercase tracking-widest font-semibold px-12 py-6 text-lg shadow-[0_0_15px_-3px_rgba(37,99,235,0.3)] border-0 transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="submit-recall-btn"
        >
          <Send className="mr-3 h-5 w-5" />
          {submitting ? 'VALIDATING...' : 'SUBMIT RECALL'}
        </Button>
      </div>
    </div>
  );
};

export default RecallSummary;
