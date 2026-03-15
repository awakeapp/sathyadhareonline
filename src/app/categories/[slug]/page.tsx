import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ArticleCard from '@/components/ui/ArticleCard';
import { Card } from '@/components/ui/Card';

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
    .select('id, title, slug, excerpt, cover_image, published_at, category:categories(name), reactions:article_reactions(count)')
    .eq('article_reactions.type', 'like')
    .eq('category_id', category.id)
    .eq('status', 'published')
    .eq('is_deleted', false)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false });

  return (
    <div className="font-sans antialiased min-h-[100svh] px-4 pt-1 pb-0 max-w-lg mx-auto sm:max-w-2xl lg:max-w-4xl border-t border-[var(--color-border)]">
      
      <div className="mb-6 px-1">
        <h1 className="text-3xl font-black text-[var(--color-text)] tracking-tight">
          {category.name}
        </h1>
        <p className="text-[var(--color-muted)] text-xs font-bold uppercase tracking-widest mt-1">
          {articles?.length || 0} Articles
        </p>
      </div>

      {!articles?.length ? (
        <Card className="text-center py-24 rounded-3xl mt-6 shadow-none border-dashed bg-[var(--color-surface)] border-[var(--color-border)]">
          <p className="text-sm font-bold tracking-widest uppercase text-[var(--color-muted)]">No articles found</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4 mt-2">
          {articles.map((article) => (
            <ArticleCard key={article.id} variant="list" article={article as unknown as React.ComponentProps<typeof ArticleCard>['article']} />
          ))}
        </div>
      )}
    </div>
  );
}
