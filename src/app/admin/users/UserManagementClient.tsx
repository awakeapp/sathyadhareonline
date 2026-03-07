'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Label } from '@/components/ui/Input';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { 
  UserPlus, Mail, Edit2, Trash2, 
  Slash, Ban, CheckCircle
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

  const formatDate = (iso?: string | null) => {
    if (!iso) return 'Unknown';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? 'Unknown' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      
      {/* ── Action Bar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={() => setShowCreate(true)} className="flex-1 rounded-2xl h-14 font-black shadow-lg shadow-blue-500/10 hover:scale-[1.02] transition-transform">
          <UserPlus className="w-5 h-5 mr-2" /> Direct Create User
        </Button>
        <Button onClick={() => setShowInvite(true)} variant="secondary" className="flex-1 rounded-2xl h-14 font-black shadow-lg shadow-black/5 hover:scale-[1.02] transition-transform bg-[#ffe500] text-black hover:bg-[#ffe500]/90">
          <Mail className="w-5 h-5 mr-2" /> Invite via Email
        </Button>
      </div>

      {/* ── Users List ────────────────────────────────────────── */}
      <div className="space-y-3">
        {initialUsers.map((u) => {
          const roleMeta = ROLE_META[u.role] ?? ROLE_META.reader;
          const statusMeta = STATUS_META[u.status] ?? STATUS_META.active;
          const initials = (u.full_name || u.email || '?').charAt(0).toUpperCase();

          return (
            <Card key={u.id} className={`rounded-3xl border-transparent bg-[var(--color-surface)] shadow-none transition-all ${u.status !== 'active' ? 'opacity-60 bg-black/10' : ''}`}>
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                
                {/* Avatar & Basic Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center text-black font-black text-lg shrink-0 shadow-inner ${u.status === 'active' ? 'bg-gradient-to-br from-[var(--color-primary)] to-amber-400' : 'bg-gray-500'}`}>
                     {initials}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 mt-1">
                        <h3 className="font-bold text-sm truncate leading-tight">{u.full_name || 'Anonymous'}</h3>
                        <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${roleMeta.color}`}>
                          {roleMeta.label}
                        </span>
                        {u.status !== 'active' && (
                           <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${statusMeta.color}`}>
                             <statusMeta.icon className="w-3 h-3" /> {statusMeta.label}
                           </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-muted)] truncate mb-0.5 font-medium">{u.email || '—'}</p>
                      <p className="text-[10px] text-[var(--color-muted)] font-bold uppercase tracking-widest">Joined {formatDate(u.created_at)}</p>
                   </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)] justify-end">
                   <Button variant="outline" size="icon" className="rounded-xl h-9 w-9 border-[var(--color-border)]" onClick={() => { setSelectedUser(u); setShowEdit(true); }}>
                     <Edit2 className="w-3.5 h-3.5" />
                   </Button>
                   <Button variant="outline" size="icon" className={`rounded-xl h-9 w-9 border-[var(--color-border)] ${u.status !== 'active' ? 'bg-emerald-500/10 text-emerald-500' : ''}`} onClick={() => { setSelectedUser(u); setShowStatus(true); }}>
                     <Slash className="w-3.5 h-3.5" />
                   </Button>
                   <Button variant="outline" size="icon" className="rounded-xl h-9 w-9 border-red-500/20 text-red-500 hover:bg-red-500/10" onClick={() => { setSelectedUser(u); setShowDelete(true); }}>
                     <Trash2 className="w-3.5 h-3.5" />
                   </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
                  This action cannot be undone. All their session and auth data will be wiped.
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
