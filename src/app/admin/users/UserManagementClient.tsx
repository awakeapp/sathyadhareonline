'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input, Select, Label } from '@/components/ui/Input';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import { toast } from 'sonner';
import {
  UserPlus, Mail, Edit2, Trash2, Slash, Ban, CheckCircle2, Search, Download, User, Clock, KeyRound, MoreVertical, Users,
  Activity, FileText, ChevronRight, LayoutGrid, CalendarDays, ShieldCheck, Globe, Monitor, Sidebar, ShieldAlert, Send
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
  getUserActivityStatsAction,
  revokeSessionsAction,
  bulkUserAction
} from './actions';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  status: string;
  created_at: string;
  last_sign_in_at?: string | null;
  last_sign_in_ip?: string | null;
  last_sign_in_agent?: string | null;
  account_notes?: string | null;
  avatar_url?: string | null;
  permissions?: {
    can_articles: boolean;
    can_sequels: boolean;
    can_library: boolean;
    can_publish_articles?: boolean;
    can_publish_sequels?: boolean;
    can_publish_library?: boolean;
  };
}

const ROLE_META: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'S. Admin', color: 'border-[var(--color-text)]/10 bg-[var(--color-text)]/5 text-[var(--color-text)]/70' },
  admin:       { label: 'Admin',    color: 'border-[var(--color-text)]/10 bg-[var(--color-text)]/5 text-[var(--color-text)]/70' },
  editor:      { label: 'Editor',   color: 'border-indigo-100 bg-indigo-50 text-indigo-600' },
  contributor: { label: 'Collab',   color: 'border-emerald-100 bg-emerald-50 text-emerald-600' },
  reader:      { label: 'Reader',   color: 'border-[var(--color-text)]/5 text-[var(--color-muted)]' },
};

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  active:    { label: 'Active',    color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
    if (searchParams?.get('invite') === 'true') {
      setShowInvite(true);
    }
  }, [searchParams, pathname]);

  const filteredUsers = useMemo(() => {
    return initialUsers.filter(u => {
      const matchSearch =
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const roleMatch = roleFilter === 'all' || u.role === roleFilter;
      const statusMatch = statusFilter === 'all' || u.status === statusFilter;

      if (viewMode === 'users') return matchSearch && roleMatch && statusMatch && (u.role === 'admin' || u.role === 'super_admin' || u.role === 'editor' || u.role === 'contributor');
      if (viewMode === 'readers') return matchSearch && u.role === 'reader';
      return matchSearch;
    });
  }, [initialUsers, searchQuery, viewMode, roleFilter, statusFilter]);

  const groupedStaff = useMemo(() => {
    if (viewMode !== 'users') return null;
    const roleOrder = ['super_admin', 'admin', 'editor', 'contributor'];
    const groups: Record<string, UserProfile[]> = { super_admin: [], admin: [], editor: [], contributor: [] };
    filteredUsers.forEach(u => { if (groups[u.role]) groups[u.role].push(u); });
    return roleOrder.map(r => ({ role: r, users: groups[r] })).filter(g => g.users.length > 0);
  }, [filteredUsers, viewMode]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredUsers.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredUsers.map(u => u.id)));
  };

  async function handleBulkAction(action: 'role' | 'status' | 'delete' | 'revoke', value?: string) {
    if (!selectedIds.size || isPending) return;
    startTransition(async () => {
      const res = await bulkUserAction(Array.from(selectedIds), action, value);
      if (res.error) toast.error(res.error);
      else {
        toast.success(res.message);
        setSelectedIds(new Set());
      }
    });
  }

  async function handleRevokeSessions(userId: string) {
    if (isPending) return;
    startTransition(async () => {
      const res = await revokeSessionsAction(userId);
      if (res.error) toast.error(res.error);
      else toast.success(res.message);
    });
  }

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
    const b = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(b);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'users_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const openDrawerForUser = async (user: UserProfile) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerStats(null);
    try {
      const res = await getUserActivityStatsAction(user.id);
      if (res.success && res.stats) {
        setDrawerStats({ stats: res.stats, recentWork: res.recentWork || [] });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDrawerLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 pb-24">
      {/* ── Action Bar ── */}
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

      {/* ── Tabs ── */}
      <div className="flex bg-[var(--color-surface-2)]/50 p-1 rounded-xl border border-[var(--color-border)] relative">
        {(['users', 'readers', 'subscribed'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => { setViewMode(mode); setSelectedIds(new Set()); }}
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

      {/* ── Search ── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" strokeWidth={2.5} />
          <input
            placeholder={`Search ${viewMode}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[15px] font-medium focus:border-[var(--color-primary)]/40 outline-none transition-all placeholder:text-[var(--color-muted)]/30"
          />
        </div>
        {filteredUsers.length > 0 && (
          <button 
            onClick={selectAll}
            className={`h-10 px-4 rounded-xl border border-[var(--color-border)] text-[10px] font-black uppercase tracking-widest transition-all ${selectedIds.size === filteredUsers.length ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]'}`}
          >
            {selectedIds.size === filteredUsers.length ? 'Deselect' : 'Select All'}
          </button>
        )}
      </div>

      {/* ── User Feed ── */}
      <div className="flex flex-col gap-2 pt-2">
        {viewMode === 'users' ? (
          groupedStaff?.map(group => (
            <div key={group.role} className="flex flex-col gap-2 mb-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)] opacity-50">
                  {ROLE_META[group.role]?.label || group.role}
                </h3>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-muted)]">{group.users.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {group.users.map(u => (
                  <UserCard 
                    key={u.id} 
                    user={u} 
                    currentUserRole={currentUserRole}
                    isSelected={selectedIds.has(u.id)}
                    onSelect={() => toggleSelect(u.id)}
                    onOpen={() => openDrawerForUser(u)}
                    handleRevokeSessions={handleRevokeSessions}
                    setShowDelete={setShowDelete}
                    setShowEdit={setShowEdit}
                    setShowStatus={setShowStatus}
                    setShowReset={setShowReset}
                    setSelectedUser={setSelectedUser}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filteredUsers.map(u => (
              <UserCard 
                key={u.id} 
                user={u} 
                currentUserRole={currentUserRole}
                isSelected={selectedIds.has(u.id)}
                onSelect={() => toggleSelect(u.id)}
                onOpen={() => openDrawerForUser(u)}
                handleRevokeSessions={handleRevokeSessions}
                setShowDelete={setShowDelete}
                setShowEdit={setShowEdit}
                setShowStatus={setShowStatus}
                setShowReset={setShowReset}
                setSelectedUser={setSelectedUser}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Bulk Action Bar ── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-full max-w-[400px] px-4 animate-in slide-in-from-bottom-5 duration-500">
          <div className="bg-zinc-900 border border-white/10 rounded-[2rem] p-4 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 pl-2">
               <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-black shadow-lg shadow-[var(--color-primary)]/20">
                 {selectedIds.size}
               </div>
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                    <PresenceButton className="h-10 px-4 rounded-xl bg-white/10 text-white text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all">
                      Roles
                    </PresenceButton>
                 </DropdownMenuTrigger>
                 <DropdownMenuPortal>
                   <DropdownMenuContent className="p-1 bg-zinc-900 border-white/10 rounded-xl w-36">
                      <DropdownMenuItem onClick={() => handleBulkAction('role', 'editor')} className="text-white hover:bg-white/5 font-bold text-xs p-2 rounded-lg">Editor</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('role', 'contributor')} className="text-white hover:bg-white/5 font-bold text-xs p-2 rounded-lg">Contributor</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('role', 'reader')} className="text-white hover:bg-white/5 font-bold text-xs p-2 rounded-lg">Reader</DropdownMenuItem>
                   </DropdownMenuContent>
                 </DropdownMenuPortal>
               </DropdownMenu>

                <PresenceButton 
                  onClick={() => handleBulkAction('revoke')}
                  className="h-10 px-4 rounded-xl bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                >
                  Revoke
                </PresenceButton>

                <PresenceButton 
                  onClick={() => handleBulkAction('delete')}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20"
                >
                  <Trash2 size={16} />
                </PresenceButton>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Drawer ── */}
      <BottomSheet isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
        {selectedUser && (
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-5 p-2">
              <div className="w-20 h-20 rounded-[2rem] bg-[var(--color-surface-2)] overflow-hidden border border-[var(--color-border)] shadow-inner">
                {selectedUser.avatar_url ? (
                  <Image src={selectedUser.avatar_url} alt="" width={80} height={80} className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)]">
                    <User size={32} strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-[var(--color-text)] uppercase tracking-tight leading-none mb-1.5">{selectedUser.full_name || 'Incognito User'}</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${ROLE_META[selectedUser.role]?.color}`}>
                    {ROLE_META[selectedUser.role]?.label || selectedUser.role}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${STATUS_META[selectedUser.status]?.bg} ${STATUS_META[selectedUser.status]?.color}`}>
                    {selectedUser.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-[var(--color-surface-2)] rounded-[2rem] border border-[var(--color-border)] flex flex-col gap-1">
                 <span className="text-[9px] font-black text-[var(--color-muted)] uppercase tracking-widest">Email</span>
                 <p className="text-[12px] font-bold text-[var(--color-text)] truncate">{selectedUser.email}</p>
              </div>
              <div className="p-4 bg-[var(--color-surface-2)] rounded-[2rem] border border-[var(--color-border)] flex flex-col gap-1">
                 <span className="text-[9px] font-black text-[var(--color-muted)] uppercase tracking-widest">Joined</span>
                 <p className="text-[12px] font-bold text-[var(--color-text)]">{formatDate(selectedUser.created_at)}</p>
              </div>
            </div>

            {/* Security Audit (IP / Agent) */}
            <div className="p-5 bg-[var(--color-surface-2)] rounded-[2.5rem] border border-[var(--color-border)] space-y-4">
              <div className="flex items-center justify-between">
                 <h4 className="text-[10px] font-black text-[var(--color-text)] uppercase tracking-[0.2em] flex items-center gap-2">
                   <ShieldCheck size={14} className="text-[var(--color-primary)]" /> Security Baseline
                 </h4>
                 <span className="text-[9px] font-bold text-[var(--color-muted)]">Verified</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                 <div className="flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-white shadow-sm border border-[var(--color-border)]"><Globe size={14} className="text-indigo-500" /></div>
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-[var(--color-muted)] uppercase tracking-widest">Last Access IP</span>
                      <span className="text-[11px] font-mono font-bold">{selectedUser.last_sign_in_ip || 'Not logged'}</span>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-white shadow-sm border border-[var(--color-border)]"><Monitor size={14} className="text-emerald-500" /></div>
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-[var(--color-muted)] uppercase tracking-widest">Browser / OS</span>
                      <span className="text-[11px] font-bold truncate max-w-[200px]">{selectedUser.last_sign_in_agent || 'Unknown Agent'}</span>
                   </div>
                 </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-[var(--color-muted)] uppercase tracking-[0.2em] px-2 opacity-50 flex items-center gap-2">
                <Activity size={12} /> Contributions & Work
              </h4>
              {drawerLoading ? (
                <div className="h-20 bg-[var(--color-surface-2)] rounded-[2rem] animate-pulse" />
              ) : drawerStats ? (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { l: 'Total', v: drawerStats.stats.total, c: 'bg-[var(--color-surface)] text-[var(--color-text)]' },
                      { l: 'Live', v: drawerStats.stats.published, c: 'bg-emerald-50 text-emerald-600' },
                      { l: 'Review', v: drawerStats.stats.inReview, c: 'bg-amber-50 text-amber-600' },
                      { l: 'Drafts', v: drawerStats.stats.drafted, c: 'bg-zinc-100 text-zinc-600' },
                    ].map(s => (
                      <div key={s.l} className={`p-3 rounded-2xl border border-[var(--color-border)] flex flex-col items-center gap-1 ${s.c}`}>
                        <span className="text-[14px] font-black">{s.v}</span>
                        <span className="text-[7px] font-black uppercase tracking-widest opacity-60">{s.l}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-[var(--color-muted)] uppercase tracking-widest px-2">Most Recent Articles</p>
                    <div className="flex flex-col gap-2">
                      {drawerStats.recentWork.length === 0 ? (
                        <p className="text-[10px] p-4 text-center bg-[var(--color-surface-2)] rounded-2xl italic text-[var(--color-muted)]">No articles created yet</p>
                      ) : drawerStats.recentWork.map(art => (
                        <div key={art.id} className="flex items-center justify-between p-3 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-border)] group">
                           <div className="flex-1 min-w-0">
                             <p className="text-[12px] font-bold text-[var(--color-text)] truncate">{art.title}</p>
                             <p className="text-[8px] font-black uppercase tracking-widest text-[var(--color-muted)]">{formatDate(art.created_at)}</p>
                           </div>
                           <ChevronRight size={14} className="text-[var(--color-muted)] group-hover:translate-x-1 transition-transform" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center bg-rose-50 text-rose-500 rounded-2xl text-[10px] font-bold">Failed to load stats</div>
              )}
            </div>

            {/* Account Notes */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800">
               <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Administrative Notes</span>
               <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                 {selectedUser.account_notes || 'No internal notes added for this profile.'}
               </p>
            </div>

            {/* Security Activity (New) */}
            <div className="space-y-3">
               <h4 className="text-[10px] font-black text-[var(--color-muted)] uppercase tracking-[0.2em] px-2 opacity-50 flex items-center gap-2">
                 <ShieldAlert size={12} /> Security Activity Log
               </h4>
               {drawerLoading ? (
                 <div className="h-40 bg-[var(--color-surface-2)] rounded-[2rem] animate-pulse" />
               ) : (drawerStats as any)?.auditLogs?.length === 0 ? (
                 <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-950 rounded-[2rem] border border-zinc-100 dark:border-zinc-900 italic text-[10px] text-[var(--color-muted)]">
                   No security events recorded.
                 </div>
               ) : (
                 <div className="flex flex-col gap-2">
                    {(drawerStats as any).auditLogs.map((log: any) => (
                      <div key={log.id} className="p-3 bg-[var(--color-surface-2)] rounded-2xl border border-[var(--color-border)] flex flex-col gap-2">
                         <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                               <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                  <Activity size={12} strokeWidth={2.5} />
                               </div>
                               <span className="text-[10px] font-black font-mono text-zinc-900 dark:text-zinc-50 uppercase tracking-tighter truncate max-w-[150px]">
                                  {log.action.replace(/_/g, ' ')}
                               </span>
                            </div>
                            <span className="text-[8px] font-black text-[var(--color-muted)] uppercase tracking-widest opacity-40">
                               {new Date(log.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                         </div>
                         <div className="flex items-center gap-3 opacity-60">
                            <div className="flex items-center gap-1">
                               <Globe size={10} className="text-zinc-400" />
                               <span className="text-[9px] font-bold font-mono text-zinc-500">{log.ip_address || '?.?.?.?'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                               <Monitor size={10} className="text-zinc-400" />
                               <span className="text-[9px] font-bold text-zinc-500 truncate max-w-[120px]">{log.user_agent?.split(' ')[0] || 'Unknown'} Browser</span>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
            
            <div className="flex gap-2 pt-4">
              <PresenceButton 
                variant="outline" 
                className="flex-1 rounded-2xl h-14" 
                onClick={() => { setIsDrawerOpen(false); setSelectedUser(selectedUser); setShowEdit(true); }}
              >
                <Edit2 size={16} className="mr-2" /> Modify Profile
              </PresenceButton>
              <PresenceButton 
                variant="outline" 
                className="flex-1 rounded-2xl h-14 bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100"
                onClick={() => handleRevokeSessions(selectedUser.id)}
                loading={isPending}
              >
                <KeyRound size={16} className="mr-2" /> Revoke Sessions
              </PresenceButton>
              <PresenceButton 
                className="flex-1 rounded-2xl h-14 bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]"
                onClick={exportCSV}
              >
                <Download size={16} className="mr-2" /> Export
              </PresenceButton>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* ── All Modals (Integrated with new fields) ── */}
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
                  <option value="contributor">Contributor (Collab)</option>
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
                <option value="contributor">Contributor</option>
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <Input name="full_name" defaultValue={selectedUser.full_name || ''} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select name="role" defaultValue={selectedUser.role}>
                      <option value="reader">Reader</option>
                      <option value="contributor">Contributor</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                      {currentUserRole === 'super_admin' && <option value="super_admin">Super Admin</option>}
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                   <Label>Account Notes</Label>
                   <textarea name="account_notes" defaultValue={selectedUser.account_notes || ''} className="w-full p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm font-medium h-20 resize-none" placeholder="Internal notes for this user..." />
                </div>

                <div className="space-y-3 pt-3 border-t border-[var(--color-border)]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] flex items-center gap-2">
                    <Sidebar size={12} /> Granular Access Control
                  </p>
                  
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { id: 'can_articles', label: 'Article Section', pub: 'can_publish_articles', pubLabel: 'Can Publish Articles' },
                      { id: 'can_sequels', label: 'Sequel Section', pub: 'can_publish_sequels', pubLabel: 'Can Publish Sequels' },
                      { id: 'can_library', label: 'Library Section', pub: 'can_publish_library', pubLabel: 'Can Publish Library' },
                    ].map(p => (
                      <div key={p.id} className="space-y-1.5">
                        <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] cursor-pointer hover:bg-[var(--color-surface)] transition-colors group">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-[var(--color-text)]">{p.label}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">View / Write Access</span>
                          </div>
                          <input
                            type="checkbox"
                            name={p.id}
                            defaultChecked={(selectedUser.permissions as any)?.[p.id] ?? true}
                            className="w-5 h-5 rounded-lg border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)] transition-all"
                          />
                        </label>
                        <label className="flex items-center justify-between p-3 ml-6 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]/50 cursor-pointer hover:bg-[var(--color-surface)] transition-colors group">
                          <div className="flex flex-col">
                            <span className="text-[12px] font-bold text-emerald-600">Publishing Auth</span>
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Make Content Live</span>
                          </div>
                          <input
                            type="checkbox"
                            name={p.pub}
                            defaultChecked={(selectedUser.permissions as any)?.[p.pub] ?? true}
                            className="w-4 h-4 rounded-lg border-gray-300 text-emerald-500 focus:ring-emerald-500 transition-all"
                          />
                        </label>
                      </div>
                    ))}
                  </div>
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
                <ModalDescription>This action is irreversible. All authentication data for {selectedUser.email} will be purged.</ModalDescription>
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
                <ModalTitle>Account Status: {selectedUser.full_name || selectedUser.email}</ModalTitle>
              </ModalHeader>
              <form action={fd => handleAction(toggleStatusAction as any, fd, () => setShowStatus(false))} className="space-y-4 pt-2 text-left">
                <input type="hidden" name="userId" value={selectedUser.id} />
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select name="status" defaultValue={selectedUser.status}>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                  </Select>
                </div>
                <ModalFooter>
                  <Button type="button" variant="outline" onClick={() => setShowStatus(false)}>Cancel</Button>
                  <Button type="submit" loading={isPending}>Save Status</Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

function UserCard({ user, currentUserRole, isSelected, onSelect, onOpen, setShowDelete, setShowEdit, setShowStatus, setShowReset, setSelectedUser, handleRevokeSessions }: { 
  user: UserProfile; 
  currentUserRole: string;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  setShowDelete: (v: boolean) => void;
  setShowEdit: (v: boolean) => void;
  setShowStatus: (v: boolean) => void;
  setShowReset: (v: boolean) => void;
  setSelectedUser: (u: UserProfile) => void;
  handleRevokeSessions: (id: string) => void;
}) {
  const status = STATUS_META[user.status] || STATUS_META.active;
  const role = ROLE_META[user.role] || ROLE_META.reader;

  const handleAction = (u: UserProfile, openFn: (v: boolean) => void) => {
    setSelectedUser(u);
    openFn(true);
  };

  return (
    <PresenceCard className={`p-0 overflow-hidden group transition-all duration-300 border ${isSelected ? 'border-[var(--color-primary)] ring-4 ring-[var(--color-primary)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/30'}`}>
      <div className="flex items-stretch">
        {/* Selection Checkbox Area */}
        <button 
          onClick={onSelect}
          className={`w-12 flex items-center justify-center border-r border-[var(--color-border)] transition-all ${isSelected ? 'bg-[var(--color-primary)]/5' : 'hover:bg-[var(--color-surface-2)]'}`}
        >
          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[var(--color-primary)] border-[var(--color-primary)] scale-110 shadow-lg' : 'border-[var(--color-border)] bg-transparent'}`}>
            {isSelected && <CheckCircle2 size={12} className="text-white" />}
          </div>
        </button>

        <div className="flex-1 flex items-center gap-3 p-3 min-w-0" onClick={onOpen}>
          <div className="relative flex-shrink-0">
             <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden group-hover:shadow-md transition-shadow shadow-inner">
                {user.avatar_url ? (
                  <Image src={user.avatar_url} alt="" width={48} height={48} className="object-cover" />
                ) : (
                  <User size={20} className="text-[var(--color-muted)]" />
                )}
             </div>
             <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${status.bg} ${status.color}`}>
                <status.icon size={8} />
             </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h4 className="text-[13px] font-bold text-[var(--color-text)] truncate">{user.full_name || 'Anonymous'}</h4>
              {(user.permissions as any)?.can_publish_articles && <ShieldCheck size={10} className="text-emerald-500" />}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${role.color}`}>
                {role.label}
              </span>
              <span className="text-[9px] font-bold text-[var(--color-muted)] flex items-center gap-1">
                <Clock size={10} /> Active {new Date(user.last_sign_in_at || user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
        </div>

        <div className="p-2 flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] transition-colors">
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent align="end" className="w-48 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl rounded-xl p-1 z-[100]">
                <DropdownMenuLabel className="px-3 py-2 text-[10px] uppercase font-black opacity-30">Quick Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleAction(user, setShowEdit)} className="flex items-center px-3 py-2 rounded-lg text-sm font-bold hover:bg-[var(--color-surface-2)] group">
                  <Edit2 size={14} className="mr-3 text-indigo-500 group-hover:scale-110 transition-transform" /> Modify Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction(user, setShowStatus)} className="flex items-center px-3 py-2 rounded-lg text-sm font-bold hover:bg-[var(--color-surface-2)] group">
                  <Slash size={14} className="mr-3 text-amber-500 group-hover:rotate-12 transition-transform" /> Account Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction(user, setShowReset)} className="flex items-center px-3 py-2 rounded-lg text-sm font-bold hover:bg-[var(--color-surface-2)] group">
                  <KeyRound size={14} className="mr-3 text-emerald-500 group-hover:rotate-45 transition-transform" /> Reset Password
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRevokeSessions(user.id)} className="flex items-center px-3 py-2 rounded-lg text-sm font-bold hover:bg-amber-50 text-amber-600 group">
                  <KeyRound size={14} className="mr-3 text-amber-500 group-hover:scale-110 transition-transform" /> Revoke Sessions
                </DropdownMenuItem>
                <DropdownMenuSeparator className="opacity-10" />
                <DropdownMenuItem onClick={() => handleAction(user, setShowDelete)} className="flex items-center px-3 py-2 rounded-lg text-sm font-bold text-rose-500 hover:bg-rose-50 group">
                  <Trash2 size={14} className="mr-3 group-hover:animate-bounce" /> Delete User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        </div>
      </div>
    </PresenceCard>
  );
}
