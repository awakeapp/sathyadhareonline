'use server';

import { createClient } from '@/lib/supabase/server';

export async function submitComment(articleId: string, content: string) {
  if (!content.trim()) return { error: 'Comment cannot be empty' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be logged in to comment' };

  // Check if profile exists, if not, wait a moment or fail
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();
  if (!profile) return { error: 'User profile not found. Please try logging out and in again.' };

  const { error } = await supabase
    .from('comments')
    .insert({
      article_id: articleId,
      user_id: user.id,
      content: content.trim(),
      status: 'pending',
      is_deleted: false,
      is_spam: false
    });

  if (error) {
    console.error('Error submitting comment:', error);
    return { error: 'Failed to submit comment. Our team is looking into it.' };
  }

  return { success: true };
}
