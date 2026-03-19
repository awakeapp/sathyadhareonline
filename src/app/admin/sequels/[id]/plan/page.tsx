import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PlanClient from './PlanClient';

export const dynamic = 'force-dynamic';

export default async function SequelPlanPage({ params }: { params: { id: string } }) {
  const { id } = params;
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

  // Fetch the Sequel
  const { data: sequel, error: sequelError } = await supabase
    .from('sequels')
    .select('id, title, banner_image, published_at, status')
    .eq('id', id)
    .maybeSingle();

  if (sequelError || !sequel) redirect('/admin/sequels');

  // Fetch all pieces for this sequel
  const { data: pieces } = await supabase
    .from('sequel_pieces')
    .select('id, title, type, author_name, assigned_to, status, notes, created_at, profiles:assigned_to(full_name)')
    .eq('sequel_id', id)
    .order('created_at', { ascending: true });

  // Fetch editors for assignment dropdown
  const { data: editors } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'editor')
    .order('full_name');

  return (
    <div className="w-full flex flex-col gap-6 max-w-[1400px] mx-auto">
      <PlanClient
        sequel={sequel}
        pieces={(pieces || []).map(p => ({
          ...p,
          profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
        }))}
        editors={editors || []}
      />
    </div>
  );
}
