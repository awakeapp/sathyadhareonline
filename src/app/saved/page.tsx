import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import SavedClientPage from './SavedClientPage';

export const metadata: Metadata = {
  title: 'Saved Articles | Sathyadhare',
  description: 'Your saved articles on Sathyadhare Digital Journal.',
};

export const dynamic = 'force-dynamic';

export default async function SavedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select(`
      id,
      created_at,
      article:articles (
        id, title, slug, excerpt, cover_image,
        status, is_deleted, published_at,
        category:categories(name)
      ),
      book:books (
        id, title, slug, cover_image, author_name
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  interface UnifiedItem {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    cover_image: string | null;
    status: string;
    is_deleted: boolean;
    published_at: string;
    category?: { name: string } | { name: string }[] | null;
    type: 'article' | 'book';
    savedAt: string;
    href: string;
  }

  const saved = (bookmarks ?? [])
    .flatMap((b): UnifiedItem[] => {
      const art = b.article as unknown as Record<string, unknown> | null;
      if (art) {
        return [{ 
          id: art.id as string,
          title: art.title as string,
          slug: art.slug as string,
          excerpt: art.excerpt as string | null,
          cover_image: art.cover_image as string | null,
          status: art.status as string,
          is_deleted: !!art.is_deleted,
          published_at: art.published_at as string,
          category: art.category as UnifiedItem['category'],
          savedAt: b.created_at as string,
          type: 'article' as const,
          href: `/articles/${art.slug}`
        }];
      }
      const book = b.book as unknown as Record<string, unknown> | null;
      if (book) {
        return [{
          id: book.id as string,
          title: book.title as string,
          slug: (book.slug || book.id) as string,
          excerpt: book.author_name ? `By ${book.author_name}` : 'Library Book',
          cover_image: book.cover_image as string | null,
          status: 'published',
          is_deleted: false,
          published_at: b.created_at as string,
          category: { name: 'LIBRARY' },
          savedAt: b.created_at as string,
          type: 'book' as const,
          href: `/library/${book.slug || book.id}`
        }];
      }
      return [];
    })
    .filter((a) => a.status === 'published' && !a.is_deleted);

  return <SavedClientPage articles={saved} />;
}
