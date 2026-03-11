'use client';

import { useTransition } from 'react';
import { Download, RefreshCcw, TrendingUp, DollarSign, Activity, AlertCircle, ShieldCheck, ArrowDownCircle } from 'lucide-react';
import { refundTransactionAction, exportTransactionsCSV } from './actions';
import { toast } from 'sonner';
import { 
  PresenceCard, 
  PresenceButton 
} from '@/components/PresenceUI';

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
  mrr: number; 
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
        toast.success('Ledger Exported');
      }
      return;
    });
  };

  const handleRefund = async (id: string, amount: number) => {
    if (!confirm(`Authorize Refund of ₹${amount}?`)) return;
    const formData = new FormData();
    formData.append('id', id);
    const res = await refundTransactionAction(formData);
    if (res?.error) toast.error(`Atomic failure: ${res.error}`);
    else toast.success(`Reversal Successful`);
  };

  return (
    <div className="space-y-6">

      <PresenceCard className="bg-[#f0f2ff] dark:bg-indigo-500/5 border-none p-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[#5c4ae4]">
                <ShieldCheck className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-black text-[#1b1929] dark:text-white uppercase tracking-tight">Financial Registry</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Super Admin Ledger Control</p>
             </div>
          </div>
          <PresenceButton onClick={handleExport} disabled={isExporting} className="bg-white dark:bg-[#1b1929] !text-gray-400 hover:!text-[#5c4ae4] shadow-sm">
             <Download className="w-5 h-5 mr-3" /> Export Transaction Log
          </PresenceButton>
        </div>
      </PresenceCard>

      {/* ── Metric Matrix ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PresenceCard className="relative overflow-hidden group">
           <div className="absolute right-0 top-0 p-8 opacity-5">
              <TrendingUp className="w-32 h-32 text-indigo-500" />
           </div>
           <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[#5c4ae4] mb-8 shadow-inner shadow-indigo-500/5">
                 <DollarSign className="w-6 h-6" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#5c4ae4] mb-3">Lifetime Asset Mass</p>
              <h3 className="text-5xl font-black text-[#1b1929] dark:text-white tabular-nums tracking-tighter">
                ₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </h3>
           </div>
        </PresenceCard>

        <PresenceCard className="relative overflow-hidden group">
           <div className="absolute right-0 top-0 p-8 opacity-5">
              <Activity className="w-32 h-32 text-emerald-500" />
           </div>
           <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-8 shadow-inner shadow-emerald-500/5">
                 <RefreshCcw className="w-6 h-6" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-3">Monthly Recurring Velocity</p>
              <h3 className="text-5xl font-black text-[#1b1929] dark:text-white tabular-nums tracking-tighter">
                ₹{mrr.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </h3>
           </div>
        </PresenceCard>
      </div>

      {/* ── Transaction Stream ── */}
      <PresenceCard noPadding>
        <div className="p-8 border-b border-indigo-50 dark:border-white/5 flex items-center justify-between">
           <div>
              <h3 className="text-sm font-black text-[#1b1929] dark:text-white uppercase tracking-widest">Global Cache</h3>
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1">Natively intercepted payment vectors</p>
           </div>
           <Activity className="w-6 h-6 text-indigo-100" />
        </div>
        
        {transactions.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center">
             <AlertCircle className="w-16 h-16 mb-5 text-indigo-100" />
             <p className="font-black text-xl text-gray-400 uppercase tracking-widest">Registry Null</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-indigo-50 dark:border-white/5 font-black uppercase tracking-widest text-[#5c4ae4]">
                  <th className="px-8 py-5 text-[10px]">Temporal Index</th>
                  <th className="px-8 py-5 text-[10px]">Actor Identity</th>
                  <th className="px-8 py-5 text-[10px]">Manifest</th>
                  <th className="px-8 py-5 text-[10px] text-right">Value</th>
                  <th className="px-8 py-5 text-[10px] text-center">Protocol</th>
                  <th className="px-8 py-5 text-[10px] text-right">Interrupt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50 dark:divide-white/5">
                {transactions.map(t => (
                  <tr key={t.id} className={`group transition-all hover:bg-gray-50/30 dark:hover:bg-white/5 ${t.type === 'refund' ? 'opacity-40 grayscale' : ''}`}>
                    <td className="px-8 py-6 font-black tabular-nums text-gray-400">
                      {new Date(t.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-8 py-6">
                       <div>
                          <p className="font-black text-[#1b1929] dark:text-white">{t.userEmail}</p>
                          <p className="text-[9px] font-black text-indigo-300 uppercase mt-0.5">Citizen-ID: {t.id.slice(0, 8)}</p>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
                        {t.planName}
                      </span>
                    </td>
                    <td className={`px-8 py-6 font-black tabular-nums text-sm text-right ${t.type === 'refund' ? 'text-rose-500 font-bold' : 'text-[#1b1929] dark:text-white'}`}>
                      {t.type === 'refund' ? '−' : '+'}₹{(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        t.status === 'completed' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
                        t.status === 'refunded' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                        'bg-amber-50 text-amber-500 border-amber-100'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {t.status === 'completed' && t.type === 'payment' && (
                         <button onClick={() => handleRefund(t.id, t.amount)} className="h-9 px-5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest shadow-sm">
                           Reverse
                         </button>
                      )}
                      {t.status === 'refunded' && (
                         <ArrowDownCircle className="w-5 h-5 text-rose-300 inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PresenceCard>
      
    </div>
  );
}
