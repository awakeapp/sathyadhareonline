import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PenLine, LogIn } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function WritePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Not signed in — show premium sign-in prompt
  if (!user) {
    return (
      <div className="min-h-[100svh] px-4 py-4 pb-32 max-w-lg mx-auto sm:max-w-2xl border-t border-[var(--color-border)]">
        <div className="pt-3 pb-5 border-b border-[var(--color-border)] mb-6">
          <h1 className="text-2xl font-black text-[var(--color-text)] tracking-tight">Write an Article</h1>
        </div>

        <Card className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-[2.5rem] bg-white dark:bg-[#111b21] border border-[var(--color-border)] shadow-[0_20px_50px_rgba(0,0,0,0.05)] mt-4">
          <div className="w-20 h-20 rounded-3xl bg-[#f59e0b]/5 flex items-center justify-center text-[#f59e0b] mb-6">
            <PenLine size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-black text-[var(--color-text)] tracking-tight mb-2">
            Sign in to Contribute
          </h2>
          <p className="max-w-xs text-sm font-medium text-[var(--color-muted)] leading-relaxed mb-8">
            Create an account or sign in to submit your article to the Sathyadhare editorial team for review.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-[260px]">
            <Link href="/login?redirect=/write"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#685de6] text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-[#685de6]/25 active:scale-95 transition-all">
              <LogIn className="w-4 h-4" />
              Log In
            </Link>
            <Link href="/signup?redirect=/write"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-[#685de6]/30 text-[#685de6] font-black text-sm uppercase tracking-widest active:scale-95 transition-all">
              Create Account
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Signed in — redirect to article submission page
  redirect('/submit');
}
