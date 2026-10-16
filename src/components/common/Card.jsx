import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Card({
  children,
  className,
  glow = false,
  hoverable = false,
  ...props
}) {
  return (
    <div
      className={twMerge(
        clsx(
          'glass-panel rounded-2xl p-6 transition-all duration-300',
          hoverable && 'glass-panel-hover',
          glow && 'glow-indigo',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={twMerge(clsx('flex items-start justify-between gap-4 mb-5', className))}>
      <div>
        {title && <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>}
        {subtitle && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
