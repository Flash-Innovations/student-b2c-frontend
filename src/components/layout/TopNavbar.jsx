import React, { useState, useRef, useEffect, useMemo } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Terminal,
  Users2,
  Trophy,
  Mic,
  FileText,
  Flame,
  Zap,
  User,
  Crown,
  ShoppingBag,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Lock,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Code2
} from "lucide-react";
import { Avatar } from "../common/Avatar";
import { PlanBadge } from "../common/Badge";
import { useAuth } from "../../context/AuthContext";
import { practiceApi } from "../../services/practiceApi";
import { b2cApi } from "../../services/b2cApi";
import { calculateXp } from "../../utils/xpCalculator";
import { cn } from "../../utils/cn";
import PhaseTeaserModal from "../common/PhaseTeaserModal";
import BetaFeedbackModal from "../common/BetaFeedbackModal";

export function TopNavbar() {
  const { user, logout, subscription, planTier, isTechnical } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [streakDays, setStreakDays] = useState(0);
  const [streakData, setStreakData] = useState({ streak: 0, currentStreak: 0, streakBreaks: 0 });
  const [betaConfig, setBetaConfig] = useState(null);
  const [teaserFeature, setTeaserFeature] = useState('ROADMAP');
  const [isTeaserOpen, setIsTeaserOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch real telemetry: streak
  useEffect(() => {
    let isMounted = true;
    practiceApi.getStreak()
      .then((data) => {
        if (isMounted && data) {
          setStreakData(data);
          const current = data.currentStreak ?? data.streak ?? 0;
          setStreakDays(current);
        }
      })
      .catch(() => {});

    b2cApi.getBetaConfig()
      .then((res) => {
        if (isMounted && res && res.success) {
          setBetaConfig(res);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamic real XP calculation
  const practiceXp = useMemo(() => {
    return calculateXp(subscription, streakData).toLocaleString("en-IN");
  }, [subscription, streakData]);

  // Command Deck Navigation Links with Phase Governance
  const allNavLinks = useMemo(() => [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/practice", label: isTechnical ? "Practice Hub" : "Aptitude Practice", icon: isTechnical ? Code2 : BookOpen },
    { to: "/coding", label: "Coding Arena", icon: Terminal, technicalOnly: true },
    { to: "/contests", label: "Assessments", icon: Trophy },
    {
      to: "/roadmap",
      label: "AI Roadmap",
      icon: Sparkles,
      featureKey: "ROADMAP",
      releaseBadge: "Dec 1"
    },
    {
      to: "/interview",
      label: "AI Mock Interview",
      icon: Mic,
      featureKey: "INTERVIEW",
      releaseBadge: "Dec 16"
    },
    {
      to: "/gd",
      label: "GD Arena",
      icon: Users2,
      nonTechnicalOnly: true,
      featureKey: "GD",
      releaseBadge: "Dec 16"
    },
    {
      to: "/store",
      label: "Flash Store",
      icon: ShoppingBag,
      featureKey: "STORE",
      releaseBadge: "Jan 1"
    }
  ], [isTechnical]);

  const navLinks = useMemo(() => {
    return allNavLinks.filter((link) => {
      if (link.technicalOnly && !isTechnical) return false;
      if (link.nonTechnicalOnly && isTechnical) return false;
      return true;
    });
  }, [allNavLinks, isTechnical]);

  const isFeatureLocked = (link) => {
    if (!link.featureKey) return false;
    if (!betaConfig || !betaConfig.featureFlags) {
      if (link.featureKey === "ROADMAP") return true;
      if (link.featureKey === "INTERVIEW") return true;
      if (link.featureKey === "GD") return true;
      if (link.featureKey === "STORE") return true;
      return false;
    }
    const flags = betaConfig.featureFlags;
    if (link.featureKey === "ROADMAP") return !flags.roadmap;
    if (link.featureKey === "INTERVIEW") return !flags.mockInterviews;
    if (link.featureKey === "GD") return !flags.groupDiscussion;
    if (link.featureKey === "STORE") return !flags.storeCheckout;
    return false;
  };

  const handleNavClick = (e, link) => {
    if (isFeatureLocked(link)) {
      e.preventDefault();
      setTeaserFeature(link.featureKey);
      setIsTeaserOpen(true);
      return;
    }
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <img
                src="/branding/flash-logo-compact.png"
                alt="FLASH"
                className="w-8 h-8 object-contain shrink-0"
              />
              <div className="flex flex-col">
                <span className="text-base font-black tracking-tight text-slate-900 leading-tight">
                  FLASH
                </span>
                <span className="text-[9px] font-semibold text-blue-600 uppercase tracking-wider font-mono">
                  Student Portal
                </span>
              </div>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-700 tracking-wide">
              <ShieldCheck className="w-3 h-3 text-indigo-600" />
              Phase 1 Beta
            </span>
          </div>

          {/* Center: Command Deck Desktop Navigation (Smooth Inline Expanding Pills with Hype Locks) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isLocked = isFeatureLocked(link);
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={(e) => handleNavClick(e, link)}
                  title={isLocked ? `${link.label} (Unlocks ${link.releaseBadge})` : link.label}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center h-9 rounded-xl transition-all duration-300 ease-in-out select-none cursor-pointer",
                      isLocked
                        ? "px-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        : isActive
                        ? "px-3 bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-600 shadow-xs"
                        : "px-2.5 hover:px-3 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isLocked ? (
                        <div className="relative shrink-0">
                          <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                          <Lock className="w-2.5 h-2.5 text-amber-600 absolute -bottom-1 -right-1 bg-white rounded-full" />
                        </div>
                      ) : (
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-colors duration-200",
                            isActive ? "text-blue-600" : "text-slate-500 group-hover:text-slate-900"
                          )}
                        />
                      )}
                      <span
                        className={cn(
                          "overflow-hidden whitespace-nowrap text-xs transition-all duration-300 ease-in-out flex items-center gap-1.5",
                          isLocked
                            ? "max-w-0 opacity-0 group-hover:max-w-44 group-hover:opacity-100 group-hover:ml-2 font-medium text-slate-600"
                            : isActive
                            ? "max-w-40 opacity-100 ml-2 font-bold text-blue-700"
                            : "max-w-0 opacity-0 group-hover:max-w-40 group-hover:opacity-100 group-hover:ml-2 font-semibold text-slate-800"
                        )}
                      >
                        <span>{link.label}</span>
                        {isLocked && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200 shrink-0">
                            {link.releaseBadge}
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right: Telemetry Widgets, Feedback & Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Live Streak Badge */}
            <div
              title="Daily Practice Streak"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200"
            >
              <Flame className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              <span>{streakDays}d Streak</span>
            </div>

            {/* Practice XP Badge */}
            <div
              title="Cumulative Practice XP"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200"
            >
              <Zap className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              <span>{practiceXp} XP</span>
            </div>

            {/* Quick Beta Feedback Trigger */}
            <button
              type="button"
              onClick={() => setIsFeedbackOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
              title="Submit Beta Feedback"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Beta Feedback</span>
            </button>

            {/* Plan Tier Badge */}
            <PlanBadge tier={planTier} size="sm" />

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer select-none border border-transparent hover:border-slate-200"
                aria-label="User menu"
              >
                <Avatar
                  src={user?.avatar || user?.profileImageUrl}
                  name={user?.name || "Student"}
                  size="sm"
                  className="border border-slate-200 shrink-0"
                />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user?.name || "Student Candidate"}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {user?.email || "student@flash.edu"}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Candidate Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        setIsFeedbackOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-indigo-700 hover:bg-indigo-50 font-medium"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                      Beta Feedback
                    </button>
                    <Link
                      to="/store"
                      onClick={(e) => {
                        setProfileOpen(false);
                        handleNavClick(e, { featureKey: 'STORE' });
                      }}
                      className="flex items-center justify-between px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                        <span>Flash Store</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                        Jan 1
                      </span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-medium cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation drawer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Navigation Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col z-50 shadow-2xl border-r border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/branding/flash-logo-compact.png"
                  alt="FLASH"
                  className="w-8 h-8 object-contain shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-black tracking-tight text-slate-900 leading-tight">
                    FLASH
                  </span>
                  <span className="text-[9px] font-semibold text-blue-600 uppercase tracking-wider font-mono">
                    Phase 1 Closed Beta
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Telemetry Status */}
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Flame className="w-4 h-4 text-slate-700" />
                <span>{streakDays}d Streak</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Zap className="w-4 h-4 text-slate-700" />
                <span>{practiceXp} XP</span>
              </div>
            </div>

            {/* Mobile NavLinks */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Command Deck
              </div>
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isLocked = isFeatureLocked(link);
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={(e) => handleNavClick(e, link)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        isLocked
                          ? "text-slate-400 hover:bg-slate-50"
                          : isActive
                          ? "bg-blue-50 text-blue-700 font-bold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          {isLocked ? (
                            <div className="relative">
                              <Icon className="w-5 h-5 text-slate-400 shrink-0" />
                              <Lock className="w-2.5 h-2.5 text-amber-500 absolute -bottom-0.5 -right-0.5 bg-white rounded-full" />
                            </div>
                          ) : (
                            <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-blue-600" : "text-slate-400")} />
                          )}
                          <span>{link.label}</span>
                        </div>
                        {isLocked && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                            {link.releaseBadge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}

              <div className="pt-4 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Beta Tester Support
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsFeedbackOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>Submit Beta Feedback</span>
              </button>

              <div className="pt-4 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Account & Membership
              </div>
              <NavLink
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <User className="w-5 h-5 text-slate-400" />
                <span>Candidate Profile</span>
              </NavLink>
            </div>

            {/* Mobile Footer with User & Sign Out */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Avatar
                  src={user?.avatar || user?.profileImageUrl}
                  name={user?.name || "Student"}
                  size="sm"
                  className="border border-slate-200 shrink-0"
                />
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.name || "Student"}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user?.email || "student@flash.edu"}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Teaser Modal for Locked Features */}
      <PhaseTeaserModal
        isOpen={isTeaserOpen}
        onClose={() => setIsTeaserOpen(false)}
        featureKey={teaserFeature}
        onOpenFeedback={() => {
          setIsTeaserOpen(false);
          setIsFeedbackOpen(true);
        }}
      />

      {/* Beta Feedback Modal */}
      <BetaFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </>
  );
}

export default TopNavbar;
