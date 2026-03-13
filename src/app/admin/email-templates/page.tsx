import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, Bell } from 'lucide-react';
import EmailTemplatesClient from './EmailTemplatesClient';
import { 
  PresenceWrapper, 
  PresenceHeader 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

export default async function EmailTemplatesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'super_admin') {
    redirect('/admin?error=unauthorized');
  }

  const { data: templates, error } = await supabase
    .from('email_templates')
    .select('id, name, subject, body, updated_at')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching email templates:', error);
  }

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Email" 
        hideActions={true} 
      />
      
      <div className="p-4 flex flex-col gap-4 relative z-20">
        <EmailTemplatesClient initialTemplates={templates || []} />
      </div>
    </PresenceWrapper>
  );
}
