import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Heart, Shield, Terminal, ArrowUpRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950 mt-auto py-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-bold text-white text-base font-heading">FLASH</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              AI-first placement intelligence and career preparation platform designed specifically for students graduating in 2028.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Ecosystem Online
            </div>
          </div>

          {/* Student Tracks */}
          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3">Preparation Modules</h4>
            <ul className="space-y-2">
              <li><Link to="/practice" className="hover:text-indigo-400 transition-colors">Aptitude & Core CS MCQs</Link></li>
              <li><Link to="/coding" className="hover:text-indigo-400 transition-colors">DSA Coding Arena (Judge0)</Link></li>
              <li><Link to="/interview" className="hover:text-indigo-400 transition-colors">Gemini Live Mock Interviews</Link></li>
              <li><Link to="/resume" className="hover:text-indigo-400 transition-colors">Resume ATS Analyzer</Link></li>
              <li><Link to="/outcomes" className="hover:text-indigo-400 transition-colors">Verified Placement Outcomes</Link></li>
            </ul>
          </div>

          {/* Monetization & Cohort */}
          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3">Community & Plans</h4>
            <ul className="space-y-2">
              <li><Link to="/pricing" className="hover:text-indigo-400 transition-colors">Free Plan (₹0)</Link></li>
              <li><Link to="/pricing" className="hover:text-indigo-400 transition-colors">Basic Plan (₹99/mo)</Link></li>
              <li><Link to="/pricing" className="hover:text-indigo-400 transition-colors">Premium Plan (₹199/mo)</Link></li>
              <li><Link to="/pricing" className="hover:text-indigo-400 transition-colors">₹20 Mock Interview Pack</Link></li>
              <li><span className="text-slate-500">College Coding Clubs Program</span></li>
            </ul>
          </div>

          {/* Future College Partnerships */}
          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] mb-3">Institutional Vision</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              We convert verified student skill mastery and placement outcomes into data-backed college training partnerships.
            </p>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Student Consent Governed</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Flash Innovations. Built for students graduating in 2028.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security & Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
