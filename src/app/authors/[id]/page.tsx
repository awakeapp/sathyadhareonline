import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
    .select('id, full_name, role, bio, avatar_url')
    .eq('id', id)
    .single();

  if (profileError || !profile) notFound();

  // Fetch published articles by this author
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, cover_image, published_at, category:categories(name), reactions:article_reactions(count)')
    .eq('article_reactions.type', 'like')
    .eq('author_id', id)
    .eq('status', 'published')
    .eq('is_deleted', false)
    .order('published_at', { ascending: false });

  const displayName = profile.full_name ?? 'Author';

  return (
    <div className="font-sans antialiased min-h-[100svh] px-4 py-8 pb-0 max-w-lg mx-auto sm:max-w-2xl lg:max-w-4xl border-t border-[var(--color-border)]">
      
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 text-[var(--color-muted)] hover:text-[var(--color-text)]">
        <Link href="/">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Home
        </Link>
      </Button>

      {/* Author card */}
      <Card className="mb-10 rounded-[2.5rem] shadow-none bg-[var(--color-surface)] border-[var(--color-border)] overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-center gap-6 p-8 sm:p-10 text-center sm:text-left">
            <div className="relative group">
              <div className="w-28 h-28 rounded-[2rem] overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-sm">
                <Image 
                  src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`} 
                  alt={displayName} 
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                  unoptimized={!profile.avatar_url}
                />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-[var(--color-text)] tracking-tight">{displayName}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                {profile.role && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                     {profile.role}
                  </span>
                )}
                <span className="text-[11px] font-bold text-[var(--color-muted)] flex items-center gap-1">
                   <div className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
                   {articles?.length ?? 0} published article{(articles?.length ?? 0) !== 1 ? 's' : ''}
                </span>
              </div>
              {profile.bio && (
                <p className="mt-4 text-[13px] font-medium text-[var(--color-muted)] leading-relaxed max-w-xl italic">
                  &ldquo;{profile.bio}&rdquo;
                </p>
              )}
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
             <ArticleCard key={article.id} variant="list" article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
