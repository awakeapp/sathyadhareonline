import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ChevronLeft, Bell } from 'lucide-react';
import RevenueClient from './RevenueClient';
import { 
  PresenceWrapper, 
  PresenceHeader 
} from '@/components/PresenceUI';

export const dynamic = 'force-dynamic';

export default async function RevenuePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle();
  if (!profile || profile.role !== 'super_admin') redirect('/admin?error=unauthorized');

  const { data: txsData } = await supabase
    .from('transactions')
    .select('*, profiles(email), subscription_plans(name)')
    .order('created_at', { ascending: false });

  const txs = txsData || [];

  let totalRevenue = 0;
  let mrr = 0;

  const validTransactions = txs.filter(t => t.status === 'completed' && t.type === 'payment');
  
  for (const t of validTransactions) {
    totalRevenue += Number(t.amount);
  }

  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const now = new Date().getTime();
  const recentValidTx = validTransactions.filter(t => new Date(t.created_at).getTime() > now - THIRTY_DAYS);
  mrr = recentValidTx.reduce((sum, t) => sum + Number(t.amount), 0);

  const mappedTransactions = txs.map(t => ({
    id: t.id,
    amount: Number(t.amount),
    currency: t.currency,
    status: t.status,
    type: t.type,
    created_at: t.created_at,
    userEmail: (t.profiles as any)?.email || 'Unknown Protocol',
    planName: (t.subscription_plans as any)?.name || 'Direct Deposit'
  }));

  const initials = (profile?.full_name || 'A').charAt(0).toUpperCase();

  return (
    <PresenceWrapper>
      <PresenceHeader 
        title="Super Admin"
        roleLabel="Financial Intelligence · Capital Matrix"
        initials={initials}
        icon1Node={<Bell className="w-6 h-6" strokeWidth={1.25} />}
        icon2Node={<ChevronLeft className="w-6 h-6" strokeWidth={1.25} />}
        icon2Href="/admin"
      />
      
      <div className="p-4 flex flex-col gap-4 relative z-20 max-w-5xl mx-auto">
        <RevenueClient 
          totalRevenue={totalRevenue} 
          mrr={mrr} 
          transactions={mappedTransactions} 
        />
      </div>
    </PresenceWrapper>
  );
}
