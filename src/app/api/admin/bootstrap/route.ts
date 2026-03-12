
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 1. Check if any super_admin exists
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'super_admin');

  if (count && count > 0) {
    return NextResponse.json({ error: 'System already has a Super Admin. Use established admin to promote others.' }, { status: 403 });
  }

  // 2. No super_admin? Promote the current user!
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Master Admin',
      role: 'super_admin',
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Bootstrap successful. You are now a Super Admin.',
    profile: data 
  });
}
