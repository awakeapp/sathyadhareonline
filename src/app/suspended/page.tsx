import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { AlertTriangle, Home } from 'lucide-react';

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-6 text-white">
      <div className="max-w-md w-full bg-[var(--color-surface)] rounded-[2.5rem] border border-[var(--color-border)] p-10 text-center shadow-2xl">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-8 animate-pulse">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-black tracking-tighter mb-4 leading-tight">Account Restricted</h1>
        
        <p className="text-[var(--color-muted)] font-medium mb-8 leading-relaxed">
          Your account has been <span className="text-red-400 font-bold uppercase tracking-widest text-[10px]">Suspended</span>. 
          This may be due to a policy violation or maintenance. Please contact support if you think this is a mistake.
        </p>

        <div className="space-y-4">
          <Button asChild variant="outline" className="w-full rounded-2xl h-14 border-[var(--color-border)] hover:bg-[var(--color-surface-2)]">
            <Link href="/" className="flex items-center justify-center gap-2">
              <Home className="w-4 h-4" /> Back to Home
            </Link>
          </Button>
          
          <p className="text-[10px] text-[var(--color-muted)] font-bold uppercase tracking-widest">
            Support: support@sathyadhare.com
          </p>
        </div>
      </div>
    </div>
  );
}
