import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { RoleSelect } from './RoleSelect';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['reader', 'editor', 'moderator', 'admin'];

const ROLE_META: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  admin:       { label: 'Admin',       color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  editor:      { label: 'Editor',      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  moderator:   { label: 'Moderator',   color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  reader:      { label: 'Reader',      color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
};

async function updateRole(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!caller || caller.role !== 'super_admin') return;

  const targetId = formData.get('userId') as string;
  const newRole  = formData.get('role') as string;
  if (!targetId || !ALLOWED_ROLES.includes(newRole)) return;

  await supabase.from('profiles').update({ role: newRole }).eq('id', targetId).neq('role', 'super_admin');
  revalidatePath('/admin/users');
}

async function inviteEditorAction(formData: FormData) {
  'use server';
  const email    = (formData.get('email') as string)?.trim().toLowerCase();
  const fullName = (formData.get('full_name') as string)?.trim();
  const role     = (formData.get('role') as string) || 'editor';

  if (!email) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!caller || caller.role !== 'super_admin') return;

  // Use Supabase admin to invite user by email
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName || email, role },
  });

  if (error) {
    console.error('Invite error:', error.message);
    // If already exists, just update their role
    const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).single();
    if (existing) {
      await supabase.from('profiles').update({ role, full_name: fullName || undefined }).eq('id', existing.id);
    }
  }

  revalidatePath('/admin/users');
  redirect('/admin/users');
}

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: currentProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!currentProfile || currentProfile.role !== 'super_admin') redirect('/admin');

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 bg-[var(--color-background)] font-sans antialiased text-white safe-area-pb">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Link href="/admin"
            className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:text-white transition-colors active:scale-95">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight leading-tight">Users & Roles</h1>
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
              {users?.length || 0} profiles · super admin view
            </p>
          </div>
        </div>

        {/* ── Invite Editor form ──────────────────────────────── */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Add Team Member</h2>
              <p className="text-[11px] text-[var(--color-muted)]">Sends an invite email via Supabase Auth</p>
            </div>
          </div>
          <form action={inviteEditorAction} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1.5">Email *</label>
                <input
                  required name="email" type="email"
                  placeholder="editor@example.com"
                  className="w-full px-3.5 py-3 rounded-xl bg-black/20 border border-[var(--color-border)] text-white placeholder-white/20 focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1.5">Full Name</label>
                <input
                  name="full_name" type="text"
                  placeholder="Jane Doe"
                  className="w-full px-3.5 py-3 rounded-xl bg-black/20 border border-[var(--color-border)] text-white placeholder-white/20 focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 outline-none transition-all text-sm"
                />
              </div>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1.5">Assign Role</label>
                <select
                  name="role"
                  defaultValue="editor"
                  className="w-full px-3.5 py-3 rounded-xl bg-black/20 border border-[var(--color-border)] text-white focus:ring-2 focus:ring-amber-500/40 outline-none appearance-none text-sm"
                >
                  <option value="editor"    className="bg-[#181623]">Editor</option>
                  <option value="moderator" className="bg-[#181623]">Moderator</option>
                  <option value="admin"     className="bg-[#181623]">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all active:scale-95 shadow-lg shadow-amber-500/20 whitespace-nowrap"
              >
                Send Invite
              </button>
            </div>
          </form>
        </div>

        {/* ── Role legend ─────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(ROLE_META).map(([key, meta]) => (
            <span key={key} className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.color}`}>
              {meta.label}
            </span>
          ))}
        </div>

        {/* ── Users list ──────────────────────────────────────── */}
        {!users || users.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl">
            <p className="text-[var(--color-muted)] text-sm">No users found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => {
              const initials = (u.full_name || u.email || '?').charAt(0).toUpperCase();
              const roleMeta = ROLE_META[u.role] ?? ROLE_META.reader;
              return (
                <div key={u.id}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 shadow-lg group hover:border-white/15 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-amber-400 flex items-center justify-center text-black font-bold text-base shrink-0 shadow-inner">
                      {initials}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-white text-sm truncate">{u.full_name || 'Anonymous'}</h3>
                        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${roleMeta.color}`}>
                          {roleMeta.label}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-muted)] truncate">{u.email || '—'}</p>
                      <p className="text-[10px] text-[var(--color-muted)]/60 mt-0.5 font-semibold uppercase tracking-wider">
                        Joined {u.created_at ? formatDate(u.created_at) : '—'}
                      </p>
                    </div>
                    {/* Role selector */}
                    <div className="shrink-0">
                      {u.role === 'super_admin' ? (
                        <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black tracking-wide uppercase">
                          Super Admin
                        </div>
                      ) : (
                        <RoleSelect userId={u.id} currentRole={u.role} updateRole={updateRole} />
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
