import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Plus, Calendar, Settings, Eye, Bell, Sparkles } from 'lucide-react';
import { 
  PresenceWrapper, 
  PresenceHeader,
  PresenceCard 
} from '@/components/PresenceUI';

export default async function FridayMessagesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  const { data: messages, error } = await supabase
    .from('friday_messages')
    .select('id, title, is_published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching friday messages:', error);
  }

  async function publishMessageAction(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;

    const supabaseAction = await createClient();

    await supabaseAction
      .from('friday_messages')
      .update({ is_published: false })
      .eq('is_published', true);

    const { error: updateError } = await supabaseAction
      .from('friday_messages')
      .update({ is_published: true })
      .eq('id', id);

    if (updateError) {
      console.error('Error publishing message:', updateError);
      return;
    }

    revalidatePath('/admin/friday');
    redirect('/admin/friday');
  }

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Presence"
        roleLabel={`Friday Dispatch · ${messages?.length || 0} Nodes`}
        initials={initials}
        icon1={Bell}
        icon2={Plus}
        icon2Href="/admin/friday/new"
      />
      
      <div className="px-5 -mt-8 pb-10 space-y-6 relative z-20 max-w-4xl mx-auto">
        {!messages || messages.length === 0 ? (
          <PresenceCard className="py-24 text-center border-dashed border-2 border-indigo-100 flex flex-col items-center">
            <Calendar className="w-16 h-16 mb-5 text-indigo-100" />
            <p className="font-black text-xl text-gray-400 uppercase tracking-widest">Temporal Void</p>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-2">No Friday communications detected</p>
          </PresenceCard>
        ) : (
          <div className="space-y-4">
             {messages.map((msg) => (
               <PresenceCard key={msg.id} noPadding className="group">
                 <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-5 min-w-0 flex-1">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform ${msg.is_published ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-50 dark:bg-white/5 text-gray-400'}`}>
                         <Sparkles className="w-7 h-7" />
                      </div>
                      <div className="min-w-0">
                         <h2 className="text-xl font-black text-[#1b1929] dark:text-white uppercase tracking-tight truncate hover:text-[#5c4ae4] transition-colors">{msg.title || 'Untitled Message'}</h2>
                         <div className="flex items-center gap-2 mt-1">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                              msg.is_published 
                                ? 'bg-emerald-50 text-emerald-500 border-emerald-100' 
                                : 'bg-gray-50 text-gray-300 border-indigo-50'
                            }`}>
                              {msg.is_published ? 'Active Relay' : 'Cold Storage'}
                            </span>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-3 shrink-0">
                      {!msg.is_published && (
                        <form action={publishMessageAction}>
                          <input type="hidden" name="id" value={msg.id} />
                          <button
                            type="submit"
                            className="h-12 px-8 rounded-xl bg-[#5c4ae4] text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                          >
                            Activate Relay
                          </button>
                        </form>
                      )}
                      <button disabled className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-300 flex items-center justify-center cursor-not-allowed">
                         <Settings className="w-6 h-6" />
                      </button>
                   </div>
                 </div>
               </PresenceCard>
             ))}
          </div>
        )}
      </div>
    </PresenceWrapper>
  );
}
