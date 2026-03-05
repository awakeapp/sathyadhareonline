import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import ArticleCard from '@/components/ui/ArticleCard';
import SectionHeader from '@/components/ui/SectionHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft } from 'lucide-react';

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
    .select('id, title, slug, excerpt, cover_image, published_at, category:categories(name)')
    .eq('author_id', id)
    .eq('status', 'published')
    .eq('is_deleted', false)
    .order('published_at', { ascending: false });

  const displayName = profile.full_name ?? 'Author';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  return (
    <div className="font-sans antialiased min-h-[100svh] px-4 py-8 pb-32 max-w-lg mx-auto sm:max-w-2xl lg:max-w-4xl border-t border-[var(--color-border)]">
      
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 text-[var(--color-muted)] hover:text-[var(--color-text)]">
        <Link href="/">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Home
        </Link>
      </Button>

      {/* Author card */}
      <Card className="mb-10 rounded-[2rem] shadow-none bg-[var(--color-surface)] border-[var(--color-border)]">
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-24 h-24 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-black text-3xl font-black shadow-inner flex-shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-3xl font-black text-[var(--color-text)] tracking-tight">{displayName}</h1>
            <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
              {profile.role && (
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                   {profile.role}
                </span>
              )}
              <span className="hidden sm:inline text-[var(--color-muted)]">•</span>
              <p className="text-sm font-semibold text-[var(--color-muted)]">
                 {articles?.length ?? 0} published article{(articles?.length ?? 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Articles */}
      <SectionHeader title={`Articles by ${displayName}`} />

      {!articles || articles.length === 0 ? (
        <Card className="text-center py-20 rounded-3xl mt-4 shadow-none border-dashed bg-[var(--color-surface)] border-[var(--color-border)]">
          <p className="text-sm font-bold tracking-widest uppercase text-[var(--color-muted)]">No articles yet</p>
        </Card>
      ) : (
        <div className="grid gap-5 mt-4">
          {articles.map((article) => (
             <ArticleCard key={article.id} variant="list" article={article as any} />
          ))}
        </div>
      )}
    </div>
  );
}
