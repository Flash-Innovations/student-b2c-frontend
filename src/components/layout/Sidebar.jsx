import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Code2,
  BookOpen,
  Terminal,
  Trophy,
  Mic,
  FileText,
  Award,
  Crown,
  ShoppingBag,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users2,
  User,
  Lock,
  MessageSquare,
  ShieldCheck
} from "lucide-react";
import { Avatar } from "../common/Avatar";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";
import { b2cApi } from "../../services/b2cApi";
import PhaseTeaserModal from "../common/PhaseTeaserModal";
import BetaFeedbackModal from "../common/BetaFeedbackModal";

export function Sidebar({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout, subscription, isTechnical } = useAuth();
  const navigate = useNavigate();

  const [betaConfig, setBetaConfig] = useState(null);
  const [teaserFeature, setTeaserFeature] = useState('ROADMAP');
  const [isTeaserOpen, setIsTeaserOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    b2cApi.getBetaConfig()
      .then((res) => {
        if (res && res.success) {
          setBetaConfig(res);
        }
      })
      .catch(() => {});
  }, []);

  const allNavLinks = [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    {
      to: "/roadmap",
      label: "AI Roadmap",
      icon: Sparkles,
      featureKey: "ROADMAP",
      releaseBadge: "Dec 1"
    },
    { to: "/practice", label: isTechnical ? "Practice Hub" : "Aptitude Practice", icon: isTechnical ? Code2 : BookOpen },
    { to: "/coding", label: "Coding Arena", icon: Terminal, technicalOnly: true },
    {
      to: "/gd",
      label: "GD Arena",
      icon: Users2,
      nonTechnicalOnly: true,
      featureKey: "GD",
      releaseBadge: "Dec 16"
    },
    { to: "/contests", label: "Assessments", icon: Trophy },
    {
      to: "/interview",
      label: "AI Mock Interview",
      icon: Mic,
      featureKey: "INTERVIEW",
      releaseBadge: "Dec 16"
    },
    { to: "/profile", label: "Candidate Profile", icon: User },
    {
      to: "/store",
      label: "Flash Store",
      icon: ShoppingBag,
      featureKey: "STORE",
      releaseBadge: "Jan 1"
    }
  ];

  const navLinks = allNavLinks.filter((link) => {
    if (link.technicalOnly && !isTechnical) return false;
    if (link.nonTechnicalOnly && isTechnical) return false;
    return true;
  });

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
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 ease-in-out select-none",
          isCollapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-100">
          <div
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2.5 cursor-pointer overflow-hidden"
          >
            {isCollapsed ? (
              <img
                src="/branding/flash-logo-compact.png"
                alt="FLASH"
                className="w-9 h-9 object-contain shrink-0 mx-auto"
              />
            ) : (
              <div className="flex items-center gap-2.5">
                <img
                  src="/branding/flash-logo-compact.png"
                  alt="FLASH"
                  className="w-9 h-9 object-contain shrink-0"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-black tracking-tight text-slate-900 leading-tight">
                      FLASH
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                      BETA
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider font-mono">
                    Student Portal
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto no-scrollbar">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Student Career Hub
            </div>
          )}

          {navLinks.map((link) => {
            const Icon = link.icon;
            const locked = isFeatureLocked(link);

            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={(e) => handleNavClick(e, link)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative cursor-pointer",
                    locked
                      ? "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                      : isActive
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon
                        className={cn(
                          "w-5 h-5 shrink-0 transition-colors",
                          locked
                            ? "text-slate-400"
                            : isActive
                            ? "text-blue-600"
                            : "text-slate-500 group-hover:text-slate-800"
                        )}
                      />
                      {locked && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full flex items-center justify-center">
                          <Lock className="w-1.5 h-1.5 text-white" />
                        </div>
                      )}
                    </div>

                    {!isCollapsed && (
                      <span className="truncate flex-1">{link.label}</span>
                    )}

                    {!isCollapsed && locked && link.releaseBadge && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                        {link.releaseBadge}
                      </span>
                    )}

                    {/* Collapsed Tooltip */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap flex items-center gap-1.5">
                        {link.label}
                        {locked && (
                          <span className="text-[10px] text-amber-300 font-mono">
                            ({link.releaseBadge})
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Beta Status & Feedback Pill */}
        {!isCollapsed && (
          <div className="px-3 pb-2">
            <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-indigo-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  {user?.isBetaTester
                    ? `Beta Tester #${user?.betaClaimNumber || 1}`
                    : "Closed Beta"}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">
                  {user?.betaCohort || "PHASE 1"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                250 MCQs Quota • Unlimited Free Coding
              </p>
              <button
                onClick={() => setIsFeedbackOpen(true)}
                className="w-full py-1 px-2 rounded-lg bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-colors text-[11px] font-medium flex items-center justify-center gap-1 shadow-xs"
              >
                <MessageSquare className="w-3 h-3" />
                Report Bug / Feedback
              </button>
            </div>
          </div>
        )}

        {/* Student User Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div
            onClick={() => navigate("/profile")}
            className={cn(
              "flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer",
              !isCollapsed && "hover:bg-white"
            )}
            title="View candidate profile"
          >
            <Avatar
              src={user?.avatar || user?.profileImageUrl}
              name={user?.name || "Student"}
              size="sm"
              className="border border-slate-200 shrink-0"
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || "Student Candidate"}
                </p>
                <p className="text-[11px] text-slate-400 capitalize truncate">
                  {user?.graduationYear ? `Batch ${user.graduationYear} • Candidate` : "Student Candidate"}
                </p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Option B Teaser Modal */}
      <PhaseTeaserModal
        isOpen={isTeaserOpen}
        onClose={() => setIsTeaserOpen(false)}
        featureKey={teaserFeature}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
      />

      {/* Beta Feedback Modal */}
      <BetaFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </>
  );
}

export default Sidebar;
