import React, { useState, useEffect, useMemo } from "react";
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
  Users,
  ArrowRight,
  BookOpen,
  Award,
  Zap,
  Target,
  Flame
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { practiceApi } from "../services/practiceApi";
import { DailyTrendChart } from "../components/dashboard/DailyTrendChart";

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, subscription, planTier, isTechnical } = useAuth();
  
  const [streakDays, setStreakDays] = useState(14);
  const [activeTab, setActiveTab] = useState("overview");
  const [upcomingContest, setUpcomingContest] = useState("TCS NQT & Infosys DSE");

  useEffect(() => {
    async function fetchTelemetry() {
      try {
        const streakData = await practiceApi.getStreak();
        if (streakData && typeof streakData.streak === "number") {
          setStreakDays(streakData.streak > 0 ? streakData.streak : 14);
        }
      } catch (e) {
        // Fallback default
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
  const userInitials = useMemo(() => {
    if (!user?.name) return "RS";
    const parts = user.name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  }, [user?.name]);

  // Target Role & Specialization Display
  const targetRoleDisplay = useMemo(() => {
    if (user?.targetRoles && user.targetRoles.length > 0) {
      return user.targetRoles[0];
    }
    if (user?.targetRole) {
      return user.targetRole;
    }
    return isTechnical ? "SDE-1 / Software Developer" : "Management Trainee / Business Analyst";
  }, [user, isTechnical]);

  const specializationDisplay = useMemo(() => {
    const branch = user?.branch || user?.degree || (isTechnical ? "Software Engineer" : "Business Management");
    return `Aspiring ${branch}`;
  }, [user, isTechnical]);

  // Telemetry Counts
  const mcqAttempted = subscription?.mcqAttemptedCount || 24;
  const dsaAttempted = subscription?.dsaAttemptedCount || 16;
  const mcqLimit = subscription?.mcqLimit ?? 100;
  const dsaLimit = subscription?.dsaLimit ?? 50;

  const practiceXp = useMemo(() => {
    const base = 2000;
    const computed = base + (mcqAttempted * 10) + (dsaAttempted * 25) + (streakDays * 15);
    return computed.toLocaleString("en-IN");
  }, [mcqAttempted, dsaAttempted, streakDays]);

  const readinessScore = useMemo(() => {
    if (user?.readinessScore && user.readinessScore > 0) {
      return Math.min(100, Math.round(user.readinessScore));
    }
    return 84;
  }, [user?.readinessScore]);

  // Quota percentage calculations
  const mcqPercent = mcqLimit > 0 ? Math.min(100, Math.round((mcqAttempted / mcqLimit) * 100)) : 80;
  const dsaPercent = dsaLimit > 0 ? Math.min(100, Math.round((dsaAttempted / dsaLimit) * 100)) : 65;

  // Goal Progress (Benchmark 412 / 500)
  const totalSolved = Math.max(412, mcqAttempted + dsaAttempted);
  const targetGoal = 500;
  const goalPercent = Math.min(100, Math.round((totalSolved / targetGoal) * 100));

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      
      {/* ================= MAIN DASHBOARD CONTAINER ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 text-slate-900 shadow-xs">
        
        {/* Top Header: Candidate Identity & Core Stat Widgets */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {userInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Hello, {user?.name ? user.name.split(" ")[0] : "Student"}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                  <Flame className="w-3.5 h-3.5 text-slate-700" />
                  {streakDays}-Day Streak
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {specializationDisplay} • Target: {targetRoleDisplay}
              </p>
            </div>
          </div>

          {/* Quick Metrics: Practice XP & Readiness Score */}
          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-2.5 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-slate-800" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block font-medium">Practice XP</span>
                <span className="text-sm font-bold text-slate-900">{practiceXp} XP</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-2.5 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4 text-slate-800" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block font-medium">Placement Ready</span>
                <span className="text-sm font-bold text-emerald-600">{readinessScore}% Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 border-b border-slate-100">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "overview"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Readiness Dashboard
          </button>
          <button
            onClick={() => navigate("/practice")}
            className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
          >
            <Brain className="w-4 h-4" /> Practice Hub
          </button>
          <button
            onClick={() => navigate(isTechnical ? "/coding" : "/gd")}
            className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
          >
            {isTechnical ? <Code2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            {isTechnical ? "Coding Arena" : "Executive GD"}
          </button>
          <button
            onClick={() => navigate("/contests")}
            className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
          >
            <Timer className="w-4 h-4" /> Timed Mock Tests
          </button>
          <button
            onClick={() => navigate("/interview")}
            className="px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
          >
            <Bot className="w-4 h-4" /> AI Mock Interview
          </button>
        </div>

        {/* Dashboard 2-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (7 cols): Today's Modules & Performance Chart */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 tracking-wider uppercase">
                Today's Placement Modules
              </h4>
              <Link
                to="/practice"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Solve Next Problem &rarr;
              </Link>
            </div>

            {/* Module 1: Aptitude Track */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-slate-800" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-bold text-slate-900">
                      Permutations, Probability & Speed Math
                    </h5>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
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
                  <span className="text-xs font-semibold text-emerald-600">{mcqPercent}% Done</span>
                  <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${mcqPercent}%` }} />
                  </div>
                </div>
                <button
                  onClick={() => navigate("/practice")}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>

            {/* Module 2: Coding (Technical) or GD (Non-Technical) */}
            {isTechnical ? (
              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                    <Code2 className="w-5 h-5 text-slate-800" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-bold text-slate-900">
                        Binary Tree Traversals & Recursion
                      </h5>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
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
                    <span className="text-xs font-semibold text-purple-600">{dsaPercent}% Done</span>
                    <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: `${dsaPercent}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/coding")}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Code Now
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-slate-800" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-bold text-slate-900">
                        Corporate Strategy & Case Analysis
                      </h5>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
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
                    <span className="text-xs font-semibold text-blue-600">Active Daily</span>
                    <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: "100%" }} />
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/gd")}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Launch GD
                  </button>
                </div>
              </div>
            )}

            {/* Daily Accuracy & Practice Trend Chart */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-600" /> Daily Accuracy & Practice Trend
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

          {/* Right Column (5 cols): Goal Tracker, Achievement, Targeted Focus */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Goal Tracker Card */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-xs relative">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Goal Tracker
                </span>
                <Flag className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Target Role: {targetRoleDisplay}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Next Mock Test: {upcomingContest}
              </p>
              
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 mt-3">
                <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
                  <span>Questions Solved: <strong className="text-slate-900">{totalSolved} / {targetGoal}</strong></span>
                  <span className="font-bold text-blue-600">{goalPercent}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${goalPercent}%` }} />
                </div>
              </div>
            </div>

            {/* Achievement Card */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-xs flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Achievement
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-1">Aptitude Master Rank</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Top 8% percentile among active candidates
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 text-slate-800" />
              </div>
            </div>

            {/* Targeted Improvement Focus Card */}
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
              <h5 className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-slate-700" /> Targeted Improvement Focus
              </h5>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span>Data Interpretation</span>
                  <span className="font-semibold text-red-600">62% (Needs work)</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>{isTechnical ? "Dynamic Programming" : "Business Problem Sets"}</span>
                  <span className="font-semibold text-purple-600">71% (Moderate)</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Quantitative Aptitude</span>
                  <span className="font-semibold text-emerald-600">94% (Strong)</span>
                </div>
              </div>
              <button
                onClick={() => navigate("/practice")}
                className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Practice Diagnostic Questions
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

export default DashboardPage;
