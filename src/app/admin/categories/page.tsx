import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CategoryManagerClient from './CategoryManagerClient';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const supabase = await createClient();

  // ── Auth guard ──────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/admin?error=unauthorized');
  }

  // ── Data ────────────────────────────────────────────────────────
  // Fetch id too — needed for edit/delete mutations
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, icon_name')
    .order('created_at', { ascending: false });

  return (
    <div className="font-sans antialiased max-w-3xl mx-auto py-2">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8 mt-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)]">
            <Link href="/admin">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-tight">Categories</h1>
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
              {categories?.length || 0} Total
            </p>
          </div>
        </div>
        <Button asChild className="rounded-full shadow-sm pr-5">
          <Link href="/admin/categories/new">
            <Plus className="w-5 h-5 mr-1" />
            <span className="hidden sm:inline">New Category</span>
            <span className="sm:hidden">New</span>
          </Link>
        </Button>
      </div>

      {/* ── Interactive category list with edit/delete ─────────── */}
      <CategoryManagerClient categories={categories ?? []} />
    </div>
  );
}
