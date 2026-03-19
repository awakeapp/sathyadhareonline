import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ContributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'contributor') {
    redirect('/');
  }

  return (
    <div className="w-full min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] relative">
      <main className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 md:px-8 py-8 md:py-12 mt-[var(--header-height)] md:mt-20 flex flex-col gap-8 md:gap-12 animate-in fade-in pb-[calc(var(--bottom-nav-height)+1rem)]">
        {children}
      </main>
    </div>
  );
}
