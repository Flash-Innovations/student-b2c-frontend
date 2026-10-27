import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { useAuth } from "./context/AuthContext";

// Auth Pages
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { PricingPage } from "./pages/PricingPage";

// Authenticated Student Pages
import { DashboardPage } from "./pages/DashboardPage";
import { PracticeHubPage } from "./pages/PracticeHubPage";
import { McqSessionPage } from "./pages/McqSessionPage";
import { CodingArenaPage } from "./pages/CodingArenaPage";
import { CodingQuestionListPage } from "./pages/CodingQuestionListPage";
import { MockInterviewPage } from "./pages/MockInterviewPage";
import { ResumeOptimizerPage } from "./pages/ResumeOptimizerPage";
import { PlacementOutcomesPage } from "./pages/PlacementOutcomesPage";

// Group Discussion Arena Pages
import { GdLobbyPage } from "./pages/GdLobbyPage";
import { GdRoomPage } from "./pages/GdRoomPage";

// Contests & Assessments Pages
import { ContestListPage } from "./pages/ContestListPage";
import { ContestDetailsPage } from "./pages/ContestDetailsPage";
import { ContestWorkspacePage } from "./pages/ContestWorkspacePage";
import { ContestResultPage } from "./pages/ContestResultPage";
import { ContestLeaderboardPage } from "./pages/ContestLeaderboardPage";

// Student Career Profile Pages
import { StudentProfilePage } from "./pages/StudentProfilePage";
import { PublicProfilePage } from "./pages/PublicProfilePage";

function RootEntry() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

export function App() {
  const { isTechnical } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Routes>
        {/* Default Route: Always opens Login page first for unauthenticated users */}
        <Route path="/" element={<RootEntry />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/onboarding" element={<Navigate to="/register" replace />} />

        {/* Dedicated Fullscreen Distraction-Free Contest Workspace */}
        <Route
          path="/contests/:contestId/attempt/:attemptId"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 sm:p-6">
                <ContestWorkspacePage />
              </div>
            </ProtectedRoute>
          }
        />

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
          <Route
            path="/coding"
            element={isTechnical ? <CodingQuestionListPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/coding/:questionId"
            element={isTechnical ? <CodingArenaPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/practice/coding"
            element={isTechnical ? <CodingQuestionListPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/practice/coding/:questionId"
            element={isTechnical ? <CodingArenaPage /> : <Navigate to="/dashboard" replace />}
          />

          {/* Contests & Institutional Assessments */}
          <Route path="/contests" element={<ContestListPage />} />
          <Route path="/contests/:contestId" element={<ContestDetailsPage />} />
          <Route path="/contests/:contestId/result/:attemptId" element={<ContestResultPage />} />
          <Route path="/contests/:contestId/leaderboard" element={<ContestLeaderboardPage />} />

          <Route path="/interview" element={<MockInterviewPage />} />
          <Route path="/resume" element={<ResumeOptimizerPage />} />
          <Route path="/outcomes" element={<PlacementOutcomesPage />} />
          <Route path="/pricing" element={<PricingPage />} />

          {/* Student Career Profile */}
          <Route path="/profile" element={<StudentProfilePage />} />

          {/* Group Discussion Arena */}
          <Route path="/gd" element={<GdLobbyPage />} />
          <Route path="/gd/:roomId" element={<GdRoomPage />} />
        </Route>

        {/* Public Shareable Candidate Career Portfolios */}
        <Route path="/u/:username" element={<PublicProfilePage />} />
        <Route path="/profile/public/:username" element={<PublicProfilePage />} />

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
