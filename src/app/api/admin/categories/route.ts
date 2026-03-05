import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ── Helper: verify caller is admin / super_admin ──────────────────────────────
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', supabase: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Forbidden', supabase: null };
  }
  return { error: null, supabase };
}

// ── PATCH /api/admin/categories — update a category ─────────────────────────
export async function PATCH(req: NextRequest) {
  const { error, supabase } = await requireAdmin();
  if (error || !supabase) {
    return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  }

  const body = await req.json();
  const { id, name, slug, icon_name } = body as {
    id: string; name: string; slug: string; icon_name: string | null;
  };

  if (!id || !name || !slug) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { error: dbError } = await supabase
    .from('categories')
    .update({ name, slug, icon_name })
    .eq('id', id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// ── DELETE /api/admin/categories — delete a category ────────────────────────
export async function DELETE(req: NextRequest) {
  const { error, supabase } = await requireAdmin();
  if (error || !supabase) {
    return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  }

  const body = await req.json();
  const { id } = body as { id: string };

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const { error: dbError } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
