'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/Modal';
import { Plus, Trash2, Edit3, Settings, Check } from 'lucide-react';
import { savePlanAction, deletePlanAction } from './actions';
import { toast } from 'sonner';

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
      toast.error(`Error saving plan: ${res.error}`);
    } else {
      toast.success('Subscription plan saved successfully.');
      setIsEditing(false);
      // Let the page revalidate to fetch new plans
      window.location.reload();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this subscription plan?')) return;
    
    const formData = new FormData();
    formData.append('id', id);
    const res = await deletePlanAction(formData);

    if (res.error) {
      toast.error(`Error deleting plan: ${res.error}`);
    } else {
      toast.success('Subscription plan deleted from the system.');
      setPlans(plans.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-xl font-bold">Manage Subscription Tiers</h2>
           <p className="text-sm text-[var(--color-muted)] mt-1">Configure premium packages granting access to sequels.</p>
        </div>
        <Button onClick={() => handleEdit(null)} className="h-10 px-5 rounded-full font-bold">
           <Plus className="w-5 h-5 mr-1" /> Create Tier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <Card key={plan.id} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-none flex flex-col h-full group relative overflow-hidden transition-colors hover:border-[var(--color-primary)]">
            {!plan.is_active && (
              <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center pointer-events-none">
                <span className="bg-red-500/90 text-white font-black uppercase tracking-widest px-4 py-1 rounded-full text-xs shadow-xl rotate-[15deg]">
                  Inactive
                </span>
              </div>
            )}
            <CardContent className="p-8 flex flex-col h-full flex-1">
               <h3 className="text-xl font-black">{plan.name}</h3>
               <div className="flex items-end gap-1 mt-4 mb-6">
                  <span className="text-3xl font-black">₹{plan.price}</span>
                  <span className="text-[var(--color-muted)] font-medium mb-1.5 uppercase text-xs tracking-widest">/ {plan.interval}</span>
               </div>
               
               <ul className="space-y-3 flex-1 mb-6">
                 {plan.features.map((f, i) => (
                   <li key={i} className="flex items-start text-sm text-[var(--color-muted)] font-medium">
                     <Check className="w-4 h-4 text-[var(--color-primary)] mr-2 shrink-0 mt-0.5" />
                     {f}
                   </li>
                 ))}
               </ul>

               <div className="flex items-center gap-2 pt-6 border-t border-[var(--color-border)] z-20">
                 <Button onClick={() => handleEdit(plan)} variant="secondary" size="sm" className="flex-1 rounded-xl h-10 font-bold bg-white/5 hover:bg-white/10 text-white">
                   <Edit3 className="w-4 h-4 mr-2" /> Edit
                 </Button>
                 <Button onClick={() => handleDelete(plan.id)} variant="outline" size="sm" className="rounded-xl h-10 w-10 p-0 flex items-center justify-center text-rose-500 border-rose-500/20 hover:bg-rose-500/10 hover:border-rose-500/40">
                   <Trash2 className="w-4 h-4" />
                 </Button>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal open={isEditing} onOpenChange={setIsEditing}>
        <ModalContent className="sm:max-w-xl p-0 border-[var(--color-border)] rounded-[2rem] overflow-hidden bg-[var(--color-surface)]">
          <form onSubmit={handleSave} className="flex flex-col h-[70vh] sm:h-auto">
             <ModalHeader className="bg-black/20 p-6 border-b border-[var(--color-border)]">
               <ModalTitle className="text-xl font-black flex items-center gap-2">
                 <Settings className="w-6 h-6 text-[var(--color-primary)]" />
                 {editingPlan ? 'Edit Sub Tier' : 'New Sub Tier'}
               </ModalTitle>
             </ModalHeader>
             
             <div className="p-6 flex-1 overflow-y-auto space-y-6">
               <input type="hidden" name="id" value={editingPlan?.id || ''} />
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Tier Name</label>
                   <Input name="name" defaultValue={editingPlan?.name || ''} required className="bg-black/20 font-bold" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Billing Cycle</label>
                   <select name="interval" defaultValue={editingPlan?.interval || 'month'} required className="w-full flex h-11 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20 focus:bg-white/5 transition-all outline-nonering-0">
                     <option value="month">Monthly</option>
                     <option value="year">Annually</option>
                     <option value="one-time">Lifetime (One-time)</option>
                   </select>
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Price (INR)</label>
                 <Input name="price" type="number" step="0.01" defaultValue={editingPlan?.price || ''} required className="bg-black/20 font-bold font-mono" />
               </div>

               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">Included Features (One per line)</label>
                 <textarea name="features" defaultValue={editingPlan?.features.join('\n') || ''} required rows={4} className="w-full rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-white/20 transition-all resize-none" />
               </div>

               <label className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl cursor-pointer">
                 <input type="checkbox" name="is_active" value="true" defaultChecked={editingPlan ? editingPlan.is_active : true} className="w-5 h-5 rounded accent-emerald-500 border-white/20" />
                 <span className="font-bold text-sm text-emerald-400">Plan is Active & Available</span>
               </label>

             </div>

             <ModalFooter className="p-6 bg-black/20 border-t border-[var(--color-border)] gap-2 flex-wrap">
               <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="rounded-xl px-6 border-[var(--color-border)] bg-transparent w-full sm:w-auto">
                 Cancel
               </Button>
               <Button type="submit" className="rounded-xl px-8 font-bold w-full sm:w-auto">
                 Save Sub Tier
               </Button>
             </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

    </div>
  );
}
