import Link from 'next/link';

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
  const readTime = article.read_time ? `${article.read_time} MINUTES` : '3 MINUTES';
  const date = formatDate(article.published_at);

  if (variant === 'list') {
    return (
      <Link
        href={`/articles/${article.slug}`}
        className="group relative block w-full rounded-[1.25rem] tap-highlight transition-transform duration-300 active:scale-95 z-0"
        style={{ background: '#ffffff', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}
      >
        <div className="flex flex-col sm:flex-row w-full h-full">
          
          {/* Image Side */}
          <div className="relative w-full sm:w-1/3 aspect-[4/3] sm:aspect-auto rounded-t-[1.25rem] sm:rounded-l-[1.25rem] sm:rounded-tr-none overflow-hidden isolate">
            {article.cover_image ? (
            <img
              src={article.cover_image}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 bg-[#242235]" />
          )}
            
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%)' }} />

            {/* Bottom-overlapping yellow badge INSIDE the image */}
            {categoryName && (
              <div className="absolute bottom-3 left-3 z-10 hidden sm:block">
                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-[#181623]" style={{ background: '#ffe500' }}>
                  {categoryName}
                </span>
              </div>
            )}
          </div>

          {/* Content Side */}
          <div className="relative flex flex-col flex-1 p-5 gap-2 justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold leading-tight text-[#181623] line-clamp-2">
                {article.title}
              </h3>
              {article.excerpt && (
                <p className="text-[#333] text-xs leading-relaxed line-clamp-2 mt-2 font-medium">
                  {article.excerpt}
                </p>
              )}
            </div>

            <div className="mt-3 flex items-center flex-wrap gap-1.5 text-[8px] font-bold uppercase tracking-widest text-[#777]">
              <span>{categoryName || 'ARTICLE'}</span>
              <span>|</span>
              {date && <span>{date}</span>}
              {date && <span>|</span>}
              <span className="flex items-center gap-1 text-[#444]">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {readTime}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid (Dark or White)
  const isDark = variant === 'grid-dark';
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex flex-col tap-highlight z-0"
    >
      {/* Outer wrapper relative, NOT hidden, to hold the badge */}
      <div className="relative w-full aspect-[3/4]">
        {/* Inner container to clip the image radius */}
        <div 
          className="absolute inset-0 rounded-[1.25rem] overflow-hidden shadow-sm"
          style={{ background: isDark ? '#242235' : '#ffffff' }}
        >
          {article.cover_image && (
            <img
              src={article.cover_image}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          )}
        </div>
      </div>
      
      {/* Meta Text strictly outside the image area */}
      <div className="mt-3 px-1 flex flex-col gap-0.5">
        <h3 
          className="text-xs font-bold leading-tight line-clamp-2 transition-colors"
          style={{ color: '#ffffff' }}
        >
          {article.title}
        </h3>
        <p className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: '#a3a0b5' }}>
          {categoryName || 'ARTICLE'} {date && `| ${date}`}
        </p>
      </div>
    </Link>
  );
}
