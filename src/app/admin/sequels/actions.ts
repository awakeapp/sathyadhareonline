'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';

async function verifyStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) throw new Error('Permission Denied');
  
  return { user, supabase };
}

export async function createSequelAction(data: { title: string, description: string, bannerUrl: string }) {
  try {
    const { user, supabase } = await verifyStaff();
    
    // Auto generate slug
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const { error } = await supabase
      .from('sequels')
      .insert({
        title: data.title,
        slug,
        description: data.description,
        banner_image: data.bannerUrl,
        status: 'published' // Auto publish per request pattern or default to published
      });

    if (error) throw error;
    await logAuditEvent(user.id, `SEQUEL_CREATED`, { title: data.title });
    
    revalidatePath('/admin/sequels');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateSequelAction(id: string, data: { title: string, description: string, bannerUrl: string }) {
  try {
    const { user, supabase } = await verifyStaff();
    
    const { error } = await supabase
      .from('sequels')
      .update({
        title: data.title,
        description: data.description,
        banner_image: data.bannerUrl,
      })
      .eq('id', id);

    if (error) throw error;
    await logAuditEvent(user.id, `SEQUEL_UPDATED`, { sequel_id: id });
    
    revalidatePath('/admin/sequels');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteSequelAction(id: string) {
  try {
    const { user, supabase } = await verifyStaff();
    
    // Soft delete
    const { error } = await supabase
      .from('sequels')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await logAuditEvent(user.id, 'SEQUEL_DELETED', { sequel_id: id });
    
    revalidatePath('/admin/sequels');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
