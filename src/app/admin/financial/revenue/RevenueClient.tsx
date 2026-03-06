'use client';

import { useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download, RefreshCcw, TrendingUp, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { refundTransactionAction, exportTransactionsCSV } from './actions';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  created_at: string;
  userEmail: string;
  planName: string;
}

interface RevenueClientProps {
  totalRevenue: number;
  mrr: number; // Monthly recurring revenue essentially active subs
  transactions: Transaction[];
}

export default function RevenueClient({ totalRevenue, mrr, transactions }: RevenueClientProps) {
  const [isExporting, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      const res = await exportTransactionsCSV();
      if (res?.error) {
        toast.error(`Export failed: ${res.error}`);
        return;
      }
      if (res?.csv && res?.filename) {
        const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', res.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Transactions exported safely.');
      }
    });
  };

  const handleRefund = async (id: string, amount: number) => {
    if (!confirm(`Are you sure you want to refund ₹${amount} back to the user's card?`)) return;
    
    const formData = new FormData();
    formData.append('id', id);
    const res = await refundTransactionAction(formData);

    if (res?.error) {
      toast.error(`Refund failed natively: ${res.error}`);
    } else {
      toast.success(`Refund initiated successfully for transaction.`);
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div>
           <h2 className="text-xl font-bold">Revenue Reports</h2>
           <p className="text-sm text-[var(--color-muted)] mt-1">Super Admin dashboard for tracking platform monetization natively.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} className="rounded-full font-bold">
              <Download className="w-4 h-4 mr-2" /> Export CSV Log
           </Button>
        </div>
      </div>

      {/* ── Metric Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-[2rem] border-transparent bg-gradient-to-br from-indigo-500/20 to-indigo-600/5 shadow-none border border-indigo-500/20 relative overflow-hidden">
           <div className="absolute right-0 top-0 p-6 opacity-10">
              <TrendingUp className="w-24 h-24 text-indigo-500" />
           </div>
           <CardContent className="p-8 pb-10">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
                 <DollarSign className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-1">Lifetime Revenue</p>
              <h3 className="text-4xl font-black text-white">₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
           </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-transparent bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 shadow-none border border-emerald-500/20 relative overflow-hidden">
           <div className="absolute right-0 top-0 p-6 opacity-10">
              <Activity className="w-24 h-24 text-emerald-500" />
           </div>
           <CardContent className="p-8 pb-10">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                 <RefreshCcw className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-1">Monthly Recurring (MRR)</p>
              <h3 className="text-4xl font-black text-white">₹{mrr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
           </CardContent>
        </Card>
      </div>

      {/* ── Transaction History ─────────────────────────────────── */}
      <Card className="rounded-[2rem] border-[var(--color-border)] bg-[var(--color-surface)] shadow-none mt-8">
        <CardContent className="p-0">
          <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-black/10">
             <h3 className="text-base font-bold uppercase tracking-widest">Recent Transactions</h3>
          </div>
          {transactions.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center opacity-50">
               <AlertCircle className="w-12 h-12 mb-4" />
               <p className="font-bold tracking-tight text-lg">No payments detected</p>
               <p className="text-sm mt-1">Transaction logs will populate here natively.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-white/[0.02] text-[10px] uppercase tracking-widest text-[var(--color-muted)]">
                    <th className="px-6 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold">User</th>
                    <th className="px-6 py-4 font-bold">Plan Type</th>
                    <th className="px-6 py-4 font-bold text-right">Amount</th>
                    <th className="px-6 py-4 font-bold text-center">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]/50 text-[13px]">
                  {transactions.map(t => (
                    <tr key={t.id} className={`hover:bg-white/5 transition-colors ${t.type === 'refund' ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-[var(--color-muted)]">
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-semibold">{t.userEmail}</td>
                      <td className="px-6 py-4">
                        <span className="bg-white/10 px-2 py-1 rounded-md text-xs font-bold text-white/80 border border-white/10">
                          {t.planName}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-black font-mono text-right ${t.type === 'refund' ? 'text-rose-500' : 'text-emerald-400'}`}>
                        {t.type === 'refund' ? '-' : '+'}₹{(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-black tracking-widest ${
                          t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          t.status === 'refunded' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {t.status === 'completed' && t.type === 'payment' && (
                           <Button onClick={() => handleRefund(t.id, t.amount)} variant="outline" size="sm" className="h-8 rounded-lg text-[10px] text-rose-400 border-rose-500/20 hover:bg-rose-500/10 uppercase tracking-widest font-black">
                             Issue Refund
                           </Button>
                        )}
                        {t.status === 'refunded' && (
                           <span className="text-[10px] uppercase font-bold text-[var(--color-muted)]">Refunded</span>
                        )}
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
