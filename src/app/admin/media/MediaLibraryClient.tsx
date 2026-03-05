'use client';

import { useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

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

export default function MediaLibraryClient({ initialItems, userId }: Props) {
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  // ── Upload ─────────────────────────────────────────────────────
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError(null);
      setUploading(true);
      setUploadProgress(0);

      const newItems: MediaItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate type
        if (!file.type.startsWith('image/')) {
          setError(`"${file.name}" is not an image file.`);
          continue;
        }

        // Validate size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError(`"${file.name}" exceeds 5 MB limit.`);
          continue;
        }

        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

        // Upload to Storage
        const { error: storageErr } = await supabase.storage
          .from('article-images')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (storageErr) {
          setError(`Upload failed: ${storageErr.message}`);
          continue;
        }

        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/article-images/${fileName}`;

        // Insert row into media table
        const { data: row, error: dbErr } = await supabase
          .from('media')
          .insert({ url: publicUrl, uploaded_by: userId })
          .select('id, url, uploaded_by, created_at')
          .single();

        if (dbErr) {
          setError(`DB insert failed: ${dbErr.message}`);
          continue;
        }

        if (row) newItems.push(row);
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      setItems((prev) => [...newItems, ...prev]);
      setUploading(false);
      setUploadProgress(0);
    },
    [supabase, userId, SUPABASE_URL]
  );

  // ── Copy URL ────────────────────────────────────────────────────
  const handleCopy = async (item: MediaItem) => {
    await navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Delete ──────────────────────────────────────────────────────
  const handleDelete = async (item: MediaItem) => {
    if (!confirm('Delete this image permanently?')) return;
    setDeletingId(item.id);

    // Extract file name from URL
    const fileName = item.url.split('/').pop();

    if (fileName) {
      await supabase.storage.from('article-images').remove([fileName]);
    }

    await supabase.from('media').delete().eq('id', item.id);

    setItems((prev) => prev.filter((m) => m.id !== item.id));
    setDeletingId(null);
  };

  // ── Drag & Drop ─────────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      {/* ── Error Banner ─────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* ── Upload Zone ───────────────────────────────────────── */}
      <div
        className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-200 cursor-pointer group
          ${dragOver
            ? 'border-blue-500 bg-blue-500/8 scale-[1.01]'
            : 'border-white/10 bg-white/[0.02] hover:border-blue-500/50 hover:bg-blue-500/5'
          }
          ${uploading ? 'pointer-events-none' : ''}`}
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
          <div className="flex flex-col items-center gap-4">
            {/* Spinner */}
            <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
            <p className="text-sm font-semibold text-white">Uploading... {uploadProgress}%</p>
            <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors
              ${dragOver ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/40 group-hover:bg-blue-500/20 group-hover:text-blue-400'}`}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
                {dragOver ? 'Drop images here' : 'Click or drag images to upload'}
              </p>
              <p className="text-xs text-white/30 mt-1">PNG, JPG, GIF, WebP · Max 5 MB each</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Count ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">
          {items.length} {items.length === 1 ? 'image' : 'images'}
        </p>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-4 bg-white/[0.02] border border-white/5 rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-white/60 font-semibold text-sm">No images yet</p>
            <p className="text-white/25 text-xs mt-1">Upload your first image above</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`group relative bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden transition-all duration-200 hover:border-white/20 hover:shadow-lg hover:shadow-black/20
                ${deletingId === item.id ? 'opacity-40 scale-95 pointer-events-none' : ''}`}
            >
              {/* Image Preview */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt="Media"
                className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 gap-2">
                {/* Copy URL */}
                <button
                  onClick={() => handleCopy(item)}
                  title="Copy URL"
                  className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all
                    ${copiedId === item.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/90 text-gray-900 hover:bg-white'}`}
                >
                  {copiedId === item.id ? (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      Copy URL
                    </>
                  )}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(item)}
                  title="Delete image"
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-red-500/90 text-white hover:bg-red-500 transition-colors"
                >
                  {deletingId === item.id ? (
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  )}
                  Delete
                </button>
              </div>

              {/* Upload date badge — bottom left, only on non-hover */}
              <div className="absolute bottom-2 left-2 group-hover:opacity-0 transition-opacity">
                <span className="text-[9px] font-semibold text-white/50 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
                  {new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
