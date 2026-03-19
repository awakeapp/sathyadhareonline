'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  CheckCircle2, XCircle, Archive, ChevronDown, ChevronUp,
  Clock, Search, Mail, FileText, User as UserIcon, BookOpen
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { acceptSubmissionAction, rejectSubmissionAction, archiveSubmissionAction } from './submission-actions';

type Submission = {
  id: string;
  name: string | null;
  email: string | null;
  title: string | null;
  content: string | null;
  summary: string | null;
  source_reference: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function wordCount(text: string | null): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'archived', label: 'Archived' },
];

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700 ring-amber-400/30 dark:bg-amber-500/10 dark:text-amber-400',
  accepted: 'bg-emerald-50 text-emerald-700 ring-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-400',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-400/30 dark:bg-rose-500/10 dark:text-rose-400',
  archived: 'bg-gray-100 text-gray-500 ring-gray-300/30 dark:bg-white/5 dark:text-gray-400',
};

function AcceptPanel({ subId, editors, onDone }: { subId: string; editors: { id: string; full_name: string }[]; onDone: () => void }) {
  const [editorId, setEditorId] = useState(editors[0]?.id || '');
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    startTransition(async () => {
      const res = await acceptSubmissionAction(subId, editorId);
      if (res.error) { toast.error(res.error); }
      else { toast.success('Submission accepted — draft article created'); onDone(); }
    });
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 mt-2">
      <p className="text-[13px] font-bold text-emerald-700 dark:text-emerald-400">Assign to Editor</p>
      <select
        value={editorId}
        onChange={e => setEditorId(e.target.value)}
        className="h-9 rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-white dark:bg-emerald-900/10 text-[13px] font-medium px-3 text-[var(--color-text)] outline-none cursor-pointer"
      >
        <option value="">Unassigned</option>
        {editors.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
      </select>
      <div className="flex gap-2">
        <button onClick={onDone} disabled={isPending} className="flex-1 h-9 rounded-xl border border-[var(--color-border)] text-[12px] font-bold text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] transition-colors">Cancel</button>
        <button onClick={handleAccept} disabled={isPending} className="flex-1 h-9 rounded-xl bg-emerald-600 text-white text-[12px] font-bold hover:bg-emerald-700 transition-colors">
          {isPending ? 'Saving…' : 'Confirm Accept'}
        </button>
      </div>
    </div>
  );
}

function RejectPanel({ subId, onDone }: { subId: string; onDone: () => void }) {
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleReject = () => {
    if (!reason.trim()) { toast.error('Please provide a rejection reason.'); return; }
    startTransition(async () => {
      const res = await rejectSubmissionAction(subId, reason.trim());
      if (res.error) { toast.error(res.error); }
      else { toast.success('Submission rejected'); onDone(); }
    });
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-200 dark:border-rose-500/20 mt-2">
      <p className="text-[13px] font-bold text-rose-700 dark:text-rose-400">Rejection Reason (shown to submitter)</p>
      <textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="e.g. Does not match editorial guidelines…"
        rows={3}
        className="resize-none rounded-xl border border-rose-200 dark:border-rose-500/20 bg-white dark:bg-rose-900/10 text-[13px] p-3 outline-none font-medium text-[var(--color-text)]"
      />
      <div className="flex gap-2">
        <button onClick={onDone} disabled={isPending} className="flex-1 h-9 rounded-xl border border-[var(--color-border)] text-[12px] font-bold text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] transition-colors">Cancel</button>
        <button onClick={handleReject} disabled={isPending} className="flex-1 h-9 rounded-xl bg-rose-600 text-white text-[12px] font-bold hover:bg-rose-700 transition-colors">
          {isPending ? 'Saving…' : 'Confirm Reject'}
        </button>
      </div>
    </div>
  );
}

