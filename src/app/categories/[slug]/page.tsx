import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ArticleCard from '@/components/ui/ArticleCard';

export const revalidate = 60;

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('categories').select('name').eq('slug', slug).single();
  if (!data) return {};
  return { title: `${data.name} | Sathyadhare`, description: `Browse articles in ${data.name}` };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category, error: catError } = await supabase
    .from('categories').select('id, name').eq('slug', slug).single();
  if (catError || !category) notFound();

  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, cover_image, published_at, category:categories(name)')
    .eq('category_id', category.id).eq('status', 'published').eq('is_deleted', false)
    .order('published_at', { ascending: false });

  return (
    <div className="min-h-[100svh] px-4 py-6 pb-24 max-w-lg mx-auto sm:max-w-2xl lg:max-w-4xl">

      {!articles?.length ? (
        <div className="text-center py-24 rounded-[1.25rem] mt-6" style={{ background: '#242235' }}>
          <p className="text-sm font-bold tracking-widest uppercase text-[#a3a0b5]">No articles found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5 mt-2">
          {articles.map((article) => (
            <ArticleCard key={article.id} variant="list" article={article as any} />
          ))}
        </div>
      )}
    </div>
  );
}
