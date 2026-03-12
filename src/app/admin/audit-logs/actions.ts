'use server';

import { createClient } from '@/lib/supabase/server';

export async function getAuditLogsAction(params: {
  page: number;
  limit: number;
  userId?: string;
  actionSearch?: string;
  startDate?: string;
  endDate?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    throw new Error('Unauthorized');
  }

  const { page, limit, userId, actionSearch, startDate, endDate } = params;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('audit_logs')
    .select(`
      id,
      user_id,
      action,
      details,
      created_at,
      profiles ( email, full_name, role )
    `, { count: 'exact' });

  if (userId && userId !== 'all') {
    query = query.eq('user_id', userId);
  }
  
  if (actionSearch) {
    query = query.ilike('action', `%${actionSearch}%`);
  }

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  
  if (endDate) {
    // Include the entire end day
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    query = query.lte('created_at', end.toISOString());
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Audit logs error:', error);
    throw new Error('Failed to fetch audit logs');
  }

  return { logs: data || [], count: count || 0 };
}
