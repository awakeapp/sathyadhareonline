import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ChevronLeft } from 'lucide-react';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();

  // ── Auth guard ───────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'super_admin') {
    redirect('/admin?error=unauthorized');
  }

  // ── Data Fetching ────────────────────────────────────────────────────────
  // We expect ID 1 to be the single source of truth as defined in migration
  const { data: settings, error } = await supabase
    .from('site_settings')
    .select('general, social_links, seo, integrations, features')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('Error fetching global settings:', error);
  }

  // Fallback defaults if table is empty or misconfigured
  const safeSettings = settings || {
    general: {},
    social_links: {},
    seo: {},
    integrations: {},
    features: {}
  };

  return (
    <div className="font-sans antialiased max-w-6xl mx-auto py-2 px-4 pb-24">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-8 mt-4">
        <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)] shrink-0">
          <Link href="/admin">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight leading-tight">System Configuration</h1>
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
            Global state parameters and integrations
          </p>
        </div>
      </div>

      <SettingsClient initialSettings={safeSettings} />
    </div>
  );
}
