"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { ArrowLeft, Save, Send, Image as ImageIcon, Link as LinkIcon, Globe, X, Plus, Type, List, ListOrdered, Quote, Search, Trash2, CheckCircle2 } from "lucide-react";

// ─── tiny helpers ───────────────────────────────────────────────────────────
const wordCount = (el: HTMLElement | null) => {
  const t = el?.innerText?.trim() ?? "";
  return t ? t.split(/\s+/).length : 0;
};

interface ArticleWriteEditorProps {
  onSaveDraft?: (data: any) => Promise<void>;
  onSubmit?: (data: any) => Promise<void>;
  initialData?: {
    title?: string;
    authorName?: string;
    summary?: string;
    body?: string;
    sources?: string[];
    categoryId?: string;
  };
  categories?: { id: string; name: string }[];
  onBack?: () => void;
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function ArticleWriteEditor({
  onSaveDraft,   // async (data) => {}   — called when user taps Save Draft
  onSubmit,      // async (data) => {}   — called when user taps Submit
  initialData,   // optional: { title, authorName, summary, body, sources }
  categories = [],
  onBack
}: ArticleWriteEditorProps) {
  // ── field state ──────────────────────────────────────────────────────────
  const [authorName, setAuthorName] = useState(initialData?.authorName ?? "");
  const [summary,    setSummary]    = useState(initialData?.summary    ?? "");
  const [title,      setTitle]      = useState(initialData?.title      ?? "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
  const [sources,    setSources]    = useState<{id: number, value: string}[]>(
    initialData?.sources?.map((s, i) => ({ id: i, value: s })) ?? []
  );
  const [wc,         setWc]         = useState(0);
  const [saveState,  setSaveState]  = useState<"saved" | "unsaved" | "saving">("saved"); 
  const [toast,      setToast]      = useState("");
  const [toastOn,    setToastOn]    = useState(false);

  // ── refs ─────────────────────────────────────────────────────────────────
  const bodyRef     = useRef<HTMLDivElement>(null);
  const titleRef    = useRef<HTMLTextAreaElement>(null);
  const saveTimer   = useRef<NodeJS.Timeout | null>(null);
  const savedSelRef = useRef<Range | null>(null);

  // ── link modal state ─────────────────────────────────────────────────────
  const [linkOpen,  setLinkOpen]  = useState(false);
  const [linkText,  setLinkText]  = useState("");
  const [linkUrl,   setLinkUrl]   = useState("");

  // ── image modal state ────────────────────────────────────────────────────
  const [imgOpen, setImgOpen] = useState(false);
  const [imgUrl,  setImgUrl]  = useState("");
  const [imgAlt,  setImgAlt]  = useState("");

  // ── active format state ──────────────────────────────────────────────────
  const [fmtState, setFmtState] = useState({
    bold: false, italic: false, underline: false,
    h2: false, h3: false, bq: false, ul: false, ol: false,
  });

  // ── set initial body HTML once ───────────────────────────────────────────
  useEffect(() => {
    if (bodyRef.current && initialData?.body) {
      bodyRef.current.innerHTML = initialData.body;
      setWc(wordCount(bodyRef.current));
    }
  }, [initialData]);

  // ── mark unsaved ─────────────────────────────────────────────────────────
  const markUnsaved = useCallback(() => {
    setSaveState("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveState("saved"), 5000);
  }, []);

  // ── collect current editor data ──────────────────────────────────────────
  const collectData = () => ({
    authorName,
    summary,
    title,
    categoryId,
    body: bodyRef.current?.innerHTML ?? "",
    bodyText: bodyRef.current?.innerText?.trim() ?? "",
    sources: sources.map((s) => s.value).filter(Boolean),
  });

  // ── save draft ───────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    setSaveState("saving");
    try {
      await onSaveDraft?.(collectData());
      setSaveState("saved");
      showToast("Draft saved ✓");
    } catch (e) {
      setSaveState("unsaved");
      showToast("Save failed — try again");
    }
  };

  // ── submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const data = collectData();
    if (!data.title.trim())          { showToast("Please add a title"); return; }
    if (data.bodyText.length < 20)   { showToast("Article body is too short"); return; }
    if (!data.authorName.trim())     { showToast("Please add the author name"); return; }
    setSaveState("saving");
    try {
      await onSubmit?.(data);
      setSaveState("saved");
      showToast("Submitted successfully ✓");
    } catch (e) {
      setSaveState("unsaved");
      showToast("Submit failed — try again");
    }
  };

  // ── toast helper ─────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg); setToastOn(true);
    setTimeout(() => setToastOn(false), 2400);
  };

