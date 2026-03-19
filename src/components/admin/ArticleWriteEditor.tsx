"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, Save, Send, Image as ImageIcon, Link as LinkIcon,
  Globe, X, Plus, Type, List, ListOrdered, Quote, Trash2,
  CheckCircle2, AlertCircle, User, Loader2, AlertTriangle,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────
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
    coverImage?: string;
  };
  categories?: { id: string; name: string }[];
  onBack?: () => void;
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function ArticleWriteEditor({
  onSaveDraft,
  onSubmit,
  initialData,
  categories = [],
  onBack,
}: ArticleWriteEditorProps) {
  // ── field state ──────────────────────────────────────────────────────────
  const [authorName, setAuthorName] = useState(initialData?.authorName ?? "");
  const [summary,    setSummary]    = useState(initialData?.summary    ?? "");
  const [title,      setTitle]      = useState(initialData?.title      ?? "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
  const [sources,    setSources]    = useState<{id: number, value: string}[]>(
    initialData?.sources?.map((s, i) => ({ id: i, value: s })) ?? []
  );
  const [coverImage, setCoverImage] = useState(initialData?.coverImage ?? "");
  const [wc,         setWc]         = useState(0);
  // "idle" = page just opened, nothing typed yet (shows no dot)
  // "unsaved" = user has made changes not yet saved to DB
  // "saving" = network call in flight
  // "saved" = last save was successfully persisted to DB
  const [saveState,  setSaveState]  = useState<"idle" | "saved" | "unsaved" | "saving">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── toast state ──────────────────────────────────────────────────────────
  const [toast,    setToast]    = useState("");
  const [toastOn,  setToastOn]  = useState(false);
  const [toastErr, setToastErr] = useState(false);

  // ── refs ─────────────────────────────────────────────────────────────────
  const bodyRef     = useRef<HTMLDivElement>(null);
  const titleRef    = useRef<HTMLTextAreaElement>(null);
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

  // ── warn user before leaving with unsaved changes ─────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveState === "unsaved") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveState]);

  // ── mark unsaved (no fake timeout — only DB saves reset this) ────────────
  const markUnsaved = useCallback(() => {
    setSaveState("unsaved");
  }, []);

  // ── collect current editor data ──────────────────────────────────────────
  const collectData = () => ({
    authorName,
    summary,
    title,
    categoryId,
    coverImage,
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
      showToast("Draft saved successfully", false);
    } catch (e) {
      setSaveState("unsaved");
      showToast("Save failed — please try again", true);
    }
  };

  // ── back with unsaved warning ─────────────────────────────────────────────
  const handleBack = () => {
    if (saveState === "unsaved") {
      if (!window.confirm("You have unsaved changes. Leave without saving?")) return;
    }
    onBack?.();
  };

  // ── submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const data = collectData();
    if (!data.title.trim())        { showToast("Please add a title", true); return; }
    if (!data.authorName.trim())   { showToast("Please add the author name", true); return; }
    if (!data.categoryId)          { showToast("Please select a category", true); return; }
    if (!data.summary.trim())      { showToast("Please add an elevator pitch / summary", true); return; }
    if (data.bodyText.length < 20) { showToast("Article body is too short", true); return; }

    setIsSubmitting(true);
    setSaveState("saving");
    try {
      await onSubmit?.(data);
      setSaveState("saved");
      showToast("Submitted successfully!", false);
    } catch (e) {
      setSaveState("unsaved");
      showToast("Submit failed — please try again", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── toast helper ─────────────────────────────────────────────────────────
  const showToast = (msg: string, isError: boolean) => {
    setToast(msg);
    setToastErr(isError);
    setToastOn(true);
    setTimeout(() => setToastOn(false), 3000);
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
    if (!imgUrl.trim()) { showToast("Please enter an image URL", true); return; }
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
    if (sel) { sel.removeAllRanges(); sel.addRange(savedSelRef.current); }
  };

  const doInsertLink = () => {
    if (!linkUrl.trim()) { showToast("Please enter a URL", true); return; }
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
  const addSource = () => { setSources((p) => [...p, { id: Date.now(), value: "" }]); markUnsaved(); };
  const updateSource = (id: number, val: string) => { setSources((p) => p.map((s) => s.id === id ? { ...s, value: val } : s)); markUnsaved(); };
  const removeSource = (id: number) => { setSources((p) => p.filter((s) => s.id !== id)); markUnsaved(); };

  // ── save status ─────────────────────────────────────────────────────────
  const saveBadge = {
    idle:    { label: "New",      color: "var(--color-muted)",   bg: "var(--color-surface-2)", dot: "#94a3b8" },
    saved:   { label: "Saved",    color: "#16a34a",              bg: "#f0fdf4",                 dot: "#22c55e" },
    unsaved: { label: "Unsaved",  color: "#b45309",              bg: "#fffbeb",                 dot: "#f59e0b" },
    saving:  { label: "Saving…",  color: "#1d4ed8",              bg: "#eff6ff",                 dot: "#3b82f6" },
  }[saveState];

  return (
    <>
      <style>{`
        /* ── Base ─────────────────────────────────────────────── */
        .ae-wrap {
          font-family: inherit;
          background: var(--color-background);
          color: var(--color-text);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        /* ── Top bar ─────────────────────────────────────────── */
        .ae-topbar {
          position: sticky;
          top: 0;
          z-index: 50;
          height: 60px;
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          gap: 12px;
        }

        .ae-back-btn {
          width: 38px; height: 38px;
          border-radius: 50%;
          border: 1.5px solid var(--color-border);
          background: var(--color-surface-2);
          color: var(--color-text);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.18s, border-color 0.18s;
          flex-shrink: 0;
        }
        .ae-back-btn:hover { background: var(--color-border); }

        .ae-topbar-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text);
          white-space: nowrap;
        }

        .ae-save-badge {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700;
          padding: 5px 12px;
          border-radius: 99px;
          border: 1px solid var(--color-border);
          transition: all 0.3s;
          white-space: nowrap;
        }
        .ae-save-badge-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          transition: background 0.3s;
        }

        /* ── Page content ────────────────────────────────────── */
        .ae-page {
          max-width: 760px;
          margin: 0 auto;
          padding: 28px 16px 160px;
        }

        /* ── Section headers ─────────────────────────────────── */
        .ae-section-label {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 14px;
        }
        .ae-section-label span {
          font-size: 10px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.12em;
          color: var(--color-muted);
        }
        .ae-section-label::before,
        .ae-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--color-border);
        }

        /* ── Meta card ───────────────────────────────────────── */
        .ae-meta-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 28px;
        }

        .ae-meta-row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--color-border);
          transition: background 0.15s;
        }
        .ae-meta-row:last-child { border-bottom: none; }
        .ae-meta-row:focus-within { background: color-mix(in srgb, var(--color-primary) 3%, transparent); }

        .ae-meta-icon-wrap {
          width: 32px; height: 32px;
          border-radius: 10px;
          background: color-mix(in srgb, var(--color-primary) 10%, transparent);
          display: flex; align-items: center; justify-content: center;
          color: var(--color-primary);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .ae-meta-field { flex: 1; min-width: 0; }
        .ae-meta-label {
          font-size: 10px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--color-muted);
          margin-bottom: 3px;
        }
        .ae-meta-inp {
          width: 100%;
          background: transparent !important;
          border: none !important; outline: none !important;
          color: var(--color-text) !important;
          font-size: 14px !important; font-weight: 500 !important;
          padding: 0 !important; box-shadow: none !important;
          line-height: 1.5;
        }
        select.ae-meta-inp { cursor: pointer; }

        /* ── Title area ──────────────────────────────────────── */
        .ae-title-wrap {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: 20px 22px;
          margin-bottom: 28px;
          transition: border-color 0.2s;
        }
        .ae-title-wrap:focus-within {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 10%, transparent);
        }
        .ae-title-hint {
          font-size: 10px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.1em;
          color: var(--color-muted);
          margin-bottom: 8px;
        }
        .ae-title-inp {
          width: 100%;
          border: none !important; outline: none !important;
          background: transparent !important;
          font-family: var(--article-font-family), var(--font-noto-serif-kannada), serif;
          font-size: clamp(24px, 5vw, 36px);
          font-weight: 900;
          color: var(--color-text);
          line-height: 1.25;
          resize: none;
          min-height: 52px;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .ae-title-inp::placeholder { color: var(--color-muted); opacity: 0.45; }

        /* ── Format bar ──────────────────────────────────────── */
        .ae-fmtbar-wrap {
          position: sticky;
          top: 60px;
          z-index: 40;
          padding: 8px 0;
          background: var(--color-background);
        }
        .ae-fmtbar {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          display: flex;
          align-items: center;
          padding: 5px 8px;
          gap: 2px;
          overflow-x: auto;
          scrollbar-width: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .ae-fmtbar::-webkit-scrollbar { display: none; }

        .ae-fb-btn {
          min-width: 34px; height: 34px;
          border-radius: 9px;
          border: none;
          background: transparent;
          color: var(--color-muted);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
          font-size: 13px; font-weight: 700;
        }
        .ae-fb-btn:hover { background: var(--color-surface-2); color: var(--color-text); }
        .ae-fb-btn.ae-active { background: var(--color-primary); color: white; border-radius: 9px; }
        .ae-fb-sep { width: 1px; height: 18px; background: var(--color-border); margin: 0 5px; flex-shrink: 0; }
        .ae-fb-accent { color: var(--color-primary) !important; }
        .ae-fb-accent:hover { background: color-mix(in srgb, var(--color-primary) 10%, transparent) !important; }

        /* ── Body editor ─────────────────────────────────────── */
        .ae-body-section {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: 20px 22px;
          margin-bottom: 12px;
          min-height: 400px;
        }
        .ae-body {
          min-height: 360px;
          outline: none;
          font-family: var(--article-font-family), var(--font-noto-serif-kannada), serif;
          font-size: var(--article-font-size, 16px);
          line-height: var(--article-line-height, 1.8);
          color: var(--color-text);
          word-break: break-word;
        }
        .ae-body:empty::before {
          content: attr(data-placeholder);
          color: var(--color-muted);
          opacity: 0.4;
          pointer-events: none;
          font-style: italic;
        }
        .ae-body p  { margin-bottom: 1.5em; }
        .ae-body h2 { font-size: 1.55em; font-weight: 900; margin: 1.8em 0 0.6em; }
        .ae-body h3 { font-size: 1.25em; font-weight: 800; margin: 1.5em 0 0.5em; }
        .ae-body blockquote {
          border-left: 3px solid var(--color-primary);
          padding: 14px 18px;
          margin: 1.5em 0;
          color: var(--color-muted);
          font-style: italic;
          background: color-mix(in srgb, var(--color-primary) 5%, transparent);
          border-radius: 0 14px 14px 0;
        }
        .ae-body a { color: var(--color-primary); text-decoration: underline; font-weight: 600; }
        .ae-body ul, .ae-body ol { padding-left: 22px; margin-bottom: 1.5em; }
        .ae-body li { margin-bottom: 0.4em; }
        .ae-body img {
          max-width: 100%; border-radius: 16px;
          display: block; margin: 2em auto;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }

        /* ── Word count ──────────────────────────────────────── */
        .ae-wc-row {
          display: flex; align-items: center; justify-content: flex-end;
          padding: 6px 4px;
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--color-muted);
          opacity: 0.6;
          margin-bottom: 24px;
        }

        /* ── Sources ─────────────────────────────────────────── */
        .ae-src-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: 20px 22px;
          margin-bottom: 40px;
        }
        .ae-src-head {
          font-size: 10px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.1em;
          color: var(--color-muted);
          margin-bottom: 16px;
        }
        .ae-src-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--color-border);
        }
        .ae-src-row:last-of-type { border-bottom: none; }
        .ae-src-num {
          font-size: 11px; font-weight: 800;
          color: var(--color-primary); min-width: 18px;
        }
        .ae-src-inp {
          flex: 1;
          background: transparent !important; border: none !important;
          outline: none !important; color: var(--color-text) !important;
          font-size: 13px !important; font-weight: 500 !important;
          padding: 0 !important; box-shadow: none !important;
        }
        .ae-src-del {
          color: var(--color-muted); cursor: pointer;
          transition: color 0.15s; padding: 4px;
          border: none; background: transparent;
        }
        .ae-src-del:hover { color: #ef4444; }
        .ae-add-src-btn {
          margin-top: 12px;
          display: flex; align-items: center; gap: 8px;
          padding: 9px 14px;
          border-radius: 12px;
          border: 1.5px dashed var(--color-border);
          background: transparent;
          color: var(--color-muted);
          font-size: 12px; font-weight: 700;
          cursor: pointer;
          transition: all 0.18s;
          letter-spacing: 0.02em;
        }
        .ae-add-src-btn:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
          background: color-mix(in srgb, var(--color-primary) 5%, transparent);
        }

        /* ── CTA Buttons ──────────────────────────────────────── */
        .ae-btn {
          height: 46px; padding: 0 22px;
          border-radius: 14px;
          font-size: 14px; font-weight: 700;
          cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          transition: all 0.18s;
          white-space: nowrap;
        }
        .ae-btn-ghost {
          background: transparent;
          color: var(--color-text);
          border: 1.5px solid var(--color-border);
        }
        .ae-btn-ghost:hover { background: var(--color-surface-2); }
        .ae-btn-primary {
          background: var(--color-primary); color: white; border: none;
          box-shadow: 0 4px 14px color-mix(in srgb, var(--color-primary) 35%, transparent);
        }
        .ae-btn-primary:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .ae-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        /* ── Bottom bar (mobile) ─────────────────────────────── */
        .ae-bottom-bar {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 100;
          background: var(--color-surface);
          border-top: 1px solid var(--color-border);
          padding: 12px 16px;
          padding-bottom: max(12px, env(safe-area-inset-bottom));
          display: flex; gap: 10px;
        }
        .ae-bottom-bar .ae-btn { flex: 1; height: 50px; border-radius: 16px; justify-content: center; }

        /* Desktop: inline buttons, hide bottom bar */
        @media (min-width: 768px) {
          .ae-bottom-bar  { display: none; }
          .ae-desk-btns   { display: flex; gap: 10px; }
        }
        @media (max-width: 767px) {
          .ae-desk-btns   { display: none; }
        }

        /* ── Modal sheet ──────────────────────────────────────── */
        .ae-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(6px);
          display: flex; align-items: flex-end; justify-content: center;
          opacity: 0; pointer-events: none;
          transition: opacity 0.25s;
        }
        .ae-overlay.ae-open { opacity: 1; pointer-events: all; }
        .ae-sheet {
          background: var(--color-surface);
          width: 100%; max-width: 480px;
          border-radius: 28px 28px 0 0;
          padding: 20px 22px 48px;
          transform: translateY(100%);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ae-overlay.ae-open .ae-sheet { transform: translateY(0); }
        .ae-handle {
          width: 36px; height: 4px;
          background: var(--color-border);
          border-radius: 10px;
          margin: 0 auto 20px;
        }
        .ae-sheet-title { font-size: 18px; font-weight: 800; margin-bottom: 18px; color: var(--color-text); }
        .ae-sheet-label { font-size: 10px; font-weight: 800; color: var(--color-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; display: block; }
        .ae-sheet-field-wrap { margin-bottom: 16px; }
        .ae-sheet-inp {
          width: 100%;
          padding: 13px 16px;
          border-radius: 14px;
          border: 1.5px solid var(--color-border) !important;
          background: var(--color-surface-2) !important;
          font-size: 14px !important;
          color: var(--color-text) !important;
          outline: none !important;
          transition: border-color 0.18s !important;
        }
        .ae-sheet-inp:focus { border-color: var(--color-primary) !important; }
        .ae-sheet-actions { display: flex; gap: 10px; margin-top: 18px; }
        .ae-sheet-actions .ae-btn { flex: 1; justify-content: center; }

        /* ── Toast ────────────────────────────────────────────── */
        .ae-toast {
          position: fixed;
          bottom: 90px; left: 50%;
          transform: translateX(-50%) translateY(10px);
          padding: 11px 20px;
          border-radius: 14px;
          font-size: 13px; font-weight: 700;
          opacity: 0; pointer-events: none;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 300;
          display: flex; align-items: center; gap: 9px;
          white-space: nowrap;
          max-width: calc(100vw - 32px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        }
        .ae-toast.ae-show { opacity: 1; transform: translateX(-50%) translateY(0); }
        .ae-toast-success { background: #1a2e1a; color: #86efac; }
        .ae-toast-error   { background: #2e1a1a; color: #fca5a5; }

        @media (min-width: 768px) {
          .ae-toast { bottom: 36px; }
        }
      `}</style>

      <div className="ae-wrap">

        {/* ── TOP BAR ── */}
        <div className="ae-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button className="ae-back-btn" onClick={handleBack} title="Go back">
              <ArrowLeft size={18} />
            </button>
            <span className="ae-topbar-title">Create Masterpiece</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Save status badge */}
            {saveState !== "idle" && (
              <div
                className="ae-save-badge"
                style={{ color: saveBadge.color, background: saveBadge.bg }}
              >
                {saveState === "saving"
                  ? <Loader2 size={10} style={{ animation: "spin 0.8s linear infinite" }} />
                  : <span className="ae-save-badge-dot" style={{ background: saveBadge.dot }} />
                }
                {saveBadge.label}
              </div>
            )}

            {/* Desktop action buttons */}
            <div className="ae-desk-btns">
              <button className="ae-btn ae-btn-ghost" onClick={handleSaveDraft} disabled={saveState === "saving"}>
                <Save size={16} /> Save Draft
              </button>
              <button className="ae-btn ae-btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> : <Send size={16} />}
                {isSubmitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="ae-page">

          {/* STEP 1 — Meta Card */}
          <div className="ae-section-label"><span>Article Details</span></div>

          <div className="ae-meta-card">
            {/* Author */}
            <div className="ae-meta-row">
              <div className="ae-meta-icon-wrap"><User size={16} /></div>
              <div className="ae-meta-field">
                <div className="ae-meta-label">Author Name</div>
                <input
                  className="ae-meta-inp"
                  placeholder="Who is the writer?"
                  value={authorName}
                  onChange={e => { setAuthorName(e.target.value); markUnsaved(); }}
                />
              </div>
            </div>

            {/* Category */}
            <div className="ae-meta-row">
              <div className="ae-meta-icon-wrap"><List size={16} /></div>
              <div className="ae-meta-field">
                <div className="ae-meta-label">Category / Section</div>
                <select
                  className="ae-meta-inp"
                  value={categoryId}
                  onChange={e => { setCategoryId(e.target.value); markUnsaved(); }}
                >
                  <option value="">Select a category…</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cover Image */}
            <div className="ae-meta-row">
              <div className="ae-meta-icon-wrap"><ImageIcon size={16} /></div>
              <div className="ae-meta-field">
                <div className="ae-meta-label">Cover Image URL</div>
                <input
                  className="ae-meta-inp"
                  placeholder="Link to article cover asset…"
                  value={coverImage}
                  onChange={e => { setCoverImage(e.target.value); markUnsaved(); }}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="ae-meta-row">
              <div className="ae-meta-icon-wrap"><Type size={16} /></div>
              <div className="ae-meta-field">
                <div className="ae-meta-label">Elevator Pitch / Summary</div>
                <textarea
                  className="ae-meta-inp"
                  placeholder="Hook your readers with a stellar summary…"
                  rows={2}
                  style={{ resize: "none" }}
                  value={summary}
                  onChange={e => { setSummary(e.target.value); markUnsaved(); }}
                />
              </div>
            </div>
          </div>

          {/* STEP 2 — Title */}
          <div className="ae-section-label"><span>Title</span></div>

          <div className="ae-title-wrap">
            <div className="ae-title-hint">Article Title</div>
            <textarea
              ref={titleRef}
              className="ae-title-inp"
              placeholder="Your masterpiece title…"
              rows={1}
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                markUnsaved();
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
            />
          </div>

          {/* STEP 3 — Narrative */}
          <div className="ae-section-label"><span>Narrative</span></div>

          {/* Format bar */}
          <div className="ae-fmtbar-wrap">
            <div className="ae-fmtbar">
              <button className={`ae-fb-btn${fmtState.bold      ? " ae-active" : ""}`} onClick={() => applyFmt("bold")}      title="Bold (Ctrl+B)"><b>B</b></button>
              <button className={`ae-fb-btn${fmtState.italic    ? " ae-active" : ""}`} onClick={() => applyFmt("italic")}    title="Italic (Ctrl+I)"><i>I</i></button>
              <button className={`ae-fb-btn${fmtState.underline ? " ae-active" : ""}`} onClick={() => applyFmt("underline")} title="Underline (Ctrl+U)"><u>U</u></button>
              <div className="ae-fb-sep" />
              <button className={`ae-fb-btn${fmtState.h2 ? " ae-active" : ""}`} onClick={() => applyBlock("h2")} title="Heading 2" style={{ fontSize: "12px" }}>H2</button>
              <button className={`ae-fb-btn${fmtState.h3 ? " ae-active" : ""}`} onClick={() => applyBlock("h3")} title="Heading 3" style={{ fontSize: "11px" }}>H3</button>
              <div className="ae-fb-sep" />
              <button className={`ae-fb-btn${fmtState.ul  ? " ae-active" : ""}`} onClick={() => applyFmt("insertUnorderedList")} title="Bullet list"><List size={16} /></button>
              <button className={`ae-fb-btn${fmtState.ol  ? " ae-active" : ""}`} onClick={() => applyFmt("insertOrderedList")}   title="Numbered list"><ListOrdered size={16} /></button>
              <button className={`ae-fb-btn${fmtState.bq  ? " ae-active" : ""}`} onClick={() => applyBlock("blockquote")}        title="Blockquote"><Quote size={16} /></button>
              <div className="ae-fb-sep" />
              <button className="ae-fb-btn" onClick={() => applyFmt("removeFormat")} title="Clear formatting"><X size={14} /></button>
              <div style={{ flex: 1 }} />
              {/* Media / link tools */}
              <button className="ae-fb-btn ae-fb-accent" onClick={() => fileInputRef.current?.click()} title="Upload image"><ImageIcon size={16} /></button>
              <button className="ae-fb-btn ae-fb-accent" onClick={openImgModal}  title="Embed image URL"><Globe size={16} /></button>
              <button className="ae-fb-btn ae-fb-accent" onClick={openLinkModal} title="Insert link"><LinkIcon size={16} /></button>
            </div>
          </div>

          {/* Body editor */}
          <div className="ae-body-section">
            <div
              ref={bodyRef}
              className="ae-body"
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Begin your story here…"
              onInput={() => { markUnsaved(); setWc(wordCount(bodyRef.current)); }}
              onKeyUp={checkActiveFmt}
              onMouseUp={checkActiveFmt}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Word count */}
          <div className="ae-wc-row">
            {wc} {wc === 1 ? "word" : "words"}
          </div>

          {/* Sources */}
          <div className="ae-src-card">
            <div className="ae-src-head">Sources &amp; Citations</div>
            {sources.map((s, i) => (
              <div className="ae-src-row" key={s.id}>
                <span className="ae-src-num">{i + 1}</span>
                <input
                  className="ae-src-inp"
                  placeholder="Book title, website URL, or reference…"
                  value={s.value}
                  onChange={e => updateSource(s.id, e.target.value)}
                />
                <button className="ae-src-del" onClick={() => removeSource(s.id)} title="Remove source">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button className="ae-add-src-btn" onClick={addSource}>
              <Plus size={14} /> Add Citation
            </button>
          </div>

        </div>{/* end ae-page */}

        {/* ── BOTTOM BAR (mobile) ── */}
        <div className="ae-bottom-bar">
          <button className="ae-btn ae-btn-ghost" onClick={handleSaveDraft} disabled={saveState === "saving"}>
            <Save size={16} /> Save Draft
          </button>
          <button className="ae-btn ae-btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />
              : <Send size={16} />
            }
            {isSubmitting ? "Submitting…" : "Submit"}
          </button>
        </div>

        {/* ── LINK MODAL ── */}
        <div
          className={`ae-overlay${linkOpen ? " ae-open" : ""}`}
          onClick={e => { if (e.target === e.currentTarget) setLinkOpen(false); }}
        >
          <div className="ae-sheet">
            <div className="ae-handle" />
            <div className="ae-sheet-title">Insert Link</div>
            <div className="ae-sheet-field-wrap">
              <label className="ae-sheet-label">Display Text (optional)</label>
              <input className="ae-sheet-inp" placeholder="Visible link text" value={linkText} onChange={e => setLinkText(e.target.value)} />
            </div>
            <div className="ae-sheet-field-wrap">
              <label className="ae-sheet-label">Destination URL</label>
              <input className="ae-sheet-inp" placeholder="https://..." type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
            </div>
            <div className="ae-sheet-actions">
              <button className="ae-btn ae-btn-ghost" onClick={() => setLinkOpen(false)}>Cancel</button>
              <button className="ae-btn ae-btn-primary" onClick={doInsertLink}>Attach Link</button>
            </div>
          </div>
        </div>

        {/* ── IMAGE URL MODAL ── */}
        <div
          className={`ae-overlay${imgOpen ? " ae-open" : ""}`}
          onClick={e => { if (e.target === e.currentTarget) setImgOpen(false); }}
        >
          <div className="ae-sheet">
            <div className="ae-handle" />
            <div className="ae-sheet-title">Embed Image</div>
            <div className="ae-sheet-field-wrap">
              <label className="ae-sheet-label">Public Image URL</label>
              <input className="ae-sheet-inp" placeholder="https://..." type="url" value={imgUrl} onChange={e => setImgUrl(e.target.value)} />
            </div>
            <div className="ae-sheet-field-wrap">
              <label className="ae-sheet-label">Caption / Alt Text</label>
              <input className="ae-sheet-inp" placeholder="Brief description…" value={imgAlt} onChange={e => setImgAlt(e.target.value)} />
            </div>
            <div className="ae-sheet-actions">
              <button className="ae-btn ae-btn-ghost" onClick={() => setImgOpen(false)}>Cancel</button>
              <button className="ae-btn ae-btn-primary" onClick={doInsertImgUrl}>Insert Image</button>
            </div>
          </div>
        </div>

        {/* ── Hidden file input ── */}
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />

        {/* ── TOAST ── */}
        <div className={`ae-toast ${toastErr ? "ae-toast-error" : "ae-toast-success"}${toastOn ? " ae-show" : ""}`}>
          {toastErr
            ? <AlertTriangle size={15} />
            : <CheckCircle2 size={15} />
          }
          {toast}
        </div>

        {/* Spin keyframe */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      </div>
    </>
  );
}
