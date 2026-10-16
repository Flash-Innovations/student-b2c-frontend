import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  ArrowRight,
  Code2,
  BrainCircuit,
  Sparkles,
  FileCheck2,
  CheckCircle2,
  Award,
  ShieldCheck,
  TrendingUp,
  Clock,
  Play,
  Terminal,
  ChevronRight,
  Crown,
  Building,
  Check,
  Star
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge, PlanBadge } from '../components/common/Badge';

export function LandingPage() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('MONTHLY');

  const plans = [
    {
      id: 'FREE',
      name: 'Free Plan',
      price: '₹0',
      period: 'forever',
      description: 'Essential placement starter kit for self-paced students.',
      features: [
        '100 overall MCQs (Aptitude & Core CS)',
        '50 DSA Coding Problems with Judge0 compiler',
        'Basic ATS resume scanner preview',
        'Placement readiness score tracking',
        'Contests access (Pay per contest: ₹50/₹100)'
      ],
      highlight: false,
      cta: 'Start Free Today',
      variant: 'secondary'
    },
    {
      id: 'BASIC',
      name: 'Basic Plan',
      price: billingCycle === 'YEARLY' ? '₹999' : '₹99',
      period: billingCycle === 'YEARLY' ? '/year + GST' : '/month + GST',
      discountNote: billingCycle === 'YEARLY' ? 'Save ~15% on Annual Plan' : null,
      description: 'Complete coding and MCQ preparation with monthly AI mock interviews.',
      features: [
        'Unlimited MCQs (Quant, Logical, Verbal, CS)',
        'Unlimited DSA coding practice in 4 languages',
        '300 Minutes / month AI Mock Interviews (5 hours)',
        'Question-based voice tests',
        'Free entry to all regular campus placement contests',
        'Continuous performance streak telemetry'
      ],
      highlight: true,
      popularBadge: 'Most Popular for 2028 Batch',
      cta: 'Upgrade to Basic',
      variant: 'primary'
    },
    {
      id: 'PREMIUM',
      name: 'Premium Plan',
      price: billingCycle === 'YEARLY' ? '₹1,999' : '₹199',
      period: billingCycle === 'YEARLY' ? '/year + GST' : '/month + GST',
      discountNote: billingCycle === 'YEARLY' ? 'Save ~16% on Annual Plan' : null,
      description: 'Maximum mock interview reps and company-specific target problem sets.',
      features: [
        'All Basic Plan benefits included',
        '1,000 Minutes / month AI Mock Interviews (16.6 hours)',
        'All Contests included (Zero entry fee on Premium)',
        'Company-Specific Practice Sets (DSA, Dev, MCQ for FAANG/MNCs)',
        'Comprehensive ATS Resume optimization audit',
        'Verified placement certificate & recruiter spotlight'
      ],
      highlight: false,
      cta: 'Get Complete Access',
      variant: 'gold'
    }
  ];

  const variableAddons = [
    {
      title: 'AI Mock Interview Pack',
      price: '₹20',
      unit: 'per hour (60 mins)',
      description: 'Need extra mock interview reps before a campus drive? Add 60 minutes of real-time Gemini voice simulation anytime.',
      badge: '₹20 / 60 Mins'
    },
    {
      title: 'Standard Contest Entry',
      price: '₹50',
      unit: 'per contest',
      description: 'Compete in timed campus placement contests with real-time Judge0 leaderboards. (Included free with Basic & Premium).',
      badge: '₹50 Pass'
    },
    {
      title: 'Premium Contest Entry',
      price: '₹50 – ₹100',
      unit: 'per contest',
      description: 'Exclusive sponsored and prize-pool placement contests. ₹100 for Free users, 50% off (₹50) for Basic users, Free on Premium.',
      badge: 'Specialized Pass'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-28 overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-blue-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Batch 2028 Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-indigo-500/30 text-xs font-semibold text-indigo-300 mb-8 animate-in fade-in slide-in-from-top-4 duration-500 shadow-lg shadow-indigo-950/40">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span>Targeting Students Graduating in 2028</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">B2C Career Intelligence</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl mx-auto font-heading">
            Crack Technical & HR Placements with <span className="gradient-text">Real-Time AI</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Flash gives engineering students full-stack preparation: Aptitude MCQs, sandboxed DSA coding, voice-powered AI technical interviews, and ATS resume scoring.
          </p>

          {/* Hero CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" variant="primary" className="w-full sm:w-auto shadow-indigo-600/40">
                <span>Start Preparing for Free (₹0)</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <span>View Plans & Add-ons</span>
              </Button>
            </Link>
          </div>

          {/* Hero Social Proof Metrics */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-10 border-t border-slate-800/80">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-heading">2,500+</div>
              <div className="text-xs text-slate-400 mt-1">Curated MCQs & DSA Problems</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400 font-heading">Gemini Live</div>
              <div className="text-xs text-slate-400 mt-1">Real-Time Voice Interviews</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-heading">Sub-Second</div>
              <div className="text-xs text-slate-400 mt-1">Judge0 Code Execution</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-heading">Batch of 2028</div>
              <div className="text-xs text-slate-400 mt-1">Cohort Benchmark Telemetry</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-20 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="indigo" className="mb-3">5 Core Preparation Pillars</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading tracking-tight">
              Everything Needed to Stand Out in 2028 Placements
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Zero fluff. Practice on the exact compilers, questions, and conversational speech models used in modern campus recruitment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Resume ATS */}
            <Card hoverable className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">Resume Optimization (ATS)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scan your PDF resume against tech recruitment parsers. Automatically extract technical competencies, calculate ATS compliance (0–100), and receive actionable suggestions.
              </p>
            </Card>

            {/* 2. MCQ Preparation */}
            <Card hoverable className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">Aptitude & Subject MCQs</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Drill through Quantitative, Logical, Verbal, and core CS fundamentals (DBMS, OS, Computer Networks) with timed test sets and instant KaTeX step-by-step explanations.
              </p>
            </Card>

            {/* 3. Coding Arena */}
            <Card hoverable className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">DSA Coding Arena</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Integrated Monaco code editor supporting Python, C++, Java, and JavaScript. Powered by the Judge0 sandbox runtime with public test runs and hidden grading test cases.
              </p>
            </Card>

            {/* 4. AI Mock Interview */}
            <Card hoverable className="space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white">
                  <Sparkles className="w-6 h-6" />
                </div>
                <Badge variant="gold">Realtime Voice via Gemini Live</Badge>
              </div>
              <h3 className="text-lg font-bold text-white font-heading">AI Technical & HR Mock Interviews</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Experience real conversational voice testing. Speak directly into your microphone—the AI interviewer dynamically listens, evaluates technical depth, asks intelligent follow-up questions, and delivers an objective performance scorecard with transcripts.
              </p>
            </Card>

            {/* 5. Voice Tests & Outcome Registry */}
            <Card hoverable className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-heading">Verified Placement Outcomes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log verified placement and internship offers. With student consent, verified cohort data powers future institution-sponsored partnerships.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section (Matching Handwritten Notes) */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="gold" className="mb-3">Transparent Student Pricing</Badge>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-heading tracking-tight">
              Invest in Your Career for Less Than a Cup of Chai
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Start on Free (₹0) and upgrade anytime. All paid plans include generous AI mock interview time.
            </p>

            {/* Monthly / Yearly Toggle */}
            <div className="mt-8 inline-flex items-center p-1 rounded-xl glass-panel border border-slate-700">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  billingCycle === 'MONTHLY' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('YEARLY')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'YEARLY' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Annual Billing</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Save 15-16%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                  p.highlight
                    ? 'glass-panel border-indigo-500/60 shadow-2xl shadow-indigo-600/20 ring-2 ring-indigo-500/40 -translate-y-2'
                    : 'glass-panel border-slate-800 hover:border-slate-700'
                }`}
              >
                {p.popularBadge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-lg">
                    {p.popularBadge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white font-heading">{p.name}</h3>
                    <PlanBadge tier={p.id} />
                  </div>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">{p.description}</p>

                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-4xl font-extrabold text-white font-heading">{p.price}</span>
                    <span className="text-xs text-slate-400">{p.period}</span>
                  </div>

                  {p.discountNote && (
                    <p className="text-[11px] text-emerald-400 font-semibold mb-6 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{p.discountNote}</span>
                    </p>
                  )}

                  <div className="pt-6 border-t border-slate-800/80 space-y-3 mb-8">
                    {p.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link to="/pricing">
                  <Button variant={p.variant} className="w-full">
                    {p.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* Variable Paid Packs Section (Handwritten note add-ons) */}
          <div className="mt-20 max-w-5xl mx-auto pt-16 border-t border-slate-800">
            <div className="text-center mb-8">
              <Badge variant="purple" className="mb-2">Variable Paid Packs</Badge>
              <h3 className="text-2xl font-bold text-white font-heading">Flexible Pay-As-You-Go Add-ons</h3>
              <p className="text-xs text-slate-400 mt-1">Need top-up minutes or contest tickets without changing your plan?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {variableAddons.map((addon, i) => (
                <Card key={i} className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-white text-sm">{addon.title}</h4>
                      <Badge variant="indigo">{addon.badge}</Badge>
                    </div>
                    <div className="text-2xl font-extrabold text-white font-heading mb-1">{addon.price}</div>
                    <div className="text-[11px] text-slate-400 mb-3">{addon.unit}</div>
                    <p className="text-xs text-slate-300 leading-relaxed mb-6">{addon.description}</p>
                  </div>
                  <Link to="/pricing">
                    <Button variant="outline" size="sm" className="w-full">
                      Purchase Add-on
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Institutional College Partnerships CTA */}
      <section className="py-20 bg-gradient-to-b from-slate-900/60 to-slate-950 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Building className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Representing a College or Coding Club?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto mt-2 leading-relaxed">
            Flash partners with student coding clubs and university placement cells. Host inter-college coding contests, track batch of 2028 readiness, and sponsor institutional licenses.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link to="/register">
              <Button variant="secondary" size="md">
                Register Your Student Account
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="md">
                View Institutional Add-ons
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
