'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createBook(data: { title: string; author_name: string; cover_image: string; drive_link: string; is_active: boolean }) {
  const supabase = await createClient();
  const { error } = await supabase.from('books').insert({
    title: data.title,
    author_name: data.author_name || null,
    cover_image: data.cover_image,
    drive_link: data.drive_link,
    is_active: data.is_active,
  });
  revalidatePath('/admin/books');
  revalidatePath('/');
  return { error: error?.message };
}

export async function updateBook(id: string, data: { title: string; author_name: string; cover_image: string; drive_link: string; is_active: boolean }) {
  const supabase = await createClient();
  const { error } = await supabase.from('books').update({
    title: data.title,
    author_name: data.author_name || null,
    cover_image: data.cover_image,
    drive_link: data.drive_link,
    is_active: data.is_active,
  }).eq('id', id);
  revalidatePath('/admin/books');
  revalidatePath('/');
  return { error: error?.message };
}

export async function deleteBook(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('books').delete().eq('id', id);
  revalidatePath('/admin/books');
  revalidatePath('/');
  return { error: error?.message };
}

export async function toggleBook(id: string, is_active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from('books').update({ is_active }).eq('id', id);
  revalidatePath('/admin/books');
  revalidatePath('/');
  return { error: error?.message };
}
