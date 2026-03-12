'use server';

import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

export async function updateTemplateAction(id: string, subject: string, body: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') {
    return { error: 'Permission Denied: Super Admin required' };
  }

  const { error } = await supabase
    .from('email_templates')
    .update({
      subject,
      body,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
     console.error('Update template error:', error);
     return { error: 'Failed to update email template' };
  }

  await logAuditEvent(user.id, 'EMAIL_TEMPLATE_UPDATED', { template_id: id });
  revalidatePath('/admin/email-templates');
  
  return { success: true };
}
