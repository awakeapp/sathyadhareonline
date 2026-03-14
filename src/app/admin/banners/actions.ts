'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createBanner(data: { image_url: string; link_url: string; is_active: boolean }) {
  const supabase = await createClient();
  const { error } = await supabase.from('banners').insert({
    image_url: data.image_url,
    link_url: data.link_url || null,
    is_active: data.is_active,
  });
  revalidatePath('/admin/banners');
  revalidatePath('/');
  return { error: error?.message };
}

export async function updateBanner(id: string, data: { image_url: string; link_url: string; is_active: boolean }) {
  const supabase = await createClient();
  const { error } = await supabase.from('banners').update({
    image_url: data.image_url,
    link_url: data.link_url || null,
    is_active: data.is_active,
  }).eq('id', id);
  revalidatePath('/admin/banners');
  revalidatePath('/');
  return { error: error?.message };
}

export async function deleteBanner(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('banners').delete().eq('id', id);
  revalidatePath('/admin/banners');
  revalidatePath('/');
  return { error: error?.message };
}

export async function toggleBanner(id: string, is_active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from('banners').update({ is_active }).eq('id', id);
  revalidatePath('/admin/banners');
  revalidatePath('/');
  return { error: error?.message };
}
