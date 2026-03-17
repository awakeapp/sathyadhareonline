'use client';

import { useState, useRef } from 'react';
import { Plus, X, Pencil, Trash2, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { createBanner, updateBanner, deleteBanner, toggleBanner } from './actions';

interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface Props { initialBanners: Banner[]; }

const emptyForm = { image_url: '', link_url: '', is_active: true };

export default function BannersClient({ initialBanners }: Props) {
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function openNew() {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(b: Banner) {
    setEditId(b.id);
    setForm({ image_url: b.image_url, link_url: b.link_url || '', is_active: b.is_active });
    setShowForm(true);
  }

  /* Upload image to Supabase Storage */
  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `banners/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('article-images')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) { toast.error('Upload failed: ' + uploadErr.message); return; }
      const { data: urlData } = supabase.storage.from('article-images').getPublicUrl(path);
      setForm(f => ({ ...f, image_url: urlData.publicUrl }));
      toast.success('Image uploaded!');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.image_url.trim()) { toast.error('Please upload a banner image first'); return; }
    setLoading(true);
    try {
      const result = editId
        ? await updateBanner(editId, form)
        : await createBanner(form);
      if (result.error) { toast.error(result.error); return; }
      toast.success(editId ? 'Banner updated!' : 'Banner added!');
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    const result = await deleteBanner(id);
    if (result.error) toast.error(result.error);
    else { toast.success('Deleted'); setBanners(b => b.filter(x => x.id !== id)); }
    setDeleteId(null);
    setLoading(false);
  }

  async function handleToggle(b: Banner) {
    const result = await toggleBanner(b.id, !b.is_active);
    if (result.error) toast.error(result.error);
    else setBanners(prev => prev.map(x => x.id === b.id ? { ...x, is_active: !x.is_active } : x));
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const inputClass = 'w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl px-4 py-3.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:border-[#685de6]/60 focus:ring-2 focus:ring-[#685de6]/10 transition-colors';

  return (
    <div>

      {/* ── Hidden file input ── */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImagePick}
      />

      {/* ── Add / Edit form sheet ── */}
      {showForm && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-md"
          onClick={() => setShowForm(false)}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-[var(--color-surface)] w-full max-w-[500px] rounded-t-[2rem] overflow-hidden shadow-2xl"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
              <h3 className="text-[17px] font-black text-[var(--color-text)] tracking-tight">
                {editId ? 'Edit Banner' : 'New Banner'}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-9 h-9 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)] active:scale-90 transition-all"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-5">

              {/* Image picker area */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)] block mb-2">
                  Banner Image *
                </label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full relative group overflow-hidden rounded-2xl bg-[var(--color-surface-2)] border-2 border-dashed border-[var(--color-border)] hover:border-[#685de6]/50 transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ aspectRatio: form.image_url ? '16/9' : undefined, minHeight: form.image_url ? undefined : '120px' }}
                >
                  {form.image_url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.image_url}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 bg-white/90 backdrop-blur-sm text-gray-900 text-[12px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl shadow-lg">
                          <ImageIcon size={14} />
                          Change Image
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 px-4">
                      {uploading ? (
                        <div className="w-8 h-8 border-2 border-[#685de6] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-[#685de6]/10 flex items-center justify-center text-[#685de6]">
                          <ImageIcon size={22} strokeWidth={1.5} />
                        </div>
                      )}
                      <p className="text-sm font-bold text-[var(--color-text)]">
                        {uploading ? 'Uploading…' : 'Tap to choose image'}
                      </p>
                      <p className="text-[11px] text-[var(--color-muted)]">From your device — JPG, PNG, WebP</p>
                    </div>
                  )}
                </button>
              </div>

              {/* Link URL */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)] block mb-2">
                  Link URL <span className="normal-case font-medium opacity-60">(optional)</span>
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                  <input
                    value={form.link_url}
                    onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                    placeholder="https://… or /articles/slug"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              {/* Active toggle */}
              <div
                onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                className="flex items-center justify-between p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] cursor-pointer active:scale-[0.98] transition-all select-none"
              >
                <div>
                  <p className="text-sm font-bold text-[var(--color-text)] leading-none mb-0.5">Show on Home Page</p>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    {form.is_active ? 'Visible to all readers' : 'Hidden from readers'}
                  </p>
                </div>
                {/* Custom green toggle */}
                <div
                  className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${form.is_active ? 'bg-green-500' : 'bg-[var(--color-border)]'}`}
                >
                  <div
                    className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${form.is_active ? 'translate-x-7' : 'translate-x-0.5'}`}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || uploading}
                className="w-full py-4 rounded-2xl bg-[#685de6] text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-[#685de6]/25 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                  : editId ? 'Save Changes' : '+ Add Banner'
                }
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-[var(--color-surface)] rounded-3xl p-6 w-full max-w-[340px] shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 mx-auto mb-4">
              <Trash2 size={20} />
            </div>
            <h4 className="text-base font-black text-[var(--color-text)] mb-1.5 text-center">Delete Banner?</h4>
            <p className="text-sm text-[var(--color-muted)] mb-6 text-center">This will permanently remove it from the site.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 rounded-2xl border border-[var(--color-border)] text-sm font-bold text-[var(--color-text)] active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId!)}
                disabled={loading}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-black active:scale-95 transition-all disabled:opacity-60"
              >
                {loading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-xl font-black text-[var(--color-text)] tracking-tight">Home Banners</h1>
          <p className="text-[11px] text-[var(--color-muted)] font-semibold uppercase tracking-widest mt-0.5">
            {banners.length} banner{banners.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── Banner list ── */}
      <div className="flex flex-col gap-4 max-w-2xl">
        {banners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center mb-5 text-[var(--color-muted)]">
              <ImageIcon size={32} strokeWidth={1.25} />
            </div>
            <h2 className="text-lg font-black text-[var(--color-text)] mb-1">No Banners Yet</h2>
            <p className="text-sm text-[var(--color-muted)] mb-6 max-w-[240px]">
              Add banner images to show on the reader home page. They slide automatically.
            </p>
          </div>
        ) : (
          banners.map(b => (
            <div
              key={b.id}
              className="rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden shadow-sm"
            >
              {/* Banner thumbnail — 16:9 */}
              <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                {b.image_url
                  ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.image_url}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[var(--color-muted)] bg-[var(--color-surface-2)]">
                    <ImageIcon size={32} strokeWidth={1} />
                  </div>
                )}
                {/* Status pill overlaid */}
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-sm ${b.is_active ? 'bg-green-500/90 text-white' : 'bg-black/50 text-white/70'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${b.is_active ? 'bg-white' : 'bg-white/50'}`} />
                    {b.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--color-border)]">
                {b.link_url && (
                  <div className="flex-1 min-w-0 flex items-center gap-1.5 text-[11px] text-[var(--color-muted)] truncate mr-2">
                    <LinkIcon size={10} className="shrink-0" />
                    <span className="truncate">{b.link_url}</span>
                  </div>
                )}
                {!b.link_url && (
                  <span className="flex-1 text-[11px] text-[var(--color-muted)] italic">No link · {formatDate(b.created_at)}</span>
                )}
                {/* Toggle */}
                <button
                  onClick={() => handleToggle(b)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-bold transition-all active:scale-90 border shrink-0"
                  style={b.is_active
                    ? { background: 'rgba(34,197,94,0.08)', color: 'rgb(22,163,74)', borderColor: 'rgba(34,197,94,0.2)' }
                    : { background: 'var(--color-surface-2)', color: 'var(--color-muted)', borderColor: 'var(--color-border)' }
                  }
                >
                  {/* mini toggle pill */}
                  <span className={`relative inline-block w-7 h-4 rounded-full transition-colors ${b.is_active ? 'bg-green-500' : 'bg-[var(--color-border)]'}`}>
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${b.is_active ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                  </span>
                  {b.is_active ? 'On' : 'Off'}
                </button>
                <button
                  onClick={() => openEdit(b)}
                  className="flex items-center gap-1 h-8 px-3 rounded-xl text-[11px] font-bold border border-[var(--color-border)] text-[var(--color-text)] active:scale-90 transition-all shrink-0"
                >
                  <Pencil size={11} />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteId(b.id)}
                  className="flex items-center gap-1 h-8 px-3 rounded-xl text-[11px] font-bold border border-red-500/20 text-red-400 bg-red-500/5 active:scale-90 transition-all shrink-0"
                >
                  <Trash2 size={11} />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
