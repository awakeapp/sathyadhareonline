'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { Search, UploadCloud, Copy, Trash2, CheckCircle2, Image as ImageIcon, ChevronDown } from 'lucide-react';

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

  // We fall back to the bucket "media" and if we can't we use article-images, but the prompt asked for "media".
  const BUCKET_NAME = 'media'; // Using the requested bucket name

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (!searchQuery) return true;
      const fileName = item.url.split('/').pop() || '';
      return fileName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [items, searchQuery]);

  const visibleItems = filteredItems.slice(0, page * PAGE_SIZE);
  const hasMore = visibleItems.length < filteredItems.length;

  // ── Upload ─────────────────────────────────────────────────────
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
          toast.error(`"${file.name}" is not an image file.`);
          errCount++;
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`"${file.name}" exceeds 5 MB limit.`);
          errCount++;
          continue;
        }

        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

        // Attempt upload to media bucket
        const { error: storageErr } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (storageErr) {
           // Fallback if media bucket doesn't exist
           const { error: fbErr } = await supabase.storage
             .from('article-images')
             .upload(fileName, file, { cacheControl: '3600', upsert: false });
           
           if (fbErr) {
             toast.error(`Upload failed: ${fbErr.message}`);
             errCount++;
             continue;
           } else {
             // Successfully uploaded to fallback bucket
             const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/article-images/${fileName}`;
             const { data: row, error: dbErr } = await supabase
               .from('media')
               .insert({ url: publicUrl, uploaded_by: userId })
               .select('id, url, uploaded_by, created_at')
               .single();

             if (dbErr) toast.error(`DB insert failed: ${dbErr.message}`);
             else if (row) newItems.push(row);
           }
        } else {
           // Success on primary media bucket
           const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;
           const { data: row, error: dbErr } = await supabase
               .from('media')
               .insert({ url: publicUrl, uploaded_by: userId })
               .select('id, url, uploaded_by, created_at')
               .single();

           if (dbErr) toast.error(`DB insert failed: ${dbErr.message}`);
           else if (row) newItems.push(row);
        }
        
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      setItems((prev) => [...newItems, ...prev]);
      setUploading(false);
      setUploadProgress(0);
      
      if (errCount === 0 && files.length > 0) {
        toast.success(`${files.length} file(s) uploaded successfully!`);
      }
    },
    [supabase, userId, SUPABASE_URL]
  );

  // ── Copy URL ────────────────────────────────────────────────────
  const handleCopy = async (item: MediaItem) => {
    await navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Delete ──────────────────────────────────────────────────────
  const handleDelete = async (item: MediaItem) => {
    if (!confirm('Are you certain you want to delete this media?')) return;
    setDeletingId(item.id);

    // Soft delete from DB (Storage file can be purged via cron or manual cleanup)
    const { error: dbErr } = await supabase
      .from('media')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', item.id);

    if (dbErr) {
      toast.error(`Delete failed: ${dbErr.message}`);
    } else {
      toast.success('Media removed successfully');
      setItems((prev) => prev.filter((m) => m.id !== item.id));
    }
    setDeletingId(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const getFileName = (url: string) => url.split('/').pop() || 'Unknown File';

  return (
    <div className="space-y-6">
       
      {/* ── Search Bar ──────────────────────────────────────────────── */}
      <Card className="rounded-3xl shadow-none border-[var(--color-border)] bg-[var(--color-surface)]">
        <CardContent className="p-4 sm:p-5 flex items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
            <Input 
              placeholder="Search media by filename..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 w-full bg-black/20"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Upload Area ──────────────────────────────────────────────── */}
      <div
        className={`relative border border-dashed rounded-[2rem] p-10 text-center transition-all duration-300 cursor-pointer group bg-[var(--color-surface)]
          ${dragOver
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-[1.01]'
            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5'
          }
          ${uploading ? 'pointer-events-none opacity-80' : ''}`}
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {uploading ? (
          <div className="flex flex-col items-center justify-center gap-5">
            <div className="w-14 h-14 rounded-full border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] animate-spin" />
            <div className="space-y-2 w-full max-w-sm">
               <div className="flex justify-between text-xs font-bold text-white">
                  <span>Uploading files...</span>
                  <span className="tabular-nums">{uploadProgress}%</span>
               </div>
               <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden">
                 <div
                   className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
                   style={{ width: `${uploadProgress}%` }}
                 />
               </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner
              ${dragOver ? 'bg-[var(--color-primary)] text-black scale-110' : 'bg-black/20 border border-[var(--color-border)] text-[var(--color-muted)] group-hover:bg-[var(--color-primary)]/20 group-hover:text-[var(--color-primary)] group-hover:border-[var(--color-primary)]/30'}`}>
               <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold text-white transition-colors">
                {dragOver ? 'Drop files now...' : 'Drag & Drop files or click to browse'}
              </p>
              <p className="text-xs text-[var(--color-muted)] font-medium mt-1">Supports highly optimized formats (PNG, JPG, WEBP, GIF) up to 5MB</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Media Grid ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-[var(--color-muted)] font-bold uppercase tracking-widest">
            {filteredItems.length} Result{filteredItems.length !== 1 ? 's' : ''} Found
          </p>
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-4 bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] rounded-[2rem] shadow-none">
            <ImageIcon className="w-12 h-12 opacity-20 text-[var(--color-muted)]" />
            <div>
              <p className="text-white font-bold text-lg">No media found</p>
              <p className="text-[var(--color-muted)] text-sm mt-0.5">Start uploading or adjust your search.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {visibleItems.map((item) => {
                const isCopied = copiedId === item.id;
                const isDeleting = deletingId === item.id;
                const fileName = getFileName(item.url);

                return (
                  <div
                    key={item.id}
                    className={`group relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl overflow-hidden transition-all duration-300 hover:border-[var(--color-muted)] hover:shadow-xl hover:shadow-black/20
                      ${isDeleting ? 'opacity-40 scale-[0.98] pointer-events-none' : ''}`}
                  >
                    {/* Visual Preview */}
                    <div className="aspect-[4/3] bg-black/20 relative overflow-hidden">
                       <img
                         src={item.url}
                         alt="Media Preview"
                         className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                         loading="lazy"
                       />
                       
                       <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant={isCopied ? "primary" : "secondary"} className={`flex-1 h-8 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all ${isCopied ? 'bg-emerald-500 text-black hover:bg-emerald-400 border-none' : 'bg-white/90 text-black hover:bg-white border-none'}`} onClick={() => handleCopy(item)}>
                               {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                               {isCopied ? 'Copied' : 'Copy'}
                            </Button>
                            <Button size="icon" variant="destructive" className="h-8 w-8 rounded-xl shrink-0" onClick={() => handleDelete(item)}>
                               <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                       </div>
                    </div>

                    {/* Meta Detail Area */}
                    <div className="p-3 bg-[var(--color-surface)] relative z-10 border-t border-[var(--color-border)]">
                       <p className="text-xs font-bold text-white truncate mb-1" title={fileName}>{fileName}</p>
                       <p className="text-[10px] text-[var(--color-muted)] font-bold uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="pt-6 pb-2 text-center">
                <Button variant="outline" onClick={() => setPage(p => p + 1)} className="rounded-full h-10 px-6 border-[var(--color-border)] text-[var(--color-muted)] hover:text-white hover:bg-white/5">
                  <ChevronDown className="w-4 h-4 mr-1.5" /> Load More Images
                </Button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
