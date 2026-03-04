import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiClient from '@/utils/api';
import { toast } from 'sonner';
import { ClipboardCheck, Send } from 'lucide-react';

const Quiz = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionId = location.state?.sessionId;
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    generateQuiz();
  }, []);

  const generateQuiz = async () => {
    try {
      const response = await apiClient.post(`/session/${sessionId}/generate-quiz`);
      setQuiz(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate quiz');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unanswered = quiz.questions.filter((_, idx) => !answers[idx]);
    if (unanswered.length > 0) {
      toast.error('Please answer all questions');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient.post(`/session/${sessionId}/submit-quiz`, {
        answers: answers
      });

      navigate('/quiz-result', { 
        state: { 
          result: response.data,
          sessionId: sessionId
        } 
      });
    } catch (error) {
      toast.error('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-zinc-400 font-mono-display text-lg mb-2">GENERATING QUIZ...</div>
          <div className="text-zinc-600 text-sm">AI is creating questions based on your topic</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8" data-testid="quiz-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <ClipboardCheck className="h-16 w-16 text-primary mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="font-heading font-black text-5xl uppercase tracking-tighter mb-4" data-testid="quiz-title">
            VERIFICATION QUIZ
          </h1>
          <p className="text-zinc-400 text-base">
            Answer 5 questions to prove your understanding.
          </p>
          <p className="text-primary text-sm mt-2 font-semibold">
            Need 3/5 correct to validate session
          </p>
          {quiz && quiz.attempt_number > 1 && (
            <p className="text-yellow-500 text-sm mt-2">
              Attempt #{quiz.attempt_number}
            </p>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-8">
          {quiz && quiz.questions.map((q, idx) => (
            <div key={idx} className="stat-card p-8 rounded-sm" data-testid={`question-${idx}`}>
              <div className="mb-4">
                <span className="text-zinc-500 text-xs uppercase tracking-wider">QUESTION {idx + 1}</span>
              </div>
              <p className="text-white text-lg mb-6">{q.question}</p>
              <div>
                <Label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">YOUR ANSWER</Label>
                <Input
                  value={answers[idx] || ''}
                  onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                  placeholder="Type your answer..."
                  className="bg-zinc-950 border-zinc-800 focus:ring-1 focus:ring-primary rounded-none"
                  data-testid={`answer-input-${idx}`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="mt-12">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-none uppercase tracking-widest font-semibold px-12 py-6 text-lg shadow-[0_0_15px_-3px_rgba(37,99,235,0.3)] border-0 transition-colors duration-100"
            data-testid="submit-quiz-btn"
          >
            <Send className="mr-3 h-5 w-5" />
            {submitting ? 'SUBMITTING...' : 'SUBMIT ANSWERS'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
