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
  LogOut,
  Menu,
  X,
  ChevronDown
} from "lucide-react";
import { Avatar } from "../common/Avatar";
import { PlanBadge } from "../common/Badge";
import { useAuth } from "../../context/AuthContext";
import { practiceApi } from "../../services/practiceApi";
import { cn } from "../../utils/cn";

export function TopNavbar() {
  const { user, logout, subscription, planTier, isTechnical } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [streakDays, setStreakDays] = useState(0);
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
        if (isMounted && data && typeof data.streak === "number") {
          setStreakDays(data.streak);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamic real XP calculation (Option A: Zero Fake Data)
  const mcqAttempted = subscription?.mcqAttemptedCount || 0;
  const dsaAttempted = subscription?.dsaAttemptedCount || 0;
  const practiceXp = useMemo(() => {
    const computed = (mcqAttempted * 10) + (dsaAttempted * 25) + (streakDays * 15);
    return computed.toLocaleString("en-IN");
  }, [mcqAttempted, dsaAttempted, streakDays]);

  // Command Deck Navigation Links
  const navLinks = useMemo(() => {
    const links = [
      { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { to: "/practice", label: "Practice Hub", icon: BookOpen }
    ];

    if (isTechnical) {
      links.push({ to: "/coding", label: "Coding Arena", icon: Terminal });
    } else {
      links.push({ to: "/gd", label: "GD Arena", icon: Users2 });
    }

    links.push(
      { to: "/contests", label: "Assessments", icon: Trophy },
      { to: "/interview", label: "AI Mock Interview", icon: Mic },
      { to: "/resume", label: "ATS Resume", icon: FileText }
    );

    return links;
  }, [isTechnical]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
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
          </div>

          {/* Center: Command Deck Desktop Navigation (Smooth Inline Expanding Pills) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  title={link.label}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center h-9 rounded-xl transition-all duration-300 ease-in-out select-none cursor-pointer",
                      isActive
                        ? "px-3 bg-blue-50 text-blue-700 font-bold border-b-2 border-blue-600 shadow-xs"
                        : "px-2.5 hover:px-3 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors duration-200",
                          isActive ? "text-blue-600" : "text-slate-500 group-hover:text-slate-900"
                        )}
                      />
                      <span
                        className={cn(
                          "overflow-hidden whitespace-nowrap text-xs transition-all duration-300 ease-in-out",
                          isActive
                            ? "max-w-40 opacity-100 ml-2 font-bold text-blue-700"
                            : "max-w-0 opacity-0 group-hover:max-w-40 group-hover:opacity-100 group-hover:ml-2 font-semibold text-slate-800"
                        )}
                      >
                        {link.label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right: Telemetry Widgets & Profile Dropdown */}
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
                    <Link
                      to="/pricing"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Crown className="w-3.5 h-3.5 text-slate-400" />
                      Pricing & Subscriptions
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
                    Student Portal
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
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-blue-50 text-blue-700 font-bold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-blue-600" : "text-slate-400")} />
                        <span>{link.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}

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
              <NavLink
                to="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <Crown className="w-5 h-5 text-slate-400" />
                <span>Pricing & Subscriptions</span>
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
    </>
  );
}

export default TopNavbar;
