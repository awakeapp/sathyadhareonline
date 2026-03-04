import Link from 'next/link';

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
      <Link
        href={`/articles/${article.slug}`}
        className="group block relative w-full aspect-[4/3] sm:aspect-[16/9] bg-white rounded-[2rem] tap-highlight z-0"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
      >
        <div className="absolute inset-0 rounded-[2rem] overflow-hidden isolate">
          {article.cover_image ? (
            <img
              src={article.cover_image}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="absolute inset-0 bg-white" />
          )}

          {/* Strong Gradient Overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.9)] via-[rgba(0,0,0,0.3)] to-transparent pointer-events-none" />

          {/* Text Content inside the hero */}
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 flex flex-col items-start pointer-events-none z-10">
            {category && (
              <span className="inline-block px-4 py-1.5 mb-4 rounded-full bg-[#ffe500] text-[#181623] text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] shadow-lg">
                {category}
              </span>
            )}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight line-clamp-2">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="mt-4 text-[#d1d1d1] text-xs sm:text-base line-clamp-2 max-w-3xl font-medium leading-relaxed">
                {article.excerpt}
              </p>
            )}
          </div>
        </div>
      </Link>
    </section>
  );
}
