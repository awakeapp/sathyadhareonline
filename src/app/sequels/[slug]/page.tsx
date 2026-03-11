import { createClient } from '@/lib/supabase/server';

export const revalidate = 60;

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default async function SequelPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch the sequel
  const { data: sequel, error: sequelError } = await supabase
    .from('sequels')
    .select('id, title, description, banner_image, published_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('is_deleted', false)
    .single();

  if (sequelError || !sequel) {
    return notFound();
  }

  // Fetch attached articles
  // Using an inner join to only fetch related articles.
  // We explicitly select fields from 'articles' to map them cleanly.
  const { data: sequelArticles, error: attachedError } = await supabase
    .from('sequel_articles')
    .select(`
      order_index,
      article:articles (
        id,
        title,
        slug,
        excerpt,
        status,
        is_deleted,
        published_at,
        created_at
      )
    `)
    .eq('sequel_id', sequel.id)
    .order('order_index', { ascending: true });

  if (attachedError) {
    console.error('Error fetching attached articles:', attachedError);
  }

  // Filter linked articles to only those published & not deleted
  // In Supabase, the joined relation is an object (or array depending on constraint, but since it's an FK to articles(id), it's an object)
  type ArticleRow = { id: string; title: string; slug: string; excerpt: string | null; status: string; is_deleted: boolean; published_at: string | null };
  const safeArticles = (sequelArticles || [])
    .map((sa) => sa.article as unknown as ArticleRow)
    .filter((a) => a && a.status === 'published' && a.is_deleted === false);

  return (
    <article className="min-h-screen bg-gray-50 pb-24">
      {/* Header / Banner Section */}
      <header className="relative w-full h-[400px] md:h-[500px] bg-indigo-900 overflow-hidden shadow-inner">
        {sequel.banner_image && (
          <Image
            src={sequel.banner_image}
            alt={sequel.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover opacity-50 mix-blend-overlay z-0"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
        <div className="absolute inset-x-0 bottom-0 p-8 md:p-12 lg:px-24">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            <span className="inline-block px-3 py-1 mb-4 rounded-full bg-indigo-500/20 text-indigo-200 text-sm font-semibold tracking-wider uppercase backdrop-blur-sm border border-indigo-500/30">
              Article Sequels
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight drop-shadow-md">
              {sequel.title}
            </h1>
            {sequel.published_at && (
              <p className="mt-4 text-gray-300 font-medium tracking-wide">
                Published {new Date(sequel.published_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8 md:p-12 mb-12">
          {sequel.description && (
            <div className="prose prose-lg prose-indigo max-w-none text-gray-700 leading-relaxed font-serif">
              <p>{sequel.description}</p>
            </div>
          )}
        </div>

        <section className="mt-16">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Articles in this sequels</h2>
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-full text-sm">
              {safeArticles.length} Parts
            </span>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-indigo-200 before:to-transparent">
            {safeArticles.length === 0 ? (
              <div className="text-center py-12 p-8 bg-white border border-gray-100 rounded-2xl shadow-sm italic text-gray-500 relative z-10">
                This sequels doesn&apos;t have any published articles yet. Check back soon!
              </div>
            ) : (
              safeArticles.map((article, index) => (
                <div key={article.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  {/* Timeline Node */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-indigo-100 text-indigo-600 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10 font-bold">
                    {index + 1}
                  </div>
                  
                  {/* Card */}
                  <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300 relative z-10">
                    <Link href={`/articles/${article.slug}`} className="block focus:outline-none">
                      <div className="flex justify-between items-start mb-2">
                        <time className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">
                          Part {index + 1}
                        </time>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      {article.excerpt ? (
                        <p className="text-gray-600 line-clamp-2 mt-2">{article.excerpt}</p>
                      ) : (
                        <p className="text-gray-400 italic line-clamp-2 mt-2">No summary provided.</p>
                      )}
                      
                      <div className="mt-6 flex items-center text-sm font-semibold text-indigo-600 group-hover:translate-x-2 transition-transform duration-300 w-max">
                        Read full article
                        <svg className="ml-1 w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </article>
  );
}
