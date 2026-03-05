import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // ── Defence-in-depth: only editors allowed here ─────────────────
  if (!profile || profile.role !== 'editor') {
    redirect('/login');
  }

  return (
    <div className="flex-1 w-full relative transition-all">
      <div className="h-full overflow-y-auto w-full max-w-[1400px] mx-auto p-4 md:p-8 pb-32">
        {children}
      </div>
    </div>
  );
}
