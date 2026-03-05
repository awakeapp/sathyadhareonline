import { Skeleton } from '@/components/ui/Skeleton';
import { Card, CardContent } from '@/components/ui/Card';

export default function Loading() {
  return (
    <div className="font-sans antialiased min-h-[100svh] px-4 pt-1 pb-32 max-w-lg mx-auto sm:max-w-2xl lg:max-w-4xl scroll-smooth">
      {/* Hero / Featured Article Skeleton */}
      <div className="mb-8 pt-0 mt-4 sm:mt-6">
        <Skeleton className="w-full h-64 md:h-96 rounded-[2rem] shadow-none" />
      </div>

      {/* Grid Header */}
      <div className="animate-in fade-in flex items-center justify-between mb-5 mt-10 px-2">
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="flex flex-col gap-5 mt-5">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="rounded-3xl border-transparent bg-[var(--color-surface)] shadow-none h-[120px] flex items-center">
            <CardContent className="p-4 flex gap-4 w-full h-full">
              {/* Image placeholder */}
              <Skeleton className="w-24 h-24 rounded-2xl shrink-0" />
              
              <div className="flex flex-col justify-center flex-1 h-full gap-2">
                {/* Title placeholder */}
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                
                <div className="mt-auto">
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
