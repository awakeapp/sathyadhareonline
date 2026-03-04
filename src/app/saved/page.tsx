import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Saved Articles | Sathyadhare',
  description: 'Your saved articles on Sathyadhare Digital Journal.',
};

export const dynamic = 'force-dynamic';

export default async function SavedPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: bookmarks, error } = await supabase
    .from('bookmarks')
    .select(`
      id,
      article:articles (
        id,
        title,
        slug,
        excerpt,
        cover_image,
        status,
        is_deleted
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching bookmarks:', error);

  type ArticleRow = {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    cover_image: string | null;
    status: string;
    is_deleted: boolean;
  };

  // Filter to only published, non-deleted articles
  const saved = (bookmarks ?? [])
    .map((b) => b.article as unknown as ArticleRow)
    .filter((a) => a && a.status === 'published' && !a.is_deleted);

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 font-sans">
      <div className="flex items-center gap-3 mb-10">
        <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <h1 className="text-3xl font-extrabold text-gray-900">Saved Articles</h1>
        <span className="ml-auto text-sm text-gray-400 font-medium">{saved.length} saved</span>
      </div>

      {saved.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <svg className="w-16 h-16 text-gray-200 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <p className="text-xl font-semibold text-gray-400">No saved articles yet.</p>
          <p className="mt-2 text-gray-400 text-sm">Bookmark articles to find them here later.</p>
          <Link
            href="/"
            className="mt-8 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
          >
            Browse Articles
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {saved.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              {article.cover_image ? (
                <div className="w-full h-44 overflow-hidden">
                  <img
                    src={article.cover_image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="w-full h-44 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                  <svg className="w-12 h-12 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9" />
                  </svg>
                </div>
              )}
              <div className="p-5">
                <h2 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
                  {article.title}
                </h2>
                {article.excerpt && (
                  <p className="text-sm text-gray-500 line-clamp-3">{article.excerpt}</p>
                )}
                <span className="mt-4 inline-flex items-center text-xs font-semibold text-indigo-600 gap-1">
                  Read article →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
