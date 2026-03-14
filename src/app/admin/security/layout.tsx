'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, ShieldAlert, Key } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PresenceWrapper } from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tabs = [
    { name: 'Login History', href: '/admin/security/login-history', icon: Shield },
    { name: 'API Keys', href: '/admin/security/api-keys', icon: Key },
  ];

  return (
    <PresenceWrapper>
      <div className="w-full flex flex-col gap-6 relative z-20 max-w-5xl mx-auto">
        
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-rose-500" strokeWidth={1.25} />
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
            {tabs.map(tab => {
              const isActive = pathname === tab.href;
              return (
                <Link key={tab.name} href={tab.href}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive 
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' 
                      : 'text-[var(--color-muted)] hover:text-white hover:bg-white/5'
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
    </PresenceWrapper>
  );
}
