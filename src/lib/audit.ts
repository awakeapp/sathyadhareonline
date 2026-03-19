import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

/**
 * Logs an administrative action to the audit logs table.
 * Automatically captures the IP address and User Agent if available.
 * @param userId Make sure this matches `user.id` or profile ID triggering the action.
 * @param action A clear verb string, e.g. "USER_DELETED", "ROLE_CHANGED", "ARTICLE_PUBLISHED".
 * @param details Additional context variables, e.g. target ids, old/new states.
 */
export async function logAuditEvent(userId: string, action: string, details: Record<string, unknown> = {}) {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    const { error } = await supabase.from('audit_logs').insert({
      user_id: userId,
      action: action.toUpperCase(),
      details: {
        ...details,
        _browser_ip: ip,
        _browser_agent: userAgent
      },
      ip_address: ip,
      user_agent: userAgent
    });
    
    if (error) {
      console.error('Failed to log audit event:', error.message);
    }
  } catch (err) {
    console.error('Audit Log Exception:', err);
  }
}
