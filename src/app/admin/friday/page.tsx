import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Plus, Calendar, Settings, Eye } from 'lucide-react';

export default async function FridayMessagesPage() {
  const supabase = await createClient();

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

    const { error: preciseResetError } = await supabaseAction
      .from('friday_messages')
      .update({ is_published: false })
      .eq('is_published', true);

    if (preciseResetError) {
       console.error('Error resetting publish statuses:', preciseResetError);
    }

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

  return (
    <div className="font-sans antialiased max-w-3xl mx-auto py-2">
      <div className="flex items-center justify-between mb-8 mt-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)]">
            <Link href="/admin">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-tight">Friday Messages</h1>
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
              {messages?.length || 0} messages
            </p>
          </div>
        </div>
        <Button asChild className="rounded-full shadow-sm pr-5">
          <Link href="/admin/friday/new">
            <Plus className="w-5 h-5 mr-1" />
            <span className="hidden sm:inline">New Message</span>
            <span className="sm:hidden">New</span>
          </Link>
        </Button>
      </div>

      {!messages || messages.length === 0 ? (
        <Card className="py-20 text-center flex flex-col items-center bg-[var(--color-surface)] border-[var(--color-border)] border-dashed rounded-[2rem] shadow-none">
          <Calendar className="w-12 h-12 mb-4 opacity-20 text-[var(--color-muted)]" />
          <p className="font-bold mb-1 text-lg tracking-tight">No messages found</p>
          <p className="text-sm text-[var(--color-muted)]">Create your first Friday message</p>
        </Card>
      ) : (
        <div className="space-y-4">
           {messages.map((msg) => (
             <Card key={msg.id} hoverable className="rounded-3xl border-transparent bg-[var(--color-surface)] shadow-none">
               <CardContent className="p-5 flex flex-col sm:flex-row gap-4 items-center justify-between">
                 
                 <div className="flex-1 min-w-0 font-bold text-lg truncate tracking-tight text-white flex items-center gap-3">
                   {msg.title || 'Untitled Message'}
                   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                     msg.is_published 
                       ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                       : 'bg-gray-500/10 text-[var(--color-muted)] border-gray-500/20'
                   }`}>
                     {msg.is_published ? 'Published' : 'Draft'}
                   </span>
                 </div>
                 
                 <div className="flex items-center gap-2 flex-shrink-0">
                    {!msg.is_published && (
                      <form action={publishMessageAction} className="flex-1 sm:flex-none">
                        <input type="hidden" name="id" value={msg.id} />
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          className="w-full text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-500"
                        >
                          <Eye className="w-4 h-4 mr-1.5" />
                          Publish
                        </Button>
                      </form>
                    )}
                    <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none text-blue-500 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:text-blue-500" disabled>
                       <Link href={`/admin/friday/${msg.id}/edit`}>
                         <Settings className="w-4 h-4 mr-1.5" />
                         Edit
                       </Link>
                    </Button>
                 </div>
                 
               </CardContent>
             </Card>
           ))}
        </div>
      )}
    </div>
  );
}
