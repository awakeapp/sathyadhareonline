import React from 'react';

interface HorizontalScrollerProps {
  children: React.ReactNode;
  className?: string;
}

export default function HorizontalScroller({ children, className = '' }: HorizontalScrollerProps) {
  return (
    <div
      className={`flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory -webkit-overflow-scrolling-touch ${className}`}
      role="region"
      aria-label="Scrollable content"
    >
      {children}
    </div>
  );
}
