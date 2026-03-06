import { Card } from '@/components/ui/Card';

export default function FinancialLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      
      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <Card key={i} className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-none h-48">
          </Card>
        ))}
      </div>

      {/* Table Skeleton */}
      <Card className="rounded-[2rem] border-[var(--color-border)] bg-[var(--color-surface)] shadow-none h-96">
      </Card>

    </div>
  );
}
