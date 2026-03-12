'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createPlanAction(name: string, price: number, interval: string, features: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') return { error: 'Super Admin required' };

  const { error } = await supabase
    .from('subscription_plans')
    .insert({ name, price, interval, features, is_active: true });

  if (error) {
    console.error('Create plan error:', error);
    return { error: 'Failed to create subscription plan' };
  }

  revalidatePath('/admin/financial/plans');
  return { success: true };
}

export async function updatePlanAction(id: string, updates: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') return { error: 'Super Admin required' };

  const { error } = await supabase
    .from('subscription_plans')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Update plan error:', error);
    return { error: 'Failed to update plan' };
  }

  revalidatePath('/admin/financial/plans');
  return { success: true };
}

export async function deletePlanAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') return { error: 'Super Admin required' };

  // Instead of deleting, we deactivate it so historical transactions retain relations
  const { error } = await supabase
    .from('subscription_plans')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: 'Failed to delete plan' };

  revalidatePath('/admin/financial/plans');
  return { success: true };
}

export async function refundTransactionAction(transactionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') return { error: 'Super Admin required' };

  const { error } = await supabase
    .from('transactions')
    .update({ 
      status: 'refunded', 
      type: 'refund',
      refunded_at: new Date().toISOString() 
    })
    .eq('id', transactionId);

  if (error) {
    console.error('Refund error:', error);
    return { error: 'Failed to process refund' };
  }

  // Ideally integrate with Stripe here: e.g. await stripe.refunds.create({ payment_intent: stripe_payment_intent_id })
  
  revalidatePath('/admin/financial/revenue');
  return { success: true };
}
