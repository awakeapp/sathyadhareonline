import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function verifyStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = profile?.role || 'reader';
  
  if (!['admin', 'super_admin', 'editor'].includes(role)) throw new Error('Permission Denied');
  
  return { user, role, supabase };
}

export async function createBook(data: { title: string; author_name: string; cover_image: string; drive_link?: string; is_active: boolean; status?: string }) {
  try {
    const { user, role, supabase } = await verifyStaff();
    
    // PUBLISH check
    const status = data.status || 'draft';
    if (status === 'published' && role === 'editor') {
      throw new Error('Editors cannot publish books directly.');
    }

    const { error } = await supabase.from('books').insert({
      title: data.title,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      author_name: data.author_name || null,
      author_id: user.id,
      cover_image: data.cover_image,
      status: status,
      is_active: data.is_active,
    });
    
    if (error) throw error;
    
    revalidatePath('/admin/library');
    revalidatePath('/library');
    revalidatePath('/');
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { error: error.message };
  }
}

export async function updateBook(id: string, data: { title: string; author_name: string; cover_image: string; drive_link?: string; is_active: boolean; status?: string }) {
  try {
    const { role, supabase } = await verifyStaff();

    // PUBLISH check
    if (data.status === 'published' && role === 'editor') {
       throw new Error('Editors cannot publish books.');
    }

    const { error } = await supabase.from('books').update({
      title: data.title,
      author_name: data.author_name || null,
      cover_image: data.cover_image,
      status: data.status,
      is_active: data.is_active,
    }).eq('id', id);

    if (error) throw error;

    revalidatePath('/admin/library');
    revalidatePath('/library');
    revalidatePath('/');
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { error: error.message };
  }
}

export async function deleteBook(id: string) {
  try {
    const { role, supabase } = await verifyStaff();
    
    // Only admins can delete
    if (role === 'editor') throw new Error('Editors cannot delete books.');

    const { error } = await supabase.from('books').delete().eq('id', id);
    if (error) throw error;

    revalidatePath('/admin/library');
    revalidatePath('/library');
    revalidatePath('/');
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { error: error.message };
  }
}

export async function toggleBook(id: string, is_active: boolean) {
  try {
    const { supabase } = await verifyStaff();
    const { error } = await supabase.from('books').update({ is_active }).eq('id', id);
    if (error) throw error;
    
    revalidatePath('/admin/library');
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { error: error.message };
  }
}

// ── Chapter Actions ──

export async function createChapter(book_id: string, data: { title: string, content: string, status?: string }) {
  try {
    const { supabase } = await verifyStaff();

    // Get max order_index
    const { data: chapters } = await supabase
      .from('chapters')
      .select('order_index')
      .eq('book_id', book_id)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrder = chapters && chapters.length > 0 ? chapters[0].order_index + 1 : 0;
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const { error } = await supabase.from('chapters').insert({
      book_id,
      title: data.title,
      slug,
      content: data.content,
      order_index: nextOrder,
      status: data.status || 'draft'
    });

    if (error) throw error;
    revalidatePath(`/admin/library/${book_id}/chapters`);
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { error: error.message };
  }
}

export async function updateChapter(id: string, data: { title: string, content: string, status?: string }) {
  try {
    const { supabase } = await verifyStaff();
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const { data: ch } = await supabase.from('chapters').select('book_id').eq('id', id).single();

    const { error } = await supabase.from('chapters').update({
      title: data.title,
      slug,
      content: data.content,
      status: data.status,
      updated_at: new Date().toISOString()
    }).eq('id', id);

    if (error) throw error;
    if (ch) revalidatePath(`/admin/library/${ch.book_id}/chapters`);
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { error: error.message };
  }
}

export async function deleteChapter(id: string) {
  try {
    const { supabase } = await verifyStaff();
    const { data: ch } = await supabase.from('chapters').select('book_id').eq('id', id).single();
    
    const { error } = await supabase.from('chapters').delete().eq('id', id);
    if (error) throw error;

    if (ch) revalidatePath(`/admin/library/${ch.book_id}/chapters`);
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { error: error.message };
  }
}

export async function reorderChapters(book_id: string, chapterIds: string[]) {
  try {
    const { supabase } = await verifyStaff();

    const updates = chapterIds.map((id, index) => 
      supabase.from('chapters').update({ order_index: index }).eq('id', id)
    );

    await Promise.all(updates);
    revalidatePath(`/admin/library/${book_id}/chapters`);
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { error: error.message };
  }
}

export async function setBookStatusAction(id: string, status: string) {
  try {
    const { role, supabase } = await verifyStaff();
    
    if (status === 'published' && role === 'editor') {
       throw new Error('Editors cannot publish books.');
    }

    const { error } = await supabase.from('books').update({ status }).eq('id', id);
    if (error) throw error;
    
    revalidatePath('/admin/library');
    revalidatePath('/library');
    revalidatePath('/');
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { error: error.message };
  }
}

