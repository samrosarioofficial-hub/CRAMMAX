import React, { useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { getToken } from '@/utils/auth';

// Pages
import Landing from '@/pages/Landing';
import Auth from '@/pages/Auth';
import Home from '@/pages/Home';
import MaxMode from '@/pages/MaxMode';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import AICoach from '@/pages/AICoach';
import Settings from '@/pages/Settings';
import Leaderboard from '@/pages/Leaderboard';
import Export from '@/pages/Export';
import RecallSummary from '@/pages/RecallSummary';
import Quiz from '@/pages/Quiz';
import QuizResult from '@/pages/QuizResult';
import KnowledgeMap from '@/pages/KnowledgeMap';
import SessionHistory from '@/pages/SessionHistory';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = getToken();
  return token ? children : <Navigate to="/auth" replace />;
};

function App() {
  return (
    <div className="app-container">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/max-mode"
            element={
              <ProtectedRoute>
                <MaxMode />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-coach"
            element={
              <ProtectedRoute>
                <AICoach />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/export"
            element={
              <ProtectedRoute>
                <Export />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recall-summary"
            element={
              <ProtectedRoute>
                <RecallSummary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz"
            element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz-result"
            element={
              <ProtectedRoute>
                <QuizResult />
              </ProtectedRoute>
            }
          />
          <Route
            path="/knowledge-map"
            element={
              <ProtectedRoute>
                <KnowledgeMap />
              </ProtectedRoute>
            }
          />
          <Route
            path="/session-history"
            element={
              <ProtectedRoute>
                <SessionHistory />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
