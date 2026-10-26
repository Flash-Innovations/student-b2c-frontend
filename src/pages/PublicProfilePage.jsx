import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Star,
  GitFork,
  ExternalLink,
  FolderGit2,
  Layers,
  FileText,
  Code,
  AlertCircle,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Avatar } from "../components/common/Avatar";
import { Button } from "../components/common/Button";
import { b2cApi } from "../services/b2cApi";

function LinkedinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

export function PublicProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    b2cApi.getPublicStudentProfile(username)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.success && res.profile) {
          setProfile(res.profile);
        } else {
          setError(res?.message || "Candidate profile not found or set to private.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || "Candidate profile not found or set to private.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading candidate career profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Portfolio Unavailable</h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {error || `The candidate profile for "/u/${username}" is currently private or does not exist.`}
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
          >
            Go to FLASH Placement Arena <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Header Branding */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <img src="/branding/flash-logo-compact.png" alt="FLASH" className="h-7 w-7 object-contain" />
          <span className="font-black text-sm tracking-tight text-slate-900">FLASH</span>
          <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
            Candidate Portfolio
          </span>
        </div>
        <Link
          to="/register"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Create Your Portfolio →
        </Link>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Card Hero */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                src={profile.avatar}
                name={profile.name || "Candidate"}
                size="2xl"
                variant="rounded"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-md border-2 border-white bg-slate-100"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {profile.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" /> Verified Candidate
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                  {profile.degree || "B.Tech"} • {profile.branch || "Engineering"}
                  {profile.graduationYear && (
                    <span className="text-indigo-600 font-mono font-semibold ml-1">
                      (Class of {profile.graduationYear})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Social & Resume Links */}
            <div className="flex flex-wrap items-center gap-2">
              {profile.github && (
                <a
                  href={`https://github.com/${profile.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                >
                  <GithubIcon className="w-3.5 h-3.5" /> GitHub
                </a>
              )}
              {profile.linkedin && (
                <a
                  href={profile.linkedin.startsWith("http") ? profile.linkedin : `https://${profile.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-colors"
                >
                  <LinkedinIcon className="w-3.5 h-3.5" /> LinkedIn
                </a>
              )}
              {profile.resumeUrl && (
                <a
                  href={profile.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> View Resume
                </a>
              )}
            </div>
          </div>

          {/* Bio / Elevator Pitch */}
          {profile.bio && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-4 border-t border-slate-100">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Verified Technical Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" /> Verified Technical Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Featured Showcase Projects */}
        {profile.projects && profile.projects.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-indigo-600" /> Featured Showcase Projects
            </h2>
            <div className="space-y-3">
              {profile.projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <a
                        href={proj.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-xs sm:text-sm text-slate-900 hover:text-indigo-600 transition-colors truncate flex items-center gap-1"
                      >
                        {proj.name}
                        <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                      </a>
                      {proj.primaryLanguage && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                          {proj.primaryLanguage}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {proj.description || "Showcase project repository."}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono font-medium text-slate-500 shrink-0">
                    <span className="flex items-center gap-1" title="Stars">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {proj.stars || 0}
                    </span>
                    <span className="flex items-center gap-1" title="Forks">
                      <GitFork className="w-3.5 h-3.5 text-slate-400" />
                      {proj.forks || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Competitive Coding Profiles */}
        {profile.codingProfiles && profile.codingProfiles.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-600" /> Competitive Coding & Problem Solving
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.codingProfiles.map((cp, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                        {cp.platform === "LEETCODE" ? "LC" : "CF"}
                      </span>
                      <a
                        href={cp.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-xs text-slate-900 hover:text-indigo-600 flex items-center gap-1"
                      >
                        {cp.username}
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                      </a>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      {cp.platform}
                    </span>
                  </div>

                  {cp.stats && (
                    <div className="pt-2 border-t border-slate-200/60 font-mono text-xs space-y-1.5">
                      {cp.platform === "LEETCODE" && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-sans text-xs">Problems Solved</span>
                            <span className="font-bold text-slate-900">{cp.stats.totalSolved || 0}</span>
                          </div>
                          {cp.stats.ranking && (
                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span>Global Rank</span>
                              <span className="font-semibold text-slate-700">#{Number(cp.stats.ranking).toLocaleString()}</span>
                            </div>
                          )}
                        </>
                      )}
                      {cp.platform === "CODEFORCES" && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 font-sans text-xs">Rating</span>
                            <span className="font-bold text-indigo-600">{cp.stats.rating || 0}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Rank</span>
                            <span className="font-semibold capitalize text-slate-700">{cp.stats.rank || "Unrated"}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-6 text-xs text-slate-400 space-y-1">
          <p>Verified Candidate Career Profile • Powered by FLASH Placement Arena</p>
          <p>© {new Date().getFullYear()} FLASH Innovations. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}

export default PublicProfilePage;
