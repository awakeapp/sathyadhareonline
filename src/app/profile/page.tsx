import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileForm } from './ProfileForm';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // This shouldn't happen if auth is working correctly, but handle it
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[var(--color-muted)] font-bold">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-[var(--color-text)]">My Profile</h1>
        <p className="text-sm text-[var(--color-muted)] font-medium mt-1">
          Manage your personal information and public profile.
        </p>
      </header>

      <ProfileForm profile={profile} userEmail={user.email} />
    </div>
  );
}
