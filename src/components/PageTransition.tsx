'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';

function PageContentFallback() {
  return (
    <div className="flex-1 flex flex-col justify-start items-center p-8 min-h-screen opacity-50 space-y-4 animate-pulse pt-24">
      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
      <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded w-full mt-8"></div>
    </div>
  );
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  let type = 'slide-right';
  if (typeof window !== 'undefined') {
    type = sessionStorage.getItem('transition_type') || 'slide-right';
    if (type !== 'slide-right') {
      // Clear it so normal links fallback to slide-right
      sessionStorage.removeItem('transition_type');
    }
  }

  const variants = {
    'slide-right': {
      initial: { x: '100%', opacity: 1 },
      animate: { x: 0, opacity: 1 },
      exit: { x: '-20%', opacity: 0 },
    },
    'slide-up': {
      initial: { y: '100%', opacity: 1 },
      animate: { y: 0, opacity: 1 },
      exit: { opacity: 0 },
    }
  };

  const key = type as keyof typeof variants;
  const currentVariant = variants[key] || variants['slide-right'];

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        initial={currentVariant.initial}
        animate={currentVariant.animate}
        exit={currentVariant.exit}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 35,
          mass: 0.8
        }}
        className="w-full flex-1 flex flex-col min-w-0"
        style={{
          backgroundColor: 'var(--color-background)',
          boxShadow: '-2px 0 10px rgba(0,0,0,0.08)',
          zIndex: 10
        }}
      >
        <Suspense fallback={<PageContentFallback />}>
          {children}
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}
