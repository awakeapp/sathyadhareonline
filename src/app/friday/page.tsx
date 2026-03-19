import { createClient } from '@/lib/supabase/server';
import FridayGalleryClient from './FridayGalleryClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Friday Messages | Sathyadhare',
  description: 'ಶುಕ್ರವಾರದ ಸಂದೇಶಗಳು — Inspiring Friday messages and posters from Sathyadhare.',
};

const PAGE_SIZE = 20;

export default async function FridayPage() {
  const supabase = await createClient();

  const { data: messages, error } = await supabase
    .from('friday_messages')
    .select('id, title, image_url, message_text, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (error) console.error('Error fetching Friday messages:', error);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 mt-16 md:mt-20 pb-32 flex flex-col gap-10">
      
      {/* Page Header */}
      <div className="text-center flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl mb-1">
          🕌
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-text)] tracking-tight">
          ಶುಕ್ರವಾರದ ಸಂದೇಶಗಳು
        </h1>
        <p className="text-[15px] text-[var(--color-muted)] font-medium max-w-md leading-relaxed">
          Inspiring Friday messages — download and share with family and friends.
        </p>
        <div className="w-16 h-1 rounded-full bg-emerald-500/40 mt-2" />
      </div>

      {/* Gallery */}
      <FridayGalleryClient initialMessages={messages || []} />
    </div>
  );
}
