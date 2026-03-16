'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input, Select, Label } from '@/components/ui/Input';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { 
  UserPlus, Mail, Edit2, Trash2, 
  Slash, Ban, CheckCircle, Search, Download, User
} from 'lucide-react';
import { 
  PresenceCard, 
  PresenceButton 
} from '@/components/PresenceUI';
import { 
  createUserAction, 
  updateUserAction, 
  deleteUserAction, 
  inviteUserAction, 
  toggleStatusAction,
  setUserPermissionsAction
} from './actions';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  status: string;
  created_at: string;
  permissions?: {
    can_articles: boolean;
    can_sequels: boolean;
    can_library: boolean;
  };
}

const ROLE_META: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'bg-purple-500/10 text-purple-500 border-purple-500' },
  admin:       { label: 'Admin',       color: 'bg-blue-500/10 text-blue-500 border-blue-500' },
  editor:      { label: 'Editor',      color: 'bg-amber-500/10 text-amber-500 border-amber-500' },
  reader:      { label: 'Reader',      color: 'bg-gray-500/10 text-zinc-500 border-gray-500' },
};

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active:    { label: 'Active',    color: 'text-emerald-500', icon: CheckCircle },
  suspended: { label: 'Suspended', color: 'text-amber-500',   icon: Slash },
  banned:    { label: 'Banned',    color: 'text-red-500',     icon: Ban },
};

