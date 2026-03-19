import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import IntakeClient from './IntakeClient';
import AdminContainer from '@/components/layout/AdminContainer';

export const dynamic = 'force-dynamic';

export default async function IntakePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/admin?denied=1');
  }

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');

  // Fetch editors
  const { data: editors } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'editor')
    .order('full_name');

  return (
    <AdminContainer className="flex flex-col gap-6">
      <div className="pt-2">
        <h1 className="text-[22px] font-bold text-[var(--color-text)] tracking-tight">External Article Intake</h1>
        <p className="text-[13px] text-[var(--color-muted)] mt-1">Source and assign external content to an editor for review.</p>
      </div>

      <IntakeClient 
        categories={categories || []} 
        editors={editors || []} 
        currentUserId={user.id}
      />
    </AdminContainer>
  );
}
