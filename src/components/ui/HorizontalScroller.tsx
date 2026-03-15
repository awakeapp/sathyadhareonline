import React from 'react';

interface HorizontalScrollerProps {
  children: React.ReactNode;
  className?: string;
}

export default function HorizontalScroller({ children, className = '' }: HorizontalScrollerProps) {
  return (
    <div className="relative group/scroller">
      <div
        className={`flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory -webkit-overflow-scrolling-touch ${className}`}
        role="region"
        aria-label="Scrollable content"
      >
        {children}
      </div>
      {/* Visual affordance: side gradients */}
      <div className="absolute top-0 right-0 bottom-4 w-12 bg-gradient-to-l from-[var(--color-background)] to-transparent pointer-events-none opacity-60" />
    </div>
  );
}
