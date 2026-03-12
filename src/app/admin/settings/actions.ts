'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';

export async function updateSettingsAction(payload: {
  general: Record<string, unknown>;
  social_links: Record<string, unknown>;
  seo: Record<string, unknown>;
  integrations: Record<string, unknown>;
  features: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'super_admin') {
    return { error: 'Permission Denied: Super Admin access required' };
  }

  const { error } = await supabase
    .from('site_settings')
    .upsert(
      {
        id: 1,
        general: payload.general,
        social_links: payload.social_links,
        seo: payload.seo,
        integrations: payload.integrations,
        features: payload.features,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (error) {
    console.error('Settings update error:', error);
    return { error: 'Failed to save settings to database' };
  }

  await logAuditEvent(user.id, 'SETTINGS_UPDATED', { payload_keys: Object.keys(payload) });
  
  // Revalidate entire site layouts that might be consuming these globally
  revalidatePath('/', 'layout');
  
  return { success: true };
}
