import Link from 'next/link';
import { IndianRupee, Layers, FileOutput, ArrowLeftRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default function FinancialLayout({ children }: { children: React.ReactNode }) {
  const tabs = [
    { name: 'Revenue Reports', href: '/admin/financial/revenue', icon: IndianRupee },
    { name: 'Subscription Plans', href: '/admin/financial/plans', icon: Layers },
  ];

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 bg-[var(--color-background)] font-sans antialiased text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-2 mt-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <IndianRupee className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-tight">Financials & Monetization</h1>
            <p className="text-sm text-[var(--color-muted)] font-medium mt-1">
              Manage subscription tiers, track revenue, and process real-time transaction updates.
            </p>
          </div>
        </div>

        {/* ── Nav Tabs ─────────────────────────────────────────────── */}
        <Card className="rounded-[1.5rem] border-[var(--color-border)] bg-[var(--color-surface)] shadow-none p-2 mb-6 max-w-max">
          <div className="flex gap-2">
            {tabs.map(tab => (
              <Link key={tab.name} href={tab.href}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all text-[var(--color-muted)] hover:text-white hover:bg-white/5 active:bg-white/10">
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </Link>
            ))}
          </div>
        </Card>

        {/* ── Content ────────────────────────────────────────────── */}
        {children}
        
      </div>
    </div>
  );
}
