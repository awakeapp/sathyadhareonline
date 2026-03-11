'use client';

import { useRef, useState } from 'react';

interface Props {
  currentImageUrl?: string | null;
}

export function CoverImageUpload({ currentImageUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  }

  function handleClear() {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const displayImage = preview ?? currentImageUrl;

  return (
    <div className="space-y-3">
      {/* Preview */}
      {displayImage && (
        <div className="relative group w-full max-w-sm rounded-xl overflow-hidden border border-zinc-200 dark:border-gray-700 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayImage}
            alt="Cover preview"
            className="w-full h-44 object-cover"
          />

          {/* Overlay label */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-white font-medium">
              {preview ? '✦ New image selected' : 'Current cover'}
            </span>
            {preview && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-red-300 hover:text-red-100 font-semibold transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      {/* File input */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="cover_image"
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {displayImage ? 'Replace image' : 'Upload cover image'}
        </label>
        <input
          ref={inputRef}
          id="cover_image"
          name="cover_image"
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="sr-only"
        />
        {!displayImage && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            JPG, PNG, WebP — max 5 MB
          </span>
        )}
      </div>
    </div>
  );
}
