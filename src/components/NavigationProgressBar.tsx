'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // When path or params change, we consider the transition successful/started
    const frame = requestAnimationFrame(() => setLoading(true));
    const timeout = setTimeout(() => setLoading(false), 500); 
    
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, [pathname, searchParams]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ width: '0%', opacity: 1 }}
          animate={{ width: '90%', opacity: 1 }}
          exit={{ width: '100%', opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} // smooth ease out
          className="fixed top-0 left-0 h-[2px] bg-[var(--color-primary)] z-[9999] shadow-[0_0_8px_var(--color-primary)]"
        />
      )}
    </AnimatePresence>
  );
}
