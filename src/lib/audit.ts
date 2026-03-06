import { createClient } from '@/lib/supabase/server';

/**
 * Logs an administrative action to the audit logs table.
 * @param userId Make sure this matches `user.id` or profile ID triggering the action.
 * @param action A clear verb string, e.g. "USER_DELETED", "ROLE_CHANGED", "ARTICLE_PUBLISHED".
 * @param details Additional context variables, e.g. target ids, old/new states.
 */
export async function logAuditEvent(userId: string, action: string, details: Record<string, unknown> = {}) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('audit_logs').insert({
      user_id: userId,
      action: action.toUpperCase(),
      details
    });
    
    if (error) {
      console.error('Failed to log audit event:', error.message);
    }
  } catch (err) {
    console.error('Audit Log Exception:', err);
  }
}
