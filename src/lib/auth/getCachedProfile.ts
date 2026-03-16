import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

/**
 * Fetches the current authenticated user and their profile.
 * Cached via React 'cache' to ensure only one DB hit occurs per request,
 * even if called in Middleware, Layout, and multiple Server Components.
 */
export const getCachedProfile = cache(async () => {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { user: null, profile: null };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    // Attempt auto-creation if missing (matches layout logic)
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member',
        role: 'reader'
      })
      .select('*')
      .maybeSingle();
      
    return { user, profile: newProfile || null };
  }

  return { user, profile };
});