export default function UserManagementClient({ users: initialUsers, currentUserRole }: { users: UserProfile[], currentUserRole: string }) {
  const [isPending, startTransition] = useTransition();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  // Modal States
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const searchParams = useSearchParams();

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchParams?.get('invite') === 'true') {
        setShowInvite(true);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [searchParams]);

  const filteredUsers = useMemo(() => {
    return initialUsers.filter(u => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const emailMatch = u.email?.toLowerCase().includes(query);
        const nameMatch = u.full_name?.toLowerCase().includes(query);
        if (!emailMatch && !nameMatch) return false;
      }
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      return true;
    });
  }, [initialUsers, searchQuery, roleFilter, statusFilter]);

  async function handleAction(action: (fd: FormData) => Promise<{ error?: string; success?: boolean; message?: string }>, fd: FormData, closeFn: () => void) {
    if (isPending) return;
    startTransition(async () => {
      const res = await action(fd);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(res?.message || 'Action completed successfully');
        closeFn();
      }
    });
  }

  const exportCSV = () => {
    const headers = ['ID', 'Email', 'Full Name', 'Role', 'Status', 'Joined Date'];
    const rows = filteredUsers.map(u => [
      u.id, 
      u.email || 'N/A', 
      u.full_name || 'N/A', 
      u.role, 
      u.status, 
      new Date(u.created_at).toISOString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'users_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return 'Unknown';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? 'Unknown' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-4">
      
      {/* ── Action Bar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <PresenceButton onClick={() => setShowInvite(true)} className="flex-1 h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-indigo-500/20">
          <Mail className="w-5 h-5 mr-3" strokeWidth={1.25} /> Invite Team Member
        </PresenceButton>
        <PresenceButton onClick={() => setShowCreate(true)} className="flex-1 h-14 bg-white !text-zinc-900 dark:text-zinc-50 border-2 border-indigo-50 shadow-none hover:bg-indigo-50">
          <UserPlus className="w-5 h-5 mr-3" strokeWidth={1.25} /> Manual Creation
        </PresenceButton>
      </div>

      {/* ── Filters ───────────────────────────────────────────── */}
      <PresenceCard className="bg-zinc-50 dark:bg-white/5 border-none">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" strokeWidth={1.25} />
            <input 
              placeholder="Filter by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white dark:bg-zinc-950 border-none shadow-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar shrink-0">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-12 px-4 rounded-2xl bg-white dark:bg-zinc-950 border-none shadow-sm font-bold text-xs focus:ring-2 focus:ring-indigo-500/20">
              <option value="all">Roles</option>
              <option value="super_admin">Super Admins</option>
              <option value="admin">Admins</option>
              <option value="editor">Editors</option>
              <option value="reader">Readers</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-12 px-4 rounded-2xl bg-white dark:bg-zinc-950 border-none shadow-sm font-bold text-xs focus:ring-2 focus:ring-indigo-500/20">
              <option value="all">Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
            <button className="h-12 px-5 rounded-2xl bg-white dark:bg-zinc-950 border-none shadow-sm font-black text-xs text-zinc-500 hover:text-indigo-500 transition-colors" onClick={exportCSV}>
               <Download className="w-4 h-4" strokeWidth={1.25} />
            </button>
          </div>
        </div>
      </PresenceCard>

      {/* ── User List Row Layout ──────────────────────────────────────── */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <PresenceCard className="py-20 text-center flex flex-col items-center border-dashed border-2 border-indigo-100">
            <User className="w-16 h-16 mb-4 text-indigo-100" />
            <p className="font-black text-xl tracking-tight text-zinc-500">No members found</p>
            <p className="text-sm text-zinc-500/60 mt-2 font-bold uppercase tracking-widest">Adjust your search or filters</p>
          </PresenceCard>
        ) : (
          filteredUsers.map(u => {
            const roleMeta = ROLE_META[u.role] ?? ROLE_META.reader;
            const statusMeta = STATUS_META[u.status] ?? STATUS_META.active;
            const initials = (u.full_name || u.email || '?').charAt(0).toUpperCase();

            return (
              <PresenceCard key={u.id} noPadding className={`group active:scale-[0.99] transition-all duration-200 ${u.status !== 'active' ? 'opacity-70 grayscale' : ''}`}>
                 <div className="p-5 flex flex-col md:flex-row items-center gap-4">
                   
                   <div className="relative shrink-0">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ${u.status === 'active' ? 'bg-gradient-to-br from-[#5c4ae4] to-indigo-400' : 'bg-gray-400'}`}>
                       {initials}
                     </div>
                     <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white dark:border-[#1b1929] flex items-center justify-center shadow-sm ${statusMeta.color} bg-white dark:bg-zinc-950`}>
                       <statusMeta.icon className="w-3 h-3" />
                     </div>
                   </div>

                   <div className="flex-1 min-w-0 text-center md:text-left">
                     <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mb-1">
                        <p className="font-black text-lg md:text-xl tracking-tight truncate">{u.full_name || 'Incognito User'}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border-2 w-max lg:mx-0 mx-auto ${roleMeta.color.replace('border-', 'border-opacity-30 border-')}`}>
                          {roleMeta.label}
                        </span>
                     </div>
                     <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-5 gap-y-1">
                        <span className="text-xs font-bold text-zinc-500">{u.email}</span>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Joined {formatDate(u.created_at)}</span>
                     </div>
                   </div>

                   <div className="flex items-center gap-3 shrink-0">
                      <button onClick={() => { setSelectedUser(u); setShowEdit(true); }} className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-zinc-900 dark:text-zinc-50 hover:bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:text-white transition-all shadow-sm">
                        <Edit2 className="w-5 h-5" strokeWidth={1.25} />
                      </button>
                      <button onClick={() => { setSelectedUser(u); setShowStatus(true); }} className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-sm ${u.status !== 'active' ? 'bg-amber-500 text-white' : 'bg-zinc-50 dark:bg-white/5 text-zinc-500 hover:text-amber-500'}`}>
                        <Slash className="w-5 h-5" strokeWidth={1.25} />
                      </button>
                      <button onClick={() => { setSelectedUser(u); setShowDelete(true); }} className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                        <Trash2 className="w-5 h-5" strokeWidth={1.25} />
                      </button>
                   </div>
                 </div>
              </PresenceCard>
            );
          })
        )}
      </div>

      {/* ── MODALS ────────────────────────────────────────────── */}

      {/* 1. Create User Modal */}
      <Modal open={showCreate} onOpenChange={setShowCreate}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Direct Create User</ModalTitle>
            <ModalDescription>Bypass email invitation and create a user immediately.</ModalDescription>
          </ModalHeader>
          <form action={(fd) => handleAction(createUserAction, fd, () => setShowCreate(false))} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <Label>Full Name</Label>
                <Input name="full_name" placeholder="John Doe" required />
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
              <Label>Temp Password</Label>
              <Input name="password" type="text" placeholder="Minimum 6 chars" required minLength={6} />
            </div>
            <ModalFooter>
               <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
               <Button type="submit" loading={isPending}>Create Profile</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* 2. Invite User Modal */}
      <Modal open={showInvite} onOpenChange={setShowInvite}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Invite Team Member</ModalTitle>
            <ModalDescription>User will receive an email with a setup password link.</ModalDescription>
          </ModalHeader>
          <form action={(fd) => handleAction(inviteUserAction, fd, () => setShowInvite(false))} className="space-y-4 pt-2 text-left">
            <div className="space-y-1.5">
              <Label>Email</Label>
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
               <Button type="submit" loading={isPending} className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-white">Send Invitation</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* 3. Edit User Modal */}
      <Modal open={showEdit} onOpenChange={setShowEdit}>
        <ModalContent>
          {selectedUser && (
            <>
              <ModalHeader>
                <ModalTitle>Edit Profile</ModalTitle>
                <ModalDescription>Updating {selectedUser.email}</ModalDescription>
              </ModalHeader>
              <form action={(fd) => handleAction(updateUserAction, fd, () => setShowEdit(false))} className="space-y-4 pt-2 text-left">
                <input type="hidden" name="userId" value={selectedUser.id} />
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input name="full_name" defaultValue={selectedUser.full_name || ''} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Change Role</Label>
                  <Select name="role" defaultValue={selectedUser.role}>
                    <option value="reader">Reader</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                    {currentUserRole === 'super_admin' && <option value="super_admin">Super Admin</option>}
                  </Select>
                  {selectedUser.role === 'super_admin' && initialUsers.filter(u => u.role === 'super_admin' && u.status === 'active').length <= 1 && (
                    <p className="text-xs text-amber-500 font-bold mt-2">Cannot demote the last active Super Admin.</p>
                  )}
                </div>
                <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-white/5">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Resource Access (Allowed List)</p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'can_articles', label: 'Independent Articles', key: 'can_articles' },
                      { id: 'can_sequels', label: 'Sequels (Webzines)', key: 'can_sequels' },
                      { id: 'can_library', label: 'Library (Books)', key: 'can_library' },
                    ].map((p) => (
                      <label key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/5 cursor-pointer hover:bg-zinc-50 transition-colors">
                        <span className="text-sm font-bold">{p.label}</span>
                        <input 
                          type="checkbox" 
                          name={p.id} 
                          defaultChecked={(selectedUser.permissions as any)?.[p.key] ?? true}
                          className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" 
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <ModalFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
                  <Button type="submit" loading={isPending} disabled={selectedUser.role === 'super_admin' && initialUsers.filter(u => u.role === 'super_admin' && u.status === 'active').length <= 1}>Save Changes</Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* 4. Delete User Modal */}
      <Modal open={showDelete} onOpenChange={setShowDelete}>
        <ModalContent>
          {selectedUser && (
            <>
              <ModalHeader>
                <ModalTitle className="text-red-500 text-left">Delete User Account?</ModalTitle>
                <ModalDescription className="text-left">
                  This will PERMANENTLY delete <span className="font-bold">{selectedUser.full_name || selectedUser.email}</span>. 
                  This action cannot be undone.
                </ModalDescription>
              </ModalHeader>
              <form action={(fd) => handleAction(deleteUserAction, fd, () => setShowDelete(false))}>
                <input type="hidden" name="userId" value={selectedUser.id} />
                <ModalFooter>
                  <Button type="button" variant="outline" onClick={() => setShowDelete(false)} disabled={isPending}>Keep User</Button>
                  <Button type="submit" variant="destructive" loading={isPending} disabled={selectedUser.role === 'super_admin' && initialUsers.filter(u => u.role === 'super_admin').length <= 1}>Yes, Delete Account</Button>
                </ModalFooter>
                {selectedUser.role === 'super_admin' && initialUsers.filter(u => u.role === 'super_admin').length <= 1 && (
                  <p className="text-xs text-amber-500 font-bold mt-4 text-center">Cannot remove the last Super Admin.</p>
                )}
              </form>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* 5. Status / Suspend Modal */}
      <Modal open={showStatus} onOpenChange={setShowStatus}>
        <ModalContent>
          {selectedUser && (
            <>
              <ModalHeader>
                <ModalTitle>Manage Access Status</ModalTitle>
                <ModalDescription>Set login permissions for {selectedUser.full_name || selectedUser.email}.</ModalDescription>
              </ModalHeader>
              <form action={(fd) => handleAction(toggleStatusAction, fd, () => setShowStatus(false))} className="space-y-4 pt-2">
                <input type="hidden" name="userId" value={selectedUser.id} />
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { val: 'active',    label: 'Active',    desc: 'Full access to account features.', icon: CheckCircle, col: 'text-emerald-500' },
                    { val: 'suspended', label: 'Suspended', desc: 'Temporary login restriction.', icon: Slash, col: 'text-amber-500' },
                    { val: 'banned',    label: 'Banned',    desc: 'Permanent restriction from login.', icon: Ban, col: 'text-red-500' },
                  ].map((s) => (
                    <label key={s.val} className={`group flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${selectedUser.status === s.val ? 'bg-indigo-50/30 border-zinc-900 dark:border-white' : 'border-zinc-100 dark:border-white/5 hover:border-indigo-200'}`}>
                      <input type="radio" name="status" value={s.val} defaultChecked={selectedUser.status === s.val} className="sr-only" />
                      <div className={`w-10 h-10 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-white/10 flex items-center justify-center transition-colors group-hover:scale-110 ${s.col}`}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-black italic tracking-tighter ${s.col}`}>{s.label}</p>
                        <p className="text-[10px] text-zinc-500 font-medium">{s.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedUser.role === 'super_admin' && initialUsers.filter(u => u.role === 'super_admin' && u.status === 'active').length <= 1 && selectedUser.status === 'active' && (
                  <p className="text-xs text-amber-500 font-bold mt-2 text-center">Cannot suspend/ban the last active Super Admin.</p>
                )}
                <ModalFooter>
                  <Button type="button" variant="outline" onClick={() => setShowStatus(false)}>Cancel</Button>
                  <Button type="submit" loading={isPending} disabled={selectedUser.role === 'super_admin' && initialUsers.filter(u => u.role === 'super_admin' && u.status === 'active').length <= 1 && selectedUser.status === 'active'}>Update Status</Button>
                </ModalFooter>
              </form>
            </>
          )}
        </ModalContent>
      </Modal>

    </div>
  );
}
