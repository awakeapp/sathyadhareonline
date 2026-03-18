'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { logAuditEvent } from '@/lib/audit';
import { verifyRole } from '@/lib/auth-server';

const SUPER_ADMIN = 'super_admin';

async function verifySuperAdmin() {
  const { user } = await verifyRole(['super_admin']);
  return user;
}

export async function createUserAction(formData: FormData) {
  try {
    const caller = await verifySuperAdmin();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('full_name') as string;
    const role = formData.get('role') as string;

    const adminClient = createAdminClient();
    if (!adminClient) throw new Error('Service role key not configured.');

    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });

    if (authError) throw authError;

    if (authUser.user) {
      const { error: profileError } = await adminClient
        .from('profiles')
        .update({ role, full_name: fullName || undefined })
        .eq('id', authUser.user.id);

      if (profileError) console.error('Profile update error after create:', profileError);
      await logAuditEvent(caller.id, 'USER_CREATED', { target_user_id: authUser.user.id, email, role });
    }

    revalidatePath('/admin/users');
    return { success: true, message: 'User account created successfully.' };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Failed to create user' };
  }
}

export async function updateUserAction(formData: FormData) {
  try {
    const caller = await verifySuperAdmin();
    const userId = formData.get('userId') as string;
    const fullName = formData.get('full_name') as string;
    const role = formData.get('role') as string;

    const canArticles = formData.get('can_articles') === 'on';
    const canSequels = formData.get('can_sequels') === 'on';
    const canLibrary = formData.get('can_library') === 'on';

    const supabase = await createClient();

    // Safeguard: Last super admin check
    if (role !== SUPER_ADMIN) {
      const { data: target } = await supabase.from('profiles').select('role, status').eq('id', userId).maybeSingle();
      if (target?.role === SUPER_ADMIN) {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', SUPER_ADMIN)
          .eq('status', 'active');
        if ((count || 0) <= 1 && target?.status === 'active') {
          throw new Error('Cannot demote the last active Super Admin.');
        }
      }
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName, role })
      .eq('id', userId);
    if (profileError) throw profileError;

    const { error: permError } = await supabase
      .from('user_content_permissions')
      .upsert({
        user_id: userId,
        can_articles: canArticles,
        can_sequels: canSequels,
        can_library: canLibrary,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    if (permError) console.error('Permissions update failed:', permError);

    await logAuditEvent(caller.id, 'USER_UPDATED', {
      target_user_id: userId,
      fullName,
      role,
      permissions: { canArticles, canSequels, canLibrary },
    });

    revalidatePath('/admin/users');
    return { success: true, message: 'User updated successfully.' };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Failed to update user' };
  }
}

export async function deleteUserAction(formData: FormData) {
  try {
    const caller = await verifySuperAdmin();
    const userId = formData.get('userId') as string;

    const supabase = await createClient();
    const adminClient = createAdminClient();
    if (!adminClient) throw new Error('Service role key not configured.');

    const { data: target } = await supabase.from('profiles').select('role, status').eq('id', userId).maybeSingle();
    if (target?.role === SUPER_ADMIN) {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', SUPER_ADMIN)
        .eq('status', 'active');
      if ((count || 0) <= 1 && target?.status === 'active') {
        throw new Error('Cannot delete the last active Super Admin.');
      }
    }

    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
    if (authError) throw authError;

    await logAuditEvent(caller.id, 'USER_DELETED', { target_user_id: userId });

    revalidatePath('/admin/users');
    return { success: true, message: 'User account permanently deleted.' };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Failed to delete user' };
  }
}

export async function inviteUserAction(formData: FormData) {
  try {
    const caller = await verifySuperAdmin();
    const email = formData.get('email') as string;
    const role = formData.get('role') as string;

    const adminClient = createAdminClient();
    if (!adminClient) throw new Error('Service role key not configured.');

    const { error } = await adminClient.auth.admin.inviteUserByEmail(email, { data: { role } });
    if (error) throw error;

    await logAuditEvent(caller.id, 'USER_INVITED', { invited_email: email, role });

    revalidatePath('/admin/users');
    return { success: true, message: 'Invitation email sent successfully.' };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Failed to invite user' };
  }
}

export async function toggleStatusAction(formData: FormData) {
  try {
    const caller = await verifySuperAdmin();
    const userId = formData.get('userId') as string;
    const status = formData.get('status') as string;

    const supabase = await createClient();
    const adminClient = createAdminClient();
    if (!adminClient) throw new Error('Service role key not configured.');

    if (status !== 'active') {
      const { data: target } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', userId)
        .maybeSingle();

      if (target?.role === SUPER_ADMIN) {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', SUPER_ADMIN)
          .eq('status', 'active');
        if ((count || 0) <= 1 && target?.status === 'active') {
          throw new Error('Cannot suspend the last active Super Admin.');
        }
      }
    }

    // 1. Update profiles table
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId);
    if (profileErr) throw profileErr;

    // 2. Sync with Supabase Auth — ban_duration='0' = not banned, '876600h' = ~100 years
    const banDuration = status === 'active' ? '0' : '876600h';
    const { error: authErr } = await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: banDuration,
    });
    if (authErr) console.error('[toggleStatus] Auth ban update failed:', authErr.message);

    // 3. Force sign-out all existing sessions for suspended/banned users
    if (status !== 'active') {
      const { error: signOutErr } = await adminClient.auth.admin.signOut(userId, 'global');
      if (signOutErr) console.error('[toggleStatus] Force signout failed:', signOutErr.message);
    }

    await logAuditEvent(caller.id, `USER_${status.toUpperCase()}`, {
      target_user_id: userId,
      auth_ban_applied: status !== 'active',
    });

    revalidatePath('/admin/users');
    return {
      success: true,
      message: `User ${status === 'active' ? 'reactivated' : status === 'suspended' ? 'suspended' : 'banned'} successfully.`,
    };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Failed to update status' };
  }
}

