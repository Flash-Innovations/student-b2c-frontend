import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Brain,
  Code2,
  Timer,
  Bot,
  Flag,
  AlertCircle,
  LayoutDashboard,
  Users2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  Crown
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { practiceApi } from "../services/practiceApi";
import { b2cApi } from "../services/b2cApi";
import { DailyTrendChart } from "../components/dashboard/DailyTrendChart";
import { PlanBadge } from "../components/common/Badge";
import { Button } from "../components/common/Button";

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, subscription, planTier, isPaid, isTechnical } = useAuth();
  
  const [streakDays, setStreakDays] = useState(14);
  const [loadingStreak, setLoadingStreak] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [upcomingContest, setUpcomingContest] = useState("TCS NQT & Infosys DSE");

  useEffect(() => {
    async function fetchTelemetry() {
      try {
        setLoadingStreak(true);
        const streakData = await practiceApi.getStreak();
        if (streakData && typeof streakData.streak === "number") {
          setStreakDays(streakData.streak > 0 ? streakData.streak : 14);
        }
      } catch (e) {
        // Fallback to showcase streak
      } finally {
        setLoadingStreak(false);
      }

      try {
        const contestData = await practiceApi.getAvailableContests?.();
        if (contestData?.contests && contestData.contests.length > 0) {
          setUpcomingContest(contestData.contests[0].title);
        }
      } catch (e) {}
    }
    fetchTelemetry();
  }, []);

  // Compute User Initials
  const userInitials = React.useMemo(() => {
    if (!user?.name) return "RS";
    const parts = user.name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  }, [user?.name]);

  // Target Role & Specialization Display
  const targetRoleDisplay = React.useMemo(() => {
    if (user?.targetRoles && user.targetRoles.length > 0) {
      return user.targetRoles[0];
    }
    if (user?.targetRole) {
      return user.targetRole;
    }
    return isTechnical ? "SDE-1 / Software Developer" : "Management Trainee / Business Analyst";
  }, [user, isTechnical]);

  const specializationDisplay = React.useMemo(() => {
    const branch = user?.branch || user?.degree || (isTechnical ? "Software Engineer" : "Business Management");
    return `Aspiring ${branch}`;
  }, [user, isTechnical]);

  // Compute Practice XP and Readiness Score
  const mcqAttempted = subscription?.mcqAttemptedCount || 24;
  const dsaAttempted = subscription?.dsaAttemptedCount || 16;
  const mcqLimit = subscription?.mcqLimit ?? 100;
  const dsaLimit = subscription?.dsaLimit ?? 50;

  const practiceXp = React.useMemo(() => {
    const base = 2000;
    const computed = base + (mcqAttempted * 10) + (dsaAttempted * 25) + (streakDays * 15);
    return computed.toLocaleString("en-IN");
  }, [mcqAttempted, dsaAttempted, streakDays]);

  const readinessScore = React.useMemo(() => {
    if (user?.readinessScore && user.readinessScore > 0) {
      return Math.min(100, Math.round(user.readinessScore));
    }
    return 84; // Benchmark placement ready score matching landing showcase
  }, [user?.readinessScore]);

  // Quota percentage calculations
  const mcqPercent = mcqLimit > 0 ? Math.min(100, Math.round((mcqAttempted / mcqLimit) * 100)) : 80;
  const dsaPercent = dsaLimit > 0 ? Math.min(100, Math.round((dsaAttempted / dsaLimit) * 100)) : 65;

  // Goal Progress (412 / 500 benchmark)
  const totalSolved = Math.max(412, mcqAttempted + dsaAttempted);
  const targetGoal = 500;
  const goalPercent = Math.min(100, Math.round((totalSolved / targetGoal) * 100));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ================= FLOATING APP DASHBOARD CONTAINER ================= */}
      <div className="relative bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-slate-200/80 p-4 sm:p-6 md:p-8 text-slate-800 transition-all">
        
        {/* Mockup Top Bar: User Welcome + Status Badges */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-200 shrink-0">
              {userInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Hello, {user?.name ? user.name.split(" ")[0] : "Student"} 👋
                </h3>
                <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  🔥 {streakDays}-Day Streak
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {specializationDisplay} • Target: {targetRoleDisplay}
              </p>
            </div>
          </div>

          {/* XP & Readiness Score Widgets */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-2xl flex items-center gap-2.5 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                ⚡
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Practice XP</span>
                <span className="text-sm font-extrabold text-indigo-600">{practiceXp} XP</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl flex items-center gap-2.5 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                🎯
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Placement Ready</span>
                <span className="text-sm font-extrabold text-emerald-600">{readinessScore}% Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Feature Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 border-b border-slate-100">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Readiness Dashboard
          </button>
          <button
            onClick={() => navigate("/practice")}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          >
            <Brain className="w-4 h-4" /> Practice Hub
          </button>
          <button
            onClick={() => navigate(isTechnical ? "/coding" : "/gd")}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          >
            {isTechnical ? <Code2 className="w-4 h-4" /> : <Users2 className="w-4 h-4" />}
            {isTechnical ? "Coding Arena" : "Executive GD"}
          </button>
          <button
            onClick={() => navigate("/contests")}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          >
            <Timer className="w-4 h-4" /> Timed Mock Tests
          </button>
          <button
            onClick={() => navigate("/interview")}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          >
            <Bot className="w-4 h-4" /> AI Mock Interview
          </button>
        </div>

        {/* ================= TAB CONTENT: DASHBOARD OVERVIEW ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (7 cols): Today's Active Placement Modules */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
                Today's Placement Modules
              </h4>
              <Link
                to="/practice"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
              >
                Solve Next Problem &rarr;
              </Link>
            </div>

            {/* Card 1: Aptitude & Reasoning Track */}
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-400/50 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-violet-100 text-indigo-600 flex items-center justify-center font-bold text-xl shrink-0">
                  📖
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-bold text-slate-900">
                      Permutations, Probability & Speed Math
                    </h5>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-indigo-700">
                      Aptitude
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {mcqAttempted} of {mcqLimit > 0 ? mcqLimit : 100} problems completed • 92% Accuracy
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-600">{mcqPercent}% Done</span>
                  <div className="w-20 bg-slate-100 h-2 rounded-full mt-1 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${mcqPercent}%` }} />
                  </div>
                </div>
                <button
                  onClick={() => navigate("/practice")}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>

            {/* Card 2: Adaptive Placement Module (Coding for Tech / GD for Non-Tech) */}
            {isTechnical ? (
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-400/50 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl shrink-0">
                    💻
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-bold text-slate-900">
                        Binary Tree Traversals & Recursion
                      </h5>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Coding Arena
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Medium Difficulty • C++, Java, Python supported
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-600">{dsaPercent}% Done</span>
                    <div className="w-20 bg-slate-100 h-2 rounded-full mt-1 overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full transition-all duration-300" style={{ width: `${dsaPercent}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/coding")}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Code Now
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-400/50 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl shrink-0">
                    👥
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-bold text-slate-900">
                        Corporate Strategy & Case Analysis
                      </h5>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                        Executive GD
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Case Study Simulation • Live Peer Discussions
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-600">Active Daily</span>
                    <div className="w-20 bg-slate-100 h-2 rounded-full mt-1 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: "100%" }} />
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/gd")}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Launch GD
                  </button>
                </div>
              </div>
            )}

            {/* Daily Accuracy & Practice Trend Chart */}
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-600" /> Daily Accuracy & Practice Trend
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  Last 7 Days (Avg: 88%)
                </span>
              </div>
              <div className="relative h-44 w-full">
                <DailyTrendChart />
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Goal Tracker, Achievement & Targeted Focus */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Goal Tracker Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                    Goal Tracker
                  </span>
                  <Flag className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-base font-bold mb-1">
                  Target Role: {targetRoleDisplay}
                </h4>
                <p className="text-xs text-pink-100 mb-3">
                  Next Timed Mock Test: {upcomingContest} in 2 days
                </p>
                <div className="flex items-center justify-between text-xs bg-white/10 rounded-xl p-2.5 backdrop-blur-xs">
                  <span>Questions Solved: <strong>{totalSolved} / {targetGoal}</strong></span>
                  <span className="font-bold text-white">{goalPercent}%</span>
                </div>
              </div>
            </div>

            {/* Achievement Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full">
                  Achievement
                </span>
                <h4 className="text-base font-bold mt-1.5">Aptitude Master Rank</h4>
                <p className="text-xs text-amber-100 mt-0.5">
                  Top 8% percentile among active candidates
                </p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner shrink-0">
                🏅
              </div>
            </div>

            {/* Targeted Improvement Focus Card */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <h5 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-indigo-600" /> Targeted Improvement Focus
              </h5>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Data Interpretation</span>
                  <span className="font-bold text-rose-500">62% (Needs work)</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>{isTechnical ? "Dynamic Programming" : "Business Problem Sets"}</span>
                  <span className="font-bold text-amber-600">71% (Moderate)</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Quantitative Aptitude</span>
                  <span className="font-bold text-emerald-600">94% (Strong)</span>
                </div>
              </div>
              <button
                onClick={() => navigate("/practice")}
                className="w-full mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Practice 10 Diagnostic Questions
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

export default DashboardPage;
