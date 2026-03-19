'use client';

import { useState, useTransition } from 'react';
import { Mail, Download, Trash2, CheckCircle2, AlertCircle, Users, X, Bell } from 'lucide-react';
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

  // Push Notification state
  const [showPushCompose, setShowPushCompose] = useState(false);
  const [pushTitle, setPushTitle] = useState('');
  const [pushMsg, setPushMsg] = useState('');
  const [pushStatus, setPushStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

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
        alert(j.error ?? 'Failed to unsubscribe');
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
      setErrorMsg(j.error ?? 'Failed to send email');
    }
  }

  async function handleSendPush(e: React.FormEvent) {
    e.preventDefault();
    if (!pushTitle.trim() || !pushMsg.trim()) return;
    setPushStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: pushTitle, message: pushMsg }),
      });

      if (res.ok) {
        setPushStatus('sent');
        setPushTitle('');
        setPushMsg('');
        setTimeout(() => { setPushStatus('idle'); setShowPushCompose(false); }, 3000);
      } else {
        const j = await res.json();
        setPushStatus('error');
        setErrorMsg(j.error ?? 'Failed to send push notification');
      }
    } catch {
      setPushStatus('error');
      setErrorMsg('Network error sending push notification');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      
      {/* ── BROADCAST BAR ── */}
      <PresenceCard className="bg-zinc-50 dark:bg-white/5 border-none p-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-zinc-900 dark:text-zinc-50">
                <Bell className="w-6 h-6" strokeWidth={1.25} />
             </div>
             <div>
                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">Broadcasting</h2>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">Send emails and push alerts</p>
             </div>
          </div>
          <div className="flex gap-3">
            <PresenceButton onClick={() => setShowPushCompose(true)} className="bg-rose-500 text-white font-black tracking-widest text-[10px] uppercase shadow-xl shadow-rose-500/20">
               Send Push
            </PresenceButton>
            <PresenceButton onClick={() => setShowCompose(true)} className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black tracking-widest text-[10px] uppercase shadow-xl shadow-indigo-500/20">
               Compose Email
            </PresenceButton>
            <PresenceButton onClick={handleExport} className="bg-white dark:bg-zinc-950 !text-zinc-500 hover:!text-zinc-900 dark:text-zinc-50 shadow-sm">
               <Download className="w-5 h-5" strokeWidth={1.25} />
            </PresenceButton>
          </div>
        </div>
      </PresenceCard>

      {/* ── RECEIVER NETWORK ── */}
      <PresenceCard noPadding>
        <div className="p-4 border-b border-indigo-50 dark:border-white/5 flex items-center justify-between">
           <div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-widest">Active Subscribers</h3>
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1">Subscribed users</p>
           </div>
           <Users className="w-6 h-6 text-indigo-100" strokeWidth={1.25} />
        </div>
        
        {subs.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center">
             <Users className="w-16 h-16 mb-5 text-indigo-100" />
             <p className="font-black text-xl text-zinc-500 uppercase tracking-widest">No Subscribers Yet</p>
          </div>
        ) : (
          <div className="divide-y divide-indigo-50 dark:divide-white/5">
            {subs.map(sub => (
              <div key={sub.id} className={`flex items-center px-8 py-6 transition-all ${removingId === sub.id ? 'opacity-40 grayscale' : 'hover:bg-gray-50/30 dark:hover:bg-white/5'}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-zinc-900 dark:text-zinc-50 truncate uppercase tracking-tight">{sub.email}</p>
                  <p className="text-[10px] font-black text-zinc-400 mt-1 uppercase tracking-widest">
                    Subscribed · {new Date(sub.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(sub)}
                  disabled={!!removingId || isPending}
                  className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center justify-center shrink-0 min-w-[44px] min-h-[44px]"
                >
                  <Trash2 className="w-5 h-5" strokeWidth={1.25} />
                </button>
              </div>
            ))}
          </div>
        )}
      </PresenceCard>

      {/* ── EMAIL MODAL ── */}
      {showCompose && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-2xl bg-white dark:bg-[#181623] rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
              <div className="p-10 border-b border-indigo-50 dark:border-white/5 flex items-center justify-between bg-indigo-50/30">
                 <div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">Send Email</h2>
                    <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-widest mt-1">Sending to {subs.length} subscribers</p>
                 </div>
                 <button className="w-12 h-12 rounded-full bg-white dark:bg-zinc-950 text-zinc-500 flex items-center justify-center shadow-sm" onClick={() => setShowCompose(false)}>
                    <X className="w-6 h-6" strokeWidth={1.25} />
                 </button>
              </div>
              
              <form onSubmit={handleSend} className="p-10 flex flex-col gap-4">
                 <div className="space-y-3">
                   <label className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Email Subject</label>
                   <input 
                     value={subject} 
                     onChange={e => setSubject(e.target.value)} 
                     required 
                     placeholder="Broadcasting: System Update..." 
                     className="w-full h-14 px-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-none text-sm font-bold shadow-inner" 
                   />
                 </div>
                 <div className="space-y-3">
                   <label className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Email Message</label>
                   <textarea 
                     value={body} 
                     onChange={e => setBody(e.target.value)} 
                     required 
                     rows={10} 
                     placeholder="Write the transmission content..." 
                     className="w-full p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-950 border-none text-sm font-bold shadow-inner placeholder-gray-300 resize-none"
                   />
                   <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right">Plain text formatting only</p>
                 </div>

                 <div className="flex flex-col gap-4">
                   {sendStatus === 'error' && (
                     <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-rose-50 text-rose-500 text-xs font-black uppercase tracking-widest">
                       <AlertCircle className="w-5 h-5" strokeWidth={1.25} /> {errorMsg}
                     </div>
                   )}
                   {sendStatus === 'sent' && (
                     <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-50 text-emerald-500 text-xs font-black uppercase tracking-widest">
                       <CheckCircle2 className="w-5 h-5" strokeWidth={1.25} /> Email sent successfully
                     </div>
                   )}
                   
                   <PresenceButton 
                     type="submit" 
                     className="w-full h-16 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black tracking-[0.2em] text-xs uppercase shadow-2xl shadow-indigo-500/20" 
                     loading={sendStatus === 'sending'} 
                     disabled={sendStatus === 'sending' || sendStatus === 'sent'}
                   >
                     {sendStatus === 'sent' ? 'SENT' : 'SEND EMAIL'}
                   </PresenceButton>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* ── PUSH NOTIFICATION MODAL ── */}
      {showPushCompose && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-2xl bg-white dark:bg-[#181623] rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
              <div className="p-10 border-b border-rose-50 dark:border-white/5 flex items-center justify-between bg-rose-50/30">
                 <div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">Broadcast Push</h2>
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mt-1">Instant Alert to all devices</p>
                 </div>
                 <button className="w-12 h-12 rounded-full bg-white dark:bg-zinc-950 text-zinc-500 flex items-center justify-center shadow-sm" onClick={() => setShowPushCompose(false)}>
                    <X className="w-6 h-6" strokeWidth={1.25} />
                 </button>
              </div>
              
              <form onSubmit={handleSendPush} className="p-10 flex flex-col gap-4">
                 <div className="space-y-3">
                   <label className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Push Title</label>
                   <input 
                     value={pushTitle} 
                     onChange={e => setPushTitle(e.target.value)} 
                     required 
                     placeholder="Breaking News: Sathyadhare Exclusive..." 
                     className="w-full h-14 px-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-none text-sm font-bold shadow-inner" 
                   />
                 </div>
                 <div className="space-y-3">
                   <label className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Push Message</label>
                   <textarea 
                     value={pushMsg} 
                     onChange={e => setPushMsg(e.target.value)} 
                     required 
                     rows={4} 
                     placeholder="Brief message appearing on lock screens..." 
                     className="w-full p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-950 border-none text-sm font-bold shadow-inner placeholder-gray-300 resize-none"
                   />
                 </div>

                 <div className="flex flex-col gap-4">
                   {pushStatus === 'error' && (
                     <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-rose-50 text-rose-500 text-xs font-black uppercase tracking-widest">
                       <AlertCircle className="w-5 h-5" strokeWidth={1.25} /> {errorMsg}
                     </div>
                   )}
                   {pushStatus === 'sent' && (
                     <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-50 text-emerald-500 text-xs font-black uppercase tracking-widest">
                       <CheckCircle2 className="w-5 h-5" strokeWidth={1.25} /> Push alert sent!
                     </div>
                   )}
                   
                   <PresenceButton 
                     type="submit" 
                     className="w-full h-16 bg-rose-500 text-white font-black tracking-[0.2em] text-xs uppercase shadow-2xl shadow-rose-500/20 underline-offset-4" 
                     loading={pushStatus === 'sending'} 
                     disabled={pushStatus === 'sending' || pushStatus === 'sent'}
                   >
                     {pushStatus === 'sent' ? 'BLASTED!' : 'BLAST PUSH ALERT'}
                   </PresenceButton>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}
