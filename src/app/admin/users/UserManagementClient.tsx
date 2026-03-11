'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Label } from '@/components/ui/Input';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { 
  UserPlus, Mail, Edit2, Trash2, 
  Slash, Ban, CheckCircle, Search, Download
} from 'lucide-react';
import { 
  createUserAction, 
  updateUserAction, 
  deleteUserAction, 
  inviteUserAction, 
  toggleStatusAction 
} from './actions';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  status: string;
  created_at: string;
}

const ROLE_META: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  admin:       { label: 'Admin',       color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  editor:      { label: 'Editor',      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  reader:      { label: 'Reader',      color: 'bg-gray-500/10 text-[var(--color-muted)] border-gray-500/20' },
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
      // 1. Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const emailMatch = u.email?.toLowerCase().includes(query);
        const nameMatch = u.full_name?.toLowerCase().includes(query);
        if (!emailMatch && !nameMatch) return false;
      }
      // 2. Role
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      // 3. Status
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      
      return true;
    });
  }, [initialUsers, searchQuery, roleFilter, statusFilter]);

  async function handleAction(action: (fd: FormData) => Promise<{ error?: string; success?: boolean }>, fd: FormData, closeFn: () => void) {
    startTransition(async () => {
      const res = await action(fd);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Action completed successfully');
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
    <div className="space-y-6">
      
      {/* ── Action Bar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <Button onClick={() => setShowInvite(true)} className="flex-1 rounded-2xl h-14 font-black shadow-lg hover:scale-[1.02] transition-transform bg-[#ffe500] text-black hover:bg-[#ffe500]/90">
          <Mail className="w-5 h-5 mr-2" /> Invite Member
        </Button>
        <Button onClick={() => setShowCreate(true)} variant="secondary" className="flex-1 rounded-2xl h-14 font-black shadow-lg shadow-blue-500/10 hover:scale-[1.02] transition-transform">
          <UserPlus className="w-5 h-5 mr-2" /> Direct Create User
        </Button>
      </div>

      {/* ── Filters ───────────────────────────────────────────── */}
      <Card className="rounded-3xl shadow-none border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
            <Input 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 w-full bg-black/20"
            />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar flex-shrink-0">
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-[140px] h-11 bg-black/20">
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admins</option>
              <option value="admin">Admins</option>
              <option value="editor">Editors</option>
              <option value="reader">Readers</option>
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-[140px] h-11 bg-black/20">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </Select>
            <Button variant="outline" className="h-11 bg-black/20 border text-[var(--color-muted)] px-4" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Users Table Layout ──────────────────────────────────────── */}
      <Card className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-none">
        {filteredUsers.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
             <Search className="w-12 h-12 mb-4 opacity-20 text-[var(--color-muted)]" />
             <p className="font-bold mb-1 text-lg tracking-tight">No users found</p>
             <p className="text-sm text-[var(--color-muted)]">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-black/20 text-[var(--color-muted)] text-[10px] uppercase font-black tracking-widest border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-6 py-4 rounded-tl-3xl">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right rounded-tr-3xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] bg-transparent">
                {filteredUsers.map((u) => {
                  const roleMeta = ROLE_META[u.role] ?? ROLE_META.reader;
                  const statusMeta = STATUS_META[u.status] ?? STATUS_META.active;
                  const initials = (u.full_name || u.email || '?').charAt(0).toUpperCase();

                  return (
                    <tr key={u.id} className={`transition-colors hover:bg-black/10 group ${u.status !== 'active' ? 'opacity-80' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-black font-black text-sm shrink-0 shadow-inner ${u.status === 'active' ? 'bg-gradient-to-br from-[var(--color-primary)] to-amber-400' : 'bg-gray-500'}`}>
                            {initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-white truncate group-hover:text-[var(--color-primary)] transition-colors">{u.full_name || 'Anonymous'}</span>
                            <span className="text-xs text-[var(--color-muted)] truncate font-medium">{u.email || 'No email provided'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${roleMeta.color}`}>
                          {roleMeta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${statusMeta.color}`}>
                          <statusMeta.icon className="w-3.5 h-3.5" /> {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-medium text-[var(--color-muted)]">{formatDate(u.created_at)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-[var(--color-border)] hover:bg-white/5" onClick={() => { setSelectedUser(u); setShowEdit(true); }}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="outline" size="icon" className={`h-8 w-8 rounded-lg border-[var(--color-border)] hover:bg-white/5 ${u.status !== 'active' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : ''}`} onClick={() => { setSelectedUser(u); setShowStatus(true); }}>
                            <Slash className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-red-500/20 text-red-500 hover:bg-red-500/10" onClick={() => { setSelectedUser(u); setShowDelete(true); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
               <Button type="submit" loading={isPending} className="bg-[#ffe500] text-black hover:bg-[#ffe500]/90">Send Invitation</Button>
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
                <ModalTitle className="text-red-500">Delete User Account?</ModalTitle>
                <ModalDescription>
                  This will PERMANENTLY delete <span className="text-white font-bold">{selectedUser.full_name || selectedUser.email}</span>. 
                  This action cannot be undone. All their session and metadata will be permanently archived.
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
                <ModalDescription>Set visibility and login permissions for {selectedUser.full_name || selectedUser.email}.</ModalDescription>
              </ModalHeader>
              <form action={(fd) => handleAction(toggleStatusAction, fd, () => setShowStatus(false))} className="space-y-4 pt-2">
                <input type="hidden" name="userId" value={selectedUser.id} />
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { val: 'active',    label: 'Active',    desc: 'Full access to account features.', icon: CheckCircle, col: 'text-emerald-500' },
                    { val: 'suspended', label: 'Suspended', desc: 'Redirected to restriction page.', icon: Slash, col: 'text-amber-500' },
                    { val: 'banned',    label: 'Banned',    desc: 'Permanent restriction from login.', icon: Ban, col: 'text-red-500' },
                  ].map((s) => (
                    <label key={s.val} className={`group flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${selectedUser.status === s.val ? 'bg-[var(--color-surface-2)] border-[var(--color-primary)]' : 'border-[var(--color-border)] hover:border-[var(--color-muted)]'}`}>
                      <input type="radio" name="status" value={s.val} defaultChecked={selectedUser.status === s.val} className="sr-only" />
                      <div className={`w-10 h-10 rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center transition-colors group-hover:scale-110 ${s.col}`}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-black italic tracking-tighter ${s.col}`}>{s.label}</p>
                        <p className="text-[10px] text-[var(--color-muted)] font-medium">{s.desc}</p>
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
