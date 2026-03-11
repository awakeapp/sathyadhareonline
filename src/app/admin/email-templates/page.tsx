import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ChevronLeft } from 'lucide-react';
import EmailTemplatesClient from './EmailTemplatesClient';

export const dynamic = 'force-dynamic';

export default async function EmailTemplatesPage() {
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
  const { data: templates, error } = await supabase
    .from('email_templates')
    .select('id, name, subject, body, updated_at')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching email templates:', error);
  }

  return (
    <div className="font-sans antialiased max-w-6xl mx-auto py-2 px-4 pb-24">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-8 mt-4">
        <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)] shrink-0 hover:text-white transition-colors">
          <Link href="/admin">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight leading-tight">System Delivery Protocol</h1>
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
            SMTP Payload Routing Configuration
          </p>
        </div>
      </div>

      <EmailTemplatesClient initialTemplates={templates || []} />
    </div>
  );
}
