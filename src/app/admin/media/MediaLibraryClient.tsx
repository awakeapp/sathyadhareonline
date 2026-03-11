'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Search, UploadCloud, Copy, Trash2, CheckCircle2, Image as ImageIcon, ChevronDown, Wand2 } from 'lucide-react';
import { 
  PresenceCard, 
  PresenceButton 
} from '@/components/PresenceUI';

interface MediaItem {
  id: string;
  url: string;
  uploaded_by: string | null;
  created_at: string;
}

interface Props {
  initialItems: MediaItem[];
  userId: string;
}

const PAGE_SIZE = 24;

export default function MediaLibraryClient({ initialItems, userId }: Props) {
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const BUCKET_NAME = 'media';

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (!searchQuery) return true;
      const fileName = item.url.split('/').pop() || '';
      return fileName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [items, searchQuery]);

  const visibleItems = filteredItems.slice(0, page * PAGE_SIZE);
  const hasMore = visibleItems.length < filteredItems.length;

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      setUploadProgress(0);

      const newItems: MediaItem[] = [];
      let errCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) {
          toast.error(`"${file.name}" is not an image.`);
          errCount++;
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          toast.error(`"${file.name}" exceeds 10MB.`);
          errCount++;
          continue;
        }

        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: storageErr } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (storageErr) {
            toast.error(`Upload error: ${storageErr.message}`);
            errCount++;
            continue;
        } else {
           const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;
           const { data: row, error: dbErr } = await supabase
               .from('media')
               .insert({ url: publicUrl, uploaded_by: userId })
               .select('id, url, uploaded_by, created_at')
               .single();

           if (dbErr) toast.error(`DB Record Error: ${dbErr.message}`);
           else if (row) newItems.push(row);
        }
        
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      setItems((prev) => [...newItems, ...prev]);
      setUploading(false);
      setUploadProgress(0);
      
      if (errCount === 0 && files.length > 0) {
        toast.success(`Successfully uploaded ${files.length} asset(s)`);
      }
    },
    [supabase, userId, SUPABASE_URL]
  );

  const handleCopy = async (item: MediaItem) => {
    await navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    toast.success('Asset URL copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm('Permanent deletion? This cannot be undone.')) return;
    setDeletingId(item.id);

    const { error: dbErr } = await supabase
      .from('media')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', item.id);

    if (dbErr) {
      toast.error(`Delete failed: ${dbErr.message}`);
    } else {
      toast.success('Asset removed');
      setItems((prev) => prev.filter((m) => m.id !== item.id));
    }
    setDeletingId(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const getFileName = (url: string) => url.split('/').pop() || 'Untitled Asset';

  return (
    <div className="flex flex-col gap-4">
       
      {/* ── Search & Filter ── */}
      <PresenceCard className="bg-zinc-50 dark:bg-white/5 border-none">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" strokeWidth={1.25} />
          <input 
            placeholder="Search cloud assets..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white dark:bg-zinc-950 border-none shadow-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-sm"
          />
        </div>
      </PresenceCard>

      {/* ── Drag & Drop Upload ── */}
      <div
        className={`relative border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all duration-300 cursor-pointer group bg-white dark:bg-zinc-950
          ${dragOver
            ? 'border-zinc-900 dark:border-white bg-indigo-50/50 dark:bg-indigo-500/10 scale-[1.01]'
            : 'border-indigo-100 dark:border-white/5 hover:border-indigo-300'
          }
          ${uploading ? 'pointer-events-none opacity-80' : ''}`}
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />

        {uploading ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
               <div className="w-20 h-20 rounded-full border-4 border-indigo-100 border-t-[#5c4ae4] animate-spin" />
               <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-zinc-900 dark:text-zinc-50">{uploadProgress}%</div>
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Synchronising Assets...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-xl shadow-indigo-500/10
              ${dragOver ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-white scale-110 rotate-6' : 'bg-indigo-50 dark:bg-indigo-500/10 text-zinc-900 dark:text-zinc-50 group-hover:scale-105 group-hover:-rotate-3'}`}>
               <UploadCloud className="w-10 h-10" />
            </div>
            <div>
              <p className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                {dragOver ? 'Release to Upload' : 'Deploy Assets to Cloud'}
              </p>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-2">Maximum resolution supported · 10MB Limit</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Assets Display ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                {filteredItems.length} Identified Assets
              </p>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase">Live connection</span>
           </div>
        </div>

        {filteredItems.length === 0 ? (
          <PresenceCard className="py-24 text-center border-dashed border-2 border-indigo-100 flex flex-col items-center">
            <ImageIcon className="w-16 h-16 mb-5 text-indigo-100" />
            <p className="font-black text-xl text-zinc-500 uppercase tracking-widest">Vault is Empty</p>
          </PresenceCard>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {visibleItems.map((item) => {
                const isCopied = copiedId === item.id;
                const fileName = getFileName(item.url);

                return (
                  <PresenceCard
                    key={item.id}
                    noPadding
                    className={`group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 active:scale-[0.98]
                      ${deletingId === item.id ? 'opacity-40 grayscale' : ''}`}
                  >
                    <div className="aspect-square relative overflow-hidden bg-zinc-50 dark:bg-white/5">
                       <img src={item.url} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                       
                       <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                          <div className="flex gap-2">
                             <button onClick={() => handleCopy(item)} className={`flex-1 h-9 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all shadow-lg ${isCopied ? 'bg-emerald-500 text-white' : 'bg-white text-black hover:bg-indigo-50'}`}>
                                {isCopied ? <CheckCircle2 className="w-4 h-4" strokeWidth={1.25} /> : <Copy className="w-4 h-4" strokeWidth={1.25} />}
                                {isCopied ? 'Copied' : 'Link'}
                             </button>
                             <button onClick={() => handleDelete(item)} className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 shadow-lg">
                                <Trash2 className="w-4 h-4" strokeWidth={1.25} />
                             </button>
                          </div>
                       </div>
                    </div>
                    <div className="p-3">
                       <p className="text-[11px] font-black text-zinc-900 dark:text-zinc-50 truncate" title={fileName}>{fileName}</p>
                       <div className="flex items-center justify-between mt-1">
                          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">
                             {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </p>
                          <Wand2 className="w-3 h-3 text-indigo-200" strokeWidth={1.25} />
                       </div>
                    </div>
                  </PresenceCard>
                );
              })}
            </div>

            {hasMore && (
              <div className="pt-8 text-center">
                <Button variant="outline" onClick={() => setPage(p => p + 1)} className="rounded-2xl h-12 px-8 border-indigo-100 dark:border-white/5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-50 hover:bg-indigo-50 transition-all font-black uppercase tracking-widest text-[10px]">
                  <ChevronDown className="w-4 h-4 mr-2" strokeWidth={1.25} /> Decrypt more assets
                </Button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
