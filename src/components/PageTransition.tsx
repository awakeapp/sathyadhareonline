'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [transitionType, setTransitionType] = useState('slide-right'); // default

  useEffect(() => {
    // Determine the transition type based on sessionStorage set by navigation components
    const type = sessionStorage.getItem('transition_type');
    if (type) {
      setTransitionType(type);
      // Reset after reading so regular links default back to slide-right
      sessionStorage.removeItem('transition_type');
    } else {
      setTransitionType('slide-right');
    }
  }, [pathname]);

  const variants = {
    'slide-right': {
      initial: { x: '100%', opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: '-100%', opacity: 0 },
    },
    'slide-up': {
      initial: { y: '100%', opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: '-10%', opacity: 0 },
    }
  };

  const currentVariant = variants[transitionType as keyof typeof variants] || variants['slide-right'];

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        initial={currentVariant.initial}
        animate={currentVariant.animate}
        exit={currentVariant.exit}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="w-full flex-1 flex flex-col min-w-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
