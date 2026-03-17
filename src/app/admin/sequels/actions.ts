'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';

async function verifyStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = profile?.role || 'reader';
  if (!['admin', 'super_admin', 'editor'].includes(role)) throw new Error('Permission Denied');
  
  return { user, role, supabase };
}

export async function createSequelAction(data: { title: string, description: string, bannerUrl: string, categoryId?: string, status?: string }) {
  try {
    const { user, role, supabase } = await verifyStaff();
    
    const status = data.status || 'draft';
    if (status === 'published' && role === 'editor') {
       throw new Error('Editors cannot publish sequels. Please save as draft or submit for review.');
    }

    // Auto generate slug
    const slug = data.title.toLowerCase().replace(/[^a-z0-9\u0080-\uFFFF]+/g, '-').replace(/(^-|-$)+/g, '');

    const { error } = await supabase
      .from('sequels')
      .insert({
        title: data.title,
        slug,
        description: data.description,
        banner_image: data.bannerUrl,
        category_id: data.categoryId || null,
        status: status
      });

    if (error) throw error;
    await logAuditEvent(user.id, `SEQUEL_CREATED`, { title: data.title, status });
    
    revalidatePath('/admin/sequels');
    revalidatePath('/sequels');
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { error: error.message };
  }
}

export async function updateSequelAction(id: string, data: { title: string, description: string, bannerUrl: string, categoryId?: string, status?: string }) {
  try {
    const { user, role, supabase } = await verifyStaff();
    
    if (data.status === 'published' && role === 'editor') {
       throw new Error('Editors cannot publish sequels.');
    }

    const { error } = await supabase
      .from('sequels')
      .update({
        title: data.title,
        description: data.description,
        banner_image: data.bannerUrl,
        category_id: data.categoryId || null,
        status: data.status
      })
      .eq('id', id);

    if (error) throw error;
    await logAuditEvent(user.id, `SEQUEL_UPDATED`, { sequel_id: id, status: data.status });
    
    revalidatePath('/admin/sequels');
    revalidatePath('/sequels');
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { error: error.message };
  }
}

export async function deleteSequelAction(id: string) {
  try {
    const { user, role, supabase } = await verifyStaff();
    
    if (role === 'editor') throw new Error('Editors cannot delete sequels.');

    // Soft delete
    const { error } = await supabase
      .from('sequels')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await logAuditEvent(user.id, 'SEQUEL_DELETED', { sequel_id: id });
    
    revalidatePath('/admin/sequels');
    revalidatePath('/sequels');
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { error: error.message };
  }
}

export async function setSequelStatusAction(id: string, status: string) {
  try {
    const { user, role, supabase } = await verifyStaff();
    
    if (status === 'published' && role === 'editor') {
       throw new Error('Editors cannot publish sequels.');
    }

    const { error } = await supabase
      .from('sequels')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
    await logAuditEvent(user.id, `SEQUEL_STATUS_CHANGE`, { sequel_id: id, status });
    
    revalidatePath('/admin/sequels');
    revalidatePath('/sequels');
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { error: error.message };
  }
}

export async function reorderSequelArticlesAction(sequelId: string, articleIds: string[]) {
  try {
    const { supabase } = await verifyStaff();

    // Simple strategy: delete and re-insert in order
    await supabase.from('sequel_articles').delete().eq('sequel_id', sequelId);

    if (articleIds.length > 0) {
      const inserts = articleIds.map((id, index) => ({
        sequel_id: sequelId,
        article_id: id,
        order_index: index,
      }));
      const { error } = await supabase.from('sequel_articles').insert(inserts);
      if (error) throw error;

      // Ensure all re-inserted articles are marked as non-standalone
      await supabase
        .from('articles')
        .update({ is_standalone: false })
        .in('id', articleIds);
    }

    revalidatePath(`/admin/sequels/${sequelId}/edit`);
    revalidatePath('/sequels');
    revalidatePath('/');
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { error: error.message };
  }
}

export async function toggleSequelArticleAction(sequelId: string, articleId: string, attach: boolean) {
  try {
    const { supabase } = await verifyStaff();

    if (attach) {
      // Find max order index
      const { data: current } = await supabase
        .from('sequel_articles')
        .select('order_index')
        .eq('sequel_id', sequelId)
        .order('order_index', { ascending: false })
        .limit(1);
      
      const nextIndex = current && current.length > 0 ? (current[0].order_index + 1) : 0;

      const { error } = await supabase.from('sequel_articles').insert({
        sequel_id: sequelId,
        article_id: articleId,
        order_index: nextIndex
      });
      if (error) throw error;

      // Mark article as non-standalone so it won't appear on home/articles pages
      await supabase
        .from('articles')
        .update({ is_standalone: false })
        .eq('id', articleId);
    } else {
      const { error } = await supabase
        .from('sequel_articles')
        .delete()
        .eq('sequel_id', sequelId)
        .eq('article_id', articleId);
      if (error) throw error;

      // Check if article still belongs to any other sequel
      const { data: remaining } = await supabase
        .from('sequel_articles')
        .select('sequel_id')
        .eq('article_id', articleId)
        .limit(1);

      // If no longer in any sequel, restore it as standalone
      if (!remaining || remaining.length === 0) {
        await supabase
          .from('articles')
          .update({ is_standalone: true })
          .eq('id', articleId);
      }
    }

    revalidatePath(`/admin/sequels/${sequelId}/edit`);
    revalidatePath('/sequels');
    revalidatePath('/');
    return { success: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { error: error.message };
  }
}
