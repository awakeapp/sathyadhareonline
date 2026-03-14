import { createClient } from '@/lib/supabase/server';
import FridayClientPage from './FridayClientPage';

export const dynamic = 'force-dynamic';

export default async function FridayPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const supabase = await createClient();

  // Fetch all published Friday messages ordered newest first
  const { data: messages } = await supabase
    .from('friday_messages')
    .select('id, title, image_url, message_text, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  const allMessages = messages || [];

  // Find the index to display — by date param or latest (index 0)
  let activeIndex = 0;
  if (date) {
    const idx = allMessages.findIndex(m =>
      new Date(m.created_at).toISOString().slice(0, 10) === date
    );
    if (idx !== -1) activeIndex = idx;
  }

  return (
    <FridayClientPage messages={allMessages} initialIndex={activeIndex} />
  );
}
