import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Settings, Mail, Shield, IndianRupee,
  LucideIcon, ArrowRight, MoreHorizontal, ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

interface CardItem {
  label: string;
  sub: string;
  href: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
}

const MORE_ITEMS: CardItem[] = [
  {
    label: 'Settings',
    sub: 'Site configuration & branding',
    href: '/admin/settings',
    icon: Settings,
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.12)',
    border: 'rgba(148,163,184,0.40)',
  },
  {
    label: 'Email Templates',
    sub: 'Welcome, notifications & alerts',
    href: '/admin/email-templates',
    icon: Mail,
    color: '#60a5fa',
    bg: 'rgba(37,99,235,0.15)',
    border: 'rgba(37,99,235,0.40)',
  },
  {
    label: 'Security',
    sub: 'API keys, login history',
    href: '/admin/security',
    icon: Shield,
    color: '#f87171',
    bg: 'rgba(239,68,68,0.15)',
    border: 'rgba(239,68,68,0.40)',
  },
  {
    label: 'Financial',
    sub: 'Revenue, subscriptions & refunds',
    href: '/admin/financial',
    icon: IndianRupee,
    color: '#34d399',
    bg: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.40)',
  },
];

export default async function MorePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || profile.role !== 'super_admin') redirect('/admin?error=unauthorized');

  return (
    <div className="font-sans antialiased min-h-screen pb-28 px-4 pt-6 bg-[var(--color-background)]">
      <div className="max-w-4xl mx-auto">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-8 mt-2">
          <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)] shrink-0 hidden sm:flex">
            <Link href="/admin">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="w-12 h-12 rounded-2xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center flex-shrink-0">
            <MoreHorizontal className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-text)]">
              More
            </h1>
            <p className="text-sm text-[var(--color-muted)] font-medium mt-0.5">
              System configuration &amp; admin tools
            </p>
          </div>
        </div>

        {/* ── Grid of cards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MORE_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex items-center gap-5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {/* Hover border glow */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ boxShadow: `0 0 0 1.5px ${item.border}` }}
              />

              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                style={{ background: item.bg }}
              >
                <item.icon size={26} style={{ color: item.color }} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-black text-lg text-[var(--color-text)] group-hover:text-white transition-colors">
                  {item.label}
                </p>
                <p className="text-sm text-[var(--color-muted)] font-medium mt-0.5">
                  {item.sub}
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight
                size={18}
                className="flex-shrink-0 group-hover:translate-x-1 transition-transform duration-200"
                style={{ color: item.color, opacity: 0.7 }}
              />
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
