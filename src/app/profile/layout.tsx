import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Double-verify that the user has a profile record and hasn't been suspended/banned
  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single();

  if (profile?.status === 'suspended' || profile?.status === 'banned') {
    redirect('/suspended');
  }

  return (
    <div className="flex-1 w-full relative transition-all bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="h-full overflow-y-auto w-full mx-auto">
        {children}
      </div>
    </div>
  );
}
