import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default function NewSequelPage() {

  async function createSequelAction(formData: FormData) {
    'use server';
    const supabaseAction = await createClient();

    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string;
    const banner_image = formData.get('banner_image') as string;

    const { error: insertError } = await supabaseAction
      .from('sequels')
      .insert({
        title,
        slug,
        description,
        banner_image,
        status: 'draft',
      });

    if (insertError) {
      console.error('Error inserting sequel:', insertError);
      return; 
    }

    revalidatePath('/admin/sequels');
    redirect('/admin/sequels');
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">New Sequel Container</h1>
        <Link 
          href="/admin/sequels"
          className="text-gray-600 hover:text-gray-900 font-medium bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
        >
          Cancel
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <form action={createSequelAction} className="p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700">Title</label>
              <input 
                type="text" 
                id="title" 
                name="title" 
                required 
                placeholder="e.g., The Ultimate Guide Series"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-gray-900 placeholder-gray-400"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="slug" className="block text-sm font-semibold text-gray-700">Slug</label>
              <input 
                type="text" 
                id="slug" 
                name="slug" 
                required 
                placeholder="e.g., ultimate-guide-series"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="banner_image" className="block text-sm font-semibold text-gray-700">Banner Image URL</label>
            <input 
              type="text" 
              id="banner_image" 
              name="banner_image" 
              placeholder="e.g., https://example.com/banner.jpg"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-gray-900 placeholder-gray-400"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700">Description</label>
            <textarea 
              id="description" 
              name="description" 
              rows={4}
              placeholder="Brief summary of the issue or series container..."
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow text-gray-900 placeholder-gray-400 resize-y"
            />
          </div>

          <div className="pt-4 flex justify-end items-center gap-4">
            <button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8 py-3 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              Create Sequel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
