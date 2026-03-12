'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';

export async function refundTransactionAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') return { error: 'Forbidden' };

  const id = formData.get('id') as string;
  
  // Real Stripe logic:
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  // await stripe.refunds.create({ payment_intent: tx.stripe_payment_intent_id });

  // Update mock local DB
  const { error } = await supabase.from('transactions')
    .update({ 
      status: 'refunded', 
      type: 'refund', 
      refunded_at: new Date().toISOString() 
    })
    .eq('id', id);

  if (error) return { error: error.message };

  await logAuditEvent(user.id, 'TRANSACTION_REFUNDED', { transaction_id: id });

  revalidatePath('/admin/financial/revenue');
  return { success: true };
}

export async function exportTransactionsCSV() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') return { error: 'Forbidden' };

  const { data: txs, error } = await supabase
    .from('transactions')
    .select('*, profiles(email), subscription_plans(name)')
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };

  const header = ['Transaction ID', 'User Email', 'Plan Name', 'Amount', 'Currency', 'Status', 'Type', 'Date'];
  const rows = (txs || []).map(t => {
    const email = (t.profiles as { email?: string } | null)?.email || 'Unknown';
    const plan = (t.subscription_plans as { name?: string } | null)?.name || 'Unknown Plan';
    return [
      t.id,
      email,
      `"${plan}"`,
      t.amount,
      t.currency,
      t.status,
      t.type,
      new Date(t.created_at).toISOString()
    ];
  });

  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  return { csv, filename: `transactions_${new Date().toISOString().slice(0, 10)}.csv` };
}
