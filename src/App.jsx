import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { Footer } from "./components/layout/Footer";

// Public Pages
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { PricingPage } from "./pages/PricingPage";

// Authenticated Student Pages
import { DashboardPage } from "./pages/DashboardPage";
import { PracticeHubPage } from "./pages/PracticeHubPage";
import { McqSessionPage } from "./pages/McqSessionPage";
import { CodingArenaPage } from "./pages/CodingArenaPage";
import { MockInterviewPage } from "./pages/MockInterviewPage";
import { ResumeOptimizerPage } from "./pages/ResumeOptimizerPage";
import { PlacementOutcomesPage } from "./pages/PlacementOutcomesPage";

export function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Routes>
        {/* Public Routes with Standalone Layout */}
        <Route
          path="/"
          element={
            <div className="min-h-screen flex flex-col bg-[#f8f9ff]">
              <LandingPage />
              <Footer />
            </div>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Authenticated Student Portal Routes wrapped in DashboardLayout (Sidebar + TopNavbar) */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/practice" element={<PracticeHubPage />} />
          <Route path="/practice/mcq" element={<McqSessionPage />} />
          <Route path="/coding" element={<CodingArenaPage />} />
          <Route path="/practice/coding" element={<CodingArenaPage />} />
          <Route path="/interview" element={<MockInterviewPage />} />
          <Route path="/resume" element={<ResumeOptimizerPage />} />
          <Route path="/outcomes" element={<PlacementOutcomesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
