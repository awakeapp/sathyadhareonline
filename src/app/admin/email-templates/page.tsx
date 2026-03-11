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
    .single();

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
        title="Presence"
        roleLabel="Delivery Protocol · SMTP Routing"
        initials={initials}
        icon1={Bell}
        icon2={ChevronLeft}
        onIcon2Click={() => window.location.href = '/admin'}
      />
      
      <div className="px-5 -mt-8 pb-10 space-y-6 relative z-20">
        <EmailTemplatesClient initialTemplates={templates || []} />
      </div>
    </PresenceWrapper>
  );
}
