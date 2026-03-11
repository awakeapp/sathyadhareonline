'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { createApiKeyAction, deleteApiKeyAction, getLoginHistoryAction } from './actions';
import { Key, Shield, Clock, AlertTriangle, MonitorSmartphone, Plus, Eye, KeyRound, Check, X, Search, Calendar, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { 
  PresenceCard, 
  PresenceButton 
} from '@/components/PresenceUI';

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

  const [keys, setKeys] = useState(initialKeys);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPerms, setNewKeyPerms] = useState<Set<string>>(new Set(['read:articles']));
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const [logins, setLogins] = useState<LoginEvent[]>([]);
  const [isLoadingLogins, setIsLoadingLogins] = useState(false);
  
  const [searchEmail, setSearchEmail] = useState('');
  const [loginPage, setLoginPage] = useState(1);
  const loginsPerPage = 20;

  useEffect(() => {
    if (activeTab === 'logins' && logins.length === 0 && !isLoadingLogins) {
      setIsLoadingLogins(true);
      getLoginHistoryAction().then(res => {
        if (res.error) toast.error('History Extraction Failed');
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
    if (!newKeyName.trim()) return toast.error('Missing ID Label');
    if (newKeyPerms.size === 0) return toast.error('Perms Required');

    startTransition(async () => {
      const res = await createApiKeyAction(newKeyName, Array.from(newKeyPerms));
      if (res.error) {
        toast.error(res.error);
      } else if (res.success && res.rawKey && res.keyRecord) {
        setKeys(prev => [res.keyRecord as ApiKey, ...prev]);
        setGeneratedKey(res.rawKey);
        setNewKeyName('');
        setIsCreatingKey(false);
        toast.success('Key Forged');
      }
    });
  };

  const handleRevokeKey = (id: string) => {
    if (!confirm('Authorize Permanent Revocation?')) return;
    startTransition(async () => {
      const res = await deleteApiKeyAction(id);
      if (res.error) toast.error(res.error);
      else {
        toast.success('Key Purged');
        setKeys(prev => prev.filter(k => k.id !== id));
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copy Successful');
  };

  const filteredLogins = logins.filter(l => l.email?.toLowerCase().includes(searchEmail.toLowerCase()));
  const totalLoginsCount = filteredLogins.length;
  const paginatedLogins = filteredLogins.slice((loginPage - 1) * loginsPerPage, loginPage * loginsPerPage);
  const totalPages = Math.ceil(totalLoginsCount / loginsPerPage);

  return (
    <div className="space-y-6">

      {/* ── Protocol Selectors ── */}
      <PresenceCard className="bg-[#f0f2ff] dark:bg-indigo-500/5 border-none p-2">
        <div className="flex gap-2 w-full overflow-x-auto hide-scrollbar">
          {[
            { id: 'keys', label: 'Cryptographic Vault', icon: Key },
            { id: 'logins', label: 'Forensic Timeline', icon: Shield },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex-1 justify-center ${activeTab === t.id ? 'bg-[#5c4ae4] text-white shadow-xl shadow-indigo-500/20' : 'text-indigo-400 hover:text-[#5c4ae4] hover:bg-white dark:hover:bg-white/5'}`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </PresenceCard>

      {activeTab === 'keys' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           
           {isCreatingKey && (
             <PresenceCard className="bg-white dark:bg-[#181623] border-l-8 border-l-[#5c4ae4] p-8 space-y-8 relative overflow-hidden">
                <div className="absolute right-[-20px] top-[-20px] opacity-[0.03] rotate-12">
                   <KeyRound className="w-48 h-48 text-[#5c4ae4]" />
                </div>
                <div className="flex items-center justify-between relative z-10">
                   <div>
                      <h2 className="text-2xl font-black text-[#1b1929] dark:text-white uppercase tracking-tight">Forge Access Token</h2>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">High-Privilege Authorization Vector</p>
                   </div>
                   <button onClick={() => setIsCreatingKey(false)} className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 text-gray-400 flex items-center justify-center">
                      <X className="w-5 h-5" />
                   </button>
                </div>
                
                <div className="space-y-8 relative z-10">
                   <div className="space-y-3">
                     <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Identity Label</label>
                     <input 
                       value={newKeyName} 
                       onChange={e => setNewKeyName(e.target.value)} 
                       placeholder="e.g. CORE_SYSTEM_API" 
                       className="w-full h-14 px-6 rounded-2xl bg-gray-50 dark:bg-[#1b1929] border-none text-sm font-bold shadow-inner" 
                     />
                   </div>

                   <div className="space-y-4">
                      <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Protocol Permissions</label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { id: 'read:articles', label: 'Index Articles' },
                          { id: 'write:articles', label: 'Mutate Data' },
                          { id: 'read:users', label: 'Intercept Profiles' },
                          { id: 'manage:billing', label: 'Control Capital' }
                        ].map(p => {
                           const active = newKeyPerms.has(p.id);
                           return (
                             <button
                               key={p.id}
                               onClick={() => togglePermission(p.id)}
                               className={`flex items-center gap-3 p-4 rounded-2xl transition-all border-2 text-left ${active ? 'bg-indigo-50 border-[#5c4ae4] text-[#5c4ae4]' : 'bg-white dark:bg-[#1b1929] border-transparent text-gray-400'}`}
                             >
                                <div className={`w-3 h-3 rounded-full border-2 ${active ? 'bg-[#5c4ae4] border-[#5c4ae4] shadow-lg shadow-indigo-500/50' : 'border-gray-200'}`}></div>
                                <span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>
                             </button>
                           );
                        })}
                      </div>
                   </div>

                   <PresenceButton onClick={handleCreateKey} loading={isPending} className="w-full h-16 bg-[#5c4ae4] font-black tracking-[0.2em] text-xs uppercase shadow-2xl shadow-indigo-500/20">
                      Initialize Key Forging
                   </PresenceButton>
                </div>
             </PresenceCard>
           )}

           {generatedKey && (
             <PresenceCard className="bg-rose-50 border-none p-10 space-y-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 w-2 bg-rose-500"></div>
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-500/20">
                      <AlertTriangle className="w-8 h-8" />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-rose-600 uppercase tracking-tighter">Raw Key Intercepted</h3>
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-1">One-time exposure event detected</p>
                   </div>
                </div>

                <div className="p-8 rounded-[2rem] bg-black/5 flex flex-col items-center gap-6">
                   <code className="text-xl font-mono text-rose-500 font-black break-all text-center tracking-widest">
                      {generatedKey}
                   </code>
                   <PresenceButton onClick={() => copyToClipboard(generatedKey)} className="bg-rose-500 shadow-xl shadow-rose-500/20 text-xs px-10">
                      Secure to Clipboard
                   </PresenceButton>
                </div>

                <div className="flex justify-center">
                   <button onClick={() => setGeneratedKey(null)} className="text-[10px] font-black text-rose-300 uppercase underline tracking-[0.3em]">I have secured this asset</button>
                </div>
             </PresenceCard>
           )}

           {!isCreatingKey && !generatedKey && (
             <PresenceCard className="bg-[#f0f2ff] dark:bg-indigo-500/5 border-none p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h2 className="text-sm font-black text-[#1b1929] dark:text-white uppercase tracking-[0.2em]">Active Cipher Nodes</h2>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Authorized system access points</p>
                  </div>
                  <PresenceButton onClick={() => setIsCreatingKey(true)} className="bg-[#5c4ae4] shadow-xl shadow-indigo-500/20 px-8">
                    <Plus className="w-5 h-5 mr-3" /> Forge New Node
                  </PresenceButton>
                </div>
             </PresenceCard>
           )}

           <div className="grid gap-4">
             {keys.map(k => (
               <PresenceCard key={k.id} noPadding className="group overflow-hidden">
                  <div className="p-8 flex flex-col md:flex-row gap-8 items-start md:items-center">
                     <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[#5c4ae4] shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                        <Key className="w-8 h-8" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-4 mb-3">
                           <h3 className="text-xl font-black text-[#1b1929] dark:text-white truncate uppercase tracking-tight">{k.name}</h3>
                           <span className="px-3 py-1 rounded-lg bg-gray-50 dark:bg-white/5 text-[10px] font-black text-gray-300 uppercase tracking-widest border border-indigo-50">{k.prefix}••••</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-6">
                           <div className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 text-indigo-300" />
                              <span className="text-[10px] font-black text-gray-400 uppercase">Deployed · {new Date(k.created_at).toLocaleDateString()}</span>
                           </div>
                           <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-indigo-300" />
                              <span className="text-[10px] font-black text-gray-400 uppercase">Pulse · {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Zero Activity'}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex md:flex-col gap-3 shrink-0">
                        <div className="flex gap-1.5 flex-wrap justify-end">
                           {k.permissions.map(p => (
                             <span key={p} className="px-3 py-1 rounded-lg bg-[#5c4ae4]/5 text-[#5c4ae4] text-[9px] font-black uppercase tracking-widest border border-indigo-50">{p.split(':')[0]}</span>
                           ))}
                        </div>
                        <button onClick={() => handleRevokeKey(k.id)} className="h-11 px-8 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-sm">
                           Purge
                        </button>
                     </div>
                  </div>
               </PresenceCard>
             ))}
             {keys.length === 0 && !isCreatingKey && (
               <PresenceCard className="py-24 text-center border-dashed border-2 border-indigo-100 flex flex-col items-center">
                  <KeyRound className="w-16 h-16 mb-5 text-indigo-100" />
                  <p className="font-black text-xl text-gray-400 uppercase tracking-widest">Vault Empty</p>
               </PresenceCard>
             )}
           </div>

        </div>
      )}

      {activeTab === 'logins' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           
           <PresenceCard noPadding>
              <div className="p-8 border-b border-indigo-50 dark:border-white/5 flex flex-col md:flex-row items-center gap-6">
                 <div className="relative flex-1 w-full">
                   <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" />
                   <input 
                     placeholder="Filter target identity..." 
                     value={searchEmail}
                     onChange={e => { setSearchEmail(e.target.value); setLoginPage(1); }}
                     className="w-full h-14 pl-12 pr-4 rounded-2xl bg-gray-50 dark:bg-[#1b1929] border-none text-sm font-bold shadow-inner"
                   />
                 </div>
                 <div className="px-8 py-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-[10px] font-black text-[#5c4ae4] uppercase tracking-widest border border-indigo-100">
                   Detected Traces: {totalLoginsCount}
                 </div>
              </div>

              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-indigo-50 dark:border-white/5 font-black uppercase tracking-widest text-[#5c4ae4]">
                      <th className="px-8 py-5 text-[10px]">Temporal Event</th>
                      <th className="px-8 py-5 text-[10px]">Target Subject</th>
                      <th className="px-8 py-5 text-[10px]">Vector Origin (IP)</th>
                      <th className="px-8 py-5 text-[10px] text-right">Environment ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-50 dark:divide-white/5">
                    {isLoadingLogins ? (
                       <tr>
                         <td colSpan={4} className="py-24 text-center">
                           <div className="w-12 h-12 rounded-2xl border-4 border-indigo-100 border-t-[#5c4ae4] animate-spin mx-auto mb-4"></div>
                           <p className="text-gray-300 font-black uppercase tracking-widest text-[10px]">Decoding Traces...</p>
                         </td>
                       </tr>
                    ) : paginatedLogins.length === 0 ? (
                       <tr>
                         <td colSpan={4} className="py-24 text-center">
                           <Shield className="w-16 h-16 text-indigo-100 mx-auto mb-5" />
                           <p className="font-black text-xl text-gray-400 uppercase tracking-widest">No Events Found</p>
                         </td>
                       </tr>
                    ) : (
                       paginatedLogins.map(login => (
                         <tr key={login.log_id} className="group transition-all hover:bg-gray-50/30 dark:hover:bg-white/5">
                            <td className="px-8 py-6 font-black tabular-nums text-gray-400">
                              {new Date(login.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-indigo-400">
                                   <User className="w-5 h-5" />
                                </div>
                                <div>
                                   <p className="font-black text-[#1b1929] dark:text-white uppercase tracking-tight">{login.email}</p>
                                   <span className="text-[9px] font-black text-indigo-300 uppercase mt-0.5 tracking-widest">{login.role || 'reader'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 font-mono font-black text-indigo-400 text-[11px]">
                              {login.ip_address}
                            </td>
                            <td className="px-8 py-6 text-[10px] font-bold text-gray-300 text-right max-w-[250px] truncate italic">
                              {login.user_agent || 'Zero Signal Header'}
                            </td>
                         </tr>
                       ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {totalPages > 1 && (
                <div className="p-8 bg-gray-50/30 dark:bg-white/5 border-t border-indigo-50 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Cluster {loginPage} <span className="mx-2 text-indigo-100">|</span> Total {totalPages}
                  </span>
                  <div className="flex gap-3">
                     <button disabled={loginPage === 1} onClick={() => setLoginPage(loginPage - 1)} className="w-12 h-12 rounded-xl bg-white dark:bg-[#1b1929] text-gray-300 hover:text-[#5c4ae4] disabled:opacity-20 shadow-sm flex items-center justify-center"><ChevronLeft className="w-6 h-6" /></button>
                     <button disabled={loginPage >= totalPages} onClick={() => setLoginPage(loginPage + 1)} className="w-12 h-12 rounded-xl bg-white dark:bg-[#1b1929] text-gray-300 hover:text-[#5c4ae4] disabled:opacity-20 shadow-sm flex items-center justify-center"><ChevronRight className="w-6 h-6" /></button>
                  </div>
                </div>
              )}
           </PresenceCard>

        </div>
      )}

    </div>
  );
}
