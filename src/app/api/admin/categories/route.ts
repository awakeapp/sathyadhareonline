import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';

// ── Helper: verify caller is admin / super_admin ──────────────────────────────
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', supabase: null, user: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Forbidden', supabase: null, user: null };
  }
  return { error: null, supabase, user };
}

// ── POST /api/admin/categories — create a category ───────────────────────────
export async function POST(req: NextRequest) {
  const { error, supabase, user } = await requireAdmin();
  if (error || !supabase || !user) {
    return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  }

  const body = await req.json() as {
    name: string; slug: string; description?: string; icon_name?: string; type?: string;
  };
  const { name, slug, description, icon_name, type } = body;

  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
  }

  // Determine next sort_order
  const { data: maxRow } = await supabase
    .from('categories')
    .select('sort_order')
    .eq('type', type || 'article')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = ((maxRow?.sort_order as number | null) ?? 0) + 1;

  const { data: created, error: dbError } = await supabase
    .from('categories')
    .insert({
      name: name.trim(),
      slug: slug.trim(),
      description: description?.trim() || null,
      icon_name: icon_name?.trim() || null,
      sort_order: nextOrder,
      type: type || 'article',
    })
    .select('id, name, slug, description, icon_name, sort_order, type')
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  await logAuditEvent(user.id, 'CATEGORY_CREATED', { category_id: created.id, name });
  return NextResponse.json({ ok: true, category: created }, { status: 201 });
}

// ── PATCH /api/admin/categories — update a category ──────────────────────────
export async function PATCH(req: NextRequest) {
  const { error, supabase, user } = await requireAdmin();
  if (error || !supabase || !user) {
    return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  }

  const body = await req.json() as {
    id: string; name: string; slug: string; description?: string; icon_name?: string | null; type?: string;
  };
  const { id, name, slug, description, icon_name, type } = body;

  if (!id || !name?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { error: dbError } = await supabase
    .from('categories')
    .update({
      name: name.trim(),
      slug: slug.trim(),
      description: description?.trim() || null,
      icon_name: icon_name || null,
      type: type || 'article',
    })
    .eq('id', id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  await logAuditEvent(user.id, 'CATEGORY_UPDATED', { category_id: id, name, slug });
  return NextResponse.json({ ok: true });
}

// ── PUT /api/admin/categories — batch reorder ─────────────────────────────────
// Body: { order: [{ id: string, sort_order: number }] }
export async function PUT(req: NextRequest) {
  const { error, supabase, user } = await requireAdmin();
  if (error || !supabase || !user) {
    return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  }

  const { order } = await req.json() as { order: { id: string; sort_order: number }[] };
  if (!Array.isArray(order) || order.length === 0) {
    return NextResponse.json({ error: 'Invalid order payload' }, { status: 400 });
  }

  // Batch update via individual updates (Supabase doesn't have a native upsert
  // that can update different rows to different values in one call without RPC)
  const updates = order.map(({ id, sort_order }) =>
    supabase.from('categories').update({ sort_order }).eq('id', id)
  );
  const results = await Promise.all(updates);
  const failed = results.find(r => r.error);
  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 500 });
  }

  await logAuditEvent(user.id, 'CATEGORIES_REORDERED', { count: order.length });
  return NextResponse.json({ ok: true });
}

// ── DELETE /api/admin/categories — soft-delete a category ────────────────────
export async function DELETE(req: NextRequest) {
  const { error, supabase, user } = await requireAdmin();
  if (error || !supabase || !user) {
    return NextResponse.json({ error }, { status: error === 'Unauthorized' ? 401 : 403 });
  }

  const body = await req.json() as { id: string };
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const { error: dbError } = await supabase
    .from('categories')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  await logAuditEvent(user.id, 'CATEGORY_DELETED', { category_id: id });
  return NextResponse.json({ ok: true });
}
