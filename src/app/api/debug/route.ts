
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    const { data: profileColumns } = await supabase.rpc('get_columns', { table_name: 'profiles' });
    const { data: categoryColumns } = await supabase.rpc('get_columns', { table_name: 'categories' });
    
    // Fallback if rpc doesn't exist: try to fetch one row and see keys
    const { data: p } = await supabase.from('profiles').select('*').limit(1);
    const { data: c } = await supabase.from('categories').select('*').limit(1);

    return NextResponse.json({
      user: user ? { id: user.id, email: user.email } : 'Not logged in',
      profiles_schema: p && p[0] ? Object.keys(p[0]) : 'Empty or Error',
      categories_schema: c && c[0] ? Object.keys(c[0]) : 'Empty or Error',
      env: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        service: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
