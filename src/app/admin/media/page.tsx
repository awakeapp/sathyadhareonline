import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, Bell } from 'lucide-react';
import MediaLibraryClient from './MediaLibraryClient';
import { 
  PresenceWrapper, 
  PresenceHeader 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

export default async function MediaLibraryPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
    redirect('/admin');
  }

  const { data: mediaItems, error } = await supabase
    .from('media')
    .select('id, url, uploaded_by, created_at')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) console.error('Error fetching media:', error);

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Media Library" 
        hideActions={true} 
      />
      
      <div className="p-4 flex flex-col gap-4 relative z-20">
        <MediaLibraryClient
          initialItems={mediaItems ?? []}
          userId={user.id}
        />
      </div>
    </PresenceWrapper>
  );
}
