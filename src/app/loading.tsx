import { ArticleCardSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen px-4 py-8 bg-[var(--color-background)] max-w-lg mx-auto sm:max-w-2xl lg:max-w-4xl">
      <div className="flex flex-col gap-6">
        <ArticleCardSkeleton />
        <ArticleCardSkeleton />
        <ArticleCardSkeleton />
      </div>
    </div>
  );
}
