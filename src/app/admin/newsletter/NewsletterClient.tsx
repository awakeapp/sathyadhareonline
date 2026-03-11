'use client';

import { useState, useTransition } from 'react';
import { Mail, Download, Trash2, CheckCircle2, AlertCircle, Users, X } from 'lucide-react';
import { 
  PresenceCard, 
  PresenceButton 
} from '@/components/PresenceUI';

interface Subscriber { id: string; email: string; created_at: string; }

interface Props {
  subscribers: Subscriber[];
}

export default function NewsletterClient({ subscribers: initial }: Props) {
  const [subs, setSubs] = useState<Subscriber[]>(initial);
  const [showCompose, setShowCompose] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    const header = 'Email,Subscribed';
    const rows = subs.map(s =>
      `${s.email},${new Date(s.created_at).toLocaleDateString('en-IN')}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleRemove(sub: Subscriber) {
    if (!confirm(`Unsubscribe ${sub.email}?`)) return;
    setRemovingId(sub.id);

    startTransition(async () => {
      const res = await fetch('/api/admin/newsletter', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sub.id }),
      });
      if (res.ok) {
        setSubs(prev => prev.filter(s => s.id !== sub.id));
      } else {
        const j = await res.json();
        alert(j.error ?? 'Atomic Rejection');
      }
      setRemovingId(null);
      return;
    });
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setSendStatus('sending');
    setErrorMsg('');

    const res = await fetch('/api/admin/newsletter/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body, recipients: subs.map(s => s.email) }),
    });

    if (res.ok) {
      setSendStatus('sent');
      setSubject('');
      setBody('');
      setTimeout(() => { setSendStatus('idle'); setShowCompose(false); }, 3000);
    } else {
      const j = await res.json();
      setSendStatus('error');
      setErrorMsg(j.error ?? 'Transmission Failed');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      
      {/* ── BROADCAST BAR ── */}
      <PresenceCard className="bg-[#f0f2ff] dark:bg-indigo-500/5 border-none p-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[#5c4ae4]">
                <Mail className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-black text-[#1b1929] dark:text-white uppercase tracking-tight">Signal Broadcast</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Control direct communication nodes</p>
             </div>
          </div>
          <div className="flex gap-3">
            <PresenceButton onClick={() => setShowCompose(true)} className="bg-[#5c4ae4] font-black tracking-widest text-[10px] uppercase shadow-xl shadow-indigo-500/20">
               Compose Dispatch
            </PresenceButton>
            <PresenceButton onClick={handleExport} className="bg-white dark:bg-[#1b1929] !text-gray-400 hover:!text-[#5c4ae4] shadow-sm">
               <Download className="w-5 h-5" />
            </PresenceButton>
          </div>
        </div>
      </PresenceCard>

      {/* ── RECEIVER NETWORK ── */}
      <PresenceCard noPadding>
        <div className="p-4 border-b border-indigo-50 dark:border-white/5 flex items-center justify-between">
           <div>
              <h3 className="text-sm font-black text-[#1b1929] dark:text-white uppercase tracking-widest">Active Receivers</h3>
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1">Verified communication channels</p>
           </div>
           <Users className="w-6 h-6 text-indigo-100" />
        </div>
        
        {subs.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center">
             <Users className="w-16 h-16 mb-5 text-indigo-100" />
             <p className="font-black text-xl text-gray-400 uppercase tracking-widest">Network Empty</p>
          </div>
        ) : (
          <div className="divide-y divide-indigo-50 dark:divide-white/5">
            {subs.map(sub => (
              <div key={sub.id} className={`flex items-center px-8 py-6 transition-all ${removingId === sub.id ? 'opacity-40 grayscale' : 'hover:bg-gray-50/30 dark:hover:bg-white/5'}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-[#1b1929] dark:text-white truncate uppercase tracking-tight">{sub.email}</p>
                  <p className="text-[10px] font-black text-gray-300 mt-1 uppercase tracking-widest">
                    Link Established · {new Date(sub.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(sub)}
                  disabled={!!removingId || isPending}
                  className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center justify-center shrink-0"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </PresenceCard>

      {/* ── DISPATCH MODAL ── */}
      {showCompose && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1b1929]/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-2xl bg-white dark:bg-[#181623] rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
              <div className="p-10 border-b border-indigo-50 dark:border-white/5 flex items-center justify-between bg-indigo-50/30">
                 <div>
                    <h2 className="text-2xl font-black text-[#1b1929] dark:text-white uppercase tracking-tight">Signal Dispatch</h2>
                    <p className="text-[10px] font-black text-[#5c4ae4] uppercase tracking-widest mt-1">Targeting {subs.length} active nodes</p>
                 </div>
                 <button className="w-12 h-12 rounded-full bg-white dark:bg-[#1b1929] text-gray-400 flex items-center justify-center shadow-sm" onClick={() => setShowCompose(false)}>
                    <X className="w-6 h-6" />
                 </button>
              </div>
              
              <form onSubmit={handleSend} className="p-10 flex flex-col gap-4">
                 <div className="space-y-3">
                   <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Communication Subject</label>
                   <input 
                     value={subject} 
                     onChange={e => setSubject(e.target.value)} 
                     required 
                     placeholder="Broadcasting: System Update..." 
                     className="w-full h-14 px-6 rounded-2xl bg-gray-50 dark:bg-[#1b1929] border-none text-sm font-bold shadow-inner" 
                   />
                 </div>
                 <div className="space-y-3">
                   <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Manifest Message</label>
                   <textarea 
                     value={body} 
                     onChange={e => setBody(e.target.value)} 
                     required 
                     rows={10} 
                     placeholder="Write the transmission content..." 
                     className="w-full p-6 rounded-[2rem] bg-gray-50 dark:bg-[#1b1929] border-none text-sm font-bold shadow-inner placeholder-gray-300 resize-none"
                   />
                   <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest text-right">UTF-8 Plaintext Protocol Only</p>
                 </div>

                 <div className="flex flex-col gap-4">
                   {sendStatus === 'error' && (
                     <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-rose-50 text-rose-500 text-xs font-black uppercase tracking-widest">
                       <AlertCircle className="w-5 h-5" /> {errorMsg}
                     </div>
                   )}
                   {sendStatus === 'sent' && (
                     <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-50 text-emerald-500 text-xs font-black uppercase tracking-widest">
                       <CheckCircle2 className="w-5 h-5" /> Transmission Acknowledged
                     </div>
                   )}
                   
                   <PresenceButton 
                     type="submit" 
                     className="w-full h-16 bg-[#5c4ae4] font-black tracking-[0.2em] text-xs uppercase shadow-2xl shadow-indigo-500/20" 
                     loading={sendStatus === 'sending'} 
                     disabled={sendStatus === 'sending' || sendStatus === 'sent'}
                   >
                     {sendStatus === 'sent' ? 'DISPATCHED' : 'INITIALIZE BROADCAST'}
                   </PresenceButton>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}
