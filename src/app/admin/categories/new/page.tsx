import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AdminContainer from '@/components/layout/AdminContainer';

export default async function NewCategoryPage() {

  async function createCategoryAction(formData: FormData) {
    'use server';
    const supabaseAction = await createClient();

    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const icon_name = formData.get('icon_name') as string;

    const { error: insertError } = await supabaseAction
      .from('categories')
      .insert({
        name,
        slug,
        icon_name: icon_name || null,
      });

    if (insertError) {
      console.error('Error inserting category:', insertError);
      // Depending on implementation, you might want to show an error state
      return; 
    }

    redirect('/admin/categories');
  }

  return (
    <AdminContainer className="pb-[calc(var(--bottom-nav-height)+1rem)] pt-6 safe-area-pb">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin/categories" className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:text-white transition-colors active:scale-95 min-w-[44px] min-h-[44px]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">New Category</h1>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-2xl">
          <form action={createCategoryAction} className="p-6 md:p-8 flex flex-col gap-6">
            
            <div>
              <label className="block text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1" htmlFor="name">
                Category Name
              </label>
              <input
                required
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Technology"
                className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1" htmlFor="slug">
                URL Slug
              </label>
              <input
                required
                id="slug"
                name="slug"
                type="text"
                placeholder="e.g. technology"
                className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2 px-1" htmlFor="icon_name">
                Icon Name <span className="font-normal opacity-50 capitalize lowercase">(optional)</span>
              </label>
              <input
                id="icon_name"
                name="icon_name"
                type="text"
                placeholder="e.g. cpu"
                className="w-full px-4 py-3.5 rounded-2xl bg-black/20 border border-[var(--color-border)] text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
              />
            </div>

            <div className="pt-6 mt-2 flex flex-col sm:flex-row justify-end gap-3 border-t border-[var(--color-border)]">
              <Link
                href="/admin/categories"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-[var(--color-border)] font-semibold text-[var(--color-muted)] hover:text-white hover:bg-white/5 transition-colors text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[var(--color-primary)] text-black font-bold hover:bg-[#ffed4a] transition-colors shadow-lg shadow-[var(--color-primary)]/20 text-center"
              >
                Create Category
              </button>
            </div>
            
          </form>
        </div>
    </AdminContainer>
  );
}
