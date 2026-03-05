import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', supabase: null };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return { error: 'Forbidden', supabase: null };
  return { error: null, supabase };
}

// DELETE — remove a subscriber
export async function DELETE(req: NextRequest) {
  const { error, supabase } = await requireAdmin();
  if (error || !supabase) return NextResponse.json({ error }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error: dbError } = await supabase
    .from('newsletter_subscribers')
    .delete()
    .eq('id', id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
