'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';
import { verifyRole } from '@/lib/auth-server';

export async function saveSiteSettingsAction(settings: Record<string, unknown>) {
  const supabase = await createClient();
  let user;
  try {
    const auth = await verifyRole(['super_admin']);
    user = auth.user;
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unauthorized' };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...updatePayload } = settings;

  const { error } = await supabase
    .from('site_settings')
    .update({
      ...updatePayload,
      updated_at: new Date().toISOString()
    })
    .eq('id', 1);

  if (error) {
    if (error.code === 'PGRST116') {
      // If row doesn't exist, insert instead
      const { error: insErr } = await supabase.from('site_settings').insert({ id: 1, ...updatePayload });
      if (insErr) return { error: insErr.message };
    } else {
      return { error: error.message };
    }
  }

  await logAuditEvent(user.id, 'SITE_SETTINGS_UPDATED', { updated_fields: Object.keys(updatePayload) });

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function saveEmailTemplateAction(templateId: string, name: string, subject: string, body: string) {
  const supabase = await createClient();
  let user;
  try {
    const auth = await verifyRole(['super_admin']);
    user = auth.user;
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unauthorized' };
  }

  let error;
  if (templateId) {
    const res = await supabase.from('email_templates').update({ subject, body, updated_at: new Date().toISOString() }).eq('id', templateId);
    error = res.error;
  } else {
    // If we were creating new, which we usually just update standard ones
    const res = await supabase.from('email_templates').insert({ name, subject, body });
    error = res.error;
  }

  if (error) return { error: error.message };

  await logAuditEvent(user.id, 'EMAIL_TEMPLATE_UPDATED', { template_name: name });

  revalidatePath('/admin/settings');
  return { success: true };
}
