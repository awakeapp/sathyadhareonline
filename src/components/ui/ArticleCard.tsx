import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image?: string | null;
  category?: { name: string } | { name: string }[] | null;
  published_at?: string | null;
  read_time?: number | null;
}

interface ArticleCardProps {
  article: Article;
  variant?: 'list' | 'grid-dark' | 'grid-white';
}

function getCategory(article: Article) {
  const cat = Array.isArray(article.category) ? article.category[0] : article.category;
  return cat?.name ?? null;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).toUpperCase();
}

export default function ArticleCard({ article, variant = 'list' }: ArticleCardProps) {
  const categoryName = getCategory(article);
  const readTime = article.read_time ? `${article.read_time} MIN READ` : '3 MIN READ';
  const date = formatDate(article.published_at);

  if (variant === 'list') {
    return (
      <Link href={`/articles/${article.slug}`} className="group relative block w-full tap-highlight transition-transform duration-300 active:scale-[0.98] outline-none">
        <Card hoverable className="rounded-3xl border-transparent bg-[var(--color-surface)] shadow-none overflow-hidden h-full flex flex-col sm:flex-row group-hover:bg-[var(--color-surface-2)]">
          {/* Image Side */}
          <div className="relative w-full sm:w-[35%] aspect-[16/10] sm:aspect-auto sm:h-auto overflow-hidden">
            {article.cover_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.cover_image}
                alt={article.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="absolute inset-0 bg-[var(--color-surface-2)]" />
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent sm:hidden" />

            {/* Mobile Badge */}
            {categoryName && (
              <div className="absolute top-3 left-3 z-10 sm:hidden">
                <span className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-black bg-[var(--color-primary)] shadow-sm">
                  {categoryName}
                </span>
              </div>
            )}
          </div>

          {/* Content Side */}
          <CardContent className="flex flex-col flex-1 p-5 sm:p-6 justify-between border-t sm:border-t-0 sm:border-l border-[var(--color-border)]">
            <div>
              {/* Desktop Badge */}
              {categoryName && (
                <div className="hidden sm:inline-block mb-3">
                  <span className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-[var(--color-primary)] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
                    {categoryName}
                  </span>
                </div>
              )}
              
              <h3 className="text-base sm:text-lg font-bold leading-snug text-[var(--color-text)] line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                {article.title}
              </h3>
              
              {article.excerpt && (
                <p className="text-[var(--color-muted)] text-sm leading-relaxed line-clamp-2 mt-2 font-medium">
                  {article.excerpt}
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
              {date && <span>{date}</span>}
              {date && <span className="opacity-30">•</span>}
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {readTime}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Grid Style
  return (
    <Link href={`/articles/${article.slug}`} className="group flex flex-col tap-highlight h-full outline-none">
      <Card hoverable className="rounded-[1.75rem] border-transparent bg-transparent shadow-none h-full flex flex-col">
        {/* Image Container */}
        <div className="relative w-full aspect-[4/5] rounded-[1.75rem] overflow-hidden mb-3 bg-[var(--color-surface-2)]">
          {article.cover_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.cover_image}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
              loading="lazy"
            />
          )}
          {/* Subtle gradient overlay to ensure badge readability if added later */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        {/* Meta Text strictly outside the image area */}
        <div className="px-1 flex flex-col flex-1 pb-1">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5 text-[var(--color-primary)]">
            {categoryName || 'ARTICLE'}
          </p>
          <h3 className="text-sm font-bold leading-snug line-clamp-2 text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors mb-2">
            {article.title}
          </h3>
          <div className="mt-auto text-[9px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
            {date && `${date}`}
          </div>
        </div>
      </Card>
    </Link>
  );
}
