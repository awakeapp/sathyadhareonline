'use client';

import { useState, useRef } from 'react';
import { Plus, X, Trash2, Link as LinkIcon, Image as ImageIcon, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { createBook, updateBook, deleteBook, toggleBook } from './actions';

interface Book {
  id: string;
  title: string;
  author_name: string | null;
  cover_image: string;
  drive_link: string;
  is_active: boolean;
  created_at: string;
}

interface Props { initialBooks: Book[]; }

const emptyForm = { title: '', author_name: '', cover_image: '', drive_link: '', is_active: true };

export default function BooksClient({ initialBooks }: Props) {
  const [books, setBooks] = useState<Book[]>(initialBooks);
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

  function openEdit(b: Book) {
    setEditId(b.id);
    setForm({
      title: b.title,
      author_name: b.author_name || '',
      cover_image: b.cover_image,
      drive_link: b.drive_link,
      is_active: b.is_active,
    });
    setShowForm(true);
  }

  /* Upload book cover */
  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `books/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('article-images')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) { toast.error('Upload failed: ' + uploadErr.message); return; }
      const { data: urlData } = supabase.storage.from('article-images').getPublicUrl(path);
      setForm(f => ({ ...f, cover_image: urlData.publicUrl }));
      toast.success('Cover uploaded!');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cover_image.trim()) { toast.error('Please upload a book cover'); return; }
    if (!form.title.trim()) { toast.error('Please enter a book title'); return; }
    if (!form.drive_link.trim()) { toast.error('Please enter the Drive Link'); return; }

    setLoading(true);
    try {
      const result = editId
        ? await updateBook(editId, form)
        : await createBook(form);
      if (result.error) { toast.error(result.error); return; }
      toast.success(editId ? 'Book updated!' : 'Book added!');
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    const result = await deleteBook(id);
    if (result.error) toast.error(result.error);
    else { toast.success('Deleted'); setBooks(b => b.filter(x => x.id !== id)); }
    setDeleteId(null);
    setLoading(false);
  }

  async function handleToggle(b: Book) {
    const result = await toggleBook(b.id, !b.is_active);
    if (result.error) toast.error(result.error);
    else setBooks(prev => prev.map(x => x.id === b.id ? { ...x, is_active: !x.is_active } : x));
  }

  const inputClass = 'w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl px-4 py-3.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:border-[#685de6]/60 focus:ring-2 focus:ring-[#685de6]/10 transition-colors';

  return (
    <div className="min-h-screen pb-40">

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
            className="bg-[var(--color-surface)] w-full max-w-[500px] max-h-[90vh] overflow-y-auto rounded-t-[2rem] shadow-2xl"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 50px)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] sticky top-0 z-10">
              <h3 className="text-[17px] font-black text-[var(--color-text)] tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#685de6]" />
                {editId ? 'Edit Book' : 'New Book'}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-9 h-9 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-[var(--color-muted)] active:scale-90 transition-all"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-6">

              {/* Cover Image Picker (2:3 aspect ratio) */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)] block mb-2">
                  Book Cover Image *
                </label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-40 relative group overflow-hidden rounded-2xl bg-[var(--color-surface-2)] border-2 border-dashed border-[var(--color-border)] hover:border-[#685de6]/50 transition-all active:scale-[0.98] disabled:opacity-60 mx-auto"
                  style={{ aspectRatio: '2/3' }}
                >
                  {form.cover_image ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.cover_image}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 bg-white/90 backdrop-blur-sm text-gray-900 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg">
                          <ImageIcon size={12} />
                          Change
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 w-full h-full">
                      {uploading ? (
                        <div className="w-8 h-8 border-2 border-[#685de6] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-[#685de6]/10 flex items-center justify-center text-[#685de6]">
                          <ImageIcon size={20} strokeWidth={1.5} />
                        </div>
                      )}
                      <p className="text-xs font-bold text-[var(--color-text)] text-center leading-tight">
                        {uploading ? 'Uploading…' : 'Tap to add cover'}
                      </p>
                    </div>
                  )}
                </button>
              </div>

              {/* Title Input */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)] block mb-2">
                  Book Title *
                </label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. My Awesome Book"
                  className={inputClass}
                />
              </div>

              {/* Author Input */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)] block mb-2">
                  Author Name <span className="normal-case font-medium opacity-60">(optional)</span>
                </label>
                <input
                  value={form.author_name}
                  onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))}
                  placeholder="e.g. John Doe"
                  className={inputClass}
                />
              </div>

              {/* Drive Link URL */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)] block mb-2">
                  Google Drive / PDF Link *
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                  <input
                    required
                    type="url"
                    value={form.drive_link}
                    onChange={e => setForm(f => ({ ...f, drive_link: e.target.value }))}
                    placeholder="https://drive.google.com/..."
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
                className="w-full py-4 rounded-2xl bg-[#685de6] text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-[#685de6]/25 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                  : editId ? 'Save Changes' : '+ Add Book'
                }
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-[var(--color-surface)] rounded-[2rem] p-6 w-full max-w-[340px] shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-5">
              <Trash2 size={24} />
            </div>
            <h4 className="text-lg font-black text-[var(--color-text)] mb-2 text-center">Remove Book?</h4>
            <p className="text-sm text-[var(--color-muted)] mb-8 text-center px-4 leading-relaxed">This will permanently remove it from your reader&apos;s library.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3.5 rounded-2xl border border-[var(--color-border)] text-sm font-bold text-[var(--color-text)] active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId!)}
                disabled={loading}
                className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white text-sm font-black active:scale-95 transition-all disabled:opacity-60"
              >
                {loading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ── */}
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-xl font-black text-[var(--color-text)] tracking-tight">PDF Library</h1>
          <p className="text-[11px] text-[var(--color-muted)] font-semibold uppercase tracking-widest mt-0.5">
            {books.length} book{books.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 h-10 px-4 rounded-2xl bg-[#685de6] text-white text-sm font-black shadow-md shadow-[#685de6]/25 active:scale-95 transition-all"
        >
          <Plus size={16} strokeWidth={2.5} />
          Add Book
        </button>
      </div>

      {/* ── Book list ── */}
      <div className="px-4 py-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {books.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-[2rem] bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center mb-5 text-[var(--color-muted)]">
              <BookOpen size={32} strokeWidth={1.25} />
            </div>
            <h2 className="text-lg font-black text-[var(--color-text)] mb-2">No Books Yet</h2>
            <p className="text-sm text-[var(--color-muted)] mb-6 max-w-[240px] leading-relaxed">
              Add your first PDF book. Readers will see it horizontally scrolling on the home page.
            </p>
            <button
              onClick={openNew}
              className="flex items-center gap-2 h-11 px-6 rounded-2xl bg-[#685de6] text-white text-sm font-black shadow-lg shadow-[#685de6]/20 active:scale-95 transition-all"
            >
              <Plus size={16} strokeWidth={2.5} />
              Add First Book
            </button>
          </div>
        ) : (
          books.map(b => (
            <div
              key={b.id}
              className="group flex flex-col rounded-[2rem] bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden shadow-sm"
            >
              {/* Cover thumbnail */}
              <div className="relative w-full aspect-[2/3] bg-[var(--color-surface-2)] shrink-0">
                {b.cover_image
                  ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.cover_image}
                    alt={b.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[var(--color-muted)]">
                    <BookOpen size={24} strokeWidth={1} />
                  </div>
                )}
                {/* Status pill overlaid */}
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-sm ${b.is_active ? 'bg-green-500/90 text-white shadow-sm' : 'bg-black/50 text-white/70'}`}>
                    {b.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
              </div>

              {/* Info + Actions */}
              <div className="flex-1 flex flex-col p-4">
                <h4 className="text-sm font-bold text-[var(--color-text)] leading-tight line-clamp-2 mb-1">
                  {b.title}
                </h4>
                {b.author_name && (
                  <p className="text-[11px] text-[var(--color-muted)] truncate mb-2">{b.author_name}</p>
                )}
                
                <div className="mt-auto grid grid-cols-3 gap-1.5 pt-3 border-t border-[var(--color-border)]">
                  <button
                    onClick={() => handleToggle(b)}
                    className="flex flex-col items-center justify-center py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:-translate-y-0.5"
                    style={b.is_active
                      ? { background: 'rgba(34,197,94,0.1)', color: 'rgb(34,197,94)' }
                      : { background: 'var(--color-surface-2)', color: 'var(--color-muted)' }
                    }
                  >
                    On/Off
                  </button>
                  <button
                    onClick={() => openEdit(b)}
                    className="flex flex-col items-center justify-center py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-[var(--color-surface-2)] text-[var(--color-text)] transition-all hover:-translate-y-0.5 hover:text-[#685de6]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(b.id)}
                    className="flex flex-col items-center justify-center py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 transition-all hover:-translate-y-0.5 hover:bg-red-500/20"
                  >
                    Del
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