  // ── format toolbar actions ───────────────────────────────────────────────
  const applyFmt = (cmd: string, val?: string) => {
    bodyRef.current?.focus();
    document.execCommand(cmd, false, val ?? "");
    checkActiveFmt();
    markUnsaved();
  };

  const applyBlock = (tag: string) => {
    bodyRef.current?.focus();
    const sel  = window.getSelection();
    if (sel?.rangeCount) {
      const node = sel.getRangeAt(0).commonAncestorContainer;
      const el   = node.nodeType === 3 ? node.parentElement : (node as HTMLElement);
      if (el?.tagName?.toLowerCase() === tag) {
        document.execCommand("formatBlock", false, "p");
        checkActiveFmt(); return;
      }
    }
    document.execCommand("formatBlock", false, tag);
    checkActiveFmt(); markUnsaved();
  };

  const checkActiveFmt = () => {
    const val = document.queryCommandValue("formatBlock").toLowerCase();
    setFmtState({
      bold:      document.queryCommandState("bold"),
      italic:    document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      ul:        document.queryCommandState("insertUnorderedList"),
      ol:        document.queryCommandState("insertOrderedList"),
      h2:        val === "h2",
      h3:        val === "h3",
      bq:        val === "blockquote",
    });
  };

  // ── Enter key: drop back to <p> after heading / blockquote ──────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const val = document.queryCommandValue("formatBlock").toLowerCase();
      if (["h2", "h3", "blockquote"].includes(val)) {
        setTimeout(() => document.execCommand("formatBlock", false, "p"), 0);
      }
    }
  };

  // ── image insert ─────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => insertImgHTML(ev.target?.result as string, file.name);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const insertImgHTML = (src: string, alt?: string) => {
    bodyRef.current?.focus();
    document.execCommand(
      "insertHTML", false,
      `<img src="${src}" alt="${alt ?? ""}"
        style="max-width:100%;border-radius:12px;display:block;margin:1.4em auto;box-shadow:0 4px 16px rgba(0,0,0,0.08)"
      /><p><br/></p>`
    );
    markUnsaved();
  };

  const openImgModal = () => {
    const sel = window.getSelection();
    savedSelRef.current = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : null;
    setImgUrl(""); setImgAlt(""); setImgOpen(true);
  };

  const doInsertImgUrl = () => {
    if (!imgUrl.trim()) { showToast("Please enter an image URL"); return; }
    setImgOpen(false);
    restoreSel();
    insertImgHTML(imgUrl.trim(), imgAlt.trim());
  };

  // ── link insert ──────────────────────────────────────────────────────────
  const openLinkModal = () => {
    const sel = window.getSelection();
    savedSelRef.current = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : null;
    setLinkText(sel?.toString() ?? "");
    setLinkUrl(""); setLinkOpen(true);
  };

  const restoreSel = () => {
    if (!savedSelRef.current) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges(); sel.addRange(savedSelRef.current);
    }
  };

  const doInsertLink = () => {
    if (!linkUrl.trim()) { showToast("Please enter a URL"); return; }
    setLinkOpen(false);
    bodyRef.current?.focus();
    restoreSel();
    const sel = window.getSelection();
    if (sel?.toString()) {
      document.execCommand("createLink", false, linkUrl.trim());
    } else {
      document.execCommand(
        "insertHTML", false,
        `<a href="${linkUrl.trim()}" target="_blank" rel="noopener">${linkText.trim() || linkUrl.trim()}</a>`
      );
    }
    markUnsaved();
  };

  // ── sources ──────────────────────────────────────────────────────────────
  const addSource = () => {
    setSources((prev) => [...prev, { id: Date.now(), value: "" }]);
    markUnsaved();
  };
  const updateSource = (id: number, val: string) => {
    setSources((prev) => prev.map((s) => s.id === id ? { ...s, value: val } : s));
    markUnsaved();
  };
  const removeSource = (id: number) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
    markUnsaved();
  };

  // ── save status copy ─────────────────────────────────────────────────────
  const saveCopy = { saved: "Saved", unsaved: "Unsaved", saving: "Saving…" }[saveState];
  const dotColor = { saved: "#22c55e", unsaved: "#f59e0b", saving: "#3b82f6" }[saveState];

  return (
    <>
      <style>{`
        .ae-wrap {
          font-family: inherit;
          background: var(--color-background);
          color: var(--color-text);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }
        /* Mobile adjustment for scroll */
        .ae-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px 16px 140px;
        }
        
        .ae-topbar {
          position: sticky;
          top: 0;
          z-index: 50;
          height: 64px;
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .ae-back {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid var(--color-border);
          background: var(--color-surface-2);
          color: var(--color-text);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .ae-back:hover { background: var(--color-border); }

        .ae-topbar-brand {
          font-size: 15px;
          font-weight: 700;
          color: var(--color-text);
          margin-left: 12px;
        }

        .ae-save-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: var(--color-muted);
          background: var(--color-surface-2);
          border-radius: 99px;
          padding: 6px 12px;
          border: 1px solid var(--color-border);
        }
        
        .ae-save-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: all 0.3s;
        }

        /* Meta Card */
        .ae-meta {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 32px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .ae-meta-row {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--color-border);
        }
        .ae-meta-row:last-child { border-bottom: none; }
        .ae-meta-icon { color: var(--color-primary); margin-top: 4px; }
        .ae-meta-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-muted); margin-bottom: 4px; }
        .ae-meta-inp { 
          width: 100%; 
          background: transparent !important; 
          border: none !important; 
          outline: none !important; 
          color: var(--color-text) !important; 
          font-size: 15px !important; 
          font-weight: 500 !important;
          padding: 0 !important;
          box-shadow: none !important;
        }

        /* Title */
        .ae-title-inp {
          width: 100%;
          border: none !important;
          outline: none !important;
          background: transparent !important;
          font-family: var(--article-font-family), serif;
          font-size: clamp(28px, 6vw, 42px);
          font-weight: 900;
          color: var(--color-text);
          line-height: 1.2;
          resize: none;
          min-height: 60px;
          margin-bottom: 24px;
          padding: 0 !important;
          box-shadow: none !important;
        }

        /* Ruled */
        .ae-ruled { display: flex; align-items: center; gap: 12px; margin: 32px 0 20px; }
        .ae-ruled hr { flex: 1; border: none; border-top: 1px solid var(--color-border); }
        .ae-ruled span { font-size: 11px; font-weight: 800; color: var(--color-muted); text-transform: uppercase; letter-spacing: 0.1em; }

        /* Format Bar */
        .ae-fmtbar {
          position: sticky;
          top: 64px;
          z-index: 40;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          display: flex;
          align-items: center;
          padding: 6px;
          gap: 4px;
          margin-bottom: 24px;
          overflow-x: auto;
          scrollbar-width: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .ae-fmtbar::-webkit-scrollbar { display: none; }
        
        .ae-fb-btn {
          min-width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: var(--color-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .ae-fb-btn:hover { background: var(--color-surface-2); color: var(--color-text); }
        .ae-fb-btn.ae-active { background: var(--color-primary); color: white; }
        
        .ae-fb-sep { width: 1px; height: 20px; background: var(--color-border); margin: 0 4px; }
        
        .ae-fb-accent { color: var(--color-primary); }
        .ae-fb-accent:hover { background: color-mix(in srgb, var(--color-primary) 10%, transparent); }

        /* Body Editor */
        .ae-body {
          min-height: 500px;
          outline: none;
          font-family: var(--article-font-family), serif;
          font-size: var(--article-font-size);
          line-height: var(--article-line-height);
          color: var(--color-text);
          word-break: break-word;
          padding-bottom: 100px;
        }
        .ae-body:empty::before {
          content: attr(data-placeholder);
          color: var(--color-muted);
          opacity: 0.5;
          pointer-events: none;
          font-style: italic;
        }
        .ae-body p { margin-bottom: 1.5em; }
        .ae-body h2 { font-size: 1.6em; font-weight: 900; margin: 1.8em 0 0.6em; }
        .ae-body h3 { font-size: 1.3em; font-weight: 800; margin: 1.5em 0 0.5em; }
        .ae-body blockquote {
          border-left: 4px solid var(--color-primary);
          padding-left: 20px;
          margin: 1.5em 0;
          color: var(--color-muted);
          font-style: italic;
          background: color-mix(in srgb, var(--color-primary) 5%, transparent);
          padding: 16px 20px;
          border-radius: 0 12px 12px 0;
        }
        .ae-body a { color: var(--color-primary); text-decoration: underline; font-weight: 600; }
        .ae-body ul, .ae-body ol { padding-left: 24px; margin-bottom: 1.5em; }
        .ae-body li { margin-bottom: 0.5em; }
        .ae-body img { 
          max-width: 100%; 
          border-radius: 20px; 
          display: block; 
          margin: 2.5em auto; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        /* Sources */
        .ae-src-wrap {
          margin-top: 48px;
          padding: 32px;
          background: var(--color-surface-2);
          border-radius: 24px;
          border: 1px solid var(--color-border);
        }
        .ae-src-head { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-muted); margin-bottom: 20px; }
        .ae-src-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--color-border); }
        .ae-src-row:last-child { border-bottom: none; }
        .ae-src-num { font-size: 12px; font-weight: 700; color: var(--color-primary); min-width: 20px; }
        .ae-src-inp { 
          flex: 1; 
          background: transparent !important; 
          border: none !important; 
          outline: none !important; 
          color: var(--color-text) !important; 
          font-size: 14px !important; 
          font-weight: 500 !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .ae-src-del { color: var(--color-muted); cursor: pointer; transition: color 0.2s; }
        .ae-src-del:hover { color: #ef4444; }
        
        .ae-add-src {
          margin-top: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 12px;
          border: 1.5px dashed var(--color-border);
          background: transparent;
          color: var(--color-muted);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ae-add-src:hover { border-color: var(--color-primary); color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 5%, transparent); }

        /* Buttons */
        .ae-btn {
          height: 44px;
          padding: 0 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .ae-btn-outline { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); }
        .ae-btn-outline:hover { background: var(--color-surface-2); }
        .ae-btn-solid { background: var(--color-primary); color: white; border: none; box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary) 30%, transparent); }
        .ae-btn-solid:hover { opacity: 0.9; transform: translateY(-1px); }

        /* Bottom Bar */
        .ae-bottom-bar {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          padding: 8px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          display: flex;
          gap: 8px;
          width: calc(100% - 32px);
          max-width: 400px;
        }
        .ae-bottom-bar .ae-btn { flex: 1; height: 50px; border-radius: 16px; }

        /* Modal */
        .ae-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          opacity: 0;
          pointer-events: none;
          transition: all 0.3s;
        }
        .ae-overlay.ae-open { opacity: 1; pointer-events: all; }
        .ae-sheet {
          background: var(--color-surface);
          width: 100%;
          max-width: 500px;
          border-radius: 32px 32px 0 0;
          padding: 24px 24px 48px;
          transform: translateY(100%);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ae-overlay.ae-open .ae-sheet { transform: translateY(0); }
        .ae-handle { width: 40px; height: 5px; background: var(--color-border); border-radius: 10px; margin: 0 auto 24px; }
        .ae-sheet-title { font-size: 20px; font-weight: 800; margin-bottom: 20px; color: var(--color-text); }
        
        .ae-sheet-inp-wrap { margin-bottom: 20px; }
        .ae-sheet-inp-label { font-size: 11px; font-weight: 800; color: var(--color-muted); text-transform: uppercase; margin-bottom: 8px; display: block; }
        .ae-sheet-inp { 
          width: 100%; 
          padding: 14px 18px; 
          border-radius: 16px; 
          border: 1.5px solid var(--color-border) !important; 
          background: var(--color-surface-2) !important; 
          font-size: 15px !important; 
          color: var(--color-text) !important;
          outline: none !important;
        }
        .ae-sheet-inp:focus { border-color: var(--color-primary) !important; }

        /* Toast */
        .ae-toast {
          position: fixed;
          top: 80px;
          left: 50%;
          transform: translateX(-50%) translateY(-20px);
          background: var(--color-text);
          color: var(--color-surface);
          padding: 12px 24px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 700;
          opacity: 0;
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 300;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ae-toast.ae-show { opacity: 1; transform: translateX(-50%) translateY(0); }

        @media (min-width: 768px) {
          .ae-bottom-bar { display: none; }
          .ae-desk-btns { display: flex; gap: 10px; }
          .ae-toast { top: auto; bottom: 40px; }
        }
        @media (max-width: 767px) {
          .ae-desk-btns { display: none; }
        }
      `}</style>

      <div className="ae-wrap">
        {/* ── TOP BAR ── */}
        <div className="ae-topbar">
          <div className="flex items-center">
            <button className="ae-back" onClick={onBack}>
              <ArrowLeft size={20} />
            </button>
            <span className="ae-topbar-brand">Create Masterpiece</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="ae-save-pill">
              <div className="ae-save-dot" style={{background: dotColor}} />
              <span>{saveCopy}</span>
            </div>
            <div className="ae-desk-btns">
              <button className="ae-btn ae-btn-outline" onClick={handleSaveDraft}>
                <Save size={18} /> Save Draft
              </button>
              <button className="ae-btn ae-btn-solid" onClick={handleSubmit}>
                Submit <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ── PAGE ── */}
        <div className="ae-page allow-select">
          {/* META CARD */}
          <div className="ae-meta">
            <div className="ae-meta-row">
              <div className="ae-meta-icon"><Plus size={20} /></div>
              <div className="flex-1">
                <div className="ae-meta-label">Author Identity</div>
                <input
                  className="ae-meta-inp"
                  placeholder="Who is the writer?"
                  value={authorName}
                  onChange={e => { setAuthorName(e.target.value); markUnsaved(); }}
                />
              </div>
            </div>
            <div className="ae-meta-row">
              <div className="ae-meta-icon"><List size={20} /></div>
              <div className="flex-1">
                <div className="ae-meta-label">Category / Section</div>
                <select
                  className="ae-meta-inp cursor-pointer"
                  value={categoryId}
                  onChange={e => { setCategoryId(e.target.value); markUnsaved(); }}
                >
                  <option value="">Select Category...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="ae-meta-row">
              <div className="ae-meta-icon"><Type size={20} /></div>
              <div className="flex-1">
                <div className="ae-meta-label">Elevator Pitch / Summary</div>
                <textarea
                  className="ae-meta-inp"
                  placeholder="Hook your readers with a stellar summary..."
                  rows={2}
                  style={{ resize: 'none' }}
                  value={summary}
                  onChange={e => { setSummary(e.target.value); markUnsaved(); }}
                />
              </div>
            </div>
          </div>

          {/* TITLE */}
          <textarea
            ref={titleRef}
            className="ae-title-inp"
            placeholder="Untitled Masterpiece"
            rows={1}
            value={title}
            onChange={e => {
              setTitle(e.target.value);
              markUnsaved();
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
          />

          <div className="ae-ruled"><hr/><span>Narrative</span><hr/></div>

          {/* FORMAT TOOLBAR */}
          <div className="ae-fmtbar hide-scrollbar">
            <button className={`ae-fb-btn${fmtState.bold ? " ae-active":""}`} onClick={()=>applyFmt("bold")} title="Bold"><span className="font-bold">B</span></button>
            <button className={`ae-fb-btn${fmtState.italic ? " ae-active":""}`} onClick={()=>applyFmt("italic")} title="Italic"><span className="italic">I</span></button>
            <button className={`ae-fb-btn${fmtState.underline ? " ae-active":""}`} onClick={()=>applyFmt("underline")} title="Underline"><span className="underline">U</span></button>
            <div className="ae-fb-sep"/>
            <button className={`ae-fb-btn${fmtState.h2 ? " ae-active":""}`} onClick={()=>applyBlock("h2")} title="Heading 2"><span className="font-bold text-xs">H2</span></button>
            <button className={`ae-fb-btn${fmtState.h3 ? " ae-active":""}`} onClick={()=>applyBlock("h3")} title="Heading 3"><span className="font-bold text-[10px]">H3</span></button>
            <div className="ae-fb-sep"/>
            <button className={`ae-fb-btn${fmtState.ul ? " ae-active":""}`} onClick={()=>applyFmt("insertUnorderedList")} title="Bullet List"><List size={18}/></button>
            <button className={`ae-fb-btn${fmtState.ol ? " ae-active":""}`} onClick={()=>applyFmt("insertOrderedList")} title="Numbered List"><ListOrdered size={18}/></button>
            <button className={`ae-fb-btn${fmtState.bq ? " ae-active":""}`} onClick={()=>applyBlock("blockquote")} title="Quote"><Quote size={18}/></button>
            <div className="ae-fb-sep"/>
            <button className="ae-fb-btn" onClick={()=>applyFmt("removeFormat")} title="Clear Format"><X size={16}/></button>
            <div className="flex-1" />
            <div className="flex items-center gap-1 border-l border-[var(--color-border)] pl-2">
              <button className="ae-fb-btn ae-fb-accent" onClick={()=>fileInputRef.current?.click()} title="Upload Image"><ImageIcon size={18}/></button>
              <button className="ae-fb-btn ae-fb-accent" onClick={openImgModal} title="Web Image"><Globe size={18}/></button>
              <button className="ae-fb-btn ae-fb-accent" onClick={openLinkModal} title="Insert Link"><LinkIcon size={18}/></button>
            </div>
          </div>

          {/* BODY EDITOR */}
          <div
            ref={bodyRef}
            className="ae-body"
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Begin your story here..."
            onInput={() => { markUnsaved(); setWc(wordCount(bodyRef.current)); }}
            onKeyUp={checkActiveFmt}
            onMouseUp={checkActiveFmt}
            onKeyDown={handleKeyDown}
          />

          <div className="flex items-center justify-end mt-4 text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)] opacity-60">
            {wc} {wc === 1 ? "word" : "words"}
          </div>

          {/* SOURCES */}
          <div className="ae-src-wrap">
            <div className="ae-src-head">Sources &amp; Citations</div>
            {sources.map((s, i) => (
              <div className="ae-src-row" key={s.id}>
                <span className="ae-src-num">{i + 1}</span>
                <input
                  className="ae-src-inp"
                  placeholder="Book title, Website URL, or Reference..."
                  value={s.value}
                  onChange={e => updateSource(s.id, e.target.value)}
                />
                <button className="ae-src-del" onClick={() => removeSource(s.id)}><Trash2 size={16} /></button>
              </div>
            ))}
            <button className="ae-add-src" onClick={addSource}>
              <Plus size={16} /> Add Citation
            </button>
          </div>
        </div>

        {/* ── LINK MODAL ── */}
        <div className={`ae-overlay${linkOpen?" ae-open":""}`} onClick={e=>{if(e.target===e.currentTarget)setLinkOpen(false)}}>
          <div className="ae-sheet">
            <div className="ae-handle"/>
            <div className="ae-sheet-title">Connect a Link</div>
            <div className="ae-sheet-inp-wrap">
              <label className="ae-sheet-inp-label">Description</label>
              <input className="ae-sheet-inp" placeholder="Optional text display" value={linkText} onChange={e=>setLinkText(e.target.value)} />
            </div>
            <div className="ae-sheet-inp-wrap">
              <label className="ae-sheet-inp-label">Destination URL</label>
              <input className="ae-sheet-inp" placeholder="https://..." type="url" value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} />
            </div>
            <div className="flex gap-3 mt-4">
              <button className="ae-btn ae-btn-outline flex-1" onClick={()=>setLinkOpen(false)}>Dismiss</button>
              <button className="ae-btn ae-btn-solid flex-1" onClick={doInsertLink}>Attach Link</button>
            </div>
          </div>
        </div>

        {/* ── IMAGE URL MODAL ── */}
        <div className={`ae-overlay${imgOpen?" ae-open":""}`} onClick={e=>{if(e.target===e.currentTarget)setImgOpen(false)}}>
          <div className="ae-sheet">
            <div className="ae-handle"/>
            <div className="ae-sheet-title">Embed Image</div>
            <div className="ae-sheet-inp-wrap">
              <label className="ae-sheet-inp-label">Public Image URL</label>
              <input className="ae-sheet-inp" placeholder="https://..." type="url" value={imgUrl} onChange={e=>setImgUrl(e.target.value)} />
            </div>
            <div className="ae-sheet-inp-wrap">
              <label className="ae-sheet-inp-label">Caption / Alt Text</label>
              <input className="ae-sheet-inp" placeholder="Brief description..." value={imgAlt} onChange={e=>setImgAlt(e.target.value)} />
            </div>
            <div className="flex gap-3 mt-4">
              <button className="ae-btn ae-btn-outline flex-1" onClick={()=>setImgOpen(false)}>Dismiss</button>
              <button className="ae-btn ae-btn-solid flex-1" onClick={doInsertImgUrl}>Insert Image</button>
            </div>
          </div>
        </div>

        {/* ── BOTTOM BAR (mobile) ── */}
        <div className="ae-bottom-bar">
          <button className="ae-btn ae-btn-outline" onClick={handleSaveDraft}>Draft</button>
          <button className="ae-btn ae-btn-solid" onClick={handleSubmit}>Submit <Send size={16} /></button>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFileChange} />
        <div className={`ae-toast${toastOn?" ae-show":""}`}>
          <CheckCircle2 size={18} /> {toast}
        </div>
      </div>
    </>
  );
}
