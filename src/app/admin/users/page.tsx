import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { logAuditEvent } from '@/lib/audit';
import { RoleSelect } from './RoleSelect';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Label } from '@/components/ui/Input';
import { ChevronLeft, UserPlus, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['reader', 'editor', 'admin'];

const ROLE_META: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  admin:       { label: 'Admin',       color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  editor:      { label: 'Editor',      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  reader:      { label: 'Reader',      color: 'bg-gray-500/10 text-[var(--color-muted)] border-gray-500/20' },
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
  
  await logAuditEvent(user.id, 'USER_ROLE_CHANGED', { target_user_id: targetId, new_role: newRole });
  
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
      await logAuditEvent(user.id, 'USER_ROLE_CHANGED', { target_user_id: existing.id, new_role: role, note: 're-invited' });
    }
  } else {
    await logAuditEvent(user.id, 'USER_INVITED', { invited_email: email, role });
  }

  revalidatePath('/admin/users');
  redirect('/admin/users');
}

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let users: any[] = [];
  let currentProfile: any = null;

  try {
    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    currentProfile = p;
    if (!currentProfile || currentProfile.role !== 'super_admin') redirect('/admin');

    const { data: u, error: fetchError } = await supabase
      .from('profiles')
      .select('*') // Select all to avoid column errors if 'email' is missing
      .order('created_at', { ascending: false });
    
    if (!fetchError && u) {
      users = u;
    }
  } catch (err) {
    console.error('Admin users page fetch error:', err);
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="font-sans antialiased max-w-3xl mx-auto py-2">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-8 mt-4">
        <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)]">
          <Link href="/admin">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight leading-tight">Users & Roles</h1>
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
            {users?.length || 0} profiles · super admin view
          </p>
        </div>
      </div>

      {/* ── Invite Editor form ──────────────────────────────── */}
      <Card className="rounded-[2rem] border-[var(--color-border)] mb-10 overflow-hidden shadow-lg shadow-black/5">
        <div className="bg-[var(--color-surface)] p-6 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
               <UserPlus className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Add Team Member</h2>
              <p className="text-[11px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">Sends invite via Supabase Auth</p>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <form action={inviteEditorAction} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Email *</Label>
                <Input required name="email" type="email" placeholder="editor@example.com" />
              </div>
              <div>
                <Label>Full Name</Label>
                <Input name="full_name" type="text" placeholder="Jane Doe" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-1 w-full">
                <Label>Assign Role</Label>
                <Select name="role" defaultValue="editor">
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </Select>
              </div>
              <Button type="submit" variant="primary" className="w-full sm:w-auto h-12 shadow-sm text-black">
                Send Invite
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Role legend ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6 px-1">
        {Object.entries(ROLE_META).map(([key, meta]) => (
          <span key={key} className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.color}`}>
            {meta.label}
          </span>
        ))}
      </div>

      {/* ── Users list ──────────────────────────────────────── */}
      {!users || users.length === 0 ? (
        <Card className="py-20 text-center flex flex-col items-center bg-[var(--color-surface)] border-[var(--color-border)] border-dashed rounded-[2rem] shadow-none">
          <p className="text-[var(--color-muted)] font-bold tracking-tight">No users found.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((u) => {
            const initials = (u.full_name || u.email || '?').charAt(0).toUpperCase();
            const roleMeta = ROLE_META[u.role] ?? ROLE_META.reader;
            return (
              <Card key={u.id} hoverable className="rounded-3xl border-transparent bg-[var(--color-surface)] shadow-none">
                <CardContent className="p-5 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-amber-400 flex items-center justify-center text-black font-black text-lg shrink-0 shadow-inner">
                    {initials}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-sm truncate leading-tight">{u.full_name || 'Anonymous'}</h3>
                      <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${roleMeta.color}`}>
                        {roleMeta.label}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-muted)] truncate mb-0.5 font-medium">{u.email || '—'}</p>
                    <p className="text-[10px] text-[var(--color-muted)] font-bold uppercase tracking-widest opacity-70">
                      Joined {u.created_at ? formatDate(u.created_at) : '—'}
                    </p>
                  </div>
                  {/* Role selector */}
                  <div className="shrink-0 flex items-center">
                    {u.role === 'super_admin' ? (
                      <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 text-[10px] font-black tracking-wide uppercase flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
                      </div>
                    ) : (
                      <RoleSelect userId={u.id} currentRole={u.role} updateRole={updateRole} />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}
