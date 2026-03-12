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
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role }
    });

    if (authError) throw authError;

    // Profile is usually created via trigger, but let's ensure it has the correct role 
    // in case the trigger only defaults to 'reader'
    if (authUser.user) {
      const { error: profileError } = await adminClient
        .from('profiles')
        .update({ role, full_name: fullName || undefined })
        .eq('id', authUser.user.id);
      
      if (profileError) console.error('Profile update error after create:', profileError);
      
      await logAuditEvent(caller.id, 'USER_CREATED', { target_user_id: authUser.user.id, email, role });
    }

    revalidatePath('/admin/users');
    return { success: true, message: 'User profile manually created.' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create user';
    console.error('Create User Error:', error);
    return { error: message };
  }
}

export async function updateUserAction(formData: FormData) {
  try {
    const caller = await verifySuperAdmin();
    const userId = formData.get('userId') as string;
    const fullName = formData.get('full_name') as string;
    const role = formData.get('role') as string;

    const supabase = await createClient();

    // Safeguard: Last super admin check
    if (role !== SUPER_ADMIN) {
      const { data: target } = await supabase.from('profiles').select('role, status').eq('id', userId).single();
      if (target?.role === SUPER_ADMIN) {
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', SUPER_ADMIN).eq('status', 'active');
        if ((count || 0) <= 1 && target?.status === 'active') {
          throw new Error('Cannot demote the last active Super Admin.');
        }
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, role })
      .eq('id', userId);

    if (error) throw error;

    await logAuditEvent(caller.id, 'USER_UPDATED', { target_user_id: userId, fullName, role });

    revalidatePath('/admin/users');
    return { success: true, message: 'User role updated successfully.' };
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

    // Safeguard: Check if it's the last super admin
    const { data: target } = await supabase.from('profiles').select('role, status').eq('id', userId).single();
    if (target?.role === SUPER_ADMIN) {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', SUPER_ADMIN).eq('status', 'active');
      if ((count || 0) <= 1 && target?.status === 'active') {
        throw new Error('Cannot delete the last active Super Admin.');
      }
    }

    // Delete from auth (cascades to profiles)
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
    if (authError) throw authError;

    await logAuditEvent(caller.id, 'USER_DELETED', { target_user_id: userId });

    revalidatePath('/admin/users');
    return { success: true, message: 'User account has been permanently deleted.' };
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
    const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { role }
    });

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
    const status = formData.get('status') as string; // 'active', 'suspended', 'banned'

    const supabase = await createClient();
    
    // Safeguard: Cannot suspend the last super admin
    if (status !== 'active') {
       const { data: target } = await supabase.from('profiles').select('role, status').eq('id', userId).single();
       if (target?.role === SUPER_ADMIN) {
          const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', SUPER_ADMIN).eq('status', 'active');
          if ((count || 0) <= 1 && target?.status === 'active') {
             throw new Error('Cannot suspend the last active Super Admin.');
          }
       }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId);

    if (error) throw error;

    await logAuditEvent(caller.id, `USER_${status.toUpperCase()}`, { target_user_id: userId });

    revalidatePath('/admin/users');
    return { success: true, message: `User status updated to ${status}.` };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Failed to update status' };
  }
}
