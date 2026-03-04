import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default function NewFridayMessagePage() {

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

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">New Friday Message</h1>
        <Link 
          href="/admin/friday"
          className="text-gray-600 hover:text-gray-900 font-medium bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
        >
          Cancel
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <form action={createMessageAction} className="p-8 space-y-8">
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700">Title</label>
              <input 
                type="text" 
                id="title" 
                name="title" 
                placeholder="e.g., Jummah Mubarak - Week 1"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-gray-900 placeholder-gray-400"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="image_url" className="block text-sm font-semibold text-gray-700">Image URL</label>
              <input 
                type="text" 
                id="image_url" 
                name="image_url" 
                placeholder="e.g., https://example.com/jummah.jpg"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-gray-900 placeholder-gray-400"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message_text" className="block text-sm font-semibold text-gray-700">Message Text</label>
              <textarea 
                id="message_text" 
                name="message_text" 
                rows={6}
                placeholder="Write your Friday greetings or reflection here..."
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-gray-900 placeholder-gray-400 resize-y"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end items-center gap-4 border-t border-gray-100">
            <button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8 py-3 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              Create Message
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
