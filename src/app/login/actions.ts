'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { getRedirectPath } from '@/lib/auth/redirectAfterLogin';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const returnTo = formData.get('returnTo') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();
  const headerList = await headers();
  
  // Capture security metrics
  const ip = headerList.get('x-forwarded-for')?.split(',')[0] || 'Unknown';
  const agent = headerList.get('user-agent') || 'Unknown Agent';

  const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError || !data.user) {
    return { error: signInError?.message || 'Login failed.' };
  }

  // Update profile with security data
  try {
    const { logAuditEvent } = await import('@/lib/audit');
    await supabase
      .from('profiles')
      .update({ 
        last_sign_in_ip: ip, 
        last_sign_in_agent: agent,
        last_sign_in_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', data.user.id);
      
    await logAuditEvent(data.user.id, 'LOGIN_PASSWORD');
  } catch (e) {
    console.error('Security update failed after password login:', e);
  }

  const destination = await getRedirectPath(supabase, data.user.id, returnTo || undefined);
  return { success: true, destination };
}
