import React from 'react';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

/* ─── Presence Layout Wrapper ─── */
export function PresenceWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`min-h-screen bg-[var(--color-background)] pt-[88px] pb-[80px] ${className}`}>
      {children}
    </div>
  );
}

/* ─── Presence Header ─── */
export function PresenceHeader({ 
  title = "Presence", 
  roleLabel,
  initials,
  icon1: Icon1,
  icon2: Icon2,
  icon1Href,
  icon2Href
}: { 
  title?: string; 
  roleLabel?: string; 
  initials?: string; 
  icon1?: LucideIcon; 
  icon2?: LucideIcon; 
  icon1Href?: string; 
  icon2Href?: string; 
}) {
  return (
    <div 
      className="fixed top-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-[1400px] bg-[#5c4ae4] text-white p-4 shadow-sm border-b border-indigo-400"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-wide">{title}</h1>
          {roleLabel && (
            <p className="text-xs uppercase opacity-80 mt-1">{roleLabel}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {Icon1 && (
            icon1Href ? (
              <Link href={icon1Href} className="relative transition-transform active:scale-90 flex items-center justify-center min-w-[44px] min-h-[44px]">
                <Icon1 className="w-6 h-6" strokeWidth={1.5} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
              </Link>
            ) : (
              <div className="relative flex items-center justify-center min-w-[44px] min-h-[44px]">
                <Icon1 className="w-6 h-6 opacity-50" strokeWidth={1.5} />
              </div>
            )
          )}
          {Icon2 && (
            icon2Href ? (
              <Link href={icon2Href} className="transition-transform active:scale-90 flex items-center justify-center min-w-[44px] min-h-[44px]">
                <Icon2 className="w-6 h-6" strokeWidth={1.5} />
              </Link>
            ) : (
              <div className="flex items-center justify-center min-w-[44px] min-h-[44px]">
                <Icon2 className="w-6 h-6 opacity-50" strokeWidth={1.5} />
              </div>
            )
          )}
          <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-sm font-bold shrink-0">
            {initials || 'A'}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Presence Card ─── */
export function PresenceCard({ children, className = "", noPadding = false, onClick }: { children: React.ReactNode; className?: string; noPadding?: boolean; onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-[#1b1929] rounded-xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden ${noPadding ? '' : 'p-4'} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-all' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Presence Stat Circle ─── */
export function PresenceStatCircle({ 
  percent, 
  label, 
  value,
  color = "#5c4ae4" 
}: { 
  percent: number; 
  label: string; 
  value: string | number;
  color?: string;
}) {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="w-20 h-20 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="currentColor"
            strokeWidth="5"
            fill="transparent"
            className="text-gray-100 dark:text-gray-800"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={color}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-0.5">
          <span className="text-xl font-bold leading-none">{value}</span>
          {typeof value === 'number' && <span className="text-[8px] font-bold text-gray-400 -mt-0.5">%</span>}
        </div>
      </div>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

/* ─── Presence Action Tile (Grid Layout) ─── */
export function PresenceActionTile({ 
  href, 
  icon: Icon, 
  label, 
  badge,
  className = "" 
}: { 
  href: string; 
  icon: LucideIcon; 
  label: string; 
  badge?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-2 p-2 transition-all active:scale-95 group min-h-[44px] min-w-[44px] ${className}`}>
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-[#f0efff] dark:bg-indigo-500/10 flex items-center justify-center text-[#5c4ae4] dark:text-indigo-400 group-hover:bg-[#5c4ae4] group-hover:text-white transition-colors duration-300">
          <Icon className="w-6 h-6" strokeWidth={1.5} />
        </div>
        {badge && (
          <span className="absolute top-0 -right-1 w-2.5 h-2.5 bg-rose-500 border border-white dark:border-[#1b1929] rounded-full" />
        )}
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-300 text-center whitespace-nowrap">
        {label}
      </span>
    </Link>
  );
}

/* ─── Presence Button ─── */
export function PresenceButton({ 
  children, 
  onClick, 
  disabled, 
  type = "button",
  loading = false,
  variant = "primary",
  className = "" 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean; 
  type?: "button" | "submit" | "reset";
  loading?: boolean;
  variant?: "primary" | "outline" | "destructive";
  className?: string 
}) {
  const variantStyles = {
    primary: "bg-[#5c4ae4] text-white shadow-indigo-500/20 hover:bg-[#4534c7]",
    outline: "bg-white dark:bg-transparent border-2 border-indigo-500/10 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10",
    destructive: "bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600"
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-4 py-2 min-h-[44px] min-w-[44px] rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${variantStyles[variant]} ${className}`}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

/* ─── Presence Section Header ─── */
export function PresenceSectionHeader({ title, action, actionHref }: { title: string; action?: string; actionHref?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
      {action && actionHref && (
        <Link href={actionHref} className="text-sm font-medium text-[#5c4ae4] hover:underline min-h-[44px] flex items-center">
          {action}
        </Link>
      )}
    </div>
  );
}
