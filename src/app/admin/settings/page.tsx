import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, Bell } from 'lucide-react';
import SettingsClient from './SettingsClient';
import { 
  PresenceWrapper, 
  PresenceHeader 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
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

  const { data: settings, error } = await supabase
    .from('site_settings')
    .select('general, social_links, seo, integrations, features')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('Error fetching global settings:', error);
  }

  const safeSettings = settings || {
    general: {},
    social_links: {},
    seo: {},
    integrations: {},
    features: {}
  };

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Presence"
        roleLabel="System Architecture · Global Config"
        initials={initials}
        icon1={Bell}
        icon2={ChevronLeft}
        icon2Href="/admin"
      />
      
      <div className="px-5 -mt-8 pb-10 space-y-6 relative z-20">
        <SettingsClient initialSettings={safeSettings} />
      </div>
    </PresenceWrapper>
  );
}