function SubmissionCard({ sub, editors }: { sub: Submission; editors: { id: string; full_name: string }[] }) {
  const [expanded, setExpanded] = useState(false);
  const [panel, setPanel] = useState<'accept' | 'reject' | null>(null);
  const [isPending, startTransition] = useTransition();

  const wc = wordCount(sub.content);
  const statusStyle = STATUS_STYLE[sub.status] ?? STATUS_STYLE.pending;

  const handleArchive = () => {
    startTransition(async () => {
      const res = await archiveSubmissionAction(sub.id);
      if (res.error) toast.error(res.error);
      else toast.success('Submission archived');
    });
  };

  return (
    <div className={`bg-[var(--color-surface)] border rounded-2xl overflow-hidden transition-all ${expanded ? 'border-[var(--color-primary)]/30 shadow-lg shadow-[var(--color-primary)]/5' : 'border-[var(--color-border)]'}`}>
      
      {/* Card Header — always visible */}
      <div
        onClick={() => setExpanded(v => !v)}
        className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors"
      >
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset ${statusStyle}`}>
              {sub.status}
            </span>
            {sub.rejection_reason && (
              <span className="text-[12px] text-rose-600 dark:text-rose-400 font-medium italic truncate max-w-xs">
                "{sub.rejection_reason}"
              </span>
            )}
          </div>
          <h3 className="text-[15px] font-bold text-[var(--color-text)] leading-snug pr-4">
            {sub.title || 'Untitled Submission'}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-[12px] text-[var(--color-muted)] font-medium">
            <span className="flex items-center gap-1"><UserIcon size={12} /> {sub.name || 'Anonymous'}</span>
            <span className="flex items-center gap-1"><Mail size={12} /> {sub.email || '—'}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {timeAgo(sub.created_at)}</span>
            {wc > 0 && <span className="flex items-center gap-1"><FileText size={12} /> {wc.toLocaleString()} words</span>}
          </div>
        </div>
        <div className="shrink-0 text-[var(--color-muted)]">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Expanded detail section */}
      {expanded && (
        <div className="border-t border-[var(--color-border)] flex flex-col gap-4 p-5">
          {sub.summary && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-1.5">Summary</p>
              <p className="text-[14px] text-[var(--color-text)] font-medium leading-relaxed">{sub.summary}</p>
            </div>
          )}

          {sub.source_reference && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-1.5">Source</p>
              <p className="text-[13px] text-[var(--color-muted)] font-medium">{sub.source_reference}</p>
            </div>
          )}

          {sub.content && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[var(--color-muted)] mb-2">Full Content</p>
              <div className="max-h-80 overflow-y-auto rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] p-5 text-[14px] text-[var(--color-text)] leading-relaxed font-medium whitespace-pre-wrap">
                {sub.content}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {sub.status === 'pending' && panel === null && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--color-border)]">
              <button
                onClick={e => { e.stopPropagation(); setPanel('accept'); }}
                className="flex items-center gap-2 h-9 px-5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors text-[12px] font-bold uppercase tracking-wider"
              >
                <CheckCircle2 size={14} /> Accept
              </button>
              <button
                onClick={e => { e.stopPropagation(); setPanel('reject'); }}
                className="flex items-center gap-2 h-9 px-5 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 transition-colors text-[12px] font-bold uppercase tracking-wider"
              >
                <XCircle size={14} /> Reject
              </button>
              <button
                disabled={isPending}
                onClick={e => { e.stopPropagation(); handleArchive(); }}
                className="flex items-center gap-2 h-9 px-5 rounded-xl bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:bg-[var(--color-border)] transition-colors text-[12px] font-bold uppercase tracking-wider ml-auto"
              >
                <Archive size={14} /> Archive
              </button>
            </div>
          )}

          {panel === 'accept' && (
            <AcceptPanel subId={sub.id} editors={editors} onDone={() => setPanel(null)} />
          )}
          {panel === 'reject' && (
            <RejectPanel subId={sub.id} onDone={() => setPanel(null)} />
          )}

          {/* Archive button for non-pending */}
          {sub.status !== 'pending' && sub.status !== 'archived' && (
            <div className="pt-2 border-t border-[var(--color-border)]">
              <button
                disabled={isPending}
                onClick={e => { e.stopPropagation(); handleArchive(); }}
                className="flex items-center gap-2 h-9 px-5 rounded-xl bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:bg-[var(--color-border)] transition-colors text-[12px] font-bold uppercase tracking-wider"
              >
                <Archive size={14} /> Archive
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GuestSubmissionsClient({ submissions, editors }: {
  submissions: Submission[];
  editors: { id: string; full_name: string }[];
}) {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = submissions;
    if (statusFilter !== 'all') list = list.filter(s => s.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [submissions, statusFilter, search]);

  return (
    <div className="flex flex-col gap-6">

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl flex-wrap">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all ${
                statusFilter === tab.id
                  ? 'bg-[var(--color-surface)] shadow text-[var(--color-text)] border border-[var(--color-border)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or name…"
            className="w-full h-10 pl-9 pr-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[13px] font-medium outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
          />
        </div>
      </div>

      {/* Count */}
      <p className="text-[13px] text-[var(--color-muted)] font-semibold">
        Showing {filtered.length} submission{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="p-16 text-center flex flex-col items-center gap-3 bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] rounded-3xl">
          <BookOpen size={32} className="text-[var(--color-muted)] opacity-30" />
          <p className="text-[15px] font-bold text-[var(--color-text)]">No submissions found</p>
          <p className="text-[13px] text-[var(--color-muted)]">
            {statusFilter === 'all' ? 'No reader submissions have been received yet.' : `No ${statusFilter} submissions.`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(sub => (
            <SubmissionCard key={sub.id} sub={sub} editors={editors} />
          ))}
        </div>
      )}
    </div>
  );
}
