import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input, Select, Label } from '@/components/ui/Input';
import { PresenceHeader, PresenceButton } from '@/components/PresenceUI';
import { Mic, ArrowLeft, Save, Mic2 } from 'lucide-react';
import Link from 'next/link';
import { createPodcastAction } from '@/app/admin/manage/actions';
import { revalidatePath } from 'next/cache';
import AdminContainer from '@/components/layout/AdminContainer';

export default async function NewPodcastPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: categories } = await supabase.from('categories').select('id, name').order('name');

  return (
    <AdminContainer className="flex flex-col gap-6 pb-[calc(var(--bottom-nav-height)+1rem)]">
      <PresenceHeader>
        <div className="flex items-center gap-4">
          <Link href="/admin/manage?tab=podcast" className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] transition-all min-w-[44px] min-h-[44px]">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-xl font-black uppercase tracking-tight text-[var(--color-text)] flex items-center gap-2">
              <Mic2 size={20} className="text-indigo-500" /> New Podcast
            </h1>
            <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest">Audio Content & Series</p>
          </div>
        </div>
      </PresenceHeader>

      <form action={createPodcastAction} className="p-8 bg-[var(--color-surface)] rounded-[2.5rem] border border-[var(--color-border)] shadow-xl shadow-indigo-500/5 space-y-6">
        
        <div className="space-y-4">
          <div className="space-y-1.5 text-left">
            <Label className="text-[10px] uppercase font-black tracking-widest text-[var(--color-muted)] ml-1">Podcast Title</Label>
            <Input name="title" placeholder="The Voice of Truth - Ep 1" className="h-14 rounded-2xl text-lg font-bold px-5" required />
          </div>

          <div className="space-y-1.5 text-left">
            <Label className="text-[10px] uppercase font-black tracking-widest text-[var(--color-muted)] ml-1">Audio URL / Cloud Link</Label>
            <Input name="audio_url" placeholder="https://storage.link/podcast.mp3" className="h-12 rounded-xl text-sm font-medium px-5" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <Label className="text-[10px] uppercase font-black tracking-widest text-[var(--color-muted)] ml-1">Category</Label>
              <Select name="category_id" className="h-12 rounded-xl">
                <option value="">Select Category</option>
                {categories?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5 text-left">
              <Label className="text-[10px] uppercase font-black tracking-widest text-[var(--color-muted)] ml-1">Initial Status</Label>
              <Select name="status" className="h-12 rounded-xl">
                <option value="draft">Save as Draft</option>
                <option value="published">Publish Now</option>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <Label className="text-[10px] uppercase font-black tracking-widest text-[var(--color-muted)] ml-1">Cover Image URL</Label>
            <Input name="cover_image" placeholder="https://images.unsplash.com/..." className="h-12 rounded-xl text-sm font-medium px-5" />
          </div>

          <div className="space-y-1.5 text-left">
            <Label className="text-[10px] uppercase font-black tracking-widest text-[var(--color-muted)] ml-1">Short Description</Label>
            <textarea 
              name="description" 
              placeholder="What is this podcast about?" 
              className="w-full h-32 p-5 rounded-[2rem] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm font-medium focus:border-[var(--color-primary)] outline-none transition-all resize-none"
            />
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <Link href="/admin/manage?tab=podcast" className="flex-1">
            <PresenceButton variant="outline" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px]" type="button">Cancel</PresenceButton>
          </Link>
          <PresenceButton className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" type="submit">
            <Save size={16} className="mr-2" /> Save Podcast
          </PresenceButton>
        </div>
      </form>
    </AdminContainer>
  );
}
