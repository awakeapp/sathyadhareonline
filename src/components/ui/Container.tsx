import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  maxW?: '7xl' | '5xl' | '4xl' | '3xl' | 'full';
}

const maxWMap: Record<NonNullable<ContainerProps['maxW']>, string> = {
  '7xl': 'max-w-7xl',
  '5xl': 'max-w-5xl',
  '4xl': 'max-w-4xl',
  '3xl': 'max-w-3xl',
  'full': 'max-w-full',
};

export default function Container({ children, className = '', maxW = '7xl' }: ContainerProps) {
  return (
    <div className={`${maxWMap[maxW]} mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
