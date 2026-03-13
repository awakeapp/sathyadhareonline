import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, Bell } from 'lucide-react';
import SequelsClient from './SequelsClient';
import { 
  PresenceWrapper, 
  PresenceHeader 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

export default async function SequelsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/admin?error=unauthorized');
  }

  const { data: sequels, error } = await supabase
    .from('sequels')
    .select('id, title, description, banner_image, status')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sequels:', error);
  }

  const { data: countsData } = await supabase
    .from('sequel_articles')
    .select('sequel_id');

  const countsRecord: Record<string, number> = {};
  for (const row of countsData || []) {
    countsRecord[row.sequel_id] = (countsRecord[row.sequel_id] || 0) + 1;
  }

  const sequelsWithCounts = (sequels || []).map(s => ({
    ...s,
    article_count: countsRecord[s.id] || 0,
  }));

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Sequels" 
        hideActions={true} 
      />
      
      <div className="p-4 flex flex-col gap-4 relative z-20">
        <SequelsClient initialSequels={sequelsWithCounts} />
      </div>
    </PresenceWrapper>
  );
}
