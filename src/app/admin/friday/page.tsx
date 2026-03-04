import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';

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

    // Set all messages to false
    const { error: resetError } = await supabaseAction
      .from('friday_messages')
      .update({ is_published: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // small hack to update all rows if needed, or simply not specifying eq

    // A better approach matching PostgREST specs: 
    // update({ is_published: false }) without filter might throw depending 
    // on setup so we can update only where is_published is true
    const { error: preciseResetError } = await supabaseAction
      .from('friday_messages')
      .update({ is_published: false })
      .eq('is_published', true);

    if (resetError && preciseResetError) {
       console.error('Error resetting publish statuses:', preciseResetError);
    }

    // Set target message to true
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
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Friday Messages</h1>
        <Link
          href="/admin/friday/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          New Message
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {!messages || messages.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                  No Friday messages found. Create your first one!
                </td>
              </tr>
            ) : (
              messages.map((msg) => (
                <tr key={msg.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900 line-clamp-1">
                      {msg.title || 'Untitled Message'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        msg.is_published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    {!msg.is_published && (
                      <form action={publishMessageAction}>
                        <input type="hidden" name="id" value={msg.id} />
                        <button
                          type="submit"
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition-colors"
                        >
                          Publish
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
