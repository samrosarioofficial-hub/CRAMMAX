import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import apiClient from '@/utils/api';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const PHASES = [
  { id: 'preview', name: 'PREVIEW', duration: 5 * 60 },
  { id: 'learn', name: 'LEARN', duration: 35 * 60 },
  { id: 'recall', name: 'RECALL', duration: 10 * 60 },
  { id: 'test', name: 'TEST', duration: 10 * 60 }
];

const MaxMode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(location.state?.session);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(PHASES[0].duration);
  const [isPaused, setIsPaused] = useState(false);
  const [showExit, setShowExit] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate('/home');
      return;
    }

    // Find current phase
    const completedPhases = session.phases_completed || [];
    let nextPhaseIndex = 0;
    
    for (let i = 0; i < PHASES.length; i++) {
      if (!completedPhases.includes(PHASES[i].id)) {
        nextPhaseIndex = i;
        break;
      }
    }
    
    setCurrentPhaseIndex(nextPhaseIndex);
    setTimeRemaining(PHASES[nextPhaseIndex].duration);
  }, [session, navigate]);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Play notification sound when timer ends
          playNotificationSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const playNotificationSound = () => {
    // Simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio notification not supported');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const completePhase = async () => {
    try {
      const currentPhase = PHASES[currentPhaseIndex];
      const response = await apiClient.post(
        `/session/${session.session_id}/complete-phase`,
        { phase: currentPhase.id }
      );
      
      setSession(response.data);

      if (response.data.is_completed) {
        toast.success('Session completed!');
        navigate('/home');
      } else {
        // Move to next phase
        const nextIndex = currentPhaseIndex + 1;
        if (nextIndex < PHASES.length) {
          setCurrentPhaseIndex(nextIndex);
          setTimeRemaining(PHASES[nextIndex].duration);
          toast.success(`${currentPhase.name} complete`);
        }
      }
    } catch (error) {
      toast.error('Failed to complete phase');
    }
  };

  const exitSession = () => {
    navigate('/home');
  };

  if (!session) return null;

  const currentPhase = PHASES[currentPhaseIndex];
  const progress = ((PHASES[currentPhaseIndex].duration - timeRemaining) / PHASES[currentPhaseIndex].duration) * 100;

  return (
    <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col" data-testid="max-mode-container">
      {/* Exit Button */}
      <div className="absolute top-8 right-8 z-10">
        <Button
          variant="ghost"
          onClick={() => setShowExit(true)}
          className="text-zinc-500 hover:text-zinc-300 rounded-none"
          data-testid="exit-btn"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Current Phase */}
        <div className="text-zinc-500 text-xs uppercase tracking-[0.2em] mb-8" data-testid="current-phase">
          PHASE {currentPhaseIndex + 1} OF {PHASES.length}
        </div>

        {/* Phase Name */}
        <h1 
          className="font-heading font-black text-6xl md:text-8xl uppercase tracking-tighter mb-12"
          data-testid="phase-name"
        >
          {currentPhase.name}
        </h1>

        {/* Timer */}
        <div 
          className="font-mono-display text-8xl md:text-9xl font-bold text-white timer-glow mb-16"
          data-testid="timer-display"
        >
          {formatTime(timeRemaining)}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-2xl mb-12">
          <div className="h-1 bg-zinc-800 rounded-none overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          <Button
            onClick={() => setIsPaused(!isPaused)}
            className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-none uppercase tracking-widest font-semibold px-8 py-5 border-0 transition-colors duration-100"
            data-testid="pause-btn"
          >
            {isPaused ? 'RESUME' : 'PAUSE'}
          </Button>
          
          <Button
            onClick={completePhase}
            className="bg-primary hover:bg-primary/90 text-white rounded-none uppercase tracking-widest font-semibold px-8 py-5 shadow-[0_0_15px_-3px_rgba(37,99,235,0.3)] border-0 transition-colors duration-100"
            data-testid="complete-phase-btn"
          >
            COMPLETE PHASE
          </Button>
        </div>

        {/* Phase Indicators */}
        <div className="flex gap-2 mt-16">
          {PHASES.map((phase, index) => {
            const isCompleted = session.phases_completed?.includes(phase.id);
            const isCurrent = index === currentPhaseIndex;
            
            return (
              <div
                key={phase.id}
                className={`w-12 h-12 rounded-sm border flex items-center justify-center text-xs font-mono-display ${
                  isCompleted
                    ? 'bg-primary border-primary text-white'
                    : isCurrent
                    ? 'border-primary text-primary'
                    : 'border-zinc-800 text-zinc-600'
                }`}
                data-testid={`phase-indicator-${phase.id}`}
              >
                {index + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-8 max-w-md" data-testid="exit-modal">
            <h2 className="font-heading font-black text-2xl uppercase tracking-tighter mb-4">
              EXIT SESSION?
            </h2>
            <p className="text-zinc-400 text-sm mb-6">
              Exiting now will mark this as an early exit. Your streak and discipline score will be affected.
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => setShowExit(false)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-none uppercase tracking-widest font-semibold py-4 border-0 transition-colors duration-100"
                data-testid="cancel-exit-btn"
              >
                CANCEL
              </Button>
              <Button
                onClick={exitSession}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white rounded-none uppercase tracking-widest font-semibold py-4 border-0 transition-colors duration-100"
                data-testid="confirm-exit-btn"
              >
                EXIT
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaxMode;
