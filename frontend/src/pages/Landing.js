import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target, Zap, TrendingUp } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1759300631960-be501eb8ceea?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwyfHxhdGhsZXRlJTIwZm9jdXMlMjBkYXJrJTIwZ3ltJTIwc3R1ZHklMjBuaWdodCUyMG1pbmltYWxpc3QlMjBhcmNoaXRlY3R1cmUlMjBjb25jcmV0ZSUyMGFic3RyYWN0JTIwZ2VvbWV0cmljJTIwYmxhY2t8ZW58MHx8fHwxNzcyNTM5NjgwfDA&ixlib=rb-4.1.0&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-transparent to-zinc-950 z-10" />
        
        {/* Content */}
        <div className="relative z-20 max-w-6xl mx-auto px-8 text-center">
          <h1 
            className="font-heading font-black text-6xl md:text-8xl lg:text-9xl uppercase tracking-tighter leading-none mb-6"
            data-testid="landing-hero-title"
          >
            STUDYMAX
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl mb-4 max-w-2xl mx-auto leading-relaxed">
            Not a productivity tool. A discipline transformation system.
          </p>
          <p className="text-zinc-500 text-sm md:text-base mb-12 max-w-xl mx-auto">
            Turn yourself into a high-focus, high-consistency performer through structured study phases and behavioral pressure.
          </p>
          
          <Button
            onClick={() => navigate('/auth')}
            className="bg-primary hover:bg-primary/90 text-white rounded-none uppercase tracking-widest font-semibold px-12 py-6 text-lg shadow-[0_0_15px_-3px_rgba(37,99,235,0.3)] border-0 transition-colors duration-100"
            data-testid="start-max-mode-btn"
          >
            START MAX MODE
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Philosophy Section */}
      <div className="py-24 px-8 bg-zinc-900/40">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading font-black text-4xl md:text-5xl uppercase tracking-tighter mb-16 text-center">
            DISCIPLINE OVER MOTIVATION
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="stat-card p-8 rounded-sm" data-testid="feature-structured">
              <Target className="h-10 w-10 text-primary mb-4" strokeWidth={1.5} />
              <h3 className="font-heading text-xl uppercase tracking-wider font-semibold mb-3">STRUCTURED SESSIONS</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                4-phase MAX MODE system. Preview. Learn. Recall. Test. 50 minutes of pure focus.
              </p>
            </div>
            
            <div className="stat-card p-8 rounded-sm" data-testid="feature-pressure">
              <Zap className="h-10 w-10 text-primary mb-4" strokeWidth={1.5} />
              <h3 className="font-heading text-xl uppercase tracking-wider font-semibold mb-3">BEHAVIORAL PRESSURE</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Streaks. Discipline scores. Levels. No soft motivation. Just accountability.
              </p>
            </div>
            
            <div className="stat-card p-8 rounded-sm" data-testid="feature-feedback">
              <TrendingUp className="h-10 w-10 text-primary mb-4" strokeWidth={1.5} />
              <h3 className="font-heading text-xl uppercase tracking-wider font-semibold mb-3">AI COACH</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Direct. Strict. Daily feedback that holds you accountable. No excuses.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading font-black text-4xl md:text-6xl uppercase tracking-tighter mb-8">
            READY TO TRANSFORM?
          </h2>
          <p className="text-zinc-400 text-base mb-12">
            Start your first session now. Test your consistency.
          </p>
          <Button
            onClick={() => navigate('/auth')}
            className="bg-primary hover:bg-primary/90 text-white rounded-none uppercase tracking-widest font-semibold px-12 py-6 text-lg shadow-[0_0_15px_-3px_rgba(37,99,235,0.3)] border-0 transition-colors duration-100"
            data-testid="cta-start-btn"
          >
            BEGIN NOW
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
