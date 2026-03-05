import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CategoryManagerClient from './CategoryManagerClient';

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
    <div className="min-h-screen pb-24 px-4 pt-6 bg-[var(--color-background)] font-sans antialiased text-white safe-area-pb">
      <div className="max-w-2xl mx-auto">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:text-white transition-colors active:scale-95">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">Categories</h1>
              <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
                {categories?.length || 0} Total
              </p>
            </div>
          </div>
          <Link
            href="/admin/categories/new"
            className="flex items-center gap-1.5 bg-[var(--color-primary)] text-black px-4 py-2.5 rounded-full text-sm font-bold hover:bg-[#ffed4a] transition-all shadow-lg shadow-[var(--color-primary)]/20 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            <span className="hidden sm:inline">New</span>
          </Link>
        </div>

        {/* ── Interactive category list with edit/delete ─────────── */}
        <CategoryManagerClient categories={categories ?? []} />
      </div>
    </div>
  );
}
