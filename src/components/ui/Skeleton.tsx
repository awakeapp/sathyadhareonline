import { cn } from '@/lib/utils'

export function Skeleton({
  className,
}: {
  className?: string
}) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[var(--radius-sm)]',
        'bg-[var(--color-border)]',
        className
      )}
    />
  )
}

export function ArticleCardSkeleton() {
  return (
    <div className="p-4 border border-[var(--color-border)]
      rounded-[var(--radius-md)]
      bg-[var(--color-surface)] space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

export function ArticleListSkeleton({
  count = 5,
}: {
  count?: number
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ArticleCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2 py-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="p-4 border border-[var(--color-border)]
      rounded-[var(--radius-md)]
      bg-[var(--color-surface)] space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-16" />
    </div>
  )
}

export function TableRowSkeleton({
  cols = 4,
}: {
  cols?: number
}) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}
