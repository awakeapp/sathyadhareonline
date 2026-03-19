'use server';

import { createClient } from '@/lib/supabase/server';

export async function updateArticleStatus(articleId: string, newStatus: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authorized' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { error: 'Profile not found' };
  }

  if (profile.role === 'editor' && newStatus === 'published') {
    return { error: 'Editors cannot publish' };
  }

  const { error: updateError } = await supabase
    .from('articles')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', articleId);

  if (updateError) {
    return { error: updateError.message };
  }

  await supabase.from('audit_logs').insert({
    action: 'ARTICLE_STATUS_CHANGED',
    details: { articleId, newStatus },
    user_id: user.id
  });

  return { success: true };
}

export async function assignArticle(articleId: string, assignToUserId: string, notes: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authorized' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role === 'editor') {
    return { error: 'Not authorized' };
  }

  const { error: updateError } = await supabase
    .from('articles')
    .update({ 
      assigned_to: assignToUserId,
      assigned_at: new Date().toISOString(),
      assignment_notes: notes
    })
    .eq('id', articleId);

  if (updateError) {
    return { error: updateError.message };
  }

  await supabase.from('audit_logs').insert({
    action: 'CONTENT_ASSIGNED',
    details: { articleId, assignToUserId },
    user_id: user.id
  });

  return { success: true };
}

export async function deleteArticle(articleId: string, hard: boolean = false) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authorized' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (hard && profile.role !== 'super_admin')) {
    return { error: 'Not authorized' };
  }

  if (hard) {
    const { error: deleteError } = await supabase
      .from('articles')
      .delete()
      .eq('id', articleId);

    if (deleteError) {
      return { error: deleteError.message };
    }
  } else {
    const { error: updateError } = await supabase
      .from('articles')
      .update({ 
        status: 'deleted',
        deleted_at: new Date().toISOString()
      })
      .eq('id', articleId);

    if (updateError) {
      return { error: updateError.message };
    }
  }

  await supabase.from('audit_logs').insert({
    action: hard ? 'ARTICLE_HARD_DELETED' : 'ARTICLE_DELETED',
    details: { articleId },
    user_id: user.id
  });

  return { success: true };
}

export async function restoreArticle(articleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authorized' };
  }

  const { error: updateError } = await supabase
    .from('articles')
    .update({ 
      status: 'draft',
      deleted_at: null
    })
    .eq('id', articleId);

  if (updateError) {
    return { error: updateError.message };
  }

  await supabase.from('audit_logs').insert({
    action: 'ARTICLE_RESTORED',
    details: { articleId },
    user_id: user.id
  });

  return { success: true };
}
