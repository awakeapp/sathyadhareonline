'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';

async function verifySuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') {
    throw new Error('Super Admin access required');
  }
  return user;
}

const TABLE_MAP: Record<string, string> = {
  article: 'articles',
  category: 'categories',
  sequel: 'sequels',
  comment: 'comments',
  media: 'media',
};

export async function restoreItemAction(formData: FormData) {
  try {
    const caller = await verifySuperAdmin();
    const id = formData.get('id') as string;
    const type = formData.get('type') as string;
    const table = TABLE_MAP[type];

    if (!id || !table) throw new Error('Missing ID or invalid type');

    const supabase = await createClient();
    const { error } = await supabase
      .from(table)
      .update({ is_deleted: false, deleted_at: null })
      .eq('id', id);

    if (error) throw error;

    await logAuditEvent(caller.id, `${type.toUpperCase()}_RESTORED`, { id });

    revalidatePath('/admin/trash');
    revalidatePath(`/admin/${type}s`);
    if (type === 'media') revalidatePath('/admin/media');
    return { success: true };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Restore failed' };
  }
}

export async function permanentDeleteAction(formData: FormData) {
  try {
    const caller = await verifySuperAdmin();
    const id = formData.get('id') as string;
    const type = formData.get('type') as string;
    const table = TABLE_MAP[type];

    if (!id || !table) throw new Error('Missing ID or invalid type');

    const supabase = await createClient();

    // Specific cleanup for Articles (cover images) or Media (the file itself)
    if (type === 'article' || type === 'media') {
       const column = type === 'article' ? 'cover_image' : 'url';
       const { data: row } = await supabase.from(table).select(column).eq('id', id).maybeSingle();
       const fileUrl = (row as Record<string, unknown> | null)?.[column] as string | undefined;

       if (fileUrl) {
          // Extract file name/path from URL (assuming storage public URL format)
          const fileName = fileUrl.split('/').pop();
          if (fileName) {
             await supabase.storage.from('article-images').remove([fileName]);
          }
       }
    }

    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;

    await logAuditEvent(caller.id, `${type.toUpperCase()}_PURGED`, { id });

    revalidatePath('/admin/trash');
    if (type === 'media') revalidatePath('/admin/media');
    return { success: true };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Purge failed' };
  }
}
