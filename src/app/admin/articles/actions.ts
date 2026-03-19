'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';

export async function bulkDeleteArticles(ids: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!['admin', 'super_admin'].includes(profile?.role || '')) return { error: 'Permission denied' };

  const { error } = await supabase
    .from('articles')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .in('id', ids);

  if (error) return { error: error.message };

  await logAuditEvent(user.id, 'BULK_ARTICLES_DELETED', { count: ids.length, ids });
  revalidatePath('/admin/articles');
  revalidatePath('/');
  return { success: true };
}

export async function bulkUpdateStatus(ids: string[], status: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = profile?.role || '';
  
  // STAFF check
  if (!['admin', 'super_admin', 'editor'].includes(role)) {
    return { error: 'Permission denied' };
  }

  // PUBLISH check
  if (status === 'published' && role === 'editor') {
    // also check the granular permission
    const permRow = await supabase
      .from('user_content_permissions')
      .select('can_publish_articles')
      .eq('user_id', user.id)
      .single()
    
    const canPublish = permRow.data?.can_publish_articles ?? false
    
    if (!canPublish) {
      return { error: 'You do not have permission to publish.' }
    }
  }

  const updatePayload: Record<string, unknown> = { status };
  if (status === 'published') updatePayload.published_at = new Date().toISOString();

  const { error } = await supabase
    .from('articles')
    .update(updatePayload)
    .in('id', ids);

  if (error) return { error: error.message };

  await logAuditEvent(user.id, 'BULK_ARTICLES_STATUS', { count: ids.length, ids, new_status: status });
  revalidatePath('/admin/articles');
  revalidatePath('/editor/articles');
  revalidatePath('/');
  return { success: true };
}

export async function setArticleStatusAction(id: string, status: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = profile?.role || '';
  
  // STAFF check
  if (!['admin', 'super_admin', 'editor'].includes(role)) return { error: 'Permission denied' };

  // PUBLISH check
  if (status === 'published' && role === 'editor') {
    // also check the granular permission
    const permRow = await supabase
      .from('user_content_permissions')
      .select('can_publish_articles')
      .eq('user_id', user.id)
      .single()
    
    const canPublish = permRow.data?.can_publish_articles ?? false
    
    if (!canPublish) {
      return { error: 'You do not have permission to publish.' }
    }
  }

  const updatePayload: Record<string, unknown> = { status };
  if (status === 'published') {
    updatePayload.published_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('articles')
    .update(updatePayload)
    .eq('id', id);

  if (error) return { error: error.message };

  await logAuditEvent(user.id, 'ARTICLE_STATUS_CHANGED', { article_id: id, new_status: status });
  revalidatePath('/admin/articles');
  revalidatePath('/editor/articles');
  revalidatePath('/');
  return { success: true };
}

export async function restoreArticleAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!['admin', 'super_admin'].includes(profile?.role || '')) return { error: 'Permission denied' };

  const { error } = await supabase
    .from('articles')
    .update({ is_deleted: false, deleted_at: null })
    .eq('id', id);

  if (error) return { error: error.message };

  await logAuditEvent(user.id, 'ARTICLE_RESTORED', { article_id: id });
  revalidatePath('/admin/articles');
  return { success: true };
}

export async function featureArticleAction(id: string, currentStatus: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!['admin', 'super_admin'].includes(profile?.role || '')) return { error: 'Permission denied' };

  if (currentStatus) {
    await supabase.from('articles').update({ is_featured: false }).eq('id', id);
    await logAuditEvent(user.id, 'ARTICLE_UNFEATURED', { article_id: id });
  } else {
    await supabase.from('articles').update({ is_featured: false }).neq('id', id);
    await supabase.from('articles').update({ is_featured: true }).eq('id', id);
    await logAuditEvent(user.id, 'ARTICLE_FEATURED', { article_id: id });
  }

  revalidatePath('/admin/articles');
  revalidatePath('/');
  return { success: true };
}

export async function deleteArticleAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!['admin', 'super_admin'].includes(profile?.role || '')) return { error: 'Permission denied' };

  const { error } = await supabase
    .from('articles')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };

  await logAuditEvent(user.id, 'ARTICLE_DELETED', { article_id: id });
  revalidatePath('/admin/articles');
  revalidatePath('/');
  return { success: true };
}
