import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, Layers, Library, PenLine, Clock, CheckCircle2, XCircle } from 'lucide-react';
import AdminContainer from '@/components/layout/AdminContainer';

export const dynamic = 'force-dynamic';

export default async function ContributorDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const { data: permissions } = await supabase
    .from('user_content_permissions')
    .select('can_articles, can_sequels, can_library')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: submissions, error: subError } = await supabase
    .from('guest_submissions')
    .select('id, title, status, created_at, rejection_reason')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (subError) {
    console.error('Error fetching submissions:', subError);
  }

  const canArticles = permissions?.can_articles ?? false;
  const canSequels = permissions?.can_sequels ?? false;
  const canLibrary = permissions?.can_library ?? false;

  return (
    <AdminContainer className="flex flex-col gap-10">
      
      {/* 1. Header & Write Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-text)] tracking-tight font-kannada">
            ಸ್ವಾಗತ
          </h1>
          <p className="text-xl font-medium text-[var(--color-muted)] mt-2">
            Welcome, {profile?.full_name || 'Contributor'}
          </p>
        </div>
        {canArticles && (
          <Link 
            href="/write"
            className="flex items-center justify-center gap-2 h-12 md:h-14 px-8 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-[14px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-[var(--color-primary)]/20 active:scale-95 shrink-0"
          >
            <PenLine size={18} />
            Write New Article
          </Link>
        )}
      </div>

      {/* 2. My Access Section */}
      <div className="flex flex-col gap-4">
        <h2 className="text-[18px] font-bold text-[var(--color-text)] tracking-tight">My Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {canArticles && (
            <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col gap-3 hover:border-[var(--color-primary)]/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-1 min-w-[44px] min-h-[44px]">
                <FileText size={20} />
              </div>
              <h3 className="font-bold text-[16px] text-[var(--color-text)]">Articles</h3>
              <p className="text-[14px] text-[var(--color-muted)] leading-relaxed">
                Submit standalone articles and opinions directly to the editorial team.
              </p>
            </div>
          )}
          
          {canSequels && (
            <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col gap-3 hover:border-[var(--color-primary)]/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-1 min-w-[44px] min-h-[44px]">
                <Layers size={20} />
              </div>
              <h3 className="font-bold text-[16px] text-[var(--color-text)]">Sequels</h3>
              <p className="text-[14px] text-[var(--color-muted)] leading-relaxed">
                Contribute serialized content to ongoing digital magazines or issues.
              </p>
            </div>
          )}

          {canLibrary && (
            <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl p-6 flex flex-col gap-3 hover:border-[var(--color-primary)]/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-1 min-w-[44px] min-h-[44px]">
                <Library size={20} />
              </div>
              <h3 className="font-bold text-[16px] text-[var(--color-text)]">Library</h3>
              <p className="text-[14px] text-[var(--color-muted)] leading-relaxed">
                Manage and write chapters for books inside the core library.
              </p>
            </div>
          )}

          {!canArticles && !canSequels && !canLibrary && (
            <div className="col-span-full p-8 text-center bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] rounded-3xl">
              <p className="text-[14px] text-[var(--color-muted)] font-medium">
                You currently do not have access to any specific publishing sections. Contact an administrator.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. My Submissions Section */}
      <div className="flex flex-col gap-4 mt-4">
        <h2 className="text-[18px] font-bold text-[var(--color-text)] tracking-tight">My Submissions</h2>
        
        {(!submissions || submissions.length === 0) ? (
          <div className="p-12 text-center bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] rounded-3xl flex flex-col items-center justify-center gap-3">
            <FileText size={32} className="text-[var(--color-muted)] opacity-30" />
            <p className="text-[15px] font-bold text-[var(--color-text)]">No Submissions Yet</p>
            <p className="text-[14px] text-[var(--color-muted)] max-w-sm">
              Any articles you submit for review will automatically tracking their status here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {submissions.map((sub) => {
              const st = sub.status || 'pending';
              const isRejected = st === 'rejected';
              const isAccepted = st === 'accepted' || st === 'published' || st === 'converted';
              
              let statusColor = 'bg-amber-50 text-amber-600 ring-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400';
              let Icon = Clock;
              
              if (isRejected) {
                statusColor = 'bg-rose-50 text-rose-600 ring-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400';
                Icon = XCircle;
              } else if (isAccepted) {
                statusColor = 'bg-emerald-50 text-emerald-600 ring-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400';
                Icon = CheckCircle2;
              }

              return (
                <div key={sub.id} className="p-5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-[var(--color-surface)]">
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <h3 className="text-[16px] font-bold text-[var(--color-text)] truncate leading-tight">
                      {sub.title}
                    </h3>
                    <p className="text-[13px] text-[var(--color-muted)]">
                      Submitted on {new Date(sub.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    
                    {isRejected && sub.rejection_reason && (
                      <div className="mt-2 text-[13px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 p-3 rounded-lg border border-rose-100 dark:border-rose-500/20 inline-block">
                        <span className="font-bold mr-1">Feedback:</span> {sub.rejection_reason}
                      </div>
                    )}
                  </div>
                  
                  <div className="shrink-0 flex items-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold uppercase tracking-wider ring-1 ring-inset ${statusColor}`}>
                      <Icon size={14} strokeWidth={2.5} />
                      {st.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </AdminContainer>
  );
}
