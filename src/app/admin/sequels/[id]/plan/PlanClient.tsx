'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, FileText, AlignLeft, User as UserIcon, Calendar, Filter, Activity, Bookmark } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/Button';
import { Input, Select, Label } from '@/components/ui/Input';
import { addSequelPieceAction, updateSequelPieceAction } from './actions';

export default function PlanClient({ sequel, pieces, editors }: {
  sequel: any;
  pieces: any[];
  editors: any[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);

  const completedCount = pieces.filter(p => p.status === 'approved').length;
  const totalCount = pieces.length;

  const STATUS_CLASSES: Record<string, string> = {
    not_started: 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300',
    in_progress: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    submitted: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
  };

  const TYPE_CLASSES: Record<string, string> = {
    editorial: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
    poem: 'bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400 border-pink-200 dark:border-pink-500/20',
    fiction: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
    essay: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400 border-teal-200 dark:border-teal-500/20',
  };

  const handleCreatePiece = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addSequelPieceAction(sequel.id, formData);
      if (res.error) toast.error(res.error);
      else {
        toast.success('Piece drafted successfully');
        setIsAdding(false);
      }
    });
  };

  const handleChangeStatus = (pieceId: string, status: string) => {
    startTransition(async () => {
      const res = await updateSequelPieceAction(pieceId, sequel.id, { status });
      if (res.error) toast.error(res.error);
      else toast.success('Status updated');
    });
  };

  const handleChangeAssignment = (pieceId: string, assigned_to: string) => {
    startTransition(async () => {
      const res = await updateSequelPieceAction(pieceId, sequel.id, { assigned_to: assigned_to || null });
      if (res.error) toast.error(res.error);
      else toast.success('Assignment updated');
    });
  };

  return (
    <div className="w-full flex flex-col gap-8">
      
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-[var(--color-border)]">
        <div className="flex gap-5 items-center">
          {sequel.banner_image ? (
            <img src={sequel.banner_image} alt={sequel.title} className="w-20 h-24 object-cover rounded-xl shadow border border-[var(--color-border)] shrink-0" />
          ) : (
            <div className="w-20 h-24 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center border border-[var(--color-border)] shrink-0">
              <FileText size={24} className="text-[var(--color-muted)] opacity-50" />
            </div>
          )}
          <div className="flex flex-col gap-1 min-w-0">
            <Link href="/admin/sequels" className="text-[12px] font-bold text-[var(--color-muted)] hover:text-[var(--color-primary)] flex items-center gap-1 uppercase tracking-widest mb-1 transition-colors">
              <ArrowLeft size={12} strokeWidth={3} /> Sequels
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text)] tracking-tight truncate leading-tight">
              {sequel.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-1">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
                <Calendar size={14} className="text-amber-500" /> 
                {sequel.published_at ? new Date(sequel.published_at).toLocaleDateString() : 'Unscheduled'}
              </span>
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-muted)]">
                <Filter size={14} className="text-emerald-500" />
                {completedCount} of {totalCount} completed
              </span>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={() => setIsAdding(true)}
          className="h-10 px-5 rounded-full bg-[var(--color-text)] text-[var(--color-bg)] font-bold text-[12px] uppercase tracking-wider shrink-0 shadow-lg"
        >
          <Plus size={14} className="mr-1.5" /> Add Piece
        </Button>
      </div>

      {/* 2. Add Piece Form (Inline) */}
      {isAdding && (
        <div className="bg-[var(--color-surface-2)] border border-[var(--color-primary)]/30 rounded-3xl p-6 shadow-xl shadow-[var(--color-primary)]/5 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 mb-4">
            <Bookmark size={18} className="text-[var(--color-primary)]" />
            <h2 className="text-[16px] font-bold text-[var(--color-text)]">Plan New Piece</h2>
          </div>
          <form onSubmit={handleCreatePiece} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <Label>Piece Title</Label>
              <Input name="title" required placeholder="e.g. Editorial Note, Winter Poem" className="bg-[var(--color-surface)]" />
            </div>
            
            <div className="space-y-1.5">
              <Label>Author Name</Label>
              <Input name="author_name" required placeholder="Name of the writer" className="bg-[var(--color-surface)]" />
            </div>

            <div className="space-y-1.5">
              <Label>Piece Type</Label>
              <Select name="type" required className="bg-[var(--color-surface)] cursor-pointer">
                <option value="editorial">Editorial</option>
                <option value="poem">Poem</option>
                <option value="fiction">Fiction</option>
                <option value="essay">Essay</option>
                <option value="other">Other</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Assign To (Editor)</Label>
              <Select name="assigned_to" className="bg-[var(--color-surface)] cursor-pointer">
                <option value="">Unassigned</option>
                {editors.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Admin Notes</Label>
              <Input name="notes" placeholder="Brief instructions..." className="bg-[var(--color-surface)]" />
            </div>

            <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-3 mt-2">
              <Button type="button" variant="outline" onClick={() => setIsAdding(false)} disabled={isPending} className="px-5 rounded-xl uppercase tracking-wider text-[11px] font-bold">
                Cancel
              </Button>
              <Button type="submit" loading={isPending} className="px-6 rounded-xl bg-[var(--color-primary)] text-white uppercase tracking-wider text-[11px] font-bold">
                Save Piece
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 3. The Board */}
      {pieces.length === 0 ? (
        <div className="p-12 text-center bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] rounded-3xl flex flex-col items-center justify-center gap-3">
          <AlignLeft size={32} className="text-[var(--color-muted)] opacity-30" />
          <p className="text-[15px] font-bold text-[var(--color-text)]">No Pieces Planned</p>
          <p className="text-[14px] text-[var(--color-muted)]">Click "Add Piece" to start building this Sequel's table of contents.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pieces.map(p => {
            const stateColor = STATUS_CLASSES[p.status || 'not_started'] || STATUS_CLASSES.not_started;
            const typeClass  = TYPE_CLASSES[p.type] || 'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300 border-gray-200 dark:border-white/10';
            
            return (
              <div key={p.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 hover:border-[var(--color-primary)]/30 transition-colors flex flex-col gap-4">
                
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border mb-2 ${typeClass}`}>
                      {p.type}
                    </span>
                    <h3 className="text-[15px] font-bold text-[var(--color-text)] leading-snug break-words">
                      {p.title}
                    </h3>
                    <p className="text-[13px] font-medium text-[var(--color-muted)] mt-1 flex items-center gap-1.5">
                      <UserIcon size={12} /> {p.author_name}
                    </p>
                  </div>
                </div>

                {/* Notes if any */}
                {p.notes && (
                  <div className="bg-[var(--color-surface-2)] p-2.5 rounded-lg border border-[var(--color-border)] text-[12px] text-[var(--color-muted)] italic">
                    <span className="font-semibold text-[var(--color-text)] not-italic">Notes:</span> {p.notes}
                  </div>
                )}

                {/* Assign / Status Selectors */}
                <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-[var(--color-border)]">
                  
                  <div className="flex-1 min-w-0 relative">
                    <select 
                      value={p.assigned_to || ''}
                      onChange={(e) => handleChangeAssignment(p.id, e.target.value)}
                      disabled={isPending}
                      className="w-full appearance-none h-9 pl-3 pr-8 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[12px] font-medium text-[var(--color-text)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {editors.map(e => (
                        <option key={e.id} value={e.id}>{e.full_name}</option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-muted)]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 relative">
                    <select 
                      value={p.status || 'not_started'}
                      onChange={(e) => handleChangeStatus(p.id, e.target.value)}
                      disabled={isPending}
                      className={`w-full appearance-none h-9 pl-3 pr-8 rounded-lg border text-[12px] font-bold uppercase tracking-wider outline-none cursor-pointer ${stateColor}`}
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="submitted">Submitted</option>
                      <option value="approved">Approved</option>
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
