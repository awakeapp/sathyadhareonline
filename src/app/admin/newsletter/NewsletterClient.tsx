'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Textarea, Label } from '@/components/ui/Input';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from '@/components/ui/Modal';
import { Mail, Download, Trash2, CheckCircle2, AlertCircle, Users } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      {/* ── Action bar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setShowCompose(true)} className="rounded-full shadow-sm pr-5">
          <Mail className="w-5 h-5 mr-1" />
          <span className="font-bold text-sm">Compose Newsletter</span>
        </Button>
        <Button variant="outline" onClick={handleExport} className="rounded-full border-[var(--color-border)] text-[var(--color-muted)] hover:text-white transition-colors">
          <Download className="w-4 h-4 mr-2" />
          <span className="font-semibold text-sm">Export CSV</span>
        </Button>
      </div>

      {/* ── Subscriber list ─────────────────────────────────────── */}
      {subs.length === 0 ? (
        <Card className="py-20 text-center flex flex-col items-center bg-[var(--color-surface)] border-[var(--color-border)] border-dashed rounded-[2rem] shadow-none">
          <Users className="w-12 h-12 mb-4 opacity-20 text-[var(--color-muted)]" />
          <p className="font-bold mb-1 text-lg tracking-tight">No subscribers yet</p>
          <p className="text-sm text-[var(--color-muted)]">Readers who sign up for the newsletter will appear here.</p>
        </Card>
      ) : (
        <Card className="bg-[var(--color-surface)] border-transparent rounded-[2rem] overflow-hidden shadow-none">
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
              {subs.length} Active Subscriber{subs.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {subs.map(sub => (
              <div key={sub.id} className={`flex items-center px-5 py-4 transition-all ${removingId === sub.id ? 'opacity-40' : 'hover:bg-white/[0.02]'}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{sub.email}</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    Subscribed {new Date(sub.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <Button
                  onClick={() => handleRemove(sub)}
                  disabled={!!removingId || isPending}
                  variant="outline"
                  size="sm"
                  className="ml-4 flex-shrink-0 text-red-500 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  {removingId === sub.id ? 'Removing…' : 'Remove'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ══ COMPOSE MODAL ════════════════════════════════════════════ */}
      <Modal open={showCompose} onOpenChange={(open) => {
        if (!open && sendStatus !== 'sending') setShowCompose(false);
      }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Compose Newsletter</ModalTitle>
            <ModalDescription>Sending to {subs.length} subscriber{subs.length !== 1 ? 's' : ''}</ModalDescription>
          </ModalHeader>

          <form onSubmit={handleSend} className="grid gap-4 py-4">
            <div>
              <Label>Subject</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} required placeholder="Your newsletter subject line" />
            </div>
            <div>
              <Label>Message Body</Label>
              <Textarea value={body} onChange={e => setBody(e.target.value)} required rows={8} placeholder="Write your newsletter content here…" className="resize-none" />
              <p className="text-[10px] text-[var(--color-muted)] mt-1">Plain text only. This will be sent as a plain email.</p>
            </div>

            {sendStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-400 text-sm font-semibold">
                <AlertCircle className="w-4 h-4" />
                {errorMsg}
              </div>
            )}
            {sendStatus === 'sent' && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Newsletter sent successfully!
              </div>
            )}
          </form>

          <ModalFooter>
             <Button type="button" variant="ghost" onClick={() => setShowCompose(false)} disabled={sendStatus === 'sending'}>
               Cancel
             </Button>
             <Button onClick={handleSend} type="submit" variant="primary" loading={sendStatus === 'sending'} disabled={sendStatus === 'sending' || sendStatus === 'sent'}>
               {sendStatus === 'sent' ? '✓ Sent' : 'Send'}
             </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
