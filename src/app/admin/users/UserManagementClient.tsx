'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input, Select, Label } from '@/components/ui/Input';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import { toast } from 'sonner';
import {
  UserPlus, Mail, Edit2, Trash2,
  Slash, Ban, CheckCircle, Search, Download, User, Clock, KeyRound, MoreVertical, Users
} from 'lucide-react';
import {
  PresenceCard,
  PresenceButton
} from '@/components/PresenceUI';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuPortal,
} from '@/components/ui/Dropdown';
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
  inviteUserAction,
  toggleStatusAction,
  sendPasswordResetAction,
} from './actions';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  status: string;
  created_at: string;
  last_sign_in_at?: string | null;
  avatar_url?: string | null;
  permissions?: {
    can_articles: boolean;
    can_sequels: boolean;
    can_library: boolean;
  };
}

// Fix: role keys must be lowercase_underscore (normalised in page.tsx)
const ROLE_META: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'S. Admin', color: 'border-[var(--color-text)]/10 bg-[var(--color-text)]/5 text-[var(--color-text)]/70' },
  admin:       { label: 'Admin',    color: 'border-[var(--color-text)]/10 bg-[var(--color-text)]/5 text-[var(--color-text)]/70' },
  editor:      { label: 'Editor',   color: 'border-[var(--color-text)]/10 bg-[var(--color-text)]/5 text-[var(--color-text)]/70' },
  reader:      { label: 'Reader',   color: 'border-[var(--color-text)]/5 text-[var(--color-muted)]' },
};

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  active:    { label: 'Active',    color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle },
  suspended: { label: 'Suspended', color: 'text-amber-500',   bg: 'bg-amber-500/10',   icon: Slash },
  banned:    { label: 'Banned',    color: 'text-red-500',     bg: 'bg-red-500/10',     icon: Ban },
};

