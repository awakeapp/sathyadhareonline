import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-[var(--color-surface-2)]",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.5s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/20 dark:after:via-white/5 after:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export function ArticleCardSkeleton() {
  return (
    <div className="w-full flex flex-col gap-4 p-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <Skeleton className="w-full aspect-[16/9] rounded-2xl" />
      <div className="flex flex-col gap-2 px-1">
        <Skeleton className="h-6 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-1/2 rounded-lg" />
      </div>
      <div className="flex justify-between items-center mt-2 border-t border-[var(--color-border)] pt-4 px-1">
        <Skeleton className="h-4 w-24 rounded-lg" />
        <div className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export { Skeleton }
