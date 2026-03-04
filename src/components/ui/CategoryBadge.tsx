interface CategoryBadgeProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

import React from 'react';

export default function CategoryBadge({ name, className = '', style }: CategoryBadgeProps) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-sm leading-5 ${className}`}
      style={{ background: '#ffd500', color: '#0a0b1a', ...style }}
    >
      {name}
    </span>
  );
}
