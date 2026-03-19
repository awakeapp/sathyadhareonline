'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createIntakeAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return { error: 'Permission denied' };
    }

    const title = formData.get('title') as string;
    const external_author_name = formData.get('external_author_name') as string;
    const source_reference = formData.get('source_reference') as string;
    const content = formData.get('content') as string;
    const category_id = formData.get('category_id') as string;
    const admin_notes = formData.get('admin_notes') as string;
    const assigned_to = formData.get('assigned_to') as string;

    // Generate slug from title
    const generateSlug = (t: string) =>
      t.toLowerCase()
       .replace(/[^a-z0-9]+/g, '-')
       .replace(/(^-|-$)+/g, '');

    const baseSlug = generateSlug(title);
    const slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;

    const { error } = await supabase
      .from('articles')
      .insert({
        title,
        slug,
        external_author_name,
        source_reference: source_reference || null,
        content,
        category_id,
        admin_notes: admin_notes || null,
        assigned_to,
        author_type: 'external',
        status: 'draft',
        author_id: user.id // The admin who ingested it
      });

    if (error) {
      console.error('Intake insertion error:', error);
      return { error: error.message };
    }

    revalidatePath('/admin/articles');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to create intake article.' };
  }
}
