import { createClient } from '@/lib/supabase/server';
import SectionHeader from '@/components/ui/SectionHeader';
import BookCard, { BookItem } from '@/components/ui/BookCard';
import { Card } from '@/components/ui/Card';
import { Library } from 'lucide-react';

export const revalidate = 60;

export default async function LibraryIndexPage() {
  const supabase = await createClient();
  const { data: books } = await supabase
    .from('books')
    .select(`
      *,
      chapters:chapters(count)
    `)
    .eq('status', 'published')
    .eq('is_active', true)
    .order('created_at', { ascending: false });


  const hasBooks = books && books.length > 0;

  const mappedBooks: BookItem[] = (books || []).map((b: { id: string, title: string, slug: string, author_name: string, cover_image: string, chapters: { count: number }[] }) => {
    const chCount = b.chapters?.[0]?.count || 0;

    
    return {
      id: b.id,
      title: b.title,
      slug: b.slug || b.id,
      author_name: b.author_name,
      cover_image: b.cover_image,
      chapter_count: chCount,
    };
  });


  return (
    <div className="min-h-[100svh] px-4 pt-1 pb-[calc(var(--bottom-nav-height)+1rem)] max-w-lg mx-auto sm:max-w-2xl lg:max-w-5xl">
      
      <SectionHeader title="Library" />

      {!hasBooks ? (
        <Card className="flex flex-col items-center justify-center py-24 px-6 text-center rounded-[2.5rem] bg-white dark:bg-[#111b21] border border-[var(--color-border)] shadow-[0_20px_50px_rgba(0,0,0,0.05)] mt-4 animate-fade-up">
          <div className="w-20 h-20 rounded-3xl bg-[var(--color-primary)]/5 flex items-center justify-center text-[var(--color-primary)] mb-6">
            <Library size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--color-text)] tracking-tight mb-2">
            Library is Empty
          </h2>
          <p className="max-w-xs text-sm font-medium text-[var(--color-muted)] leading-relaxed">
            We are curating amazing stories to add to the digital shelf. Check back soon!
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-1 mt-6">
          {mappedBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
