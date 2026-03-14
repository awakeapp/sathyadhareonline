'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitComment(articleId: string, content: string) {
  if (!content.trim()) return { error: 'Comment cannot be empty' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'You must be logged in to comment' };

  const { error } = await supabase
    .from('comments')
    .insert({
      article_id: articleId,
      user_id: user.id,
      content: content.trim(),
      status: 'pending' // Comments usually need moderation
    });

  if (error) {
    console.error('Error submitting comment:', error);
    return { error: 'Failed to submit comment. Please try again.' };
  }

  return { success: true };
}
