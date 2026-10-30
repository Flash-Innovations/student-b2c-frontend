import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card } from "./Card";
import { cn } from "../../utils/cn";

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = "bg-slate-100 text-slate-800",
  trend = null,
  onClick,
  className = ""
}) {
  return (
    <Card
      hover={!!onClick}
      onClick={onClick}
      padding="normal"
      className={cn(
        "flex flex-col justify-between relative overflow-hidden p-5 transition-all duration-200 border-slate-200/80 shadow-xs",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 truncate" title={title}>
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <h4
              className={cn(
                "font-bold text-slate-900 tracking-tight",
                typeof value === "string" && value.length > 10
                  ? "text-lg font-bold break-words"
                  : "text-2xl"
              )}
            >
              {value}
            </h4>
          </div>
        </div>
        {Icon && (
          <div className={cn("p-2.5 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
            <Icon className="w-4.5 h-4.5" />
          </div>
        )}
      </div>

      {(trend || subtitle) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {trend ? (
            <div className="flex items-center gap-1.5 font-medium flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold shrink-0",
                  trend.direction === "up" && "bg-emerald-50 text-emerald-700",
                  trend.direction === "down" && "bg-red-50 text-red-700",
                  trend.direction === "neutral" && "bg-slate-100 text-slate-700"
                )}
              >
                {trend.direction === "up" && <ArrowUpRight className="w-3 h-3" />}
                {trend.direction === "down" && <ArrowDownRight className="w-3 h-3" />}
                {trend.direction === "neutral" && <Minus className="w-3 h-3" />}
                {trend.value}
              </span>
              {trend.label && <span className="text-slate-400 truncate">{trend.label}</span>}
            </div>
          ) : (
            <span className="text-slate-500 truncate">{subtitle}</span>
          )}
        </div>
      )}
    </Card>
  );
}

export default StatCard;
