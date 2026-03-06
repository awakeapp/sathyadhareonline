import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();

  // Auth & Guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'super_admin') {
    redirect('/admin');
  }

  // Fetch Settings (id=1)
  let { data: settings } = await supabase.from('site_settings').select('*').eq('id', 1).single();

  // If no settings exist yet (migration not run or failed to insert), provide sensible defaults
  if (!settings) {
    settings = {
      id: 1,
      general: { site_name: 'Sathyadhare', tagline: '', logo_url: '', favicon_url: '', contact_email: '' },
      social_links: { twitter: '', facebook: '', instagram: '', youtube: '' },
      seo: { meta_title: 'Sathyadhare', meta_description: '', og_image: '' },
      integrations: { google_oauth_enabled: false, google_client_id: '', analytics_id: '' },
      features: { comments_enabled: true, guest_submissions_enabled: true, newsletter_enabled: true, registration_enabled: true },
    };
  }

  // Fetch Email Templates
  const { data: templates } = await supabase.from('email_templates').select('*').order('name');

  return (
    <div className="min-h-screen pb-24 bg-[var(--color-background)] font-sans antialiased text-white safe-area-pb">
      <SettingsClient 
        initialSettings={settings} 
        initialTemplates={templates || []} 
        userId={user.id} 
      />
    </div>
  );
}