export default function UserManagementClient({
  users: initialUsers,
  currentUserRole,
}: {
  users: UserProfile[];
  currentUserRole: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // View Modes (ARRANGE LIKE: Users, Readers, Subscribed)
  const [viewMode, setViewMode] = useState<'users' | 'readers' | 'subscribed'>('users');

  // Modal States
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showReset, setShowReset] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const searchParams = useSearchParams();

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchParams?.get('invite') === 'true') setShowInvite(true);
    }, 0);
    return () => clearTimeout(t);
  }, [searchParams]);

  const filteredUsers = useMemo(() => {
    return initialUsers.filter(u => {
      // First filter by View Mode (Tab)
      if (viewMode === 'users') {
        if (!['super_admin', 'admin', 'editor'].includes(u.role)) return false;
      } else if (viewMode === 'readers') {
        if (u.role !== 'reader') return false;
      } else if (viewMode === 'subscribed') {
        return false; // No logic yet
      }

      // Then filter by Action Bar filters
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!u.email?.toLowerCase().includes(q) && !u.full_name?.toLowerCase().includes(q)) return false;
      }
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      return true;
    });
  }, [initialUsers, searchQuery, roleFilter, statusFilter, viewMode]);

  async function handleAction(
    action: (fd: FormData) => Promise<{ error?: string; success?: boolean; message?: string }>,
    fd: FormData,
    closeFn: () => void,
  ) {
    if (isPending) return;
    startTransition(async () => {
      const res = await action(fd);
      if (res?.error) toast.error(res.error);
      else { toast.success(res?.message || 'Action completed'); closeFn(); }
    });
  }

  const exportCSV = () => {
    const headers = ['ID', 'Email', 'Full Name', 'Role', 'Status', 'Joined', 'Last Login'];
    const rows = filteredUsers.map(u => [
      u.id, u.email || 'N/A', u.full_name || 'N/A', u.role, u.status,
      new Date(u.created_at).toISOString(),
      u.last_sign_in_at ? new Date(u.last_sign_in_at).toISOString() : 'Never',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = 'users_export.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const formatDate = (iso?: string | null, fallback = '—') => {
    if (!iso) return fallback;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? fallback : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatRelative = (iso?: string | null) => {
    if (!iso) return null;
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(iso);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* ── Action Bar (Consolidated & Compact) ── */}
      <div className="grid grid-cols-2 gap-2">
        <button 
          onClick={() => setShowInvite(true)} 
          className="h-10 rounded-xl bg-[var(--color-primary)] text-white font-bold text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[var(--color-primary)]/10"
        >
          <Mail className="w-3.5 h-3.5" strokeWidth={2.5} /> Invite
        </button>
        <button 
          onClick={() => setShowCreate(true)} 
          className="h-10 rounded-xl bg-[var(--color-surface)] text-[var(--color-text)] font-bold text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-all"
        >
          <UserPlus className="w-3.5 h-3.5" strokeWidth={2.5} /> Create
        </button>
      </div>

      {/* ── Tabs (Minimal) ── */}
      <div className="flex bg-[var(--color-surface-2)]/50 p-1 rounded-xl border border-[var(--color-border)] relative">
        {(['users', 'readers', 'subscribed'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`relative flex-1 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] rounded-lg transition-all duration-300 ${
              viewMode === mode 
                ? 'text-[var(--color-primary)]' 
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {mode === 'users' ? 'Staff' : mode === 'readers' ? 'Readers' : 'Subscribers'}
            {viewMode === mode && (
              <div className="absolute inset-0 bg-[var(--color-surface)] rounded-lg shadow-sm -z-10 animate-in fade-in zoom-in-95 duration-300 border border-[var(--color-border)]" />
            )}
          </button>
        ))}
      </div>

      {/* ── Search & Filter Row (Single Compact Row) ── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" strokeWidth={2.5} />
          <input
            placeholder={`Search...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[15px] font-medium focus:border-[var(--color-primary)]/40 outline-none transition-all placeholder:text-[var(--color-muted)]/30"
          />
        </div>

        {viewMode === 'users' && (
          <div className="relative group min-w-[120px]">
            <select 
              value={roleFilter} 
              onChange={e => setRoleFilter(e.target.value)}
              className="w-full h-10 pl-3 pr-8 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] font-bold uppercase tracking-wider text-[var(--color-text)] outline-none appearance-none cursor-pointer hover:bg-[var(--color-surface-2)]"
            >
              <option value="all">Roles</option>
              <option value="super_admin">S.Admin</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-muted)]">
              <Users size={12} strokeWidth={2.5} />
            </div>
          </div>
        )}

        <button 
          onClick={exportCSV} 
          className="w-10 h-10 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-all flex items-center justify-center shadow-sm shrink-0"
        >
          <Download className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Stats bar ── */}
      <div className="flex gap-3 flex-wrap text-[12px] font-bold text-[var(--color-muted)]/80 px-1">
        <span>{filteredUsers.length} {viewMode === 'users' ? 'Staff Members' : viewMode === 'readers' ? 'Readers' : 'Subscribers'}</span>
        {viewMode === 'users' && (
          <>
            <span>·</span>
            <span>{initialUsers.filter(u => u.role === 'super_admin').length} Super Admins</span>
          </>
        )}
        {initialUsers.filter(u => u.status !== 'active').length > 0 && (
          <>
            <span>·</span>
            <span className="text-amber-600">{initialUsers.filter(u => u.status !== 'active').length} Restricted</span>
          </>
        )}
      </div>

      {/* ── User List ── */}
      <div className="space-y-3">
        {viewMode === 'subscribed' ? (
          <PresenceCard className="py-24 text-center flex flex-col items-center border-dashed border-2 border-[var(--color-border)]">
            <Mail className="w-10 h-10 text-[var(--color-muted)] mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-[var(--color-text)] mb-1">No Active Subscriptions</h3>
            <p className="text-sm text-[var(--color-muted)] max-w-xs mx-auto">
              Subscription billing is not yet enabled. Once active, your paying members will appear here.
            </p>
          </PresenceCard>
        ) : filteredUsers.length === 0 ? (
          <PresenceCard className="py-20 text-center flex flex-col items-center border-dashed border-2 border-[var(--color-border)]">
            <User className="w-14 h-14 mb-4 text-[var(--color-border)]" />
            <p className="font-bold text-[16px] text-[var(--color-muted)]">No users found</p>
            <p className="text-[13px] text-[var(--color-muted)]/60 mt-1">Try adjusting filters</p>
          </PresenceCard>
        ) : (
          filteredUsers.map(u => {
            const roleMeta = ROLE_META[u.role] ?? { label: u.role, color: ROLE_META.reader.color };
            const statusMeta = STATUS_META[u.status] ?? STATUS_META.active;
            const initials = (u.full_name || u.email || '?').charAt(0).toUpperCase();
            const lastSeen = formatRelative(u.last_sign_in_at);

            return (
              <div key={u.id} className="group relative">
                <div className="flex items-center p-4 bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 gap-4">
                  
                  {/* Avatar Section */}
                  <div className="relative shrink-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-[20px] font-bold text-white overflow-hidden shadow-sm transition-transform group-hover:scale-105 duration-500
                      ${u.status === 'active'
                        ? 'bg-gradient-to-br from-[var(--color-primary)] to-indigo-500'
                        : 'bg-zinc-500'}`}>
                      {u.avatar_url ? (
                        <Image
                          src={u.avatar_url}
                          alt={u.full_name || 'U'}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    {/* Status indicator on avatar */}
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[3px] border-[var(--color-surface)] flex items-center justify-center ${statusMeta.color} ${statusMeta.bg} shadow-sm`}>
                      <statusMeta.icon className={`w-2 h-2 ${u.status === 'active' ? 'animate-pulse' : ''}`} strokeWidth={3} />
                    </div>
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="font-bold text-[17px] text-[var(--color-text)] tracking-tight truncate">
                          {u.full_name || 'Anonymous Member'}
                        </h3>
                        <span className={`inline-flex px-1.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${roleMeta.color} bg-transparent`}>
                          {roleMeta.label}
                        </span>
                      </div>
                      
                      {/* Desktop Last Seen (Subtle) */}
                      {lastSeen && (
                        <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--color-muted)]/40 uppercase tracking-tighter">
                          <Clock className="w-3 h-3" />
                          {lastSeen}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[14px] text-[var(--color-muted)] font-medium mb-2.5 opacity-60 group-hover:opacity-100 transition-opacity truncate">
                      {u.email}
                    </p>
                    
                    <div className="flex items-center gap-4 text-[11px] font-bold text-[var(--color-muted)]/30 uppercase tracking-widest leading-none">
                      <div className="flex items-center gap-1.5 hover:text-[var(--color-text)] transition-colors">
                        <Users className="w-3 h-3" strokeWidth={2.5} />
                        Joined {formatDate(u.created_at)}
                      </div>
                      {/* Mobile Last Seen */}
                      {lastSeen && (
                        <div className="sm:hidden flex items-center gap-1.5 text-[var(--color-primary)]/60">
                          <Clock className="w-3 h-3" strokeWidth={2.5} />
                          {lastSeen}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions — Integral & Refined */}
                  <div className="shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-10 h-10 rounded-2xl bg-transparent border border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)]/40 hover:text-[var(--color-text)] transition-all">
                          <MoreVertical className="w-4.5 h-4.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuContent align="end" className="w-[200px] p-1.5 bg-[var(--color-surface)] border-[var(--color-border)] shadow-2xl rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                          <DropdownMenuLabel className="px-3 py-2 text-[10px] opacity-40 uppercase tracking-widest font-bold">Member Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => { setSelectedUser(u); setShowEdit(true); }} className="rounded-xl py-2 px-3 font-bold text-[13px]">
                            <Edit2 className="w-3.5 h-3.5 mr-2.5 opacity-60" />
                            Manage Permissions
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => { setSelectedUser(u); setShowReset(true); }} className="rounded-xl py-2 px-3 font-bold text-[13px] text-indigo-600 focus:bg-indigo-50 dark:focus:bg-indigo-500/10">
                            <KeyRound className="w-3.5 h-3.5 mr-2.5" />
                            Force Password Reset
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="my-1.5 opacity-10" />

                          <DropdownMenuItem onClick={() => { setSelectedUser(u); setShowStatus(true); }} className="rounded-xl py-2 px-3 font-bold text-[13px] text-amber-600 focus:bg-amber-50 dark:focus:bg-amber-500/10">
                            <Slash className="w-3.5 h-3.5 mr-2.5" />
                            {u.status === 'active' ? 'Suspend Access' : 'Restore Access'}
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => { setSelectedUser(u); setShowDelete(true); }} className="rounded-xl py-2 px-3 font-bold text-[13px] text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10">
                            <Trash2 className="w-3.5 h-3.5 mr-2.5" />
                            Delete Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenuPortal>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── MODALS ── */}

      {/* 6. Password Reset Modal — Fix #6 */}
      <Modal open={showReset} onOpenChange={setShowReset}>
        <ModalContent>
          {selectedUser && (
            <>
              <ModalHeader>
                <ModalTitle>Send Password Reset</ModalTitle>
                <ModalDescription>
                  Send a password reset email to <span className="font-bold">{selectedUser.email}</span>. They will receive a secure link to set a new password.
                </ModalDescription>
              </ModalHeader>
              <form action={fd => handleAction(sendPasswordResetAction, fd, () => setShowReset(false))} className="pt-2">
                <input type="hidden" name="email" value={selectedUser?.email || ''} />
                <ModalFooter>
                  <Button type="button" variant="outline" onClick={() => setShowReset(false)}>Cancel</Button>
                  <Button type="submit" loading={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <KeyRound className="w-4 h-4 mr-2" /> Send Reset Link
                  </Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal open={showCreate} onOpenChange={setShowCreate}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Create User Account</ModalTitle>
            <ModalDescription>Bypass email invite — account is created immediately.</ModalDescription>
          </ModalHeader>
          <form action={fd => handleAction(createUserAction, fd, () => setShowCreate(false))} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 text-left">
                <Label>Full Name</Label>
                <Input name="full_name" placeholder="Jane Doe" required />
              </div>
              <div className="space-y-1.5 text-left">
                <Label>Role</Label>
                <Select name="role">
                  <option value="reader">Reader</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  {currentUserRole === 'super_admin' && <option value="super_admin">Super Admin</option>}
                </Select>
              </div>
            </div>
            <div className="space-y-1.5 text-left">
              <Label>Email</Label>
              <Input name="email" type="email" placeholder="user@example.com" required />
            </div>
            <div className="space-y-1.5 text-left">
              {/* Fix #2 — was type="text", now type="password" so it's masked */}
              <Label>Temporary Password</Label>
              <Input name="password" type="password" placeholder="Minimum 6 characters" required minLength={6} />
            </div>
            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" loading={isPending}>Create Account</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* 2. Invite User */}
      <Modal open={showInvite} onOpenChange={setShowInvite}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Invite Team Member</ModalTitle>
            <ModalDescription>They will receive an email with a setup link.</ModalDescription>
          </ModalHeader>
          <form action={fd => handleAction(inviteUserAction, fd, () => setShowInvite(false))} className="space-y-4 pt-2 text-left">
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input name="email" type="email" placeholder="editor@sathyadhare.com" required />
            </div>
            <div className="space-y-1.5">
              <Label>Initial Role</Label>
              <Select name="role">
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </Select>
            </div>
            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
              <Button type="submit" loading={isPending}>Send Invitation</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* 3. Edit User */}
      <Modal open={showEdit} onOpenChange={setShowEdit}>
        <ModalContent>
          {selectedUser && (
            <>
              <ModalHeader>
                <ModalTitle>Edit Profile</ModalTitle>
                <ModalDescription>Updating {selectedUser.email}</ModalDescription>
              </ModalHeader>
              <form action={fd => handleAction(updateUserAction, fd, () => setShowEdit(false))} className="space-y-4 pt-2 text-left">
                <input type="hidden" name="userId" value={selectedUser.id} />
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input name="full_name" defaultValue={selectedUser.full_name || ''} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select name="role" defaultValue={selectedUser.role}>
                    <option value="reader">Reader</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                    {currentUserRole === 'super_admin' && <option value="super_admin">Super Admin</option>}
                  </Select>
                  {selectedUser.role === 'super_admin' && initialUsers.filter(u => u.role === 'super_admin' && u.status === 'active').length <= 1 && (
                    <p className="text-[11px] text-amber-500 font-semibold mt-1">⚠️ Cannot demote the last active Super Admin.</p>
                  )}
                </div>

                {/* Content Permissions */}
                <div className="space-y-2 pt-3 border-t border-[var(--color-border)]">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[var(--color-muted)]">Content Access</p>
                  {[
                    { id: 'can_articles', label: 'Articles', key: 'can_articles' },
                    { id: 'can_sequels', label: 'Sequels', key: 'can_sequels' },
                    { id: 'can_library', label: 'Library', key: 'can_library' },
                  ].map(p => (
                    <label key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] cursor-pointer hover:bg-[var(--color-surface)] transition-colors">
                      <span className="text-[13px] font-semibold text-[var(--color-text)]">{p.label}</span>
                      <input
                        type="checkbox"
                        name={p.id}
                        defaultChecked={(selectedUser.permissions as any)?.[p.key] ?? true}
                        className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                    </label>
                  ))}
                </div>

                <ModalFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
                  <Button
                    type="submit"
                    loading={isPending}
                    disabled={selectedUser.role === 'super_admin' && initialUsers.filter(u => u.role === 'super_admin' && u.status === 'active').length <= 1}
                  >
                    Save Changes
                  </Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* 4. Delete User */}
      <Modal open={showDelete} onOpenChange={setShowDelete}>
        <ModalContent>
          {selectedUser && (
            <>
              <ModalHeader>
                <ModalTitle className="text-rose-500 text-left">Delete Account?</ModalTitle>
                <ModalDescription className="text-left">
                  This will permanently delete <span className="font-bold">{selectedUser.full_name || selectedUser.email}</span>.
                  This cannot be undone.
                </ModalDescription>
              </ModalHeader>
              <form action={fd => handleAction(deleteUserAction, fd, () => setShowDelete(false))}>
                <input type="hidden" name="userId" value={selectedUser.id} />
                {selectedUser.role === 'super_admin' && initialUsers.filter(u => u.role === 'super_admin').length <= 1 && (
                  <p className="text-[12px] text-amber-500 font-bold mb-4 text-center">Cannot delete the last Super Admin.</p>
                )}
                <ModalFooter>
                  <Button type="button" variant="outline" onClick={() => setShowDelete(false)} disabled={isPending}>Keep Account</Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    loading={isPending}
                    disabled={selectedUser.role === 'super_admin' && initialUsers.filter(u => u.role === 'super_admin').length <= 1}
                  >
                    Yes, Delete
                  </Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* 5. Status Modal — now includes real Auth ban notice */}
      <Modal open={showStatus} onOpenChange={setShowStatus}>
        <ModalContent>
          {selectedUser && (
            <>
              <ModalHeader>
                <ModalTitle>Manage Account Access</ModalTitle>
                <ModalDescription>
                  Set login permissions for <span className="font-bold">{selectedUser.full_name || selectedUser.email}</span>.
                  Suspended and banned users will have their sessions terminated.
                </ModalDescription>
              </ModalHeader>
              <form action={fd => handleAction(toggleStatusAction, fd, () => setShowStatus(false))} className="space-y-4 pt-2">
                <input type="hidden" name="userId" value={selectedUser.id} />
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { val: 'active',    label: 'Active',    desc: 'Full access — can log in normally.', icon: CheckCircle, col: 'text-emerald-500' },
                    { val: 'suspended', label: 'Suspended', desc: 'Temporarily blocked from login.', icon: Slash, col: 'text-amber-500' },
                    { val: 'banned',    label: 'Banned',    desc: 'Permanently blocked from all access.', icon: Ban, col: 'text-red-500' },
                  ].map(s => (
                    <label key={s.val}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
                        ${selectedUser.status === s.val
                          ? 'bg-[var(--color-surface-2)] border-[var(--color-primary)]/50'
                          : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30'}`}
                    >
                      <input type="radio" name="status" value={s.val} defaultChecked={selectedUser.status === s.val} className="sr-only" />
                      <div className={`w-9 h-9 rounded-xl border border-[var(--color-border)] flex items-center justify-center ${s.col}`}>
                        <s.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`text-[13px] font-bold ${s.col}`}>{s.label}</p>
                        <p className="text-[11px] text-[var(--color-muted)]">{s.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedUser.role === 'super_admin' && initialUsers.filter(u => u.role === 'super_admin' && u.status === 'active').length <= 1 && selectedUser.status === 'active' && (
                  <p className="text-[12px] text-amber-500 font-bold text-center">
                    ⚠️ Cannot suspend/ban the last active Super Admin.
                  </p>
                )}
                <ModalFooter>
                  <Button type="button" variant="outline" onClick={() => setShowStatus(false)}>Cancel</Button>
                  <Button
                    type="submit"
                    loading={isPending}
                    disabled={
                      selectedUser.role === 'super_admin' &&
                      initialUsers.filter(u => u.role === 'super_admin' && u.status === 'active').length <= 1 &&
                      selectedUser.status === 'active'
                    }
                  >
                    Update Status
                  </Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>

    </div>
  );
}
