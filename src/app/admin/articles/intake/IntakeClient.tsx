'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input, Select, Label } from '@/components/ui/Input';
import { toast } from '@/lib/toast';
import { ArrowLeft, Save, FileText, User, Link2, BookOpen, MessageSquare, Briefcase } from 'lucide-react';
import { createIntakeAction } from './actions';

export default function IntakeClient({ categories, editors, currentUserId }: {
  categories: { id: string, name: string }[];
  editors: { id: string, full_name: string }[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createIntakeAction(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Intake article saved successfully.');
        router.push('/admin/articles');
        router.refresh();
      }
    });
  };

  return (
    <div className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[2rem] p-6 lg:p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Core Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2 text-left">
            <Label className="flex items-center gap-2"><FileText size={14} className="text-[var(--color-primary)]" /> Article Title *</Label>
            <Input name="title" placeholder="The Title of the Sourced Article" required className="h-12 text-[15px] font-medium rounded-2xl" />
          </div>

          <div className="space-y-2 text-left">
            <Label className="flex items-center gap-2"><BookOpen size={14} className="text-emerald-500" /> Category *</Label>
            <Select name="category_id" required className="h-12 text-[15px] font-medium rounded-2xl cursor-pointer">
              <option value="" disabled hidden selected>Select a Category...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* External Author Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl">
          <div className="space-y-2 text-left">
            <Label className="flex items-center gap-2"><User size={14} className="text-indigo-500" /> Author Name *</Label>
            <Input name="external_author_name" placeholder="John Doe (Original Writer)" required className="h-12 rounded-2xl" />
          </div>
          <div className="space-y-2 text-left">
            <Label className="flex items-center gap-2"><Link2 size={14} className="text-rose-500" /> Source Reference</Label>
            <Input name="source_reference" placeholder="e.g. https://website.com or 'New York Times'" className="h-12 rounded-2xl" />
          </div>
        </div>

        {/* Source Content */}
        <div className="space-y-2 text-left">
          <Label className="flex items-center gap-2"><FileText size={14} className="text-amber-500" /> Source Content *</Label>
          <textarea 
            name="content" 
            placeholder="Paste the raw text of the article here for the editor to format and refine..." 
            required 
            className="w-full h-80 p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[14px] font-medium resize-y focus:border-[var(--color-primary)] outline-none transition-all placeholder:text-[var(--color-muted)]/50 leading-relaxed" 
          />
        </div>

        {/* Assignment & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl">
          <div className="space-y-2 text-left">
            <Label className="flex items-center gap-2"><Briefcase size={14} className="text-cyan-500" /> Assign to Editor *</Label>
            <Select name="assigned_to" required className="h-12 rounded-2xl cursor-pointer">
              <option value="" disabled hidden selected>Choose an Editor...</option>
              {editors.map(e => (
                <option key={e.id} value={e.id}>{e.full_name || 'Unknown Editor'}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 text-left">
            <Label className="flex items-center gap-2"><MessageSquare size={14} className="text-fuchsia-500" /> Admin Notes for Editor</Label>
            <textarea 
              name="admin_notes" 
              placeholder="Internal instructions (e.g. 'Format this, check facts...')" 
              className="w-full h-32 p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[13px] font-medium resize-none focus:border-[var(--color-primary)]/50 outline-none transition-all" 
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/admin/articles')}
            disabled={isPending}
            className="h-12 px-6 rounded-2xl font-bold uppercase tracking-widest text-[11px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Cancel
          </Button>
          <Button 
            type="submit" 
            loading={isPending}
            className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-[var(--color-primary)] hover:opacity-90 transition-opacity shadow-lg shadow-[var(--color-primary)]/20"
          >
            <Save className="w-4 h-4 mr-2" /> Save as Draft
          </Button>
        </div>

      </form>
    </div>
  );
}
