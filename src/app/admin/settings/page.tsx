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
    .maybeSingle();

  // CRIT-05: If no row exists, upsert the default row so saves never silently no-op
  if (!settings) {
    await supabase.from('site_settings').upsert(
      {
        id: 1,
        general: { site_name: 'Sathyadhare', tagline: '', logo_url: '', favicon_url: '', contact_email: '' },
        social_links: { twitter: '', facebook: '', instagram: '', youtube: '' },
        seo: { meta_title: 'Sathyadhare', meta_description: '', og_image: '' },
        integrations: { google_oauth_enabled: false, google_client_id: '', analytics_id: '' },
        features: { comments_enabled: true, guest_submissions_enabled: true, newsletter_enabled: true, registration_enabled: true },
      },
      { onConflict: 'id' }
    );
    if (error) console.error('Error fetching/creating settings:', error);
  }

  const safeSettings = settings || {
    general: { site_name: 'Sathyadhare', tagline: '', logo_url: '', favicon_url: '', contact_email: '' },
    social_links: { twitter: '', facebook: '', instagram: '', youtube: '' },
    seo: { meta_title: 'Sathyadhare', meta_description: '', og_image: '' },
    integrations: { google_oauth_enabled: false, google_client_id: '', analytics_id: '' },
    features: { comments_enabled: true, guest_submissions_enabled: true, newsletter_enabled: true, registration_enabled: true },
  };


  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Super Admin"
        roleLabel="System Architecture · Global Config"
        initials={initials}
        icon1={Bell}
        icon2={ChevronLeft}
        icon2Href="/admin"
      />
      
      <div className="p-4 flex flex-col gap-4 relative z-20">
        <SettingsClient initialSettings={safeSettings} />
      </div>
    </PresenceWrapper>
  );
}
