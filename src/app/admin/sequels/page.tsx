import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAuditEvent } from '@/lib/audit';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Plus, Settings } from 'lucide-react';

export default async function SequelsPage() {
  const supabase = await createClient();

  const { data: sequels, error } = await supabase
    .from('sequels')
    .select('id, title, status')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sequels:', error);
  }

  async function publishSequelAction(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;

    const supabaseAction = await createClient();
    const { data: { user } } = await supabaseAction.auth.getUser();
    if (!user) return;
    
    // Server-side action to change status and mark published_at dynamically
    const { error: updateError } = await supabaseAction
      .from('sequels')
      .update({ 
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error publishing sequel:', updateError);
      return;
    }

    await logAuditEvent(user.id, 'SEQUEL_PUBLISHED', { sequel_id: id });

    revalidatePath('/admin/sequels');
    redirect('/admin/sequels');
  }

  return (
    <div className="font-sans antialiased max-w-4xl mx-auto py-2">
      <div className="flex items-center justify-between mb-8 mt-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)]">
            <Link href="/admin">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-tight">Sequels</h1>
            <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
              {sequels?.length || 0} Total
            </p>
          </div>
        </div>
        <Button asChild className="rounded-full shadow-sm pr-5">
          <Link href="/admin/sequels/new">
            <Plus className="w-5 h-5 mr-1" />
            <span className="hidden sm:inline">New Sequel</span>
            <span className="sm:hidden">New</span>
          </Link>
        </Button>
      </div>

      {!sequels || sequels.length === 0 ? (
        <Card className="py-20 text-center flex flex-col items-center bg-[var(--color-surface)] border-[var(--color-border)] border-dashed rounded-[2rem] shadow-none">
          <Settings className="w-12 h-12 mb-4 opacity-20 text-[var(--color-muted)]" />
          <p className="font-bold mb-1 text-lg tracking-tight">No sequels yet</p>
          <p className="text-sm text-[var(--color-muted)]">Create your first sequel</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sequels.map((sequel) => (
            <Card key={sequel.id} hoverable className="rounded-3xl border-transparent bg-[var(--color-surface)] shadow-none transition-all">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                <div className="flex-1 min-w-0 font-bold text-lg leading-tight tracking-tight flex items-center gap-3">
                  <span className="truncate text-white">{sequel.title}</span>
                  <span
                    className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      sequel.status === 'published'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-gray-500/10 text-[var(--color-muted)] border-gray-500/20'
                    }`}
                  >
                    {sequel.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-3 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)] w-full sm:w-auto flex-shrink-0">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none text-blue-500 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:text-blue-500"
                  >
                    <Link href={`/admin/sequels/${sequel.id}/edit`}>
                      <Settings className="w-3.5 h-3.5 mr-1.5" />
                      Manage
                    </Link>
                  </Button>
                  {sequel.status === 'draft' && (
                    <form action={publishSequelAction} className="flex-1 sm:flex-none">
                      <input type="hidden" name="id" value={sequel.id} />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        className="w-full text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-500"
                      >
                        Publish
                      </Button>
                    </form>
                  )}
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
