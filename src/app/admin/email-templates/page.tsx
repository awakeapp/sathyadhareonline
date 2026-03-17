import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EmailTemplatesClient from './EmailTemplatesClient';

export const dynamic = 'force-dynamic';

export default async function EmailTemplatesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'super_admin') {
    redirect('/admin?denied=1');
  }

  const { data: templates, error } = await supabase
    .from('email_templates')
    .select('id, name, subject, body, updated_at')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching email templates:', error);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="pt-2">
        <h1 className="text-[22px] font-bold text-[var(--color-text)] tracking-tight">Email Templates</h1>
        <p className="text-[13px] text-[var(--color-muted)] mt-1">Configure automated notifications and transactional emails</p>
      </div>

      <div className="w-full">
        <EmailTemplatesClient initialTemplates={templates || []} />
      </div>
    </div>
  );
}
