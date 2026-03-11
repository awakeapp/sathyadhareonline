'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IndianRupee, Layers, ChevronLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function FinancialLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tabs = [
    { name: 'Revenue Reports', href: '/admin/financial/revenue', icon: IndianRupee },
    { name: 'Subscription Plans', href: '/admin/financial/plans', icon: Layers },
  ];

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 bg-[var(--color-background)] font-sans antialiased text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-2 mt-2">
          <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)] shrink-0">
            <Link href="/admin">
              <ChevronLeft className="w-5 h-5" strokeWidth={1.25} />
            </Link>
          </Button>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <IndianRupee className="w-6 h-6 text-emerald-500" strokeWidth={1.25} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-tight">Financials & Monetization</h1>
            <p className="text-sm text-[var(--color-muted)] font-medium mt-1">
              Manage subscription tiers, track revenue, and process real-time transaction updates.
            </p>
          </div>
        </div>

        {/* ── Nav Tabs ─────────────────────────────────────────────── */}
        <Card className="rounded-[1.5rem] border-[var(--color-border)] bg-[var(--color-surface)] shadow-none p-2 mb-6 w-full max-w-full overflow-x-auto sm:max-w-max scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {tabs.map(tab => {
              const isActive = pathname === tab.href;
              return (
                <Link key={tab.name} href={tab.href}
                  className={`flex items-center whitespace-nowrap gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive 
                    ? 'text-black bg-white shadow-xl' 
                    : 'text-[var(--color-muted)] hover:text-white hover:bg-white/5 shadow-none'
                  }`}>
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </Link>
              );
            })}
          </div>
        </Card>

        {/* ── Content ────────────────────────────────────────────── */}
        {children}
        
      </div>
    </div>
  );
}
