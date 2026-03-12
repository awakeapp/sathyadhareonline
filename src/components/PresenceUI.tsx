'use client';

import React, { useEffect, useRef } from 'react';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

/* ─── Presence Layout Wrapper ─── */
export function PresenceWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`min-h-screen bg-[var(--color-background)] pb-[120px] ${className}`}
      style={{ paddingTop: 'var(--admin-header-h, 80px)' }}
    >
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
  icon1Node,
  icon2Node,
  icon1Href,
  icon2Href,
  icon1Badge = false,
  icon2Badge = false
}: { 
  title?: string; 
  roleLabel?: string; 
  initials?: string; 
  icon1?: LucideIcon; 
  icon2?: LucideIcon;
  icon1Node?: React.ReactNode;
  icon2Node?: React.ReactNode;
  icon1Href?: string; 
  icon2Href?: string; 
  icon1Badge?: boolean;
  icon2Badge?: boolean;
}) {
  const headerRef = useRef<HTMLDivElement>(null);

  // CRIT-03: Measure real header height (including safe-area) and expose as CSS var
  // so PresenceWrapper can pad content exactly right on all devices / notch sizes.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => {
      document.documentElement.style.setProperty(
        '--admin-header-h',
        `${el.getBoundingClientRect().height}px`
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div 
      ref={headerRef}
      className="fixed top-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[1400px] bg-[var(--color-surface)]/90 backdrop-blur-xl border-b border-[var(--color-border)] shadow-sm flex flex-col justify-end"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
    >
      <div className="flex items-center justify-between h-14 px-4 w-full">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--color-text)]">{title}</h1>
          {roleLabel && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] mt-0.5">{roleLabel}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {(Icon1 || icon1Node) && (
            icon1Href ? (
              <Link href={icon1Href} className="relative transition-transform active:scale-90 flex items-center justify-center min-w-[44px] min-h-[44px]">
                {icon1Node ? icon1Node : Icon1 ? <Icon1 className="w-6 h-6" strokeWidth={1.25} /> : null}
                {icon1Badge && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />}
              </Link>
            ) : (
              <div className="relative flex items-center justify-center min-w-[44px] min-h-[44px]">
                <div className="opacity-50">{icon1Node ? icon1Node : Icon1 ? <Icon1 className="w-6 h-6" strokeWidth={1.25} /> : null}</div>
              </div>
            )
          )}
          {(Icon2 || icon2Node) && (
            icon2Href ? (
              <Link href={icon2Href} className="relative transition-transform active:scale-90 flex items-center justify-center min-w-[44px] min-h-[44px]">
                {icon2Node ? icon2Node : Icon2 ? <Icon2 className="w-6 h-6" strokeWidth={1.25} /> : null}
                {icon2Badge && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />}
              </Link>
            ) : (
              <div className="flex items-center justify-center min-w-[44px] min-h-[44px] opacity-50">
                {icon2Node ? icon2Node : Icon2 ? <Icon2 className="w-6 h-6" strokeWidth={1.25} /> : null}
              </div>
            )
          )}
          {/* LOW-04: contrast-safe initials avatar */}
          <div className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-sm font-bold text-[var(--color-text)] shrink-0">
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
      className={`bg-[var(--color-surface)] rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden ${noPadding ? '' : 'p-5'} ${onClick ? 'cursor-pointer active:scale-[0.98] hover:bg-[var(--color-surface-2)] transition-all' : ''} ${className}`}
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
  color = "#5c4ae4",
  showPercent = false
}: { 
  percent: number; 
  label: string; 
  value: string | number;
  color?: string;
  showPercent?: boolean;
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
            className="text-zinc-200 dark:text-gray-800"
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
          {showPercent && <span className="text-[8px] font-bold text-zinc-500 -mt-0.5">%</span>}
        </div>
      </div>
      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

/* ─── Presence Action Tile (Grid Layout) ─── */
export function PresenceActionTile({ 
  href, 
  icon: Icon, 
  iconNode,
  label, 
  badge,
  className = "" 
}: { 
  href: string; 
  icon?: LucideIcon; 
  iconNode?: React.ReactNode;
  label: string; 
  badge?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-3 p-2 transition-all active:scale-90 group min-h-[50px] min-w-[50px] ${className}`}>
      <div className="relative">
        <div className="w-14 h-14 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] group-hover:bg-[var(--color-primary)] group-hover:border-[var(--color-primary)] group-hover:text-white transition-all duration-300">
          {iconNode ? iconNode : Icon ? <Icon className="w-6 h-6" strokeWidth={1.5} /> : null}
        </div>
        {badge && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 border-2 border-[var(--color-surface)] rounded-full animate-pulse" />
        )}
      </div>
      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] group-hover:text-[var(--color-primary)] text-center whitespace-nowrap transition-colors duration-300">
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
    primary: "bg-[var(--color-primary)] text-white hover:opacity-90",
    outline: "bg-transparent border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-2)]",
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
      <h2 className="text-base sm:text-lg font-bold text-[var(--color-text)]">{title}</h2>
      {action && actionHref && (
        <Link href={actionHref} className="text-sm font-medium text-[var(--color-primary)] hover:underline min-h-[44px] flex items-center">
          {action}
        </Link>
      )}
    </div>
  );
}
