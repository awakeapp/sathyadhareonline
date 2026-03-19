import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
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

  const { data: settings } = await supabase
    .from('site_settings')
    .select('general, social_links, seo, integrations, features, maintenance_mode, maintenance_whitelist')
    .eq('id', 1)
    .maybeSingle();

  // If no row exists, upsert the default row so saves never silently no-op
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
  }

  const safeSettings = settings || {
    general: { site_name: 'Sathyadhare', tagline: '', logo_url: '', favicon_url: '', contact_email: '' },
    social_links: { twitter: '', facebook: '', instagram: '', youtube: '' },
    seo: { meta_title: 'Sathyadhare', meta_description: '', og_image: '' },
    integrations: { google_oauth_enabled: false, google_client_id: '', analytics_id: '' },
    features: { comments_enabled: true, guest_submissions_enabled: true, newsletter_enabled: true, registration_enabled: true },
    maintenance_mode: false,
    maintenance_whitelist: '',
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="pt-2">
        <h1 className="text-[22px] font-bold text-[var(--color-text)] tracking-tight">System Settings</h1>
        <p className="text-[13px] text-[var(--color-muted)] mt-1">Configure platform identity, features, and integrations</p>
      </div>
      
      <div className="w-full">
        <SettingsClient initialSettings={safeSettings} />
      </div>
    </div>
  );
}
