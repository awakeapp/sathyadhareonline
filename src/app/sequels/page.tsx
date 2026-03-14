import { createClient } from '@/lib/supabase/server';
import SectionHeader from '@/components/ui/SectionHeader';
import ArticleCard from '@/components/ui/ArticleCard';
import { Card } from '@/components/ui/Card';
import { Library } from 'lucide-react';

import HomeSearchBar from '@/components/ui/HomeSearchBar';

export const revalidate = 60;

export default async function SequelsPage() {
  const supabase = await createClient();
  const { data: sequels } = await supabase
    .from('sequels').select('*')
    .eq('status', 'published').eq('is_deleted', false)
    .order('published_at', { ascending: false });

  const hasSequels = sequels && sequels.length > 0;

  return (
    <div className="min-h-[100svh] px-4 py-2 pb-32 max-w-lg mx-auto sm:max-w-2xl lg:max-w-5xl">
      <HomeSearchBar />
      
      <SectionHeader title="Weekly Sequels" />

      {!hasSequels ? (
        <Card className="flex flex-col items-center justify-center py-24 px-6 text-center rounded-[2.5rem] bg-white dark:bg-[#111b21] border border-[var(--color-border)] shadow-[0_20px_50px_rgba(0,0,0,0.05)] mt-4 animate-fade-up">
          <div className="w-20 h-20 rounded-3xl bg-[var(--color-primary)]/5 flex items-center justify-center text-[var(--color-primary)] mb-6">
            <Library size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[var(--color-text)] tracking-tight mb-2">
            No Sequels Published Yet
          </h2>
          <p className="max-w-xs text-sm font-medium text-[var(--color-muted)] leading-relaxed">
            Our editorial team is busy crafting immersive long-form stories. Check back soon for our first weekly sequel!
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6 px-1 mt-4">
          {sequels.map((seq) => (
            <ArticleCard
              key={seq.id}
              variant="grid-white"
              article={{
                id: seq.id,
                title: seq.title,
                slug: seq.slug,
                cover_image: seq.banner_image,
                published_at: seq.published_at,
                category: [{ name: `SEQUEL` }] as any
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
