'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addSequelPieceAction(sequelId: string, formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return { error: 'Permission denied' };
    }

    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const author_name = formData.get('author_name') as string;
    const assigned_to = formData.get('assigned_to') as string;
    const notes = formData.get('notes') as string;

    const { error } = await supabase.from('sequel_pieces').insert({
      sequel_id: sequelId,
      title,
      type,
      author_name,
      assigned_to: assigned_to || null,
      notes: notes || null,
      status: 'not_started'
    });

    if (error) return { error: error.message };

    revalidatePath(`/admin/sequels/${sequelId}/plan`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Error saving piece' };
  }
}

export async function updateSequelPieceAction(pieceId: string, sequelId: string, updates: any) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return { error: 'Permission denied' };
    }

    const { error } = await supabase.from('sequel_pieces').update(updates).eq('id', pieceId);
    if (error) return { error: error.message };

    revalidatePath(`/admin/sequels/${sequelId}/plan`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Error updating piece' };
  }
}
