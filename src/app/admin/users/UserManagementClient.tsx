'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input, Select, Label } from '@/components/ui/Input';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import { toast } from 'sonner';
import {
  UserPlus, Mail, Edit2, Trash2,
  Slash, Ban, CheckCircle, Search, Download, User, Clock, KeyRound, MoreVertical, Users,
  Activity, FileText, ChevronRight, LayoutGrid, CalendarDays
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import {
  PresenceCard,
  PresenceButton,
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
  getUserActivityStatsAction
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

  // Detail Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerStats, setDrawerStats] = useState<{
    stats: { total: number; published: number; drafted: number; inReview: number };
    recentWork: any[];
  } | null>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchParams?.get('invite') === 'true') setShowInvite(true);
    }, 0);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  const handleUserClick = async (u: UserProfile) => {
    setSelectedUser(u);
    setIsDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerStats(null);
    try {
      const res = await getUserActivityStatsAction(u.id);
      if (res.success && res.stats) {
        setDrawerStats({ stats: res.stats, recentWork: res.recentWork || [] });
      }
    } finally {
      setDrawerLoading(false);
    }
  };

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

  // Grouped Staff
  const groupedStaff = useMemo(() => {
    if (viewMode !== 'users') return null;
    const roleOrder = ['super_admin', 'admin', 'editor'];
    const groups: Record<string, UserProfile[]> = { super_admin: [], admin: [], editor: [] };
    filteredUsers.forEach(u => { if (groups[u.role]) groups[u.role].push(u); });
    return roleOrder.map(r => ({ role: r, users: groups[r] })).filter(g => g.users.length > 0);
  }, [filteredUsers, viewMode]);

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

      {/* ── User List / Groups ── */}
      <div className="space-y-8">
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
        ) : viewMode === 'users' ? (
          <div className="space-y-12">
            {groupedStaff?.map((group) => (
              <div key={group.role} className="relative">
                <div className="flex items-center gap-3 mb-6 px-1">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-text)] opacity-40">
                    {ROLE_META[group.role]?.label || group.role}
                  </span>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--color-border)] to-transparent" />
                  <span className="text-[11px] font-black text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-md min-w-[24px] text-center">
                    {group.users.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {group.users.map(u => (
                    <UserCard key={u.id} user={u} onUserClick={handleUserClick} setSelectedUser={setSelectedUser} setShowStatus={setShowStatus} setShowEdit={setShowEdit} setShowReset={setShowReset} setShowDelete={setShowDelete} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map(u => (
               <UserCard key={u.id} user={u} onUserClick={handleUserClick} setSelectedUser={setSelectedUser} setShowStatus={setShowStatus} setShowEdit={setShowEdit} setShowReset={setShowReset} setShowDelete={setShowDelete} />
            ))}
          </div>
        )}
      </div>

      {/* ── USER DETAILS DRAWER (Premium Profile) ── */}
      <BottomSheet 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        title="Profile Details"
      >
        {selectedUser && (
          <div className="flex flex-col gap-6 pb-8">
            <div className="flex items-center gap-4">
               <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-[32px] font-bold text-white shadow-xl
                 ${selectedUser.status === 'active' ? 'bg-[var(--color-primary)]' : 'bg-zinc-500'}`}>
                 {selectedUser.avatar_url ? (
                   <Image src={selectedUser.avatar_url} alt={selectedUser.full_name || ''} width={80} height={80} className="w-full h-full object-cover rounded-3xl" unoptimized />
                 ) : (
                   (selectedUser.full_name || '?').charAt(0).toUpperCase()
                 )}
               </div>
               <div className="flex-1 min-w-0">
                  <h2 className="text-[22px] font-bold text-[var(--color-text)] tracking-tight leading-tight">
                    {selectedUser.full_name || 'Member'}
                  </h2>
                  <p className="text-[14px] text-[var(--color-muted)] font-medium mt-0.5 truncate">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]/50">
                      {ROLE_META[selectedUser.role]?.label || selectedUser.role}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${STATUS_META[selectedUser.status]?.bg} ${STATUS_META[selectedUser.status]?.color}`}>
                      {STATUS_META[selectedUser.status]?.label}
                    </span>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-[var(--color-surface-2)] rounded-2xl border border-[var(--color-border)]">
                <CalendarDays size={16} className="text-[var(--color-muted)] mb-2" />
                <p className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-wider">Joined</p>
                <p className="text-[15px] font-bold text-[var(--color-text)] mt-0.5">{formatDate(selectedUser.created_at)}</p>
              </div>
              <div className="p-4 bg-[var(--color-surface-2)] rounded-2xl border border-[var(--color-border)]">
                <Clock size={16} className="text-[var(--color-muted)] mb-2" />
                <p className="text-[11px] font-bold text-[var(--color-muted)] uppercase tracking-wider">Last Activity</p>
                <p className="text-[15px] font-bold text-[var(--color-text)] mt-0.5">{formatRelative(selectedUser.last_sign_in_at) || 'Never'}</p>
              </div>
            </div>

            {['super_admin', 'admin', 'editor'].includes(selectedUser.role) && (
              <div className="space-y-4 pt-2 border-t border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                   <h3 className="text-[13px] font-bold text-[var(--color-text)] uppercase tracking-widest px-1">Activity Stats</h3>
                   {drawerLoading && <div className="animate-spin h-3 w-3 border-2 border-[var(--color-primary)] border-t-transparent rounded-full" />}
                </div>

                {drawerStats ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-2">
                       <div className="flex flex-col items-center p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                         <span className="text-[18px] font-black text-[var(--color-text)]">{drawerStats.stats.published}</span>
                         <span className="text-[9px] font-bold text-[#10b981] uppercase tracking-tighter">Published</span>
                       </div>
                       <div className="flex flex-col items-center p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                         <span className="text-[18px] font-black text-[var(--color-text)]">{drawerStats.stats.drafted}</span>
                         <span className="text-[9px] font-bold text-[var(--color-muted)] uppercase tracking-tighter">Drafted</span>
                       </div>
                       <div className="flex flex-col items-center p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
                         <span className="text-[18px] font-black text-[var(--color-text)]">{drawerStats.stats.inReview}</span>
                         <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">In Review</span>
                       </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[12px] font-bold text-[var(--color-muted)] uppercase tracking-widest px-1">Recent Articles</p>
                      {drawerStats.recentWork.length === 0 ? (
                        <div className="py-8 text-center bg-[var(--color-surface-2)]/50 rounded-2xl text-[13px] text-[var(--color-muted)] italic">
                          No articles written yet
                        </div>
                      ) : (
                        drawerStats.recentWork.map(art => (
                          <div key={art.id} className="flex items-center justify-between p-3 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-border)] shadow-sm">
                            <div className="min-w-0 mr-3">
                              <p className="text-[14px] font-bold text-[var(--color-text)] truncate">{art.title}</p>
                              <p className="text-[11px] text-[var(--color-muted)] opacity-60 mt-0.5">{formatDate(art.created_at)}</p>
                            </div>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter
                              ${art.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                              {art.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : !drawerLoading && (
                   <div className="p-4 text-center text-[var(--color-muted)] text-[12px]">Click a name to load detailed activity</div>
                )}
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      {/* ── MODALS ── */}

      <Modal open={showReset} onOpenChange={setShowReset}>
        <ModalContent>
          {selectedUser && (
            <>
              <ModalHeader>
                <ModalTitle>Send Password Reset</ModalTitle>
                <ModalDescription>
                  Send a password reset email to <span className="font-bold">{selectedUser.email}</span>.
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
              <Label>Temporary Password</Label>
              <Input name="password" type="password" required minLength={6} />
            </div>
            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" loading={isPending}>Create Account</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <Modal open={showInvite} onOpenChange={setShowInvite}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Invite Team Member</ModalTitle>
          </ModalHeader>
          <form action={fd => handleAction(inviteUserAction, fd, () => setShowInvite(false))} className="space-y-4 pt-2 text-left">
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input name="email" type="email" required />
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

      <Modal open={showEdit} onOpenChange={setShowEdit}>
        <ModalContent>
          {selectedUser && (
            <>
              <ModalHeader>
                <ModalTitle>Edit Profile</ModalTitle>
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
                </div>
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
                  <Button type="submit" loading={isPending}>Save Changes</Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal open={showDelete} onOpenChange={setShowDelete}>
        <ModalContent>
          {selectedUser && (
            <>
              <ModalHeader>
                <ModalTitle className="text-rose-500">Delete Account?</ModalTitle>
              </ModalHeader>
              <form action={fd => handleAction(deleteUserAction, fd, () => setShowDelete(false))}>
                <input type="hidden" name="userId" value={selectedUser.id} />
                <ModalFooter>
                  <Button type="button" variant="outline" onClick={() => setShowDelete(false)} disabled={isPending}>Keep Account</Button>
                  <Button type="submit" variant="destructive" loading={isPending}>Yes, Delete</Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal open={showStatus} onOpenChange={setShowStatus}>
        <ModalContent>
          {selectedUser && (
            <>
              <ModalHeader>
                <ModalTitle>Manage Account Access</ModalTitle>
              </ModalHeader>
              <form action={fd => handleAction(toggleStatusAction, fd, () => setShowStatus(false))} className="space-y-4 pt-2">
                <input type="hidden" name="userId" value={selectedUser.id} />
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { val: 'active',    label: 'Active',    icon: CheckCircle, col: 'text-emerald-500' },
                    { val: 'suspended', label: 'Suspended', icon: Slash, col: 'text-amber-500' },
                    { val: 'banned',    label: 'Banned',    icon: Ban, col: 'text-red-500' },
                  ].map(s => (
                    <label key={s.val} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${selectedUser.status === s.val ? 'bg-[var(--color-surface-2)] border-[var(--color-primary)]/50' : 'border-[var(--color-border)]'}`}>
                      <input type="radio" name="status" value={s.val} defaultChecked={selectedUser.status === s.val} className="sr-only" />
                      <div className={`w-9 h-9 rounded-xl border border-[var(--color-border)] flex items-center justify-center ${s.col}`}>
                        <s.icon className="w-4 h-4" />
                      </div>
                      <p className={`text-[13px] font-bold ${s.col}`}>{s.label}</p>
                    </label>
                  ))}
                </div>
                <ModalFooter>
                  <Button type="button" variant="outline" onClick={() => setShowStatus(false)}>Cancel</Button>
                  <Button type="submit" loading={isPending}>Update Status</Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

function UserCard({ user: u, onUserClick, setSelectedUser, setShowStatus, setShowEdit, setShowReset, setShowDelete }: any) {
  const initials = (u.full_name || u.email || '?').charAt(0).toUpperCase();

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
    return iso.split('T')[0];
  };

  const lastSeen = formatRelative(u.last_sign_in_at);

  return (
    <div className="group relative">
      <div className="flex items-center p-3.5 bg-[var(--color-surface)] rounded-[2rem] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 hover:shadow-2xl transition-all duration-300 gap-4">
        <div onClick={() => onUserClick(u)} className="relative shrink-0 cursor-pointer overflow-hidden rounded-2xl">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[18px] font-bold text-white shadow-sm transition-all duration-500 ${u.status === 'active' ? 'bg-gradient-to-br from-[var(--color-primary)] to-indigo-600' : 'bg-zinc-500'}`}>
            {u.avatar_url ? (
              <Image src={u.avatar_url} alt={u.full_name || ''} width={48} height={48} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
            ) : initials}
          </div>
        </div>

        <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
          <div onClick={() => onUserClick(u)} className="flex-1 min-w-0 cursor-pointer">
            <h3 className="font-bold text-[17px] text-[var(--color-text)] tracking-tight leading-none truncate group-hover:text-[var(--color-primary)] transition-colors">
              {u.full_name || 'Anonymous'}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 opacity-40">
               <span className="text-[11px] font-bold uppercase tracking-tighter">Joined {u.created_at.split('T')[0]}</span>
               {lastSeen && <span className="text-[11px] font-bold uppercase tracking-tighter flex items-center gap-1.5">· {lastSeen}</span>}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <button className="w-9 h-9 rounded-xl hover:bg-[var(--color-surface-2)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4 text-[var(--color-muted)]" />
                  </button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent align="end" className="w-[180px] p-1 bg-[var(--color-surface)] border-[var(--color-border)] shadow-xl rounded-xl">
                  <DropdownMenuItem onClick={() => { setSelectedUser(u); setShowEdit(true); }} className="rounded-lg py-2 font-bold text-[12px]">Manage</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSelectedUser(u); setShowReset(true); }} className="rounded-lg py-2 font-bold text-[12px] text-indigo-500">Reset Pass</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSelectedUser(u); setShowStatus(true); }} className="rounded-lg py-2 font-bold text-[12px] text-amber-500">Status</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSelectedUser(u); setShowDelete(true); }} className="rounded-lg py-2 font-bold text-[12px] text-rose-500">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
            <div onClick={() => onUserClick(u)} className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-muted)]/20 hover:text-[var(--color-text)] transition-colors cursor-pointer">
              <ChevronRight size={18} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
