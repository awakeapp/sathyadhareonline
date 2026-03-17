'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────────── */

/** A single bottom-nav tab. */
export interface DashNavItem {
  href: string;
  label: string;
  icon: string;

  /**
   * If true, use exact path match for active detection.
   * Default: prefix match on `href`.
   */
  exact?: boolean;

  /**
   * Additional URL prefixes that trigger the active state.
   * Useful when a tab covers multiple route subtrees
   * (e.g. Write is active on both /articles/new and /articles/:id/edit).
   * When provided, `href` prefix-match is **replaced** by this list.
   */
  matchPrefixes?: string[];

  /**
   * URL prefixes that should NOT trigger the active state, even if
   * a `matchPrefixes` or `href` prefix rule would otherwise match.
   * Evaluated after positive rules.
   */
  excludePrefixes?: string[];
}

interface Props {
  items: DashNavItem[];
  /** Optional stable accent color. Falls back to --color-primary. */
  accentColor?: string;
}

/** Compute whether a nav item is active for the current pathname. */
function isItemActive(item: DashNavItem, pathname: string): boolean {
  let active: boolean;

  if (item.exact) {
    active = pathname === item.href;
  } else if (item.matchPrefixes && item.matchPrefixes.length > 0) {
    active = item.matchPrefixes.some(p => pathname.startsWith(p));
  } else {
    active = pathname.startsWith(item.href);
  }

  // Apply exclusions
  if (active && item.excludePrefixes && item.excludePrefixes.length > 0) {
    if (item.excludePrefixes.some(p => pathname.startsWith(p))) {
      active = false;
    }
  }

  return active;
}

/* ══════════════════════════════════════════════════════════════════════
   DashboardBottomNav
   — Mobile-first fixed bottom navigation bar shared across admin roles.
   — Accepts `items` so each role can supply its own tabs.
   — Supports matchPrefixes / excludePrefixes for complex active logic.
══════════════════════════════════════════════════════════════════════ */
export default function DashboardBottomNav({ items, accentColor = 'var(--color-primary)' }: Props) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-t border-[var(--color-border)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Dashboard bottom navigation"
    >
      <div className="flex items-center h-[60px] w-full max-w-[500px] mx-auto px-1">
        {items.map(item => (
          <DashNavTab
            key={item.href}
            item={item}
            active={isItemActive(item, pathname)}
            accentColor={accentColor}
          />
        ))}
      </div>
    </nav>
  );
}

/* ── Single nav tab ─────────────────────────────────────────────────── */
function DashNavTab({
  item,
  active,
  accentColor,
}: {
  item: DashNavItem;
  active: boolean;
  accentColor: string;
}) {
  const { href, label, icon: iconName } = item;
  
  // Resolve icon component from string
  const Icon = (Icons as any)[iconName] || Icons.HelpCircle;

  return (
    <Link
      href={href}
      prefetch={true}
      onClick={() => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('transition_type', 'slide-up');
          if (navigator?.vibrate) navigator.vibrate(40);
        }
      }}
      className="relative flex-1 flex flex-col items-center justify-center gap-1 transition-none active:opacity-70 select-none tap-highlight-none focus:outline-none"
      style={{ color: active ? accentColor : 'var(--color-muted)' }}
      aria-current={active ? 'page' : undefined}
    >
      {/* Icon */}
      <Icon
        size={24}
        strokeWidth={active ? 2.25 : 1.75}
        aria-hidden="true"
      />

      {/* Label */}
      <span
        className="text-[10px] tracking-tight leading-none"
        style={{ fontWeight: active ? 700 : 500 }}
      >
        {label}
      </span>

      {/* Active indicator dot */}
      {active && (
        <span
          className="absolute top-1.5 w-1 h-1 rounded-full"
          style={{ background: accentColor }}
          aria-hidden="true"
        />
      )}
    </Link>
  );
}
