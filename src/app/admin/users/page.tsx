import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { RoleSelect } from './RoleSelect';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['reader', 'editor', 'moderator', 'admin'];

async function updateRole(formData: FormData) {
  'use server';

  const supabase = await createClient();

  // Re-verify caller is super_admin on every action
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: caller } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!caller || caller.role !== 'super_admin') return;

  const targetId = formData.get('userId') as string;
  const newRole = formData.get('role') as string;

  if (!targetId || !ALLOWED_ROLES.includes(newRole)) return;

  // Safety: never touch a super_admin row
  await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetId)
    .neq('role', 'super_admin');

  revalidatePath('/admin/users');
}

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // Auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // super_admin only
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!currentProfile || currentProfile.role !== 'super_admin') {
    redirect('/admin');
  }

  // Fetch all profiles, newest first — include id for the action
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });



  return (
    <div className="min-h-screen pb-24 px-4 pt-6 bg-[var(--color-background)] font-sans antialiased text-white safe-area-pb">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:text-white transition-colors active:scale-95">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">Users & Roles</h1>
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
              {users?.length || 0} Total Profiles
            </p>
          </div>
        </div>

        {!users || users.length === 0 ? (
          <div className="py-20 text-center text-[var(--color-muted)] flex flex-col items-center">
            <svg className="w-12 h-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <p>No users found in the system.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((u) => {
              const initials = (u.full_name || u.email || '?').charAt(0).toUpperCase();
              return (
                <div key={u.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-[var(--color-primary)]/30 transition-colors">
                  
                  {/* Avatar & Info Row */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-amber-600 flex items-center justify-center flex-shrink-0 text-black font-bold text-lg shadow-inner">
                      {initials}
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h3 className="font-bold text-white text-[15px] truncate">
                        {u.full_name || 'Anonymous User'}
                      </h3>
                      <p className="text-[13px] text-[var(--color-muted)] truncate mb-1">
                        {u.email || 'No email provided'}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-muted)]/70 uppercase tracking-wider font-semibold">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Joined {u.created_at ? formatDate(u.created_at) : 'Unknown'}
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                    <div className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                      Role Permission
                    </div>
                    
                    <div>
                      {u.role === 'super_admin' ? (
                        <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold tracking-wide uppercase shadow-sm">
                          Super Admin
                        </div>
                      ) : (
                        <div className="relative z-10">
                           <RoleSelect
                            userId={u.id}
                            currentRole={u.role}
                            updateRole={updateRole}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
