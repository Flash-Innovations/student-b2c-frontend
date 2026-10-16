import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PricingPage } from './pages/PricingPage';

// Authenticated Student Pages
import { DashboardPage } from './pages/DashboardPage';
import { PracticeHubPage } from './pages/PracticeHubPage';
import { McqSessionPage } from './pages/McqSessionPage';
import { CodingArenaPage } from './pages/CodingArenaPage';
import { MockInterviewPage } from './pages/MockInterviewPage';
import { ResumeOptimizerPage } from './pages/ResumeOptimizerPage';
import { PlacementOutcomesPage } from './pages/PlacementOutcomesPage';

export function App() {
  const location = useLocation();

  // Hide footer on intense interactive IDE viewports (Coding Arena)
  const isCodingArena = location.pathname.includes('/coding');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-1 flex flex-col">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pricing" element={<PricingPage />} />

          {/* Protected Student Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice"
            element={
              <ProtectedRoute>
                <PracticeHubPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice/mcq"
            element={
              <ProtectedRoute>
                <McqSessionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coding"
            element={
              <ProtectedRoute>
                <CodingArenaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/practice/coding"
            element={
              <ProtectedRoute>
                <CodingArenaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview"
            element={
              <ProtectedRoute>
                <MockInterviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume"
            element={
              <ProtectedRoute>
                <ResumeOptimizerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/outcomes"
            element={
              <ProtectedRoute>
                <PlacementOutcomesPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isCodingArena && <Footer />}
    </div>
  );
}

export default App;
