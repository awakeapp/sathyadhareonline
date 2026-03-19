import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input, Select, Label } from '@/components/ui/Input';
import { PresenceHeader, PresenceButton } from '@/components/PresenceUI';
import { Video, ArrowLeft, Save, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { createBannerVideoAction } from '@/app/admin/manage/actions';
import AdminContainer from '@/components/layout/AdminContainer';

export default async function NewBannerVideoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  return (
    <AdminContainer className="flex flex-col gap-6 pb-20">
      <PresenceHeader>
        <div className="flex items-center gap-4">
          <Link href="/admin/manage?tab=banner" className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] transition-all">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-xl font-black uppercase tracking-tight text-[var(--color-text)] flex items-center gap-2">
              <PlayCircle size={20} className="text-rose-500" /> New Banner Video
            </h1>
            <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest">Main Dashboard Showcase</p>
          </div>
        </div>
      </PresenceHeader>

      <form action={createBannerVideoAction} className="p-8 bg-[var(--color-surface)] rounded-[2.5rem] border border-[var(--color-border)] shadow-xl shadow-rose-500/5 space-y-6">
        
        <div className="space-y-4">
          <div className="space-y-1.5 text-left">
            <Label className="text-[10px] uppercase font-black tracking-widest text-[var(--color-muted)] ml-1">Video Display Title</Label>
            <Input name="title" placeholder="Special Feature Presentation" className="h-14 rounded-2xl text-lg font-bold px-5" required />
          </div>

          <div className="space-y-1.5 text-left">
            <Label className="text-[10px] uppercase font-black tracking-widest text-[var(--color-muted)] ml-1">YouTube / Video Hosted URL</Label>
            <Input name="video_url" placeholder="https://youtube.com/watch?v=..." className="h-12 rounded-xl text-sm font-medium px-5" required />
          </div>

          <div className="space-y-1.5 text-left">
            <Label className="text-[10px] uppercase font-black tracking-widest text-[var(--color-muted)] ml-1">Thumbnail Preview Image</Label>
            <Input name="thumbnail_url" placeholder="https://images.unsplash.com/..." className="h-12 rounded-xl text-sm font-medium px-5" />
          </div>

          <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100 border-dashed">
             <div className="flex items-start gap-3">
                <div className="mt-0.5"><Video size={16} className="text-rose-500" /></div>
                <div className="flex flex-col gap-1">
                   <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Pro Tip</p>
                   <p className="text-[11px] font-bold text-rose-500 leading-relaxed">
                     Banner videos are featured prominently on the reader home dashboard. Ensure the content is high quality and optimized for mobile viewing.
                   </p>
                </div>
             </div>
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <Link href="/admin/manage?tab=banner" className="flex-1">
            <PresenceButton variant="outline" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px]" type="button">Cancel</PresenceButton>
          </Link>
          <PresenceButton className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-rose-500 text-white shadow-lg shadow-rose-500/20" type="submit">
            <Save size={16} className="mr-2" /> Save Video
          </PresenceButton>
        </div>
      </form>
    </AdminContainer>
  );
}
