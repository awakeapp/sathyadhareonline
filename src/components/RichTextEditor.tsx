'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TipTapLink from '@tiptap/extension-link';
import TipTapImage from '@tiptap/extension-image';
import Heading from '@tiptap/extension-heading';
import Youtube from '@tiptap/extension-youtube';
import { useCallback, useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { createClient } from '@/lib/supabase/client';

/* ─── Turndown: HTML → Markdown ─────────────────────────────── */
const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
td.addRule('images', {
  filter: 'img',
  replacement: (_content: string, node: Node) => {
    const el = node as HTMLImageElement;
    const alt = el.alt || '';
    const src = el.getAttribute('src') || '';
    return `![${alt}](${src})`;
  },
});

/* ─── marked: Markdown → HTML ───────────────────────────────── */
marked.setOptions({ gfm: true, breaks: true });

/* ─── Toolbar button ─────────────────────────────────────────── */
function Btn({
  children, onClick, active = false, title, danger = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  title?: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold transition-all select-none
        ${active
          ? 'bg-blue-600 text-white shadow-inner'
          : danger
            ? 'text-red-400 hover:bg-red-500/10'
            : 'text-white/60 hover:bg-white/10 hover:text-white'
        } min-w-[44px] min-h-[44px]`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="w-px h-5 bg-white/10 mx-0.5 inline-block shrink-0" />;
}

/* ─── Media Picker Modal ─────────────────────────────────────── */
function MediaPicker({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const [images, setImages] = useState<{ id: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('media')
      .select('id, url')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setImages(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-[#1a1829] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <h3 className="text-white font-bold text-base">Media Library</h3>
            <p className="text-white/40 text-xs mt-0.5">{images.length} images · click to embed</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors min-w-[44px] min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Grid */}
        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-white/30 text-sm">
              <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Loading…
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-white/30">
              <svg className="w-8 h-8 min-w-[44px] min-h-[44px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">No images in media library</p>
              <p className="text-xs opacity-60">Upload images via Admin → Media</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => { onSelect(img.url); onClose(); }}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/60 transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/20 transition-colors flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg min-w-[44px] min-h-[44px]">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Manual URL fallback */}
        <div className="border-t border-white/8 px-5 py-3 flex gap-2">
          <input
            type="text"
            placeholder="Or paste image URL directly…"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value.trim();
                if (val) { onSelect(val); onClose(); }
              }
            }}
          />
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors"
            onClick={(e) => {
              const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
              const val = input.value.trim();
              if (val) { onSelect(val); onClose(); }
            }}
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Editor ─────────────────────────────────────────────── */
interface Props {
  name: string;
  defaultValue?: string;
}

export default function RichTextEditor({ name, defaultValue = '' }: Props) {
  const [showMedia, setShowMedia] = useState(false);
  const [markdown, setMarkdown] = useState(defaultValue);

  // Convert initial markdown → HTML for TipTap
  const initialHTML = defaultValue
    ? (marked.parse(defaultValue) as string)
    : '';

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false }),
      Heading.configure({ levels: [1, 2, 3] }),
      TipTapLink.configure({ openOnClick: false }),
      TipTapImage.configure({ inline: false, allowBase64: false }),
      Youtube.configure({ inline: false, allowFullscreen: true, HTMLAttributes: { class: 'w-full aspect-video rounded-xl overflow-hidden my-4' } }),
    ],
    content: initialHTML,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: [
          'min-h-[420px] px-5 py-4 outline-none',
          'prose prose-invert max-w-none',
          'prose-headings:font-bold prose-headings:text-white',
          'prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg',
          'prose-p:text-white/80 prose-p:leading-relaxed',
          'prose-strong:text-white prose-em:text-white/80',
          'prose-blockquote:border-l-4 prose-blockquote:border-blue-500/50 prose-blockquote:pl-4 prose-blockquote:text-white/60 prose-blockquote:italic prose-blockquote:not-italic',
          'prose-code:bg-white/10 prose-code:text-blue-300 prose-code:rounded prose-code:px-1',
          'prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl',
          'prose-ul:text-white/80 prose-ol:text-white/80',
          'prose-img:rounded-xl prose-img:max-w-full',
          'prose-a:text-blue-400 prose-a:underline',
        ].join(' '),
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML();
      const md = td.turndown(html);
      setMarkdown(md);
    },
  });

  // Keep markdown in sync if defaultValue changes (e.g., edit page hydration)
  useEffect(() => {
    if (!editor || !defaultValue) return;
    const html = marked.parse(defaultValue) as string;
    if (editor.getHTML() !== html) {
      editor.commands.setContent(html);
      setMarkdown(defaultValue);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  const insertImage = useCallback((url: string) => {
    editor?.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const setLink = useCallback(() => {
    const prev = editor?.getAttributes('link').href ?? '';
    const url = window.prompt('Enter URL', prev);
    if (url === null) return;
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
    }
  }, [editor]);

  const setYoutube = useCallback(() => {
    const url = window.prompt('Enter YouTube URL');
    if (url === null || url === '') return;
    editor?.chain().focus().setYoutubeVideo({ src: url }).run();
  }, [editor]);

  return (
    <>
      {/* Hidden markdown field — submitted with the form */}
      <input type="hidden" name={name} value={markdown} />

      <div className="flex flex-col bg-[#13121f] border border-white/10 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/40 transition-shadow">

        {/* ── Toolbar ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-white/8 bg-white/[0.03]">

          {/* Headings */}
          <Btn active={editor?.isActive('heading', { level: 1 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
            <span className="text-[11px] font-black tracking-tight">H1</span>
          </Btn>
          <Btn active={editor?.isActive('heading', { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
            <span className="text-[11px] font-black tracking-tight">H2</span>
          </Btn>
          <Btn active={editor?.isActive('heading', { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
            <span className="text-[11px] font-black tracking-tight">H3</span>
          </Btn>

          <Sep />

          {/* Inline Formatting */}
          <Btn active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h8a4 4 0 000-8H6v8zm0 0h9a4 4 0 010 8H6v-8z" />
            </svg>
          </Btn>
          <Btn active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.49 3.17c-.38-1.56-2.6-1.47-2.6.38v.19c0 .07.08.1.13.05l9.02-2.33a1.25 1.25 0 01.56 2.44L10 6.5l-2.49 9.83h2.81a1.25 1.25 0 010 2.5H4.25a1.25 1.25 0 010-2.5h1.41l2.5-9.83H4.85a1.25 1.25 0 110-2.5h7.67l-.03.17z" />
            </svg>
          </Btn>
          <Btn active={editor?.isActive('code')} onClick={() => editor?.chain().focus().toggleCode().run()} title="Inline code">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </Btn>

          <Sep />

          {/* Lists */}
          <Btn active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Bullet list">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </Btn>
          <Btn active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="Numbered list">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </Btn>

          <Sep />

          {/* Block elements */}
          <Btn active={editor?.isActive('blockquote')} onClick={() => editor?.chain().focus().toggleBlockquote().run()} title="Blockquote">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
            </svg>
          </Btn>
          <Btn active={editor?.isActive('codeBlock')} onClick={() => editor?.chain().focus().toggleCodeBlock().run()} title="Code block">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </Btn>

          <Sep />

          {/* Link & Image */}
          <Btn active={editor?.isActive('link')} onClick={setLink} title="Insert / edit link">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </Btn>
          <Btn onClick={() => setShowMedia(true)} title="Insert image from media library">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </Btn>
          <Btn onClick={setYoutube} title="Embed YouTube Video">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
            </svg>
          </Btn>

          {/* Spacer + Undo/Redo */}
          <span className="flex-1" />
          <Sep />
          <Btn onClick={() => editor?.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </Btn>
          <Btn onClick={() => editor?.chain().focus().redo().run()} title="Redo (Ctrl+Shift+Z)">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </Btn>

        </div>

        {/* ── Editor canvas ────────────────────────────────────── */}
        <EditorContent editor={editor} />

        {/* ── Status bar ───────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3 text-[10px] font-mono text-white/25">
            {editor?.isActive('heading', { level: 1 }) && <span>H1</span>}
            {editor?.isActive('heading', { level: 2 }) && <span>H2</span>}
            {editor?.isActive('heading', { level: 3 }) && <span>H3</span>}
            {editor?.isActive('bold') && <span>Bold</span>}
            {editor?.isActive('italic') && <span>Italic</span>}
            {editor?.isActive('blockquote') && <span>Quote</span>}
            {editor?.isActive('codeBlock') && <span>Code</span>}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-white/20 font-mono">
              {markdown.trim().split(/\s+/).filter(Boolean).length} words · {editor?.storage?.characterCount?.characters?.() ?? markdown.length} chars · markdown
            </span>
            <button 
              type="submit"
              className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white transition-all active:scale-95"
            >
              Quick Save
            </button>
          </div>
        </div>
      </div>

      {/* ── Media picker modal ───────────────────────────────── */}
      {showMedia && (
        <MediaPicker
          onSelect={insertImage}
          onClose={() => setShowMedia(false)}
        />
      )}
    </>
  );
}
