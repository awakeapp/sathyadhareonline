'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2, Edit3, Settings, Check, Box, X, ShieldCheck } from 'lucide-react';
import { savePlanAction, deletePlanAction } from './actions';
import { toast } from 'sonner';
import { 
  PresenceCard, 
  PresenceButton 
} from '@/components/PresenceUI';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  is_active: boolean;
}

export default function PlansClient({ initialPlans }: { initialPlans: Plan[] }) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const handleEdit = (plan: Plan | null) => {
    setEditingPlan(plan);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await savePlanAction(formData);

    if (res.error) {
      toast.error(`Protocol Error: ${res.error}`);
    } else {
      toast.success('Matrix Sync Successful');
      setIsEditing(false);
      window.location.reload();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Authorize Permanent Deletion of this Tier?')) return;
    const formData = new FormData();
    formData.append('id', id);
    const res = await deletePlanAction(formData);

    if (res.error) {
      toast.error(`Atomic Rejection: ${res.error}`);
    } else {
      toast.success('Tier Purged');
      setPlans(plans.filter(p => p.id !== id));
    }
  };

  return (
    <div className="flex flex-col gap-4">

      {/* ── Tier Control Bar ── */}
      <PresenceCard className="bg-[#f0f2ff] dark:bg-indigo-500/5 border-none p-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[#5c4ae4]">
                <ShieldCheck className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-black text-[#1b1929] dark:text-white uppercase tracking-tight">Access Tiers</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Capital Structuring & Permissioning</p>
             </div>
          </div>
          <PresenceButton onClick={() => handleEdit(null)} className="h-14 px-8 bg-[#5c4ae4] font-black tracking-widest text-[10px] uppercase shadow-xl shadow-indigo-500/20">
             <Plus className="w-5 h-5 mr-3" /> Initialize New Tier
          </PresenceButton>
        </div>
      </PresenceCard>

      {/* ── Plan Matrix ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map(plan => (
          <PresenceCard key={plan.id} noPadding className={`group relative overflow-hidden flex flex-col h-full border-2 transition-all duration-500 ${!plan.is_active ? 'opacity-40 grayscale blur-[1px]' : 'hover:border-[#5c4ae4]'}`}>
            {!plan.is_active && (
              <div className="absolute inset-0 bg-white/10 dark:bg-black/20 z-10 flex items-center justify-center">
                <span className="bg-rose-500 text-white font-black uppercase tracking-[0.3em] px-8 py-3 rounded-2xl text-[10px] shadow-2xl rotate-[-15deg]">
                  Cold Storage
                </span>
              </div>
            )}
            
            <div className="p-4 pb-0 flex-1">
               <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[#5c4ae4] mb-8 shadow-inner group-hover:scale-110 transition-transform">
                  <Box className="w-7 h-7" />
               </div>
               <h3 className="text-2xl font-black text-[#1b1929] dark:text-white uppercase tracking-tight mb-2">{plan.name}</h3>
               <div className="flex items-baseline gap-2 mb-10">
                  <span className="text-4xl font-black text-[#1b1929] dark:text-white tracking-widest">₹{plan.price}</span>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">/ {plan.interval}</span>
               </div>
               
               <div className="space-y-4 mb-10">
                 {plan.features.map((f, i) => (
                   <div key={i} className="flex items-start gap-4">
                     <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[#5c4ae4] shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                     </div>
                     <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">{f}</p>
                   </div>
                 ))}
               </div>
            </div>

            <div className="p-4 pt-0 mt-auto flex items-center gap-3 relative z-20">
               <button onClick={() => handleEdit(plan)} className="flex-1 h-12 rounded-2xl bg-indigo-50 hover:bg-[#5c4ae4] hover:text-white dark:bg-indigo-500/10 text-[#5c4ae4] font-black text-[10px] uppercase tracking-widest transition-all shadow-sm">
                  Modify Node
               </button>
               <button onClick={() => handleDelete(plan.id)} className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
               </button>
            </div>
          </PresenceCard>
        ))}
      </div>

      {/* ── TIER MODAL ── */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1b1929]/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-xl bg-white dark:bg-[#181623] rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
              <form onSubmit={handleSave}>
                 <div className="p-10 border-b border-indigo-50 dark:border-white/5 flex items-center justify-between bg-indigo-50/20">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-[#5c4ae4] flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                          <Settings className="w-6 h-6" />
                       </div>
                       <div>
                          <h2 className="text-2xl font-black text-[#1b1929] dark:text-white uppercase tracking-tight">Protocol Config</h2>
                          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mt-1">Direct Tier-Manipulation Interface</p>
                       </div>
                    </div>
                    <button type="button" onClick={() => setIsEditing(false)} className="w-12 h-12 rounded-full bg-white dark:bg-[#1b1929] text-gray-400 flex items-center justify-center shadow-sm">
                       <X className="w-6 h-6" />
                    </button>
                 </div>
                 
                 <div className="p-10 flex flex-col gap-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-50">
                    <input type="hidden" name="id" value={editingPlan?.id || ''} />
                    
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Identity Label</label>
                          <input name="name" defaultValue={editingPlan?.name || ''} required className="w-full h-14 px-6 rounded-2xl bg-gray-50 dark:bg-[#1b1929] border-none text-sm font-bold shadow-inner" placeholder="e.g. ULTIMATE" />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Temporal Cycle</label>
                          <select name="interval" defaultValue={editingPlan?.interval || 'month'} required className="w-full h-14 px-6 rounded-2xl bg-gray-50 dark:bg-[#1b1929] border-none text-[10px] font-black uppercase tracking-widest shadow-inner accent-[#5c4ae4]">
                             <option value="month">Monthly</option>
                             <option value="year">Annually</option>
                             <option value="one-time">One-Time Deposit</option>
                          </select>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Capital Valuation (₹)</label>
                       <input name="price" type="number" step="0.01" defaultValue={editingPlan?.price || ''} required className="w-full h-14 px-6 rounded-2xl bg-gray-50 dark:bg-[#1b1929] border-none font-mono text-lg font-black shadow-inner text-[#1b1929]" placeholder="0.00" />
                    </div>

                    <div className="space-y-3">
                       <label className="text-[11px] font-black uppercase tracking-widest text-[#5c4ae4]">Privilege Manifest (One per line)</label>
                       <textarea name="features" defaultValue={editingPlan?.features.join('\n') || ''} required rows={5} className="w-full p-6 rounded-[2rem] bg-gray-50 dark:bg-[#1b1929] border-none text-[11px] font-black uppercase tracking-widest leading-relaxed shadow-inner resize-none focus:ring-0" placeholder="e.g. UNLIMITED SEQUEL ACCESS" />
                    </div>

                    <label className="flex items-center gap-4 p-6 bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-100 dark:border-emerald-500/20 rounded-[2rem] cursor-pointer group active:scale-[0.98] transition-all">
                       <div className="relative">
                          <input type="checkbox" name="is_active" value="true" defaultChecked={editingPlan ? editingPlan.is_active : true} className="peer sr-only" />
                          <div className="w-8 h-8 rounded-lg bg-white border-2 border-emerald-100 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                             <Check className="w-5 h-5 text-white opacity-0 peer-checked:opacity-100" />
                          </div>
                       </div>
                       <div>
                          <p className="font-black text-sm text-emerald-600 uppercase tracking-tight">Active Protocol</p>
                          <p className="text-[9px] font-black text-emerald-300 uppercase tracking-widest">Available for client acquisition</p>
                       </div>
                    </label>
                 </div>

                 <div className="p-10 bg-gray-50/50 border-t border-indigo-50 flex justify-end">
                    <PresenceButton type="submit" className="h-16 px-12 bg-[#5c4ae4] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-500/20">
                       Commit Tier Data
                    </PresenceButton>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}
