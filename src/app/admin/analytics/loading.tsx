import { Card, CardContent } from '@/components/ui/Card';

export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen pb-24 px-4 pt-6 bg-[var(--color-background)] font-sans antialiased text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-32 bg-white/10 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-white/5 rounded-md animate-pulse"></div>
          </div>
          <div className="h-10 w-28 bg-white/5 rounded-xl animate-pulse"></div>
        </div>

        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-none">
              <CardContent className="p-5">
                <div className="w-5 h-5 bg-white/10 rounded-full mb-3 animate-pulse"></div>
                <div className="h-8 w-16 bg-white/10 rounded-lg mb-2 animate-pulse"></div>
                <div className="h-3 w-20 bg-white/5 rounded-md animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Time Series Charts Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="rounded-[2rem] border-transparent bg-[var(--color-surface)] shadow-none h-[300px] animate-pulse">
            </Card>
          ))}
        </div>

        {/* Category Breakdown Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <Card key={i} className="rounded-[2rem] border-[var(--color-border)] bg-[var(--color-surface)] shadow-none h-[350px] animate-pulse">
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}
