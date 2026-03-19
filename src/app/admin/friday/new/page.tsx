import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ChevronLeft, Bell, Sparkles, Send } from 'lucide-react';
import { 
  PresenceWrapper, 
  PresenceHeader,
  PresenceCard,
  PresenceButton 
} from '@/components/PresenceUI';
import AdminContainer from '@/components/layout/AdminContainer';

export default async function NewFridayMessagePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  async function createMessageAction(formData: FormData) {
    'use server';
    const supabaseAction = await createClient();

    const title = formData.get('title') as string;
    const image_url = formData.get('image_url') as string;
    const message_text = formData.get('message_text') as string;

    const { error: insertError } = await supabaseAction
      .from('friday_messages')
      .insert({
        title,
        image_url,
        message_text,
        is_published: false,
      });

    if (insertError) {
      console.error('Error inserting friday message:', insertError);
      return; 
    }

    revalidatePath('/admin/friday');
    redirect('/admin/friday');
  }

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Super Admin"
        roleLabel="Friday Message · New"
        initials={initials}
        icon1Node={<ChevronLeft className="w-6 h-6" strokeWidth={1.25} />}
        icon1Href="/admin/friday"
        icon2Node={<Bell className="w-6 h-6" strokeWidth={1.25} />}
      />
      
      <AdminContainer className="w-full flex flex-col gap-4 relative z-20">
        <PresenceCard className="p-0 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="p-10 border-b border-indigo-50 dark:border-white/5 bg-indigo-50/10 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                 <Sparkles className="w-8 h-8 min-w-[44px] min-h-[44px]" strokeWidth={1.25} />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">Initialize Message</h2>
                 <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-widest mt-1">Create a new Friday Message</p>
              </div>
           </div>

           <form action={createMessageAction} className="p-10 space-y-10">
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Message Title</label>
                <input 
                  type="text" 
                  name="title" 
                  placeholder="e.g. Jummah Reflection - Week 42"
                  className="w-full h-16 px-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-none text-md font-bold shadow-inner" 
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Image URL</label>
                <input 
                  type="text" 
                  name="image_url" 
                  placeholder="https://images.unsplash.com/..."
                  className="w-full h-16 px-6 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-none text-sm font-bold shadow-inner" 
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Message Content</label>
                <textarea 
                  name="message_text" 
                  rows={8}
                  placeholder="The spiritual essence of this communication..."
                  className="w-full p-8 rounded-[2rem] bg-zinc-50 dark:bg-zinc-950 border-none text-md font-bold shadow-inner text-zinc-900 dark:text-zinc-50 leading-relaxed resize-none focus:ring-0"
                />
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right">Enter the message content</p>
              </div>

              <div className="flex justify-end pt-4 border-t border-indigo-50 dark:border-white/5">
                 <button 
                  type="submit" 
                  className="h-16 px-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  <Send className="w-5 h-5" strokeWidth={1.25} /> Save Message
                </button>
              </div>
           </form>
        </PresenceCard>
      </AdminContainer>
    </PresenceWrapper>
  );
}
