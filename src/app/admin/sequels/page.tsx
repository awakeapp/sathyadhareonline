import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Plus, Settings } from 'lucide-react';

export default async function SequelsPage() {
  const supabase = await createClient();

  const { data: sequels, error } = await supabase
    .from('sequels')
    .select('id, title, status')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sequels:', error);
  }

  async function publishSequelAction(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    if (!id) return;

    const supabaseAction = await createClient();
    
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

      <div className="bg-[var(--color-surface)] rounded-[2rem] shadow-none border border-[var(--color-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-border)]">
            <thead className="bg-[var(--color-surface-2)]">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-[var(--color-muted)] uppercase">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black tracking-widest text-[var(--color-muted)] uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black tracking-widest text-[var(--color-muted)] uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {!sequels || sequels.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-[var(--color-muted)] font-medium">
                    No sequels found. Create your first one!
                  </td>
                </tr>
              ) : (
                sequels.map((sequel) => (
                  <tr key={sequel.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-[var(--color-text)] line-clamp-1">
                        {sequel.title}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          sequel.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-gray-500/10 text-[var(--color-muted)] border-gray-500/20'
                        }`}
                      >
                        {sequel.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="text-blue-500 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:text-blue-500"
                        >
                          <Link href={`/admin/sequels/${sequel.id}/edit`}>
                            <Settings className="w-3.5 h-3.5 mr-1.5" />
                            Manage
                          </Link>
                        </Button>
                        {sequel.status === 'draft' && (
                          <form action={publishSequelAction}>
                            <input type="hidden" name="id" value={sequel.id} />
                            <Button
                              type="submit"
                              variant="outline"
                              size="sm"
                              className="text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-500"
                            >
                              Publish
                            </Button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
