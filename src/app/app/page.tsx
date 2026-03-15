import { createClient } from '@/lib/supabase/server'
import NewsletterForm from '@/components/NewsletterForm'
import HeroBanner from '@/components/ui/HeroBanner'
import ArticleCard from '@/components/ui/ArticleCard'
import SectionHeader from '@/components/ui/SectionHeader'
import HorizontalScroller from '@/components/ui/HorizontalScroller'

export const revalidate = 60

export default async function AppPage() {
  const supabase = await createClient()

  // 1) Hero
  const { data: featuredData } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, cover_image, category:categories(name)')
    .eq('is_featured', true).eq('status', 'published').eq('is_deleted', false)
    .single()

  let featured = featuredData
  if (!featured) {
    const { data: fb } = await supabase
      .from('articles')
      .select('id, title, slug, excerpt, cover_image, category:categories(name)')
      .eq('status', 'published').eq('is_deleted', false)
      .order('published_at', { ascending: false }).limit(1).single()
    featured = fb ?? null
  }

  // 2) Latest Articles
  const { data: latestArticles } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, cover_image, published_at, category:categories(name)')
    .eq('status', 'published').eq('is_deleted', false)
    .order('published_at', { ascending: false }).limit(6)

  // 3) Trending
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: viewRows } = await supabase
    .from('article_views')
    .select('article_id')
    .gte('viewed_at', sevenDaysAgo.toISOString())

  const viewCounts: Record<string, number> = {}
  for (const row of viewRows ?? []) {
    viewCounts[row.article_id] = (viewCounts[row.article_id] ?? 0) + 1
  }
  const topIds = Object.entries(viewCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id]) => id)

  let trending: any[] = []
  if (topIds.length > 0) {
    const { data: td } = await supabase
      .from('articles')
      .select('id, title, slug, cover_image, category:categories(name), published_at')
      .in('id', topIds)
      .eq('status', 'published')
      .eq('is_deleted', false)
    if (td) {
      trending = td.sort((a, b) => (viewCounts[b.id] ?? 0) - (viewCounts[a.id] ?? 0))
    }
  }

  // 4) Series
  const { data: latestSequels } = await supabase
    .from('sequels').select('id, title, slug, banner_image, published_at')
    .eq('status', 'published').eq('is_deleted', false)
    .order('published_at', { ascending: false }).limit(6)

  return (
    <div className="min-h-[100svh] px-4 pt-1 pb-0 max-w-lg mx-auto sm:max-w-2xl lg:max-w-5xl">

      {/* Hero */}
      {featured && (
        <div className="mb-6 pt-0">
          <HeroBanner article={featured} />
        </div>
      )}

      {/* Latest Sequels */}
      {latestSequels && latestSequels.length > 0 && (
        <section className="mb-10">
          <SectionHeader title="Latest Sequels" />
          <HorizontalScroller className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-4">
            {latestSequels.map((seq: any) => (
              <div key={seq.id} style={{ minWidth: '180px', width: '45vw', maxWidth: '220px' }}>
                <ArticleCard
                  variant="grid-dark"
                  article={{ ...seq, cover_image: seq.banner_image, category: { name: 'SEQUEL' } }}
                />
              </div>
            ))}
          </HorizontalScroller>
        </section>
      )}

      {/* Trending Articles */}
      {trending.length > 0 && (
        <section className="mb-10">
          <SectionHeader title="Trending Articles" />
          <HorizontalScroller className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-4">
            {trending.map((item: any) => (
              <div key={item.id} style={{ minWidth: '180px', width: '45vw', maxWidth: '220px' }}>
                <ArticleCard variant="grid-dark" article={item} />
              </div>
            ))}
          </HorizontalScroller>
        </section>
      )}

      {/* Latest Articles */}
      {latestArticles && latestArticles.length > 0 && (
        <section className="mb-10">
          <SectionHeader title="Latest Articles" />
          <HorizontalScroller className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-4">
            {latestArticles.map((item: any) => (
              <div key={item.id} style={{ minWidth: '180px', width: '45vw', maxWidth: '220px' }}>
                <ArticleCard variant="grid-dark" article={item} />
              </div>
            ))}
          </HorizontalScroller>
        </section>
      )}

      {/* Community Banner */}
      <section
        className="rounded-[2rem] p-10 flex flex-col sm:flex-row items-center gap-6 shadow-2xl mt-12 mb-4"
        style={{ background: '#201d31', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="sm:w-1/2 flex flex-col justify-center gap-2">
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tighter">
            JOIN READERS<br />COMMUNITY
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-[#a3a0b5] font-bold">Get weekly updates in your inbox</p>
        </div>
        <div className="w-full sm:w-1/2 flex items-center justify-end">
          <NewsletterForm />
        </div>
      </section>

    </div>
  )
}
