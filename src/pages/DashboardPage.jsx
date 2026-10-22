import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Target,
  FileText,
  Mic,
  Award,
  ArrowRight,
  Activity,
  Code,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Briefcase,
  Terminal,
  BrainCircuit,
  Sparkles,
  Crown,
  Flame,
  Zap
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { practiceApi } from "../services/practiceApi";
import { StatCard } from "../components/common/StatCard";
import { Card, CardHeader } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { PlanBadge } from "../components/common/Badge";

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, subscription, planTier, isPaid } = useAuth();
  const [streakDays, setStreakDays] = useState(3);
  const [loadingStreak, setLoadingStreak] = useState(false);

  useEffect(() => {
    async function loadStreak() {
      try {
        setLoadingStreak(true);
        const data = await practiceApi.getStreak();
        if (data && data.streak !== undefined) {
          setStreakDays(data.streak);
        }
      } catch (e) {
        // Fallback default
      } finally {
        setLoadingStreak(false);
      }
    }
    loadStreak();
  }, []);

  const readinessScore = user?.readinessScore || 68;
  const totalMockMinutes = (subscription?.includedMinutesRemaining || 0) + (subscription?.purchasedMinutesBalance || 0);

  const mcqCount = subscription?.mcqAttemptedCount || 0;
  const mcqLimit = subscription?.mcqLimit || 100;
  const mcqPercent = mcqLimit > 0 ? Math.min(100, Math.round((mcqCount / mcqLimit) * 100)) : 100;

  const dsaCount = subscription?.dsaAttemptedCount || 0;
  const dsaLimit = subscription?.dsaLimit || 50;
  const dsaPercent = dsaLimit > 0 ? Math.min(100, Math.round((dsaCount / dsaLimit) * 100)) : 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Welcome Banner matching student-web-platform */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Welcome back, {user?.name ? user.name.split(" ")[0] : "Student"}!
            </h1>
            <p className="text-sm sm:text-base text-indigo-200 max-w-xl">
              {user?.collegeName ? `${user.collegeName} • ` : ""}
              {user?.degree || user?.branch || "B.Tech"} • Batch of {user?.graduationYear || "2028"}
              {user?.targetRoles?.[0] || user?.targetRole ? ` • Target: ${user.targetRoles?.[0] || user.targetRole}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 flex items-center gap-2.5">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
              <div>
                <div className="text-xs font-bold leading-tight">{streakDays} Day Streak</div>
                <div className="text-[10px] text-indigo-200">Daily Problem Solving</div>
              </div>
            </div>

            <Link to="/practice">
              <Button
                variant="primary"
                size="md"
                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-900/40"
              >
                Start Daily Practice
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 top-0 -bottom-10 w-96 bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
      </div>

      {/* Main Metric Cards - Enlarged and spacious layout matching student-web-platform */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
        <StatCard
          title="Readiness Score"
          value={`${readinessScore}/100`}
          icon={TrendingUp}
          iconBg="bg-indigo-50 text-indigo-600"
          trend={{ value: "+8%", direction: "up", label: "vs last test" }}
        />
        <StatCard
          title="Placement Probability"
          value={`${Math.min(95, Math.round(readinessScore * 0.95))}%`}
          icon={Target}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Technical Score"
          value={`${Math.min(92, Math.round(readinessScore * 0.9))}/100`}
          icon={Code}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Mock Minutes"
          value={`${totalMockMinutes} mins`}
          icon={Mic}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="MCQ Attempts"
          value={isPaid ? `${mcqCount} (Unlimited)` : `${mcqCount}/${mcqLimit}`}
          icon={BrainCircuit}
          iconBg="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="DSA Solved"
          value={isPaid ? `${dsaCount} (Unlimited)` : `${dsaCount}/${dsaLimit}`}
          icon={Terminal}
          iconBg="bg-rose-50 text-rose-600"
        />
      </div>

      {/* Two Column Grid: Quota Status & Quick Prep Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Preparation Tracks & Quick Launch */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <CardHeader
              title="Career Preparation Modules"
              action={<PlanBadge tier={planTier} />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Tile 1: Practice MCQs */}
              <div
                onClick={() => navigate("/practice")}
                className="p-5 rounded-2xl border border-slate-200/90 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer bg-white group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Subject & Aptitude MCQs
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Formula-backed quantitative, logical, OS, DBMS, and core CS questions.
                </p>
                <div className="mt-4 flex items-center text-xs font-semibold text-indigo-600">
                  Open Practice Hub <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Tile 2: Coding Arena */}
              <div
                onClick={() => navigate("/coding")}
                className="p-5 rounded-2xl border border-slate-200/90 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer bg-white group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                    <Code className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Sandboxed Coding Arena
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  DSA challenges in C++, Python, Java & JS with real-time test case runner.
                </p>
                <div className="mt-4 flex items-center text-xs font-semibold text-emerald-600">
                  Start Coding <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Tile 3: AI Mock Interview */}
              <div
                onClick={() => navigate("/interview")}
                className="p-5 rounded-2xl border border-slate-200/90 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer bg-white group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                    <Mic className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                  Conversational Mock Interview
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Spoken dialogue with Sarah (Principal AI) + question voice tests.
                </p>
                <div className="mt-4 flex items-center text-xs font-semibold text-purple-600">
                  Launch Session <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Tile 4: Resume Optimizer */}
              <div
                onClick={() => navigate("/resume")}
                className="p-5 rounded-2xl border border-slate-200/90 hover:border-sky-500 hover:shadow-md transition-all cursor-pointer bg-white group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-sky-50 text-sky-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                  ATS Resume Optimizer
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Scan and optimize keywords for Google, Microsoft, and enterprise systems.
                </p>
                <div className="mt-4 flex items-center text-xs font-semibold text-sky-600">
                  Run ATS Scan <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Tile 5: Placement Contests & Assessments */}
              <div
                onClick={() => navigate("/contests")}
                className="p-5 rounded-2xl border border-slate-200/90 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer bg-white group sm:col-span-2"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                        Placement Contests & Assessments
                      </h3>
                      <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Rounds & SIPS Verified Evaluations
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Compete in scheduled campus placement drives, timed algorithmic programming contests, and standardized institutional aptitude tests.
                </p>
                <div className="mt-4 flex items-center text-xs font-semibold text-amber-600">
                  Browse Active Assessments <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

            </div>
          </Card>
        </div>

        {/* Right 1 Col: Quotas & Subscription Card */}
        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader
              title="Usage & Entitlements"
            />

            <div className="space-y-4">
              {/* MCQ Quota */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>MCQ Preparation</span>
                  <span className="font-mono text-slate-900">{isPaid ? "Unlimited" : `${mcqCount} / ${mcqLimit}`}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${isPaid ? 100 : mcqPercent}%` }}
                  />
                </div>
              </div>

              {/* DSA Quota */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>DSA Coding Problems</span>
                  <span className="font-mono text-slate-900">{isPaid ? "Unlimited" : `${dsaCount} / ${dsaLimit}`}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${isPaid ? 100 : dsaPercent}%` }}
                  />
                </div>
              </div>

              {/* Mock Minutes */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>AI Mock Interview Minutes</span>
                  <span className="font-mono text-slate-900">{totalMockMinutes} mins left</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (totalMockMinutes / 300) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Link to="/pricing">
                  <Button variant={isPaid ? "outline" : "primary"} size="sm" className="w-full">
                    <Crown className="w-4 h-4 mr-1.5" />
                    {isPaid ? "Manage Subscription" : "Upgrade to Basic or Premium"}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Placement Verified Offer Promo */}
          <Card className="p-6 bg-gradient-to-br from-indigo-50/80 via-white to-white border-indigo-100">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider mb-2">
              <Award className="w-4 h-4" />
              Verified Telemetry
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              Got an Internship or PPO?
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed mb-4">
              Log your verified offer to boost your student readiness index to 90+ and contribute to college NIRF placement data.
            </p>
            <Link to="/outcomes">
              <Button variant="outline" size="sm" className="w-full">
                Log Offer / PPO
              </Button>
            </Link>
          </Card>
        </div>

      </div>

    </div>
  );
}

export default DashboardPage;
