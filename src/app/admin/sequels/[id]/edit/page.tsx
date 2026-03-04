import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

export default async function EditSequelPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch the sequel
  const { data: sequel, error: sequelError } = await supabase
    .from('sequels')
    .select('title, slug')
    .eq('id', id)
    .single();

  if (sequelError || !sequel) {
    return notFound();
  }

  // Fetch all published articles
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('id, title, published_at')
    .eq('status', 'published')
    .eq('is_deleted', false)
    .order('published_at', { ascending: false });

  if (articlesError) {
    console.error('Error fetching articles:', articlesError);
  }

  // Fetch already attached articles for the specific sequel
  const { data: attachedArticles, error: attachedError } = await supabase
    .from('sequel_articles')
    .select('article_id, order_index')
    .eq('sequel_id', id)
    .order('order_index', { ascending: true });
    
  if (attachedError) {
    console.error('Error fetching attached articles:', attachedError);
  }

  // Create a fast lookup Set for defaultChecked values
  const attachedArticleIds = new Set(attachedArticles?.map(a => a.article_id) || []);

  async function updateSequelArticlesAction(formData: FormData) {
    'use server';
    const supabaseAction = await createClient();

    // FormData.getAll returns them in the order they appear in the DOM
    const selectedArticleIds = formData.getAll('article_ids') as string[];

    // 1. Delete existing sequel_articles for this sequel
    const { error: deleteError } = await supabaseAction
      .from('sequel_articles')
      .delete()
      .eq('sequel_id', id);

    if (deleteError) {
      console.error('Error deleting existing attached articles:', deleteError);
      return;
    }

    // 2. Insert new selected articles with correct order_index
    if (selectedArticleIds.length > 0) {
      const inserts = selectedArticleIds.map((articleId, index) => ({
        sequel_id: id,
        article_id: articleId,
        order_index: index,
      }));

      const { error: insertError } = await supabaseAction
        .from('sequel_articles')
        .insert(inserts);

      if (insertError) {
        console.error('Error inserting new attached articles:', insertError);
        return;
      }
    }

    revalidatePath('/admin/sequels');
    if (sequel?.slug) {
      revalidatePath(`/sequels/${sequel.slug}`); 
    }
    redirect('/admin/sequels');
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Manage Articles</h1>
          <p className="text-gray-500 mt-1">Sequel: <span className="font-medium text-gray-800">{sequel.title}</span></p>
        </div>
        <Link 
          href="/admin/sequels"
          className="text-gray-600 hover:text-gray-900 font-medium bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
        >
          Cancel
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <form action={updateSequelArticlesAction} className="p-8 space-y-8">
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Available Published Articles</h2>
            <p className="text-sm text-gray-500">
              Select the articles you want to include in this sequel. The selections are saved in the order they appear below.
            </p>
            
            <div className="space-y-3 mt-4 max-h-[500px] overflow-y-auto p-4 border border-gray-100 rounded-lg">
              {!articles || articles.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No published articles found.</p>
              ) : (
                articles.map((article) => (
                  <label 
                    key={article.id} 
                    className="flex items-start gap-4 cursor-pointer p-4 hover:bg-gray-50 rounded-xl border border-gray-100 shadow-sm transition-colors"
                  >
                    <input 
                      type="checkbox" 
                      name="article_ids" 
                      value={article.id} 
                      defaultChecked={attachedArticleIds.has(article.id)}
                      className="mt-1 flex-shrink-0 h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 transition-colors"
                    />
                    <div>
                      <span className="block text-base font-semibold text-gray-900">{article.title}</span>
                      <span className="block text-sm text-gray-500 mt-1">
                        Published on {new Date(article.published_at).toLocaleDateString()}
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end items-center gap-4 border-t border-gray-100">
            <button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8 py-3 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              Save Attached Articles
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
