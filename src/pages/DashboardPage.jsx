import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  TrendingUp,
  BrainCircuit,
  Code2,
  Sparkles,
  FileCheck2,
  Award,
  Crown,
  Clock,
  ArrowRight,
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { practiceApi } from '../services/practiceApi';
import { Card, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, PlanBadge } from '../components/common/Badge';

export function DashboardPage() {
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

  const readinessScore = user?.readinessScore || 45;
  const totalMockMinutes = (subscription?.includedMinutesRemaining || 0) + (subscription?.purchasedMinutesBalance || 0);

  const getReadinessColor = (score) => {
    if (score >= 80) return 'text-emerald-400 stroke-emerald-400';
    if (score >= 60) return 'text-indigo-400 stroke-indigo-400';
    if (score >= 40) return 'text-amber-400 stroke-amber-400';
    return 'text-rose-400 stroke-rose-400';
  };

  const mcqCount = subscription?.mcqAttemptedCount || 0;
  const mcqLimit = subscription?.mcqLimit || 100;
  const mcqPercent = mcqLimit > 0 ? Math.min(100, Math.round((mcqCount / mcqLimit) * 100)) : 100;

  const dsaCount = subscription?.dsaAttemptedCount || 0;
  const dsaLimit = subscription?.dsaLimit || 50;
  const dsaPercent = dsaLimit > 0 ? Math.min(100, Math.round((dsaCount / dsaLimit) * 100)) : 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
              Welcome back, {user?.name || 'Student'}
            </h1>
            <PlanBadge tier={planTier} />
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            {user?.collegeName || 'Flash Community'} • <span className="text-indigo-400 font-mono">Class of {user?.graduationYear || '2028'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800">
            <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
            <div>
              <div className="text-xs font-bold text-white font-mono">{streakDays} Days</div>
              <div className="text-[10px] text-slate-400">Daily Streak</div>
            </div>
          </div>

          <Link to="/pricing">
            <Button variant={planTier === 'PREMIUM' ? 'secondary' : 'gold'} size="sm">
              <Crown className="w-4 h-4 mr-1 text-amber-400" />
              <span>{isPaid ? 'Manage Plan' : 'Upgrade (₹99/mo)'}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics & Quotas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 1. Placement Readiness Index */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Placement Readiness</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-extrabold text-white font-heading">{readinessScore}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${readinessScore}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
            Calculated across Aptitude, DSA solving, ATS resume, and mock interview performance.
          </p>
        </Card>

        {/* 2. Mock Interview Minutes */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Mock Interview Time</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-extrabold text-white font-heading">{totalMockMinutes}</span>
              <span className="text-xs text-slate-400">minutes left</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {subscription?.includedMinutesRemaining || 0}m plan quota + {subscription?.purchasedMinutesBalance || 0}m add-on pack balance
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <Link to="/interview" className="text-indigo-400 hover:underline font-semibold flex items-center gap-1">
              Start Interview <ArrowRight className="w-3 h-3" />
            </Link>
            <Link to="/pricing" className="text-slate-400 hover:text-white text-[11px]">
              +Add 60m (₹20)
            </Link>
          </div>
        </Card>

        {/* 3. MCQ Quota Meter */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aptitude & MCQs</span>
              <BrainCircuit className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-extrabold text-white font-heading">{mcqCount}</span>
              <span className="text-xs text-slate-400">
                {mcqLimit > 0 ? `/ ${mcqLimit} solved` : 'solved (Unlimited)'}
              </span>
            </div>
            {mcqLimit > 0 && (
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${mcqPercent}%` }}
                />
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <Link to="/practice" className="text-emerald-400 hover:underline font-semibold flex items-center gap-1">
              Practice MCQs <ArrowRight className="w-3 h-3" />
            </Link>
            {!isPaid && (
              <span className="text-slate-500 text-[10px]">Free Tier</span>
            )}
          </div>
        </Card>

        {/* 4. DSA Coding Problems */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">DSA Coding Arena</span>
              <Code2 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-extrabold text-white font-heading">{dsaCount}</span>
              <span className="text-xs text-slate-400">
                {dsaLimit > 0 ? `/ ${dsaLimit} problems` : 'problems (Unlimited)'}
              </span>
            </div>
            {dsaLimit > 0 && (
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${dsaPercent}%` }}
                />
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <Link to="/coding" className="text-amber-400 hover:underline font-semibold flex items-center gap-1">
              Open Compiler <ArrowRight className="w-3 h-3" />
            </Link>
            {!isPaid && (
              <span className="text-slate-500 text-[10px]">Free Tier</span>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Launchpad Navigation */}
      <div>
        <h2 className="text-lg font-bold text-white font-heading mb-4">Preparation Launchpad</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Practice Hub */}
          <Link to="/practice">
            <Card hoverable className="h-full flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base mb-1">Aptitude & Subject MCQs</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Quantitative Aptitude, Logical Reasoning, Verbal, plus core CS topics (DBMS, OS, Computer Networks) with step-by-step KaTeX solutions.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-purple-400">
                <span>Start Practice</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          {/* Card 2: Coding Arena */}
          <Link to="/coding">
            <Card hoverable className="h-full flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Code2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base mb-1">DSA Coding Arena</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time Monaco code editor with multi-language execution in C++, Java, Python, and JavaScript against public and hidden test cases.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-emerald-400">
                <span>Enter Arena</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          {/* Card 3: AI Mock Interview */}
          <Link to="/interview">
            <Card hoverable className="h-full flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base mb-1">AI Mock Interview & Voice Test</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Speak directly with an AI Technical or HR interviewer via Gemini Live. Get dynamic follow-up questions, speech transcripts, and scores.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-indigo-400">
                <span>Launch Interview</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Free Plan Upgrade Callout */}
      {!isPaid && (
        <Card className="bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-base font-heading">
                Upgrade to Basic for ₹99/month (or ₹999/year)
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              Unlock unlimited MCQs, unlimited DSA submissions, 300 minutes/month of Gemini Live mock interviews, and free entry to regular contests.
            </p>
          </div>
          <Link to="/pricing" className="shrink-0 w-full sm:w-auto">
            <Button variant="gold" size="md" className="w-full sm:w-auto">
              View Upgrade Options
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
