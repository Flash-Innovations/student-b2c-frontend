import React from "react";
import { Crown, Sparkles, Zap } from "lucide-react";
import { cn } from "../../utils/cn";

export function Badge({ children, variant = "neutral", size = "md", className = "" }) {
  const variantStyles = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200/80",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
    warning: "bg-amber-50 text-amber-700 border-amber-200/70",
    danger: "bg-rose-50 text-rose-700 border-rose-200/70",
    primary: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
    purple: "bg-purple-50 text-purple-700 border-purple-200/70",
    blue: "bg-sky-50 text-sky-700 border-sky-200/70",
    outline: "bg-white text-slate-700 border-slate-200"
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] font-medium leading-none",
    md: "px-2.5 py-1 text-xs font-medium leading-none",
    lg: "px-3 py-1.5 text-xs font-semibold leading-none"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border transition-colors select-none",
        variantStyles[variant] || variantStyles.neutral,
        sizeStyles[size] || sizeStyles.md,
        className
      )}
    >
      {children}
    </span>
  );
}

export function PlanBadge({ tier = "FREE", size = "md", className = "" }) {
  const normalized = String(tier || "FREE").toUpperCase();

  if (normalized === "PREMIUM") {
    return (
      <Badge variant="purple" size={size} className={cn("gap-1 font-semibold", className)}>
        <Crown className="w-3.5 h-3.5 text-purple-600" /> Premium
      </Badge>
    );
  }

  if (normalized === "BASIC") {
    return (
      <Badge variant="primary" size={size} className={cn("gap-1 font-semibold", className)}>
        <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Basic
      </Badge>
    );
  }

  return (
    <Badge variant="neutral" size={size} className={cn("gap-1 font-semibold text-slate-600", className)}>
      <Zap className="w-3.5 h-3.5 text-slate-400" /> Free Tier
    </Badge>
  );
}

export default Badge;
