import React from "react";
import { Link } from "react-router-dom";
import { Zap, ShieldCheck, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/80 text-slate-600 text-xs py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-100">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <img
                src="/branding/flash-logo-compact.png"
                alt="FLASH"
                className="w-7 h-7 object-contain"
              />
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                FLASH
              </span>
              <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                2028 Cohort
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              AI-powered student career intelligence, MCQs, sandboxed coding arena, and real-time conversational mock interviews.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Preparation Modules</h4>
            <ul className="space-y-2">
              <li><Link to="/practice" className="hover:text-indigo-600 transition-colors">Practice MCQs</Link></li>
              <li><Link to="/coding" className="hover:text-indigo-600 transition-colors">Coding Arena (Judge0)</Link></li>
              <li><Link to="/interview" className="hover:text-indigo-600 transition-colors">AI Mock Interviews</Link></li>
              <li><Link to="/resume" className="hover:text-indigo-600 transition-colors">ATS Resume Optimizer</Link></li>
            </ul>
          </div>

          {/* Platform & Pricing */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/pricing" className="hover:text-indigo-600 transition-colors">Plans & Add-ons</Link></li>
              <li><Link to="/outcomes" className="hover:text-indigo-600 transition-colors">Verified Placement Outcomes</Link></li>
              <li><Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Student Dashboard</Link></li>
              <li><Link to="/login" className="hover:text-indigo-600 transition-colors">Student Sign In</Link></li>
            </ul>
          </div>

          {/* Institutional Trust */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px]">Institutional Trust</h4>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verified Student Telemetry
              </div>
              <p className="leading-snug">
                Anonymized outcome records shared with partner university placement cells with strict candidate consent.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div className="flex items-center gap-2">
            <img
              src="/branding/flash-logo-compact.png"
              alt="FLASH"
              className="w-4 h-4 object-contain"
            />
            <span>© {new Date().getFullYear()} FLASH Platform. Built for engineering placement excellence.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Services Active (:5001, :5050, :5055)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
