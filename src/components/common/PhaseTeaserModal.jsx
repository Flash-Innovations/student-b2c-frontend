import React from 'react';
import { Lock, Sparkles, Calendar, CheckCircle2, X, MessageSquare, ArrowRight } from 'lucide-react';

const FEATURE_CONFIGS = {
  ROADMAP: {
    title: 'Adaptive AI Career Roadmap',
    subtitle: 'Dynamic skill graph calibrated to your target recruiters',
    unlockDate: 'December 1, 2026',
    phaseBadge: 'Phase 2 Beta',
    phaseNumber: 2,
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    borderColor: 'border-amber-500/30',
    iconColor: 'text-amber-400',
    description: 'A personalized placement roadmap that learns from your practice telemetry, adapting question difficulty dynamically using Bayesian Knowledge Tracing.',
    highlights: [
      'Target company blueprints (TCS, Amazon, Infosys, Accenture, Cognizant, Wipro)',
      'Daily 3-quest smart focus queues prioritizing your weakest knowledge nodes',
      '15-minute diagnostic skill baseline assessment'
    ]
  },
  INTERVIEW: {
    title: 'Gemini Live AI Mock Interview',
    subtitle: 'Ultra-low latency conversational placement interviews',
    unlockDate: 'December 16, 2026',
    phaseBadge: 'Phase 3 Beta',
    phaseNumber: 3,
    gradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-purple-400',
    description: 'Real-time conversational voice interviews powered by Gemini Live with continuous speech streaming, code whiteboard walkthroughs, and rubric scoring.',
    highlights: [
      'Live bidirectional voice conversation with sub-second response latency',
      'STAR methodology behavioral feedback & technical architecture probing',
      'Instant post-session diagnostic report with actionable improvement steps'
    ]
  },
  GD: {
    title: 'Real-Time Peer GD Arena',
    subtitle: 'Live collaborative group discussion simulation',
    unlockDate: 'December 16, 2026',
    phaseBadge: 'Phase 3 Beta',
    phaseNumber: 3,
    gradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    description: 'Peer-to-peer discussion arenas with WebRTC media streaming, automated topic prompts, speaking-time share tracking, and moderation tools.',
    highlights: [
      'Multi-peer WebRTC audio mesh rooms with up to 8 candidate seats',
      'Curated contemporary topics spanning technology, economy, and case studies',
      'Real-time speaking duration analytics and non-concurrency enforcement'
    ]
  },
  RESUME: {
    title: 'ATS Resume Optimizer & Parser',
    subtitle: 'Enterprise recruiter screening benchmark',
    unlockDate: 'December 16, 2026',
    phaseBadge: 'Phase 3 Beta',
    phaseNumber: 3,
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    borderColor: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
    description: 'In-depth parsing engine extracting academic qualifications, projects, and domain skills to benchmark against top Tier-1 recruitment filters.',
    highlights: [
      'Instant 0-100 ATS scoring with recruiter keyword density analytics',
      'Action-verb impact analyzer and missing technical competency alerts',
      'One-click synchronization of parsed resume fields with your Flash profile'
    ]
  },
  STORE: {
    title: 'Flash Store & Subscriptions',
    subtitle: 'Full placement suite subscriptions & modular passes',
    unlockDate: 'January 1, 2027',
    phaseBadge: 'Grand Public Launch',
    phaseNumber: 4,
    gradient: 'from-indigo-500/20 via-purple-500/10 to-transparent',
    borderColor: 'border-indigo-500/30',
    iconColor: 'text-indigo-400',
    description: 'Commercial subscription tiers (Standard ₹99/mo, Premium ₹299/mo) and micro-passes (from ₹29) launch live on New Year 2027. Beta testers receive Founding Member discounts.',
    highlights: [
      'Standard Plan (₹99/mo): 1,000 MCQs, 250 DSA, 60m Gemini Mock Interview',
      'Premium Plan (₹299/mo): All 50+ company question banks, 180m Mocks, 3 Live Mentorship sessions',
      'Closed Beta Founding Members receive a permanent 30% renewal discount voucher'
    ]
  }
};

export default function PhaseTeaserModal({ isOpen, onClose, featureKey = 'ROADMAP', onOpenFeedback }) {
  if (!isOpen) return null;

  const feature = FEATURE_CONFIGS[featureKey] || FEATURE_CONFIGS.ROADMAP;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Glow backdrop header */}
        <div className={`p-6 bg-gradient-to-br ${feature.gradient} border-b ${feature.borderColor}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
                <Lock className={`w-5 h-5 ${feature.iconColor}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                    {feature.phaseBadge}
                  </span>
                  <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {feature.unlockDate}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{feature.title}</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            {feature.description}
          </p>

          <div className="space-y-2.5 pt-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Feature Capabilities Coming in This Phase
            </div>
            {feature.highlights.map((highlight, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${feature.iconColor}`} />
                <span>{highlight}</span>
              </div>
            ))}
          </div>

          {/* Beta Cohort Banner */}
          <div className="mt-4 p-3.5 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              <span className="text-white font-medium">Phase 1 Closed Beta Scope:</span>
              <div className="text-slate-400 mt-0.5">250 Practice MCQs, Unlimited Free Coding Hub & Contests active now.</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-3">
          {onOpenFeedback && (
            <button
              onClick={() => {
                onClose();
                onOpenFeedback();
              }}
              className="text-xs text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1.5 px-3 py-2"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Provide Feedback
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition-all shadow-md shadow-indigo-600/20"
          >
            Got It, Back to Practice
          </button>
        </div>
      </div>
    </div>
  );
}

