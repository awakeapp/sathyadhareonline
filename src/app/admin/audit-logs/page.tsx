import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ScrollText, Clock, User, Activity } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();

  if (!profile || profile.role !== 'super_admin') redirect('/admin');

  // Fetch audit logs (up to 50)
  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(50);

  const formatDate = (iso: string) => 
    new Date(iso).toLocaleString('en-IN', { 
      day: '2-digit', month: 'short', 
      hour: '2-digit', minute: '2-digit' 
    });

  return (
    <div className="font-sans antialiased max-w-4xl mx-auto py-2 px-4 shadow-none">
      
      <div className="flex items-center gap-4 mb-8 mt-4">
        <Button asChild variant="outline" size="icon" className="rounded-full w-10 h-10 border-[var(--color-border)] text-[var(--color-muted)]">
          <Link href="/admin">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight leading-tight flex items-center gap-2">
            Audit Logs <ScrollText className="w-6 h-6 text-purple-500" />
          </h1>
          <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-semibold mt-0.5">
            System activity tracking · super admin only
          </p>
        </div>
      </div>

      {!logs || logs.length === 0 ? (
        <Card className="py-20 text-center flex flex-col items-center bg-[var(--color-surface)] border-[var(--color-border)] border-dashed rounded-[2rem] shadow-none">
          <Activity className="w-12 h-12 mb-4 opacity-20 text-[var(--color-muted)]" />
          <p className="text-[var(--color-muted)] font-bold tracking-tight">No audit logs recorded yet.</p>
          {error && <p className="text-[10px] text-red-500/50 mt-2">{error.message}</p>}
        </Card>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id} className="rounded-3xl border-transparent bg-[var(--color-surface)] shadow-sm">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/10">
                       <Clock className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm tracking-tight uppercase bg-white/5 px-2 py-0.5 rounded border border-white/10">{log.action}</span>
                        <span className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-widest">{formatDate(log.created_at)}</span>
                      </div>
                      <p className="text-xs font-medium text-[var(--color-text)] mt-2 opacity-80 overflow-hidden text-ellipsis">
                         {JSON.stringify(log.details)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-[var(--color-background)] px-3 py-1.5 rounded-2xl border border-[var(--color-border)] self-start sm:self-center">
                    <User className="w-3.5 h-3.5 text-[var(--color-muted)]" />
                    <div className="text-[10px] font-bold">
                      <p className="leading-tight truncate max-w-[120px]">{(log.profiles as any)?.full_name || 'Admin'}</p>
                      <p className="text-[var(--color-muted)] opacity-70 leading-tight truncate max-w-[120px]">{(log.profiles as any)?.email || '...'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)] opacity-30">End of recent logs</p>
      </div>
    </div>
  );
}
