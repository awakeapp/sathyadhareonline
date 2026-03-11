'use client';

import { useState, useTransition, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { toast } from 'sonner';
import { createApiKeyAction, deleteApiKeyAction, getLoginHistoryAction } from './actions';
import { Key, Shield, Clock, AlertTriangle, MonitorSmartphone, Plus, Eye, KeyRound, Check, X, Search, Calendar, ChevronLeft, ChevronRight, User } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  created_at: string;
  last_used_at: string | null;
}

interface LoginEvent {
  log_id: string;
  user_id: string;
  email: string;
  role: string | null;
  ip_address: string;
  user_agent: string | null;
  created_at: string;
}

export default function SecurityClient({
  initialKeys
}: {
  initialKeys: ApiKey[]
}) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'keys' | 'logins'>('keys');

  // Keys State
  const [keys, setKeys] = useState(initialKeys);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPerms, setNewKeyPerms] = useState<Set<string>>(new Set(['read:articles']));
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  // Logins State
  const [logins, setLogins] = useState<LoginEvent[]>([]);
  const [isLoadingLogins, setIsLoadingLogins] = useState(false);
  
  // Login Filtering
  const [searchEmail, setSearchEmail] = useState('');
  const [loginPage, setLoginPage] = useState(1);
  const loginsPerPage = 20;

  useEffect(() => {
    if (activeTab === 'logins' && logins.length === 0 && !isLoadingLogins) {
      setIsLoadingLogins(true);
      getLoginHistoryAction().then(res => {
        if (res.error) toast.error('Failed to load login history: ' + res.error);
        if (res.data) setLogins(res.data);
        setIsLoadingLogins(false);
      });
    }
  }, [activeTab]);

  const togglePermission = (perm: string) => {
    const next = new Set(newKeyPerms);
    if (next.has(perm)) next.delete(perm);
    else next.add(perm);
    setNewKeyPerms(next);
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return toast.error('API Key name is required');
    if (newKeyPerms.size === 0) return toast.error('At least one permission is required');

    startTransition(async () => {
      const res = await createApiKeyAction(newKeyName, Array.from(newKeyPerms));
      if (res.error) {
        toast.error(res.error);
      } else if (res.success && res.rawKey && res.keyRecord) {
        setKeys(prev => [res.keyRecord as ApiKey, ...prev]);
        setGeneratedKey(res.rawKey);
        setNewKeyName('');
        setIsCreatingKey(false);
      }
    });
  };

  const handleRevokeKey = (id: string) => {
    if (!confirm('This action cannot be undone. Any application relying on this key will instantly fail. Revoke key?')) return;
    startTransition(async () => {
      const res = await deleteApiKeyAction(id);
      if (res.error) toast.error(res.error);
      else {
        toast.success('API Key securely revoked and deleted from the vault.');
        setKeys(prev => prev.filter(k => k.id !== id));
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Derived Logins based on search and pagination
  const filteredLogins = logins.filter(l => l.email?.toLowerCase().includes(searchEmail.toLowerCase()));
  const totalLoginsCount = filteredLogins.length;
  const paginatedLogins = filteredLogins.slice((loginPage - 1) * loginsPerPage, loginPage * loginsPerPage);
  const totalPages = Math.ceil(totalLoginsCount / loginsPerPage);

  return (
    <div className="space-y-6">

      {/* Tabs */}
      <div className="flex gap-2 w-full overflow-x-auto hide-scrollbar bg-[var(--color-surface)] p-2 rounded-2xl border border-[var(--color-border)]">
        {[
          { id: 'keys', label: 'Developer API Vault', icon: Key },
          { id: 'logins', label: 'Authentication Forensics', icon: Shield },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-1 justify-center sm:flex-none ${activeTab === t.id ? 'bg-[var(--color-primary)] text-black shadow-md' : 'text-[var(--color-muted)] hover:text-white hover:bg-white/5'}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'keys' && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
           
           {/* API Key Modal Form Inline Layer */}
           {isCreatingKey && (
             <Card className="rounded-[2rem] shadow-none border-[var(--color-border)] bg-[var(--color-surface)] border-l-4 border-l-[var(--color-primary)]">
               <CardContent className="p-6 md:p-8 space-y-6 relative">
                 <button onClick={() => setIsCreatingKey(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center text-[var(--color-muted)] hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                   <X className="w-4 h-4" />
                 </button>
                 <div>
                   <h2 className="text-xl font-black text-white flex items-center gap-2"><KeyRound className="w-5 h-5 text-[var(--color-primary)]" /> Forge New Key</h2>
                   <p className="text-sm text-[var(--color-muted)] mt-1">Generate a scalable programmatic access token.</p>
                 </div>
                 
                 <div className="space-y-6 border-t border-[var(--color-border)] pt-6">
                   <div className="space-y-1.5">
                     <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Application or Token Reference Name</label>
                     <Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} className="bg-black/20 font-bold" placeholder="e.g. Vercel Staging Webhooks" />
                   </div>

                   <div className="space-y-3">
                      <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Grant Permissions</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { id: 'read:articles', label: 'Read Articles' },
                          { id: 'write:articles', label: 'Write Articles' },
                          { id: 'read:users', label: 'Read Profiles' },
                          { id: 'manage:billing', label: 'Billing Hooks' }
                        ].map(p => {
                           const active = newKeyPerms.has(p.id);
                           return (
                             <label key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${active ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]' : 'bg-black/20 border-[var(--color-border)] text-[var(--color-muted)] hover:text-white hover:border-white/20'}`}>
                               <input type="checkbox" checked={active} onChange={() => togglePermission(p.id)} className="hidden" />
                               <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? 'border-[var(--color-primary)] bg-[var(--color-primary)]' : 'border-[var(--color-muted)]'}`}>
                                 {active && <Check className="w-2.5 h-2.5 text-black" />}
                               </div>
                               <span className="text-xs font-bold uppercase tracking-wide">{p.label}</span>
                             </label>
                           );
                        })}
                      </div>
                   </div>

                   <div className="pt-2">
                      <Button onClick={handleCreateKey} loading={isPending} className="h-11 px-8 rounded-xl font-bold bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary)]/90 shadow-md">
                        Generate Token Securely
                      </Button>
                   </div>
                 </div>
               </CardContent>
             </Card>
           )}

           {/* Show Generated Token Warning */}
           {generatedKey && (
             <Card className="rounded-[2rem] shadow-none border-red-500/30 bg-red-500/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 relative">
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-500"></div>
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-4">
                     <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-1" />
                     <div className="space-y-4 w-full">
                       <div>
                         <h3 className="font-black text-red-500 text-lg">Critical Token Exposure</h3>
                         <p className="text-sm font-medium text-red-400/80 mt-1">
                           This is the exclusive time we can show you the raw private key. We store an irreversible hash in the data vault. Ensure you copy it correctly immediately.
                         </p>
                       </div>
                       
                       <div className="flex items-center justify-between p-4 bg-black/50 border border-red-500/30 rounded-xl">
                          <code className="text-[#a0a0b0] font-mono text-sm break-all font-bold pr-4">{generatedKey}</code>
                          <Button variant="outline" onClick={() => copyToClipboard(generatedKey)} className="h-9 px-4 shrink-0 rounded-lg text-red-400 border-red-500/50 hover:bg-red-500/20 bg-transparent font-bold">Copy Key</Button>
                       </div>

                       <Button onClick={() => setGeneratedKey(null)} className="h-9 bg-red-500 hover:bg-red-600 font-bold text-white rounded-xl shadow-md">I have secured my token securely</Button>
                     </div>
                  </div>
                </CardContent>
             </Card>
           )}

           {!isCreatingKey && !generatedKey && (
             <div className="flex justify-between items-center bg-[var(--color-surface)] p-4 rounded-3xl border border-[var(--color-border)] gap-4">
               <div>
                 <h2 className="text-sm font-black text-white uppercase tracking-wider">Current Live Authorities</h2>
                 <p className="text-[10px] text-[var(--color-muted)] font-bold mt-1">Applications executing transactions</p>
               </div>
               <Button onClick={() => setIsCreatingKey(true)} className="h-10 px-5 rounded-xl font-bold bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary)]/90 flex shrink-0">
                 <Plus className="w-4 h-4 mr-1.5" /> Forge Key
               </Button>
             </div>
           )}

           <div className="grid gap-4">
             {keys.map(k => (
               <div key={k.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2rem] p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between group hover:border-[var(--color-primary)]/30 transition-all">
                  <div className="flex items-center gap-4 flex-1">
                     <div className="w-12 h-12 rounded-2xl bg-black/40 border-2 border-dashed border-[var(--color-border)] flex items-center justify-center shrink-0 text-[var(--color-muted)] group-hover:border-[var(--color-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                       <Key className="w-5 h-5" />
                     </div>
                     <div>
                       <h3 className="font-bold text-lg text-white mb-1 flex items-center gap-2">
                         {k.name}
                         <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full bg-white/5 text-[var(--color-muted)] border border-white/10">{k.prefix}••••••••••</span>
                       </h3>
                       <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)] font-medium">
                         <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Created: {new Date(k.created_at).toLocaleDateString()}</span>
                         <span className="flex items-center gap-1"><MonitorSmartphone className="w-3 h-3" /> Last Active: {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never used'}</span>
                       </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-4">
                     <div className="flex flex-wrap gap-1.5">
                       {k.permissions.map(p => (
                         <span key={p} className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-black/40 text-[var(--color-primary)] border border-white/5">{p}</span>
                       ))}
                     </div>
                     <div className="w-px h-8 bg-white/10 mx-2 hidden md:block"></div>
                     <Button variant="outline" size="sm" onClick={() => handleRevokeKey(k.id)} loading={isPending} className="h-9 px-4 rounded-xl text-red-500 border-red-500/30 hover:bg-red-500/10 shrink-0">Revoke</Button>
                  </div>
               </div>
             ))}
             {keys.length === 0 && (
               <div className="py-20 text-center border-dashed border border-[var(--color-border)] rounded-[2rem] text-sm font-bold text-[var(--color-muted)] bg-[var(--color-surface)]">
                 No cryptographic authorities configured yet.
               </div>
             )}
           </div>

        </div>
      )}

      {activeTab === 'logins' && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          
          <Card className="rounded-[2rem] shadow-none border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
             
             {/* Login Filter Row */}
             <div className="p-4 bg-black/20 border-b border-[var(--color-border)] flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full text-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                  <Input 
                    placeholder="Search by target email pattern..." 
                    value={searchEmail}
                    onChange={e => { setSearchEmail(e.target.value); setLoginPage(1); }}
                    className="pl-9 h-11 w-full bg-black/40 border-[var(--color-border)] rounded-xl"
                  />
                </div>
                <div className="text-xs font-bold text-[var(--color-muted)] tracking-wider uppercase bg-black/40 px-4 py-2.5 rounded-xl border border-[var(--color-border)]">
                  Tracking {totalLoginsCount} Network Vectors
                </div>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead>
                   <tr className="border-b border-white/5 bg-black/40">
                     <th className="px-5 py-4 font-black text-[var(--color-muted)] uppercase tracking-wider text-[10px]">Vector Date</th>
                     <th className="px-5 py-4 font-black text-[var(--color-muted)] uppercase tracking-wider text-[10px]">Target Authority</th>
                     <th className="px-5 py-4 font-black text-[var(--color-muted)] uppercase tracking-wider text-[10px]">Client Origin</th>
                     <th className="px-5 py-4 font-black text-[var(--color-muted)] uppercase tracking-wider text-[10px] text-right">User Agent Topology</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {isLoadingLogins ? (
                      <tr>
                        <td colSpan={4} className="py-16 text-center">
                          <div className="w-6 h-6 rounded-full border-2 border-t-[var(--color-primary)] border-[var(--color-primary)]/20 animate-spin mx-auto"></div>
                          <p className="mt-3 text-[10px] uppercase font-bold tracking-widest text-[var(--color-muted)]">Scanning Authentication Traces...</p>
                        </td>
                      </tr>
                   ) : paginatedLogins.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-16 text-center">
                          <p className="text-sm font-bold text-[var(--color-muted)]">No authentication traces detected in logs.</p>
                        </td>
                      </tr>
                   ) : (
                      paginatedLogins.map(login => (
                        <tr key={login.log_id} className="hover:bg-white/5 transition-colors group">
                           <td className="px-5 py-4 text-xs tabular-nums text-[var(--color-muted)] font-medium">
                             {new Date(login.created_at).toLocaleString()}
                           </td>
                           <td className="px-5 py-4 text-xs font-bold">
                             <div className="flex items-center gap-2">
                               <User className="w-3.5 h-3.5 text-blue-400 opacity-60" />
                               <span>{login.email}</span>
                               <span className="text-[9px] uppercase tracking-widest text-[var(--color-muted)] px-2 py-0.5 rounded border border-white/10 bg-black/20">{login.role || 'reader'}</span>
                             </div>
                           </td>
                           <td className="px-5 py-4 text-xs font-mono text-[#a0a0b0]">
                             {login.ip_address}
                           </td>
                           <td className="px-5 py-4 text-[10px] text-[var(--color-muted)] text-right font-medium max-w-[250px] truncate overflow-hidden">
                             {login.user_agent || 'Unknown Payload Header'}
                           </td>
                        </tr>
                      ))
                   )}
                 </tbody>
               </table>
             </div>
             
             {/* Pagination Bottom */}
             {totalPages > 1 && (
               <div className="p-4 bg-black/20 border-t border-[var(--color-border)] flex items-center justify-between gap-4">
                 <span className="text-xs text-[var(--color-muted)] font-bold tracking-wider">
                   Displaying cluster {loginPage} of {totalPages}
                 </span>
                 <div className="flex gap-2">
                    <Button variant="outline" size="icon" disabled={loginPage === 1} onClick={() => setLoginPage(loginPage - 1)} className="w-8 h-8 rounded-lg bg-[var(--color-surface)] border-[var(--color-border)]"><ChevronLeft className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" disabled={loginPage >= totalPages} onClick={() => setLoginPage(loginPage + 1)} className="w-8 h-8 rounded-lg bg-[var(--color-surface)] border-[var(--color-border)]"><ChevronRight className="w-4 h-4" /></Button>
                 </div>
               </div>
             )}
          </Card>

        </div>
      )}

    </div>
  );
}
