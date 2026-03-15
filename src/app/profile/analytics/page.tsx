import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SectionHeader from '@/components/ui/SectionHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Calendar, Clock, BookOpen, ChevronLeft, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

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
    const catName = (v.article as any)?.category?.name || 'Uncategorized';
    catStats[catName] = (catStats[catName] ?? 0) + 1;
  });

  const topCategories = Object.entries(catStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="font-sans antialiased min-h-[100svh] px-4 py-8 pb-12 max-w-lg mx-auto sm:max-w-2xl lg:max-w-4xl border-t border-[var(--color-border)]">
      
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 text-[var(--color-muted)] hover:text-[var(--color-text)]">
        <Link href="/profile">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Profile
        </Link>
      </Button>

      <div className="mb-10">
        <h1 className="text-3xl font-black text-[var(--color-text)] tracking-tight">Reading Analytics</h1>
        <p className="text-[var(--color-muted)] text-sm font-medium mt-1">Your reading journey over the last 30 days</p>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-none rounded-3xl">
          <CardContent className="p-5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
              <BookOpen size={20} />
            </div>
            <p className="text-2xl font-black text-[var(--color-text)]">{viewCount}</p>
            <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest">Articles Read</p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-none rounded-3xl">
          <CardContent className="p-5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
              <Clock size={20} />
            </div>
            <p className="text-2xl font-black text-[var(--color-text)]">{Math.floor(viewCount * 4.5)}m</p>
            <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest">Est. Read Time</p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-none rounded-3xl col-span-2 md:col-span-1">
          <CardContent className="p-5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
              <TrendingUp size={20} />
            </div>
            <p className="text-2xl font-black text-[var(--color-text)]">
              {topCategories[0]?.[0] || 'N/A'}
            </p>
            <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest">Top Interest</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts / Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Weekly Activity */}
        <section>
          <SectionHeader title="Daily Activity" />
          <Card className="mt-4 bg-[var(--color-surface)] border-[var(--color-border)] shadow-none rounded-[2rem] overflow-hidden">
            <CardContent className="p-6">
              {Object.keys(dailyStats).length === 0 ? (
                <div className="py-10 text-center text-[var(--color-muted)] text-sm font-medium italic">
                  No activity recorded yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(dailyStats).slice(0, 7).map(([day, count]) => (
                    <div key={day} className="flex items-center gap-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] w-16">{day}</span>
                      <div className="flex-1 h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, (count / 10) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[var(--color-text)]">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Interests */}
        <section>
          <SectionHeader title="Your Interests" />
          <Card className="mt-4 bg-[var(--color-surface)] border-[var(--color-border)] shadow-none rounded-[2rem] overflow-hidden">
            <CardContent className="p-6">
              {topCategories.length === 0 ? (
                <div className="py-10 text-center text-[var(--color-muted)] text-sm font-medium italic">
                  Start reading to discover your interests!
                </div>
              ) : (
                <div className="space-y-6">
                  {topCategories.map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                        <span className="text-sm font-bold text-[var(--color-text)]">{name}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] bg-[var(--color-surface-2)] px-2 py-0.5 rounded-full">
                        {count} Articles
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

      </div>

      {/* Recent History */}
      <section className="mt-12">
        <SectionHeader title="Recent Reading History" />
        <div className="mt-4 space-y-3">
          {views?.slice(0, 10).map((view, i) => (
            <Link 
              key={i} 
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/articles/${(view.article as any)?.slug}`}
              className="flex items-center justify-between p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors group"
            >
              <div className="min-w-0 pr-4">
                <p className="text-sm font-bold text-[var(--color-text)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(view.article as any)?.title}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] mt-1">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(view.article as any)?.category?.name}
                </p>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] shrink-0 flex items-center gap-1.5">
                <Calendar size={12} />
                {new Date(view.viewed_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
          {(!views || views.length === 0) && (
            <p className="text-center py-10 text-[var(--color-muted)] text-sm font-medium italic">Your history is currently empty.</p>
          )}
        </div>
      </section>

    </div>
  );
}
