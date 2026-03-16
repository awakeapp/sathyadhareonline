'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
}

export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const count = banners.length;

  const next = useCallback(() => setCurrent(c => (c + 1) % count), [count]);

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [next, count]);

  if (count === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl bg-[var(--color-surface-2)] select-none shadow-lg"
      style={{ aspectRatio: '16 / 9' }}
    >
      {/* Slides */}
      {banners.map((b, i) => (
        <div
          key={b.id}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
        >
          <Image
            src={b.image_url}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            priority={i === 0}
          />
        </div>
      ))}

      {/* Clickable overlay — conditionally wrap with Link */}
      <div className="absolute inset-0 z-10">
        {banners[current]?.link_url ? (
          <Link
            href={banners[current].link_url!}
            className="block w-full h-full"
            tabIndex={-1}
            aria-label="Banner link"
          />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>

      {/* Dash indicators */}
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1 rounded-full bg-black/10 backdrop-blur-md">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setCurrent(i); }}
              aria-label={`Go to banner ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'w-2 bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
