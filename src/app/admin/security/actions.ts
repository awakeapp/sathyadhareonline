'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export async function createApiKeyAction(name: string, permissions: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') {
    return { error: 'Super Admin required' };
  }

  const rawKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
  const prefix = rawKey.substring(0, 8);
  const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      name,
      prefix,
      key_hash: hash,
      permissions,
      created_by: user.id
    })
    .select('id, name, prefix, permissions, created_at, last_used_at')
    .maybeSingle();

  if (error) {
    console.error('Error creating API key:', error);
    return { error: 'Failed to generate API Key' };
  }

  revalidatePath('/admin/security');
  
  return { success: true, rawKey, keyRecord: data };
}

export async function deleteApiKeyAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') {
    return { error: 'Super Admin required' };
  }

  const { error } = await supabase.from('api_keys').delete().eq('id', id);
  if (error) return { error: 'Failed to revoke API key' };

  revalidatePath('/admin/security');
  return { success: true };
}

export async function getLoginHistoryAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') {
    return { error: 'Super Admin required' };
  }

  const { data, error } = await supabase.rpc('get_login_history');
  
  if (error) {
    console.error('Error fetching login history:', error);
    return { error: 'Failed to fetch login history', data: [] };
  }

  return { success: true, data: data || [] };
}
