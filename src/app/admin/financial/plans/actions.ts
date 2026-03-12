'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';

export async function savePlanAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') return { error: 'Forbidden' };

  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const price = formData.get('price') as string;
  const interval = formData.get('interval') as string;
  const is_active = formData.get('is_active') === 'true';
  const featuresStr = formData.get('features') as string;
  const features = featuresStr.split('\\n').map(s => s.trim()).filter(Boolean);

  if (!name || !price) return { error: 'Missing fields' };

  if (id) {
    const { error } = await supabase.from('subscription_plans').update({
      name, price: parseFloat(price), interval, is_active, features, updated_at: new Date().toISOString()
    }).eq('id', id);
    if (error) return { error: error.message };
    await logAuditEvent(user.id, 'PLAN_UPDATED', { plan_id: id, name });
  } else {
    const { error } = await supabase.from('subscription_plans').insert({
      name, price: parseFloat(price), interval, is_active, features
    });
    if (error) return { error: error.message };
    await logAuditEvent(user.id, 'PLAN_CREATED', { name });
  }

  revalidatePath('/admin/financial/plans');
  return { success: true };
}

export async function deletePlanAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') return { error: 'Forbidden' };

  const id = formData.get('id') as string;
  const { error } = await supabase.from('subscription_plans').delete().eq('id', id);

  if (error) return { error: error.message };

  await logAuditEvent(user.id, 'PLAN_DELETED', { plan_id: id });
  revalidatePath('/admin/financial/plans');
  return { success: true };
}
