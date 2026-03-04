import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, RefreshCw, Home } from 'lucide-react';

const QuizResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { result, sessionId } = location.state || {};

  if (!result) {
    navigate('/home');
    return null;
  }

  const { passed, score, total, message, correct_answers } = result;

  const handleRetry = () => {
    navigate('/quiz', { state: { sessionId } });
  };

  const handleGoHome = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8" data-testid="quiz-result-page">
      <div className="max-w-3xl w-full">
        {/* Result Icon */}
        <div className="text-center mb-12">
          {passed ? (
            <CheckCircle className="h-24 w-24 text-primary mx-auto mb-6" strokeWidth={1.5} />
          ) : (
            <XCircle className="h-24 w-24 text-destructive mx-auto mb-6" strokeWidth={1.5} />
          )}
          
          <h1 className="font-heading font-black text-5xl uppercase tracking-tighter mb-4" data-testid="result-title">
            {passed ? 'SESSION VALIDATED' : 'QUIZ FAILED'}
          </h1>
          
          <div className="font-mono-display text-6xl font-bold mb-4" data-testid="score-display">
            <span className={passed ? 'text-primary' : 'text-destructive'}>{score}</span>
            <span className="text-zinc-600"> / {total}</span>
          </div>
          
          <p className={`text-lg ${passed ? 'text-zinc-300' : 'text-zinc-400'}`}>
            {message}
          </p>
        </div>

        {/* Details */}
        {passed ? (
          <div className="stat-card p-8 rounded-sm mb-8">
            <h2 className="font-heading text-2xl uppercase tracking-wider font-semibold mb-4 text-primary">
              REWARDS EARNED
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">DISCIPLINE SCORE</div>
                <div className="font-mono-display text-3xl font-bold text-white">+100</div>
              </div>
              <div>
                <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">KNOWLEDGE XP</div>
                <div className="font-mono-display text-3xl font-bold text-primary">+{score * 20}</div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-zinc-800">
              <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">STUDY XP</div>
              <div className="font-mono-display text-2xl font-bold text-white">+100</div>
            </div>
          </div>
        ) : (
          <div className="stat-card p-8 rounded-sm mb-8">
            <h2 className="font-heading text-2xl uppercase tracking-wider font-semibold mb-4 text-destructive">
              RETRY REQUIRED
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
              You need at least 3 correct answers to validate this session. Review the correct answers below and try again.
            </p>
            <div className="bg-zinc-950 p-4 rounded-sm">
              <div className="text-zinc-500 text-xs uppercase tracking-wider mb-3">CORRECT ANSWERS</div>
              <div className="space-y-2">
                {correct_answers && correct_answers.map((answer, idx) => (
                  <div key={idx} className="text-zinc-300 text-sm">
                    <span className="text-zinc-600 font-mono">{idx + 1}.</span> {answer}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          {!passed && (
            <Button
              onClick={handleRetry}
              className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-none uppercase tracking-widest font-semibold py-5 shadow-[0_0_15px_-3px_rgba(37,99,235,0.3)] border-0 transition-colors duration-100"
              data-testid="retry-quiz-btn"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              RETRY QUIZ
            </Button>
          )}
          <Button
            onClick={handleGoHome}
            className={`${!passed ? 'flex-1' : 'w-full'} bg-zinc-800 hover:bg-zinc-700 text-white rounded-none uppercase tracking-widest font-semibold py-5 border-0 transition-colors duration-100`}
            data-testid="go-home-btn"
          >
            <Home className="mr-2 h-5 w-5" />
            GO HOME
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizResult;
