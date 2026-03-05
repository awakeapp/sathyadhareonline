import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image?: string | null;
  category?: { name: string } | { name: string }[] | null;
};

export default function HeroBanner({ article }: { article: Article }) {
  const category = Array.isArray(article.category) ? article.category[0]?.name : article.category?.name;

  return (
    <section className="relative z-0">
      <Link href={`/articles/${article.slug}`} className="group block relative w-full aspect-[4/3] sm:aspect-[16/9] bg-[var(--color-surface-2)] rounded-[2.5rem] tap-highlight z-0 outline-none">
        <Card hoverable className="absolute inset-0 rounded-[2.5rem] overflow-hidden isolate border-transparent shadow-[0_8px_32px_rgba(0,0,0,0.4)] group-hover:shadow-[0_12px_48px_rgba(0,0,0,0.6)]">
          {article.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.cover_image}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="absolute inset-0 bg-[var(--color-surface-2)]" />
          )}

          {/* Strong Gradient Overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.95)] via-[rgba(0,0,0,0.3)] to-transparent pointer-events-none" />

          {/* Text Content inside the hero */}
          <CardContent className="absolute inset-x-0 bottom-0 p-6 sm:p-10 flex flex-col items-start pointer-events-none z-10 w-full">
            {category && (
              <span className="inline-block px-4 py-1.5 mb-4 rounded-full bg-[var(--color-primary)] text-black text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] shadow-lg">
                {category}
              </span>
            )}
            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight line-clamp-3">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="mt-4 text-white/80 text-sm sm:text-base line-clamp-2 max-w-3xl font-medium leading-relaxed">
                {article.excerpt}
              </p>
            )}
          </CardContent>
        </Card>
      </Link>
    </section>
  );
}
