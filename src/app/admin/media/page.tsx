import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import MediaLibraryClient from './MediaLibraryClient';

export const dynamic = 'force-dynamic';

export default async function MediaLibraryPage() {
  const supabase = await createClient();

  // ── Auth ─────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // ── Role check ───────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'editor', 'admin'].includes(profile.role)) {
    redirect('/admin');
  }

  // ── Fetch existing media rows ────────────────────────────────
  const { data: mediaItems, error } = await supabase
    .from('media')
    .select('id, url, uploaded_by, created_at')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching media:', error);

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 bg-[var(--color-background)] font-sans antialiased text-white safe-area-pb">
      <div className="max-w-4xl mx-auto">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:text-white transition-colors active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
                Media Library
              </h1>
              <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
                {mediaItems?.length ?? 0} images uploaded
              </p>
            </div>
          </div>

          {/* Storage bucket label */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-semibold text-blue-400">bucket: article-images</span>
          </div>
        </div>

        {/* ── Client Component (upload + grid) ─────────────── */}
        <MediaLibraryClient
          initialItems={mediaItems ?? []}
          userId={user.id}
        />

      </div>
    </div>
  );
}
