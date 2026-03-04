import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export default async function AdminSubmissionsPage() {
  const supabase = await createClient();

  const { data: submissions, error } = await supabase
    .from('guest_submissions')
    .select('id, name, email, title, content, status, created_at')
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching submissions:', error);

  async function convertAction(formData: FormData) {
    'use server';
    const supabaseAction = await createClient();
    const id      = formData.get('id')      as string;
    const title   = formData.get('title')   as string;
    const content = formData.get('content') as string;

    // Generate a simple slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80);

    // Create article draft
    const { error: articleError } = await supabaseAction
      .from('articles')
      .insert({ title, content, slug, status: 'draft' });

    if (articleError) {
      console.error('Convert error:', articleError);
      return;
    }

    // Mark submission as converted
    await supabaseAction
      .from('guest_submissions')
      .update({ status: 'converted' })
      .eq('id', id);

    revalidatePath('/admin/submissions');
    revalidatePath('/admin/articles');
    redirect('/admin/submissions');
  }

  async function rejectAction(formData: FormData) {
    'use server';
    const supabaseAction = await createClient();
    const id = formData.get('id') as string;

    await supabaseAction
      .from('guest_submissions')
      .update({ status: 'rejected' })
      .eq('id', id);

    revalidatePath('/admin/submissions');
    redirect('/admin/submissions');
  }

  const statusStyles: Record<string, string> = {
    pending:   'bg-yellow-100 text-yellow-800',
    converted: 'bg-green-100 text-green-800',
    rejected:  'bg-red-100 text-red-800',
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Guest Submissions</h1>
          <p className="text-sm text-gray-500 mt-1">Review and convert reader-submitted articles.</p>
        </div>
        <span className="text-sm font-medium text-gray-400">
          {submissions?.filter(s => s.status === 'pending').length ?? 0} pending
        </span>
      </div>

      {!submissions || submissions.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No submissions yet.</div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className={`bg-white border rounded-2xl p-6 shadow-sm transition-all ${
                sub.status === 'pending' ? 'border-yellow-100' : 'border-gray-100 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h2 className="text-base font-bold text-gray-900 truncate">{sub.title}</h2>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyles[sub.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {sub.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    By <span className="font-medium text-gray-700">{sub.name}</span>
                    {' · '}
                    <a href={`mailto:${sub.email}`} className="text-indigo-600 hover:underline">{sub.email}</a>
                    {' · '}
                    {new Date(sub.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                  {sub.content && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-3 whitespace-pre-wrap">
                      {sub.content}
                    </p>
                  )}
                </div>

                {sub.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <form action={convertAction}>
                      <input type="hidden" name="id"      value={sub.id} />
                      <input type="hidden" name="title"   value={sub.title} />
                      <input type="hidden" name="content" value={sub.content ?? ''} />
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        ✓ Convert to Draft
                      </button>
                    </form>
                    <form action={rejectAction}>
                      <input type="hidden" name="id" value={sub.id} />
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        ✕ Reject
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
