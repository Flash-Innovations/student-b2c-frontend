import React from "react";
import { Crown, Sparkles, Zap } from "lucide-react";
import { cn } from "../../utils/cn";

export function Badge({ children, variant = "neutral", size = "md", className = "" }) {
  const variantStyles = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    primary: "bg-indigo-50 text-indigo-700 border-indigo-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    blue: "bg-sky-50 text-sky-700 border-sky-200",
    outline: "bg-white text-slate-700 border-slate-300"
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
    lg: "px-3 py-1.5 text-sm font-semibold"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-colors",
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
      <Badge variant="purple" size={size} className={cn("gap-1 font-bold", className)}>
        <Crown className="w-3.5 h-3.5 text-purple-600" /> Premium
      </Badge>
    );
  }

  if (normalized === "BASIC") {
    return (
      <Badge variant="primary" size={size} className={cn("gap-1 font-bold", className)}>
        <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Basic
      </Badge>
    );
  }

  return (
    <Badge variant="neutral" size={size} className={cn("gap-1 font-bold", className)}>
      <Zap className="w-3.5 h-3.5 text-slate-500" /> Free Tier
    </Badge>
  );
}

export default Badge;
