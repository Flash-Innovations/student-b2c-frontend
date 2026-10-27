import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Menu,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Sparkles,
  Zap,
  Crown
} from "lucide-react";
import { Avatar } from "../common/Avatar";
import { useAuth } from "../../context/AuthContext";
import { PlanBadge } from "../common/Badge";
import { Button } from "../common/Button";
import { cn } from "../../utils/cn";

export function TopNavbar({ onMenuClick }) {
  const { user, logout, subscription, planTier } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left items: Mobile hamburger & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand logo */}
        <div
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 cursor-pointer select-none shrink-0"
          title="FLASH Student Arena"
        >
          <img
            src="/branding/flash-logo-compact.png"
            alt="FLASH"
            className="h-8 w-8 object-contain sm:hidden"
          />
          <img
            src="/branding/flash-logo-horizontal.png"
            alt="FLASH"
            className="h-7 w-auto max-w-[140px] sm:max-w-[160px] object-contain hidden sm:block"
          />
        </div>
      </div>

      {/* Right items: Plan Badge, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Plan Tier Badge */}
        <PlanBadge tier={planTier} size="sm" />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer select-none"
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
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name || "Student"}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email || "student@flash.edu"}</p>
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
                  to="/dashboard"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <Zap className="w-3.5 h-3.5 text-slate-400" />
                  Dashboard
                </Link>
                <Link
                  to="/pricing"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <Crown className="w-3.5 h-3.5 text-slate-400" />
                  Subscription & Invoices
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                    navigate("/login");
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopNavbar;
