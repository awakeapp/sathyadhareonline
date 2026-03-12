'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';

async function verifyStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) throw new Error('Permission Denied');
  
  return { user, supabase };
}

export async function updateCommentStatusAction(id: string, status: string, isSpam: boolean = false) {
  try {
    const { user, supabase } = await verifyStaff();
    const { error } = await supabase
      .from('comments')
      .update({ status, is_spam: isSpam })
      .eq('id', id);

    if (error) throw error;
    await logAuditEvent(user.id, `COMMENT_${status.toUpperCase()}`, { comment_id: id, is_spam: isSpam });
    
    revalidatePath('/admin/comments');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteCommentAction(id: string) {
  try {
    const { user, supabase } = await verifyStaff();
    const { error } = await supabase
      .from('comments')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await logAuditEvent(user.id, 'COMMENT_DELETED', { comment_id: id });
    
    revalidatePath('/admin/comments');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function bulkUpdateCommentsAction(ids: string[], status: string, isSpam: boolean = false) {
  try {
    const { user, supabase } = await verifyStaff();
    const { error } = await supabase
      .from('comments')
      .update({ status, is_spam: isSpam })
      .in('id', ids);

    if (error) throw error;
    await logAuditEvent(user.id, `BULK_COMMENT_${status.toUpperCase()}`, { count: ids.length, is_spam: isSpam });
    
    revalidatePath('/admin/comments');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function bulkDeleteCommentsAction(ids: string[]) {
  try {
    const { user, supabase } = await verifyStaff();
    const { error } = await supabase
      .from('comments')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .in('id', ids);

    if (error) throw error;
    await logAuditEvent(user.id, 'BULK_COMMENT_DELETED', { count: ids.length });
    
    revalidatePath('/admin/comments');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
