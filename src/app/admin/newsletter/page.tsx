import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, Bell } from 'lucide-react';
import NewsletterClient from './NewsletterClient';
import { 
  PresenceWrapper, 
  PresenceHeader 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

export default async function AdminNewsletterPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard/admin?denied=1');
  }

  const { data: subscribers, error } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, created_at')
    .order('created_at', { ascending: false });

  if (error) console.error('Newsletter fetch error:', error);

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Newsletter" 
        hideActions={true} 
      />
      
      <div className="w-full flex flex-col gap-4 relative z-20 max-w-3xl mx-auto">
        <NewsletterClient subscribers={subscribers ?? []} />
      </div>
    </PresenceWrapper>
  );
}
