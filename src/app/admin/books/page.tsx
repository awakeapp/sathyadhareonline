import { createClient } from '@/lib/supabase/server';
import BooksClient from './BooksClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Books | Admin' };
export const dynamic = 'force-dynamic';

export default async function BooksPage() {
  const supabase = await createClient();

  const { data: books } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  return <BooksClient initialBooks={books || []} />;
}
