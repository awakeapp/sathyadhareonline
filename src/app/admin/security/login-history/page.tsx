import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Shield, MapPin, MonitorSmartphone, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LoginHistoryPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') {
    redirect('/dashboard/admin?denied=1');
  }

  // Fetch from the custom security definer function since schema `auth` is restricted
  const { data: history, error } = await supabase.rpc('get_login_history');

  if (error) {
    console.error('Failed fetching login history:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Authentication Logs</h2>
          <p className="text-sm text-[var(--color-muted)] mt-1">Audit trail of recent successful user sign-ins</p>
        </div>
      </div>

      <Card className="rounded-[2rem] border-[var(--color-border)] bg-[var(--color-surface)] shadow-none">
        <CardContent className="p-0">
          {!history || history.length === 0 ? (
            <div className="text-center py-20">
              <Shield className="w-12 h-12 text-[var(--color-muted)] opacity-20 mx-auto mb-4" />
              <p className="font-bold text-lg">No auth logs detected</p>
              <p className="text-sm text-[var(--color-muted)]">Users must sign in to generate history logs natively.</p>
              {error && <p className="text-xs text-rose-500 mt-2 font-mono">{error.message}</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]/50 bg-black/20 text-[var(--color-muted)] text-[10px] uppercase tracking-widest">
                    <th className="px-6 py-4 font-bold">Timestamp</th>
                    <th className="px-6 py-4 font-bold">User Account</th>
                    <th className="px-6 py-4 font-bold">IP Address</th>
                    <th className="px-6 py-4 font-bold">Client Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]/30">
                  {history.map((log: { log_id: string; created_at: string; email: string; role: string; ip_address: string; user_agent: string }) => (
                    <tr key={log.log_id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 text-white/60 whitespace-nowrap font-mono text-[11px]">
                        <div className="flex items-center gap-2">
                           <Activity className="w-3.5 h-3.5 text-rose-500 opacity-50 group-hover:opacity-100 transition-opacity" strokeWidth={1.25} />
                           {new Date(log.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="font-bold text-white">{log.email || 'Unknown Email'}</span>
                           <span className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${
                             log.role === 'super_admin' ? 'text-amber-500' :
                             log.role === 'admin' ? 'text-indigo-400' :
                             'text-[var(--color-muted)]'
                           }`}>
                             {log.role || 'Guest'}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--color-muted)] whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                           <MapPin className="w-3 h-3 opacity-50" strokeWidth={1.25} />
                           {log.ip_address || '---.---.---.---'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--color-muted)] max-w-xs truncate">
                        <div className="flex items-center gap-1.5" title={log.user_agent}>
                           <MonitorSmartphone className="w-3.5 h-3.5 opacity-50 flex-shrink-0" strokeWidth={1.25} />
                           <span className="truncate">{log.user_agent || 'Unknown Client Engine'}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
