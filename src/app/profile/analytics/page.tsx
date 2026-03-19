
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Clock, BookOpen, ArrowLeft, TrendingUp, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Fetch view history for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: views } = await supabase
    .from('article_views')
    .select('viewed_at, article:articles(title, slug, category:categories(name))')
    .eq('user_id', user.id)
    .gte('viewed_at', thirtyDaysAgo.toISOString())
    .order('viewed_at', { ascending: false });

  const viewCount = views?.length || 0;
  
  // Group views by day
  const dailyStats: Record<string, number> = {};
  views?.forEach(v => {
    const day = new Date(v.viewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyStats[day] = (dailyStats[day] ?? 0) + 1;
  });

  // Most read categories
  const catStats: Record<string, number> = {};
  views?.forEach(v => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const catName = (v.article as any)?.category?.name || 'General';
    catStats[catName] = (catStats[catName] ?? 0) + 1;
  });

  const topCategories = Object.entries(catStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[var(--color-background)] pt-6 sm:pt-10 pb-[calc(var(--bottom-nav-height)+1rem)] px-4 sm:px-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <Link 
            href="/profile" 
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors mb-6"
          >
            <ArrowLeft size={14} /> Back to Profile
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-blue-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
              <BarChart3 size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-[var(--color-text)] tracking-tight">Reading Insights</h1>
              <p className="text-sm font-medium text-[var(--color-muted)] mt-1">Analysis of your engagement since last month</p>
            </div>
          </div>
        </header>

        {/* Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-sm rounded-[2rem]">
            <CardContent className="p-8">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 min-w-[44px] min-h-[44px]">
                <BookOpen size={20} />
              </div>
              <p className="text-3xl font-black text-[var(--color-text)]">{viewCount}</p>
              <p className="text-[10px] font-black text-[var(--color-muted)] uppercase tracking-widest mt-1">Articles Read</p>
            </CardContent>
          </Card>

          <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-sm rounded-[2rem]">
            <CardContent className="p-8">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 min-w-[44px] min-h-[44px]">
                <Clock size={20} />
              </div>
              <p className="text-3xl font-black text-[var(--color-text)]">{Math.floor(viewCount * 4.5)}m</p>
              <p className="text-[10px] font-black text-[var(--color-muted)] uppercase tracking-widest mt-1">Reading Time</p>
            </CardContent>
          </Card>

          <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-sm rounded-[2rem] col-span-2 md:col-span-1">
            <CardContent className="p-8">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6 min-w-[44px] min-h-[44px]">
                <TrendingUp size={20} />
              </div>
              <p className="text-3xl font-black text-[var(--color-text)] truncate pr-2">
                {topCategories[0]?.[0] || 'N/A'}
              </p>
              <p className="text-[10px] font-black text-[var(--color-muted)] uppercase tracking-widest mt-1">Top Interest</p>
            </CardContent>
          </Card>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Daily Activity */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg font-black uppercase tracking-widest opacity-80">Activity Pattern</h2>
              <div className="h-px flex-1 bg-[var(--color-border)]" />
            </div>
            <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-none rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8">
                {Object.keys(dailyStats).length === 0 ? (
                  <div className="py-20 text-center text-[var(--color-muted)] text-sm font-medium italic">
                    No activity recorded in the last 30 days.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(dailyStats).slice(0, 10).map(([day, count]) => (
                      <div key={day} className="flex items-center gap-6">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)] w-20">{day}</span>
                        <div className="flex-1 h-3 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-blue-500/20" 
                            style={{ width: `${Math.min(100, (count / 8) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-[var(--color-text)] tabular-nums">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Categories */}
          <section>
             <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg font-black uppercase tracking-widest opacity-80">Interest Clusters</h2>
              <div className="h-px flex-1 bg-[var(--color-border)]" />
            </div>
            <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-none rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8">
                {topCategories.length === 0 ? (
                  <div className="py-20 text-center text-[var(--color-muted)] text-sm font-medium italic">
                    Read more to see your interest map.
                  </div>
                ) : (
                  <div className="space-y-8">
                    {topCategories.map(([name, count]) => (
                      <div key={name} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/40" />
                          <span className="text-sm font-black text-[var(--color-text)] group-hover:text-blue-500 transition-colors">{name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)]">
                            {count} {count === 1 ? 'Article' : 'Articles'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Footer info */}
        <footer className="mt-[var(--header-height)] pt-8 border-t border-[var(--color-border)] opacity-40">
           <p className="text-[10px] font-black uppercase tracking-widest text-center">
             Verified Data Stream • {new Date().getFullYear()} Sathyadhare Systems
           </p>
        </footer>
      </div>
    </div>
  );
}
