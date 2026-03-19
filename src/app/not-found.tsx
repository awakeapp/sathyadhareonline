import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found | Sathyadhare',
};

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full">
        {/* Large 404 Text */}
        <h1 className="text-8xl md:text-9xl font-black text-indigo-50/50 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 select-none">
          404
        </h1>
        
        <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
          <svg className="w-10 h-10 min-w-[44px] min-h-[44px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">
          Page Not Found
        </h2>
        
        <p className="text-gray-500 text-lg mb-10">
          The page you are looking for does not exist. It might have been moved or deleted.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/"
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95"
          >
            Go to Home
          </Link>
          
          <Link 
            href="/search"
            className="w-full sm:w-auto px-6 py-3 bg-white text-gray-700 font-bold rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 hover:text-indigo-600 transition-all active:scale-95"
          >
            Search
          </Link>

          <Link 
            href="/categories"
            className="w-full sm:w-auto px-6 py-3 bg-white text-gray-700 font-bold rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 hover:text-indigo-600 transition-all active:scale-95"
          >
            Categories
          </Link>
        </div>
      </div>
    </main>
  );
}
