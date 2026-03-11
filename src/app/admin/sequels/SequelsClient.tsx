'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { toast } from 'sonner';
import { createSequelAction, updateSequelAction, deleteSequelAction } from './actions';
import { Settings, Pen, Trash2, Layers, Search, Image as ImageIcon, X } from 'lucide-react';

interface Sequel {
  id: string;
  title: string;
  description: string | null;
  banner_image: string | null;
  status: string;
  article_count: number;
}

export default function SequelsClient({ initialSequels }: { initialSequels: Sequel[] }) {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  const filteredSequels = initialSequels.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const openCreate = () => {
    setTitle('');
    setDescription('');
    setBannerUrl('');
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (s: Sequel) => {
    setTitle(s.title);
    setDescription(s.description || '');
    setBannerUrl(s.banner_image || '');
    setEditingId(s.id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!title) return toast.error('Title is required');
    
    startTransition(async () => {
      let res;
      if (editingId) {
        res = await updateSequelAction(editingId, { title, description, bannerUrl });
      } else {
        res = await createSequelAction({ title, description, bannerUrl });
      }

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(editingId ? 'Sequel updated' : 'Sequel created');
        setShowModal(false);
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the sequel "${name}"?`)) return;
    startTransition(async () => {
      const res = await deleteSequelAction(id);
      if (res?.error) toast.error(res.error);
      else toast.success('Sequel deleted');
    });
  };

  return (
    <div className="space-y-6">
      
      {/* ── Toolbar ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-[var(--color-surface)] p-4 rounded-3xl border border-[var(--color-border)]">
        <div className="relative flex-1 max-w-md">
           <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
           <Input 
             placeholder="Search sequels..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="pl-10 h-11 w-full bg-black/20"
           />
        </div>
        <Button onClick={openCreate} className="h-11 rounded-xl px-6 font-bold shadow-md shrink-0 bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary)]/90">
           Create New Sequel
        </Button>
      </div>

      {/* ── Grid ──────────────────────────────────────────────────── */}
      {filteredSequels.length === 0 ? (
        <Card className="py-24 text-center border-dashed border-[var(--color-border)] rounded-[2rem] shadow-none bg-[var(--color-surface)]">
          <Layers className="w-12 h-12 mx-auto mb-4 opacity-20 text-[var(--color-muted)]" />
          <h3 className="font-bold text-lg text-white">No sequels found</h3>
          <p className="text-sm text-[var(--color-muted)] mt-1">Create your first sequel to group articles together.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSequels.map(s => (
             <Card key={s.id} className="overflow-hidden border border-[var(--color-border)] rounded-3xl bg-[var(--color-surface)] group shadow-none hover:border-[var(--color-primary)]/40 transition-all duration-300">
                {/* Visual Header */}
                <div className="h-32 bg-black/30 relative flex items-center justify-center overflow-hidden border-b border-[var(--color-border)]">
                   {s.banner_image ? (
                     <img src={s.banner_image} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   ) : (
                     <ImageIcon className="w-8 h-8 opacity-20 text-[var(--color-muted)]" />
                   )}
                   <div className="absolute top-2 right-2">
                     <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider backdrop-blur-md border ${
                       s.status === 'published' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-black/40 text-[var(--color-muted)] border-white/10'
                     }`}>
                        {s.status}
                     </span>
                   </div>
                </div>

                <CardContent className="p-5 flex flex-col justify-between" style={{ minHeight: '140px' }}>
                   <div>
                     <h3 className="text-lg font-bold text-white leading-tight tracking-tight mb-1.5 truncate" title={s.title}>{s.title}</h3>
                     <p className="text-sm text-[var(--color-muted)] line-clamp-2 leading-relaxed h-10">
                        {s.description || 'No description provided.'}
                     </p>
                   </div>
                   
                   <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
                     <Button variant="outline" size="sm" asChild className="flex-1 h-9 rounded-xl border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-400">
                        <Link href={`/admin/sequels/${s.id}/edit`}>
                           <Layers className="w-3.5 h-3.5 mr-1.5" /> 
                           {s.article_count} Article{s.article_count !== 1 ? 's' : ''}
                        </Link>
                     </Button>
                     <Button variant="outline" size="sm" className="h-9 px-3 rounded-xl border-blue-500/30 text-blue-400 bg-blue-500/5 hover:bg-blue-500/10" onClick={() => openEdit(s)}>
                        <Pen className="w-3.5 h-3.5" />
                     </Button>
                     <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-red-500/30 text-red-500 bg-red-500/5 hover:bg-red-500/10 shrink-0" onClick={() => handleDelete(s.id, s.title)} loading={isPending}>
                        <Trash2 className="w-3.5 h-3.5" />
                     </Button>
                   </div>
                </CardContent>
             </Card>
          ))}
        </div>
      )}

      {/* ── Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <Card className="w-full max-w-lg bg-[#181623] border-[var(--color-border)] shadow-2xl rounded-3xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                 <h2 className="text-xl font-black text-white">{editingId ? 'Edit Sequel' : 'Create New Sequel'}</h2>
                 <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 text-[var(--color-muted)] hover:text-white" onClick={() => setShowModal(false)}>
                    <X className="w-4 h-4" />
                 </Button>
              </div>
              <CardContent className="p-6 space-y-4">
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Sequel Title</label>
                   <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chronicles of Reality" className="bg-black/20" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Description</label>
                   <textarea 
                     value={description} onChange={e => setDescription(e.target.value)} 
                     placeholder="Brief overview of this sequel collection..." 
                     className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)] transition-shadow text-white bg-black/20 placeholder-white/20 resize-y"
                     rows={3}
                   />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Cover Image URL</label>
                   <Input value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="https://..." className="bg-black/20" />
                   <p className="text-[10px] text-[var(--color-muted)]">Upload an image in the Media Library to get a public URL.</p>
                 </div>
                 <Button onClick={handleSave} className="w-full h-12 rounded-xl text-black font-bold mt-4" loading={isPending}>
                   {editingId ? 'Save Changes' : 'Create Sequel'}
                 </Button>
              </CardContent>
           </Card>
        </div>
      )}

    </div>
  );
}