// Fix #6 — Admin-triggered password reset email
export async function sendPasswordResetAction(formData: FormData) {
  try {
    await verifySuperAdmin();
    const email = formData.get('email') as string;
    if (!email) throw new Error('Email is required.');

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/update-password`,
    });
    if (error) throw error;

    return { success: true, message: `Password reset email sent to ${email}.` };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Failed to send password reset' };
  }
}

export async function setUserPermissionsAction(
  userId: string,
  permissions: { can_articles: boolean; can_sequels: boolean; can_library: boolean },
) {
  try {
    const caller = await verifySuperAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from('user_content_permissions')
      .upsert({ user_id: userId, ...permissions, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;

    await logAuditEvent(caller.id, 'USER_PERMISSIONS_UPDATED', { target_user_id: userId, permissions });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Failed to update permissions' };
  }
}

/**
 * Fetches brief activity summary for a user to display in the profile drawer.
 */
export async function getUserActivityStatsAction(userId: string) {
  try {
    const { user: caller } = await verifyRole(['super_admin', 'admin', 'editor']);
    if (!caller) throw new Error('Unauthorized');

    const supabase = await createClient();
    
    // Get article counts and titles
    const { data: articles, error: artError } = await supabase
      .from('articles')
      .select('id, title, status, created_at, published_at, slug')
      .eq('author_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (artError) throw artError;

    const published = articles.filter(a => a.status === 'published');
    const drafted = articles.filter(a => a.status === 'draft');
    const inReview = articles.filter(a => a.status === 'in_review');

    return {
      success: true,
      stats: {
        total: articles.length,
        published: published.length,
        drafted: drafted.length,
        inReview: inReview.length,
      },
      recentWork: articles.slice(0, 8) // Show top 8 recent articles
    };
  } catch (error) {
    console.error('getUserActivityStatsAction error:', error);
    return { error: 'Failed to fetch user activity stats' };
  }
}
