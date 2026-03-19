'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function acceptSubmissionAction(submissionId: string, editorId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) return { error: 'Permission denied' };

    // Fetch the submission
    const { data: sub, error: subErr } = await supabase
      .from('guest_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (subErr || !sub) return { error: 'Submission not found' };

    // Generate unique slug
    const baseSlug = (sub.title || 'submission')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now()}`;

    // Insert article
    const { error: articleErr } = await supabase.from('articles').insert({
      title: sub.title || 'Untitled',
      slug,
      content: sub.content || '',
      excerpt: sub.summary || null,
      status: 'draft',
      assigned_to: editorId || null,
      author_id: user.id, // admin who accepted it
      author_type: 'reader',
    });

    if (articleErr) {
      console.error('Article insert error:', articleErr);
      return { error: articleErr.message };
    }

    // Update submission status
    const { error: updateErr } = await supabase
      .from('guest_submissions')
      .update({ status: 'accepted' })
      .eq('id', submissionId);

    if (updateErr) return { error: updateErr.message };

    revalidatePath('/admin/submissions');
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function rejectSubmissionAction(submissionId: string, reason: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) return { error: 'Permission denied' };

    const { error } = await supabase
      .from('guest_submissions')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', submissionId);

    if (error) return { error: error.message };

    revalidatePath('/admin/submissions');
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function archiveSubmissionAction(submissionId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) return { error: 'Permission denied' };

    const { error } = await supabase
      .from('guest_submissions')
      .update({ status: 'archived' })
      .eq('id', submissionId);

    if (error) return { error: error.message };

    revalidatePath('/admin/submissions');
    return { success: true };
  } catch (e: any) {
    return { error: e.message };
  }
}
