import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', id)
    .single();
  if (!data) return {};
  return {
    title: `${data.full_name ?? 'Author'} | Sathyadhare`,
    description: `Articles by ${data.full_name ?? 'this author'} on Sathyadhare.`,
  };
}

export default async function AuthorPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', id)
    .single();

  if (profileError || !profile) notFound();

  // Fetch published articles by this author
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, cover_image, published_at')
    .eq('author_id', id)
    .eq('status', 'published')
    .eq('is_deleted', false)
    .order('published_at', { ascending: false });

  const displayName = profile.full_name ?? 'Author';
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 font-sans">
      <Link href="/" className="text-indigo-600 hover:underline text-sm font-medium mb-10 inline-block">
        &larr; Home
      </Link>

      {/* Author card */}
      <div className="flex items-center gap-6 mb-12 p-8 bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-md flex-shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{displayName}</h1>
          {profile.role && (
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 uppercase tracking-wider">
              {profile.role}
            </span>
          )}
          <p className="mt-2 text-sm text-gray-400 font-medium">
            {articles?.length ?? 0} published article{(articles?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Articles */}
      <h2 className="text-xl font-bold text-gray-900 mb-6">Articles by {displayName}</h2>

      {!articles || articles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">No articles yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {articles.map((article) => (
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
                {article.published_at && (
                  <time className="text-xs text-indigo-500 font-semibold uppercase tracking-wider">
                    {new Date(article.published_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </time>
                )}
                <h3 className="mt-1 text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-3">{article.excerpt}</p>
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
