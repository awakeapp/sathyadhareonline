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
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 500); 
    
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ width: '0%', opacity: 1 }}
          animate={{ width: '100%', opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-blue-500 to-indigo-600 z-[9999] shadow-[0_0_10px_rgba(59,130,246,0.5)]"
        />
      )}
    </AnimatePresence>
  );
}
