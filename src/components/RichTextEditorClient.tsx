'use client';

import dynamic from 'next/dynamic';

// Load TipTap only on client — prevents SSR hydration mismatch
const RichTextEditor = dynamic(() => import('./RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-200 rounded-xl min-h-[300px] flex items-center justify-center text-gray-400 text-sm bg-gray-50">
      Loading editor…
    </div>
  ),
});

export default RichTextEditor;
