import { createClient } from '@/lib/supabase/server';
import SectionHeader from '@/components/ui/SectionHeader';
import ArticleCard from '@/components/ui/ArticleCard';

export const revalidate = 60;

export default async function SequelsPage() {
  const supabase = await createClient();
  let { data: sequels } = await supabase
    .from('sequels').select('*')
    .eq('status', 'published').eq('is_deleted', false)
    .order('published_at', { ascending: false });

  // Fallback for demo
  if (!sequels || sequels.length === 0) {
    sequels = [
      { id: '1', title: 'The Future of AI', slug: 'future-ai', banner_image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMmIyOTNkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM3Nzc2ODQiIGZvbnQtc2l6ZT0iNDgiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QUkgU0VSSUVTPC90ZXh0Pjwvc3ZnPg==', published_at: new Date().toISOString() },
      { id: '2', title: 'Space Exploration', slug: 'space', banner_image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTgxNjIzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM3Nzc2ODQiIGZvbnQtc2l6ZT0iNDgiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U1BBQ0U8L3RleHQ+PC9zdmc+', published_at: new Date().toISOString() },
      { id: '3', title: 'Bio-Engineering', slug: 'bio', banner_image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMmIyOTNkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM3Nzc2ODQiIGZvbnQtc2l6ZT0iNDgiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QklPPC90ZXh0Pjwvc3ZnPg==', published_at: new Date().toISOString() },
      { id: '4', title: 'Quantum Computing', slug: 'quantum', banner_image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTgxNjIzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM3Nzc2ODQiIGZvbnQtc2l6ZT0iNDgiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UVVBTlRVTTwvdGV4dD48L3N2Zz4=', published_at: new Date().toISOString() },
    ] as any;
  }

  return (
    <div className="min-h-[100svh] px-4 py-4 pb-24 max-w-lg mx-auto sm:max-w-2xl lg:max-w-5xl">
      <SectionHeader title="ALL Sequels" />

      {!sequels && (
        <div className="text-center py-20 opacity-50">
          <p className="text-sm font-bold tracking-widest uppercase">No series found</p>
        </div>
      )}

      {sequels && sequels.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6 px-1">
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
                category: { name: `SEQUEL` } // Fake category for meta
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
