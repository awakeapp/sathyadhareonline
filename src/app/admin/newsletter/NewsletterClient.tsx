'use client';

import { useState, useTransition } from 'react';

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
  const [tab, setTab] = useState<'active' | 'compose'>('active');

  // ── Export CSV ────────────────────────────────────────────────
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

  // ── Remove (unsubscribe) ────────────────────────────────────
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
        alert(j.error ?? 'Failed to remove subscriber');
      }
      setRemovingId(null);
    });
  }

  // ── Send newsletter ─────────────────────────────────────────
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
      setErrorMsg(j.error ?? 'Send failed');
    }
  }

  const labelClass = 'block text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] mb-1.5';
  const inputClass = 'w-full px-4 py-3 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none';

  return (
    <div className="space-y-6">
      {/* ── Action bar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--color-primary)] text-black font-bold text-sm hover:bg-[#ffed4a] transition-all shadow-lg shadow-[var(--color-primary)]/20 active:scale-95">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          Compose Newsletter
        </button>
        <button onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-white font-semibold text-sm transition-colors active:scale-95">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export CSV
        </button>
      </div>

      {/* ── Subscriber list ─────────────────────────────────────── */}
      {subs.length === 0 ? (
        <div className="py-20 text-center text-[var(--color-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl">
          <p className="font-semibold text-white mb-1">No subscribers yet</p>
          <p className="text-sm">Readers who sign up for the newsletter will appear here.</p>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-lg">
          <div className="px-5 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
              {subs.length} Active Subscriber{subs.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {subs.map(sub => (
              <div key={sub.id} className={`flex items-center px-5 py-3.5 transition-all ${removingId === sub.id ? 'opacity-40' : 'hover:bg-white/[0.02]'}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{sub.email}</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    Subscribed {new Date(sub.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(sub)}
                  disabled={!!removingId || isPending}
                  title="Remove subscriber"
                  className="ml-4 flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors disabled:opacity-50"
                >
                  {removingId === sub.id ? '…' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ COMPOSE MODAL ════════════════════════════════════════════ */}
      {showCompose && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => { if (sendStatus !== 'sending') setShowCompose(false); }}>
          <div className="w-full max-w-xl bg-[var(--color-background)] border border-[var(--color-border)] rounded-3xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
              <div>
                <h2 className="text-base font-bold text-white">Compose Newsletter</h2>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">Sending to {subs.length} subscriber{subs.length !== 1 ? 's' : ''}</p>
              </div>
              {sendStatus !== 'sending' && (
                <button onClick={() => setShowCompose(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>

            {/* Modal body */}
            <form onSubmit={handleSend} className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Subject</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} required
                  placeholder="Your newsletter subject line"
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Message Body</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} required
                  rows={8} placeholder="Write your newsletter content here…"
                  className={`${inputClass} resize-none leading-relaxed`} />
                <p className="text-[10px] text-[var(--color-muted)] mt-1">Plain text only. This will be sent as a plain email.</p>
              </div>

              {sendStatus === 'error' && (
                <p className="text-sm text-red-400 font-semibold">{errorMsg}</p>
              )}
              {sendStatus === 'sent' && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  Newsletter sent successfully!
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCompose(false)} disabled={sendStatus === 'sending'}
                  className="flex-1 py-3 rounded-2xl border border-[var(--color-border)] text-[var(--color-muted)] hover:text-white font-semibold text-sm transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={sendStatus === 'sending' || sendStatus === 'sent'}
                  className="flex-1 py-3 rounded-2xl bg-[var(--color-primary)] text-black font-bold text-sm hover:bg-[#ffed4a] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {sendStatus === 'sending' ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> Sending…</>
                  ) : sendStatus === 'sent' ? '✓ Sent' : `Send to ${subs.length} Subscribers`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
