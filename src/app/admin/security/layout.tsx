import Link from 'next/link';
import { Shield, ShieldAlert, Key } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  const tabs = [
    { name: 'Login History', href: '/admin/security/login-history', icon: Shield },
    { name: 'API Keys', href: '/admin/security/api-keys', icon: Key },
  ];

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 bg-[var(--color-background)] font-sans antialiased text-white">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-tight">Security & Auth</h1>
            <p className="text-sm text-[var(--color-muted)] font-medium mt-1">
              Super Admin security logs and API credential management
            </p>
          </div>
        </div>

        {/* ── Nav Tabs ─────────────────────────────────────────────── */}
        <Card className="rounded-[1.5rem] border-[var(--color-border)] bg-[var(--color-surface)] shadow-none p-2 mb-6">
          <div className="flex gap-2">
            {tabs.map(tab => (
              <Link key={tab.name} href={tab.href}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all text-[var(--color-muted)] hover:text-white hover:bg-white/5">
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
