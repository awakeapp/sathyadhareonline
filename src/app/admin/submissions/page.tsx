import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import GuestSubmissionsClient from './GuestSubmissionsClient';
import SubmissionsClient from './SubmissionsClient';

export const dynamic = 'force-dynamic';

export default async function SubmissionsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) redirect('/admin');

  // Staff in-review queue (for the existing SubmissionsClient tab)
  const [articles, sequels, books] = await Promise.all([
    supabase.from('articles').select('id, title, status, created_at, author:profiles!author_id(full_name)').eq('status', 'in_review').eq('is_deleted', false),
    supabase.from('sequels').select('id, title, status, created_at').eq('status', 'in_review').eq('is_deleted', false),
    supabase.from('books').select('id, title, status, created_at').eq('status', 'in_review').eq('is_deleted', false),
  ]);

  const staffItems: any[] = [
    ...(articles.data || []).map((a: any) => ({
      id: a.id, title: a.title, type: 'article',
      author: (Array.isArray(a.author) ? a.author[0]?.full_name : a.author?.full_name) || 'Anonymous',
      created_at: a.created_at
    })),
    ...(sequels.data || []).map(s => ({ id: s.id, title: s.title, type: 'sequel', author: 'Admin', created_at: s.created_at })),
    ...(books.data || []).map(b => ({ id: b.id, title: b.title, type: 'book', author: 'Admin', created_at: b.created_at })),
  ];

  // Full guest submissions — all statuses
  const { data: guestSubmissions } = await supabase
    .from('guest_submissions')
    .select('id, name, email, title, content, summary, source_reference, status, rejection_reason, created_at')
    .order('created_at', { ascending: false });

  // Editors for the assignment dropdown
  const { data: editors } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'editor')
    .order('full_name');

  return (
    <div className="w-full flex flex-col gap-8">

      {/* Reader Submissions — full featured */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--color-text)] tracking-tight">Reader Submissions</h1>
          <p className="text-[13px] text-[var(--color-muted)] mt-0.5">Review, accept, and assign externally submitted articles.</p>
        </div>
        <GuestSubmissionsClient
          submissions={guestSubmissions || []}
          editors={editors || []}
        />
      </div>

      {/* Staff review queue — existing component */}
      <div className="flex flex-col gap-4 pt-6 border-t border-[var(--color-border)]">
        <div>
          <h2 className="text-[18px] font-bold text-[var(--color-text)] tracking-tight">Staff Review Queue</h2>
          <p className="text-[13px] text-[var(--color-muted)] mt-0.5">Internal articles, sequels, and books waiting for approval.</p>
        </div>
        <SubmissionsClient staffItems={staffItems} guestItems={[]} />
      </div>
    </div>
  );
}
