import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className
}) {
  const base = 'inline-flex items-center font-semibold rounded-full uppercase tracking-wider font-mono';

  const variants = {
    default: 'bg-slate-800 text-slate-300 border border-slate-700',
    indigo: 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/30',
    purple: 'bg-purple-950/80 text-purple-300 border border-purple-500/30',
    emerald: 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30',
    amber: 'bg-amber-950/80 text-amber-300 border border-amber-500/30',
    rose: 'bg-rose-950/80 text-rose-300 border border-rose-500/30',
    gold: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40'
  };

  const sizes = {
    xs: 'text-[10px] px-2 py-0.5',
    sm: 'text-[11px] px-2.5 py-1',
    md: 'text-xs px-3 py-1.5'
  };

  return (
    <span className={twMerge(clsx(base, variants[variant], sizes[size], className))}>
      {children}
    </span>
  );
}

export function PlanBadge({ tier = 'FREE', className }) {
  if (tier === 'PREMIUM') {
    return <Badge variant="gold" className={twMerge(clsx('shadow-sm shadow-amber-500/20', className))}>✨ Premium</Badge>;
  }
  if (tier === 'BASIC') {
    return <Badge variant="indigo" className={className}>⚡ Basic</Badge>;
  }
  return <Badge variant="default" className={className}>Free Plan</Badge>;
}
