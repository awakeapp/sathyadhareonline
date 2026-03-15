import Link from 'next/link';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[var(--color-surface)]">
      <div className="w-24 h-24 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 mb-8 animate-pulse">
        <WifiOff size={48} />
      </div>
      <h1 className="text-3xl font-black text-[var(--color-text)] tracking-tight mb-4">You&apos;re Offline</h1>
      <p className="max-w-md text-[var(--color-muted)] font-medium mb-8 leading-relaxed">
        It seems you&apos;ve lost your connection. Don&apos;t worry, you can still access some of your recently visited articles.
      </p>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button asChild className="h-14 rounded-2xl font-black uppercase tracking-widest text-xs">
          <Link href="/">Try Home Page</Link>
        </Button>
        <Button asChild variant="outline" className="h-14 rounded-2xl font-black uppercase tracking-widest text-xs">
          <Link href="/saved">My Saved Articles</Link>
        </Button>
      </div>
    </div>
  );
}
