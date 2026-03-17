import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NewsletterClient from './NewsletterClient';

export const dynamic = 'force-dynamic';

export default async function AdminNewsletterPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/admin?denied=1');
  }

  const { data: subscribers, error } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, created_at')
    .order('created_at', { ascending: false });

  if (error) console.error('Newsletter fetch error:', error);

  return (
    <div className="flex flex-col gap-6">
      <div className="pt-2">
        <h1 className="text-[22px] font-bold text-[var(--color-text)] tracking-tight">Newsletter</h1>
        <p className="text-[13px] text-[var(--color-muted)] mt-1">Manage platform subscribers and broadcast updates</p>
      </div>

      <div className="w-full">
        <NewsletterClient subscribers={subscribers ?? []} />
      </div>
    </div>
  );
}
