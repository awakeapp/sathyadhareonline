'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { createSequelAction, updateSequelAction, deleteSequelAction } from './actions';
import { Settings, Pen, Trash2, Layers, Search, Image as ImageIcon, X, Box } from 'lucide-react';
import { 
  PresenceCard, 
  PresenceButton 
} from '@/components/PresenceUI';

interface Sequel {
  id: string;
  title: string;
  description: string | null;
  banner_image: string | null;
  category_id: string | null;
  status: string;
  article_count: number;
}

interface Props {
  initialSequels: Sequel[];
  categories: { id: string; name: string }[];
}

export default function SequelsClient({ initialSequels, categories }: Props) {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const filteredSequels = initialSequels.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const openCreate = () => {
    setTitle('');
    setDescription('');
    setBannerUrl('');
    setCategoryId('');
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (s: Sequel) => {
    setTitle(s.title);
    setDescription(s.description || '');
    setBannerUrl(s.banner_image || '');
    setCategoryId(s.category_id || '');
    setEditingId(s.id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!title) return toast.error('Check Title');
    
    startTransition(async () => {
      let res;
      if (editingId) {
        res = await updateSequelAction(editingId, { title, description, bannerUrl, categoryId: categoryId || undefined });
      } else {
        res = await createSequelAction({ title, description, bannerUrl, categoryId: categoryId || undefined });
      }

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Matrix Modified');
        setShowModal(false);
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Wipe "${name}"?`)) return;
    startTransition(async () => {
      const res = await deleteSequelAction(id);
      if (res?.error) toast.error(res.error);
      else toast.success('Removed');
    });
  };

  return (
    <div className="flex flex-col gap-4">
      
      {/* ── Filter Bar ── */}
      <PresenceCard className="bg-zinc-50 dark:bg-white/5 border-none p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" strokeWidth={1.25} />
            <input 
               placeholder="Search registry..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white dark:bg-zinc-950 border-none shadow-sm focus:ring-2 focus:ring-indigo-500/20 font-bold text-sm"
            />
          </div>
        </div>
      </PresenceCard>

      {/* ── Grid Matrix ── */}
      {filteredSequels.length === 0 ? (
        <PresenceCard className="py-24 text-center border-dashed border-2 border-indigo-100 flex flex-col items-center">
          <Layers className="w-16 h-16 mb-5 text-indigo-100" />
          <p className="font-black text-xl text-zinc-500 uppercase tracking-widest">No Sequences</p>
        </PresenceCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSequels.map(s => (
             <PresenceCard key={s.id} noPadding className="group overflow-hidden">
                <div className="h-40 bg-zinc-50 dark:bg-white/5 relative flex items-center justify-center overflow-hidden">
                   {s.banner_image ? (
                     <img src={s.banner_image} alt={s.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                   ) : (
                     <ImageIcon className="w-10 h-10 opacity-20 text-indigo-300" />
                   )}
                   <div className="absolute top-4 right-4">
                     <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-md border ${
                       s.status === 'published' ? 'bg-emerald-500/80 text-white border-white/20' : 'bg-black/60 text-white/60 border-white/10'
                     }`}>
                        {s.status}
                     </span>
                   </div>
                </div>

                <div className="p-4">
                   <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 mb-2 truncate">{s.title}</h3>
                   <p className="text-xs font-medium text-zinc-500 line-clamp-2 h-10 leading-relaxed italic">
                      {s.description || 'No description provided.'}
                   </p>
                   
                   <div className="flex items-center gap-3 mt-6 pt-6 border-t border-indigo-50 dark:border-white/5">
                     <Link href={`/admin/sequels/${s.id}/edit`} className="flex-1 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                        <Box className="w-4 h-4" strokeWidth={1.25} /> {s.article_count} Units
                     </Link>
                     <button className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-950 text-zinc-500 hover:text-zinc-900 dark:text-zinc-50 shadow-sm flex items-center justify-center" onClick={() => openEdit(s)}>
                        <Pen className="w-5 h-5" strokeWidth={1.25} />
                     </button>
                     <button className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center justify-center" onClick={() => handleDelete(s.id, s.title)}>
                        <Trash2 className="w-5 h-5" strokeWidth={1.25} />
                     </button>
                   </div>
                </div>
             </PresenceCard>
          ))}
        </div>
      )}

      {/* ── MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-lg bg-white dark:bg-[#181623] rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-4 border-b border-indigo-50 dark:border-white/5 flex items-center justify-between">
                 <div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">{editingId ? 'Modify Sequence' : 'Create Node'}</h2>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Registry Entry System</p>
                 </div>
                 <button className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-white/5 text-zinc-500 flex items-center justify-center" onClick={() => setShowModal(false)}>
                    <X className="w-5 h-5" strokeWidth={1.25} />
                 </button>
              </div>
              
              <div className="p-4 flex flex-col gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Identification Label</label>
                   <input 
                     value={title} 
                     onChange={e => setTitle(e.target.value)} 
                     placeholder="e.g. Volume I: The Genesis" 
                     className="w-full h-12 px-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-none text-sm font-bold shadow-inner" 
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Narrative Overview</label>
                   <textarea 
                     value={description} onChange={e => setDescription(e.target.value)} 
                     placeholder="Collection summary..." 
                     className="w-full p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-none text-sm font-bold shadow-inner placeholder-gray-300 resize-none h-24"
                   />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Sequel Category</label>
                    <select 
                      value={categoryId} 
                      onChange={e => setCategoryId(e.target.value)} 
                      className="w-full h-12 px-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-none text-sm font-bold shadow-inner"
                    >
                      <option value="">No Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Visual Banner (Asset URL)</label>
                   <input 
                     value={bannerUrl} 
                     onChange={e => setBannerUrl(e.target.value)} 
                     placeholder="https://..." 
                     className="w-full h-12 px-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-none text-sm font-bold shadow-inner" 
                   />
                 </div>
                 
                 <PresenceButton onClick={handleSave} className="w-full h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black tracking-widest text-xs uppercase shadow-xl shadow-indigo-500/20" loading={isPending}>
                    {editingId ? 'Synchronize Data' : 'Initialize Node'}
                 </PresenceButton>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
