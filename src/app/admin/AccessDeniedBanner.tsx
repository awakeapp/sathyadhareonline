'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShieldX } from 'lucide-react';

/**
 * Reads the ?denied=1 search param and shows a temporary
 * "Access Denied" banner for super_admin-only routes.
 * Auto-dismisses after 4 seconds.
 */
export default function AccessDeniedBanner() {
  const params  = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (params.get('denied') === '1') {
      setShow(true);
      const t = setTimeout(() => setShow(false), 4000);
      return () => clearTimeout(t);
    }
  }, [params]);

  if (!show) return null;

  return (
    <div
      role="alert"
      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <ShieldX size={18} className="text-rose-500 shrink-0" />
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-rose-600 dark:text-rose-400 leading-tight">
          Access Denied
        </p>
        <p className="text-[12px] text-rose-500/80 mt-0.5">
          That section requires Super Admin access.
        </p>
      </div>
    </div>
  );
}
