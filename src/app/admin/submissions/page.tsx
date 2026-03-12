import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAuditEvent } from '@/lib/audit';
import { ChevronLeft, Inbox, CheckCircle2, X, Bell, User, Mail, Calendar } from 'lucide-react';
import { 
  PresenceWrapper, 
  PresenceHeader,
  PresenceCard 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

async function convertAction(formData: FormData) {
  'use server';
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return;

  const id      = formData.get('id')      as string;
  const title   = formData.get('title')   as string;
  const content = formData.get('content') as string;

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  const { error: articleError } = await supabase
    .from('articles')
    .insert({ 
      title, 
      content, 
      slug, 
      status: 'draft', 
      author_id: user.id,
      author_name: profile.full_name || 'Admin'
    });

  if (articleError) {
    console.error('Convert error:', articleError);
    return;
  }

  await supabase.from('guest_submissions').update({ status: 'converted' }).eq('id', id);
  await logAuditEvent(user.id, 'SUBMISSION_CONVERTED', { submission_id: id, title });

  revalidatePath('/admin/submissions');
  revalidatePath('/admin/articles');
  redirect('/admin/submissions');
}

async function rejectAction(formData: FormData) {
  'use server';
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return;

  const id = formData.get('id') as string;
  await supabase.from('guest_submissions').update({ status: 'rejected' }).eq('id', id);
  await logAuditEvent(user.id, 'SUBMISSION_REJECTED', { submission_id: id });

  revalidatePath('/admin/submissions');
  redirect('/admin/submissions');
}

export default async function AdminSubmissionsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/admin?error=unauthorized');
  }

  const { data: submissions, error } = await supabase
    .from('guest_submissions')
    .select('id, name, email, title, content, status, created_at')
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching submissions:', error);

  const pendingCount = submissions?.filter(s => s.status === 'pending').length ?? 0;
  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Super Admin"
        roleLabel={`Submissions · ${pendingCount} Waiting Discovery`}
        initials={initials}
        icon1Node={<Bell className="w-6 h-6" strokeWidth={1.25} />}
        icon2Node={<ChevronLeft className="w-6 h-6" strokeWidth={1.25} />}
        icon2Href="/admin"
      />
      
      <div className="p-4 flex flex-col gap-4 relative z-20 max-w-4xl mx-auto">
        {!submissions || submissions.length === 0 ? (
          <PresenceCard className="py-24 text-center border-dashed border-2 border-indigo-100 flex flex-col items-center">
            <Inbox className="w-16 h-16 mb-5 text-indigo-100" />
            <p className="font-black text-xl text-zinc-500 uppercase tracking-widest">Inbox Void</p>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-2">No guest communications intercepted</p>
          </PresenceCard>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <PresenceCard
                key={sub.id}
                noPadding
                className={`group transition-all ${sub.status !== 'pending' ? 'opacity-60' : ''}`}
              >
                <div className="p-6 flex flex-col md:flex-row gap-6">
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight truncate flex-1">{sub.title}</h2>
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        sub.status === 'converted' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
                        sub.status === 'rejected' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                        'bg-amber-50 text-amber-500 border-amber-100'
                      }`}>
                        {sub.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                       <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-indigo-300" strokeWidth={1.25} />
                          <span className="text-xs font-black text-zinc-500 uppercase truncate">{sub.name}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-indigo-300" strokeWidth={1.25} />
                          <a href={`mailto:${sub.email}`} className="text-xs font-black text-zinc-900 dark:text-zinc-50 uppercase truncate hover:underline">{sub.email}</a>
                       </div>
                       <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-300" strokeWidth={1.25} />
                          <span className="text-[10px] font-black text-zinc-400 uppercase">
                             Received · {new Date(sub.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                       </div>
                    </div>

                    {sub.content && (
                      <div className="bg-zinc-50 dark:bg-white/5 rounded-2xl p-5 border-l-4 border-indigo-100 dark:border-indigo-500/20 mb-2">
                        <p className="text-sm font-medium leading-relaxed italic text-zinc-900/80 dark:text-white/80 line-clamp-4">
                          &ldquo;{sub.content}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  {sub.status === 'pending' && (
                    <div className="shrink-0 flex md:flex-col gap-3 pt-1">
                      <form action={convertAction}>
                        <input type="hidden" name="id"      value={sub.id} />
                        <input type="hidden" name="title"   value={sub.title} />
                        <input type="hidden" name="content" value={sub.content ?? ''} />
                        <button
                          type="submit"
                          className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20 transition-all"
                          title="Convert to Draft"
                        >
                          <CheckCircle2 className="w-6 h-6" strokeWidth={1.25} />
                        </button>
                      </form>
                      <form action={rejectAction}>
                        <input type="hidden" name="id" value={sub.id} />
                        <button
                          type="submit"
                          className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/5"
                          title="Reject"
                        >
                          <X className="w-6 h-6" strokeWidth={1.25} />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </PresenceCard>
            ))}
          </div>
        )}
      </div>
    </PresenceWrapper>
  );
}
