'use client';

import React from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';
import Link from 'next/link';

/* ─── Presence Layout Wrapper ─── */
export function PresenceWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`min-h-screen bg-[#f8f9fe] dark:bg-[#0f0e17] ${className}`}>
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
  onIcon1Click,
  onIcon2Click
}: { 
  title?: string; 
  roleLabel?: string;
  initials?: string;
  icon1?: LucideIcon;
  icon2?: LucideIcon;
  onIcon1Click?: () => void;
  onIcon2Click?: () => void;
}) {
  return (
    <div className="bg-gradient-to-b from-[#5c4ae4] to-[#4534c7] text-white px-6 pt-8 pb-16 rounded-b-[3rem] relative overflow-hidden shadow-2xl shadow-indigo-500/20">
      {/* Decorative blobs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 -left-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif italic tracking-wide" style={{ fontFamily: 'var(--font-baloo-tamma), cursive' }}>{title}</h1>
          {roleLabel && (
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mt-1">{roleLabel}</p>
          )}
        </div>
        <div className="flex items-center gap-5">
          {Icon1 && (
            <button onClick={onIcon1Click} className="relative transition-transform active:scale-90">
              <Icon1 className="w-6 h-6" strokeWidth={1.5} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-[#5442db] rounded-full" />
            </button>
          )}
          {Icon2 && (
            <button onClick={onIcon2Click} className="transition-transform active:scale-90">
              <Icon2 className="w-6 h-6" strokeWidth={1.5} />
            </button>
          )}
          <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-sm font-bold">
            {initials || 'A'}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Presence Card ─── */
export function PresenceCard({ children, className = "", noPadding = false }: { children: React.ReactNode; className?: string; noPadding?: boolean }) {
  return (
    <div className={`bg-white dark:bg-[#1b1929] rounded-[2rem] shadow-sm border border-black/5 dark:border-white/5 overflow-hidden ${noPadding ? '' : 'p-6'} ${className}`}>
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
    <Link href={href} className={`flex flex-col items-center gap-3 p-4 transition-all hover:scale-105 active:scale-95 group ${className}`}>
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-[#f0efff] dark:bg-indigo-500/10 flex items-center justify-center text-[#5c4ae4] dark:text-indigo-400 border border-indigo-500/10 group-hover:bg-[#5c4ae4] group-hover:text-white transition-colors duration-300">
          <Icon className="w-7 h-7" strokeWidth={1.5} />
        </div>
        {badge && (
          <span className="absolute top-0 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-[#1b1929] rounded-full animate-pulse" />
        )}
      </div>
      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors text-center whitespace-nowrap">
        {label}
      </span>
    </Link>
  );
}

/* ─── Presence Button ─── */
export function PresenceButton({ children, onClick, className = "" }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold shadow-lg shadow-rose-500/30 hover:bg-rose-600 transition-all active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}

/* ─── Presence Section Header ─── */
export function PresenceSectionHeader({ title, action, onActionClick }: { title: string; action?: string; onActionClick?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-lg font-black text-[#2d2d2d] dark:text-white">{title}</h2>
      {action && (
        <button onClick={onActionClick} className="text-sm font-bold text-indigo-500 hover:underline">
          {action}
        </button>
      )}
    </div>
  );
}
