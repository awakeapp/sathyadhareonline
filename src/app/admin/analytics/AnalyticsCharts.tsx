'use client';

import { useState } from 'react';

interface DayPoint { date: string; views: number; }
interface CategoryStat { name: string; count: number; }

interface Props {
  days7: DayPoint[];
  days30: DayPoint[];
  categoryStats: CategoryStat[];
}

function SparkChart({ points, color = '#ffe500' }: { points: DayPoint[]; color?: string }) {
  if (points.length === 0) return null;
  const max = Math.max(...points.map(p => p.views), 1);
  const W = 600; const H = 120; const PAD = 10;
  const xs = points.map((_, i) => PAD + (i / Math.max(points.length - 1, 1)) * (W - PAD * 2));
  const ys = points.map(p => H - PAD - (p.views / max) * (H - PAD * 2));

  const linePath = points.map((_, i) => `${i === 0 ? 'M' : 'L'} ${xs[i]} ${ys[i]}`).join(' ');
  const areaPath = `${linePath} L ${xs[xs.length - 1]} ${H - PAD} L ${xs[0]} ${H - PAD} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28" preserveAspectRatio="none">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(t => (
        <line key={t} x1={PAD} x2={W - PAD} y1={H - PAD - t * (H - PAD * 2)} y2={H - PAD - t * (H - PAD * 2)}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {/* Area fill */}
      <path d={areaPath} fill="url(#grad)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={xs[i]} cy={ys[i]} r="4" fill={color} stroke="#181623" strokeWidth="2">
          <title>{p.date}: {p.views} views</title>
        </circle>
      ))}
    </svg>
  );
}

export default function AnalyticsCharts({ days7, days30, categoryStats }: Props) {
  const [range, setRange] = useState<'7' | '30'>('7');
  const points = range === '7' ? days7 : days30;
  const totalViews = points.reduce((s, p) => s + p.views, 0);
  const maxCat = Math.max(...categoryStats.map(c => c.count), 1);

  const rangeLabel = range === '7' ? 'Last 7 Days' : 'Last 30 Days';

  return (
    <div className="space-y-6">
      {/* ── Views Chart ──────────────────────────────────────────── */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 shadow-lg">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-widest font-semibold">Article Views</p>
            <p className="text-3xl font-extrabold text-white mt-1 tabular-nums">{totalViews.toLocaleString()}</p>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">{rangeLabel}</p>
          </div>
          {/* Range picker */}
          <div className="flex gap-1 bg-black/20 p-1 rounded-xl border border-[var(--color-border)]">
            {(['7', '30'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  range === r
                    ? 'bg-[var(--color-primary)] text-black shadow'
                    : 'text-[var(--color-muted)] hover:text-white'
                }`}>
                {r}d
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        {points.length === 0 ? (
          <div className="h-28 flex items-center justify-center text-[var(--color-muted)] text-sm">
            No view data yet for this period.
          </div>
        ) : (
          <SparkChart points={points} />
        )}

        {/* X-axis labels */}
        <div className="flex justify-between mt-1 px-1">
          {points.filter((_, i) => {
            // Show at most 7 labels
            const step = Math.ceil(points.length / 7);
            return i % step === 0 || i === points.length - 1;
          }).map(p => (
            <span key={p.date} className="text-[9px] text-[var(--color-muted)] font-mono">
              {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          ))}
        </div>
      </div>

      {/* ── Category Breakdown ───────────────────────────────────── */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 shadow-lg">
        <p className="text-xs text-[var(--color-muted)] uppercase tracking-widest font-semibold mb-4">Articles by Category</p>
        {categoryStats.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] py-4 text-center">No categories with articles yet.</p>
        ) : (
          <div className="space-y-3">
            {categoryStats.map((cat, i) => {
              const pct = Math.round((cat.count / maxCat) * 100);
              const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-rose-500', 'bg-amber-500'];
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white">{cat.name}</span>
                    <span className="text-xs font-bold text-[var(--color-muted)] tabular-nums">
                      {cat.count} article{cat.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[i % colors.length]} rounded-full transition-all duration-700`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
