'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';

export type ManageActionType = 'archive' | 'delete' | 'assign';

/**
 * Universal Content Management Action
 * Handles archiving, deleting, and assigning across different content tables
 */
export async function manageContentAction(
  id: string,
  type: 'article' | 'sequel' | 'book' | 'friday' | 'banner' | 'category' | 'podcast' | 'banner_video',
  action: ManageActionType,
  payload?: any
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Permission check
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = profile?.role || 'reader';
  if (!['admin', 'super_admin', 'editor'].includes(role)) return { error: 'Forbidden' };

  // Table mapping
  const tableMap: Record<string, string> = {
    article: 'articles',
    sequel: 'sequels',
    book: 'books',
    friday: 'friday_messages',
    banner: 'banners',
    category: 'categories',
    podcast: 'podcasts',
    banner_video: 'banner_videos'
  };

  const table = tableMap[type];
  if (!table) return { error: 'Invalid content type' };

  try {
    if (action === 'archive') {
      const { error } = await supabase.from(table).update({ status: 'archived' }).eq('id', id);
      if (error) throw error;
      await logAuditEvent(user.id, `CONTENT_ARCHIVED`, { content_id: id, content_type: type });
    } 
    
    else if (action === 'delete') {
      // Super Admin or Admin only for hard delete / soft delete
      if (!['admin', 'super_admin'].includes(role)) return { error: 'Only admins can delete content' };
      
      const { error } = await supabase.from(table).update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      await logAuditEvent(user.id, `CONTENT_DELETED`, { content_id: id, content_type: type });
    }

    else if (action === 'assign') {
      if (!payload?.assigned_to) return { error: 'Assignee missing' };
      
      const { error } = await supabase.from(table).update({ assigned_to: payload.assigned_to }).eq('id', id);
      if (error) throw error;
      await logAuditEvent(user.id, `CONTENT_ASSIGNED`, { content_id: id, content_type: type, assignee_id: payload.assigned_to });
    }

    revalidatePath('/admin/manage');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('manageContentAction error:', err);
    return { error: err.message || 'Operation failed' };
  }
}
