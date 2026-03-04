'use server';

import { createClient } from '@/lib/supabase/server';

type SubscribeResult =
  | { status: 'success' }
  | { status: 'exists' }
  | { status: 'error'; message: string };

export async function subscribeAction(formData: FormData): Promise<SubscribeResult> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  if (!email) return { status: 'error', message: 'Email is required.' };

  const supabase = await createClient();

  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email });

  if (!error) return { status: 'success' };

  // Postgres unique-violation code
  if (error.code === '23505') return { status: 'exists' };

  console.error('Subscribe error:', error);
  return { status: 'error', message: 'Something went wrong. Please try again.' };
}
