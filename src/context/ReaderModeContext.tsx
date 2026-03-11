'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'

/* ─────────────────────────────────────────────────────────────────────────────
   ReaderMode Context
   ─────────────────────────────────────────────────────────────────────────────
   - Stores whether a privileged user (super_admin / admin / editor) has
     voluntarily switched to "reader mode" (browsing the reader homepage as
     a regular reader would see it).
   - Persisted to localStorage so it survives new tabs, full page reloads,
     and PWA restores. Cleared explicitly on logout (see TopHeader.tsx).
   - Should NOT be confused with a user's actual role – the middleware still
     enforces role-based access for every route.
   ───────────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'sathyadhare:readerMode'

interface ReaderModeContextValue {
  /** Whether the current privileged user has switched to reader mode */
  readerMode: boolean
  /** Activate reader mode (stores to localStorage & navigates to `/`) */
  enableReaderMode: () => void
  /** Deactivate reader mode (removes from localStorage) */
  disableReaderMode: () => void
  /** Toggle reader mode */
  toggleReaderMode: () => void
}

const ReaderModeContext = createContext<ReaderModeContextValue>({
  readerMode: false,
  enableReaderMode: () => {},
  disableReaderMode: () => {},
  toggleReaderMode: () => {},
})

export function ReaderModeProvider({ children }: { children: React.ReactNode }) {
  // Always initialise as false so server and client agree (no hydration mismatch).
  // A useEffect syncs the real value from localStorage after mount.
  const [readerMode, setReaderMode] = useState<boolean>(false)

  // Sync from localStorage after the component first mounts (client-side only).
  // eslint-disable-next-line react-compiler/react-compiler
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'true') {
        setReaderMode(true)
      }
    } catch {/* ignore */}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const enableReaderMode = useCallback(() => {
    try { 
      localStorage.setItem(STORAGE_KEY, 'true')
      document.cookie = `${STORAGE_KEY}=true; path=/; max-age=31536000`
    } catch {}
    setReaderMode(true)
  }, [])

  const disableReaderMode = useCallback(() => {
    try { 
      localStorage.removeItem(STORAGE_KEY) 
      document.cookie = `${STORAGE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    } catch {}
    setReaderMode(false)
  }, [])

  const toggleReaderMode = useCallback(() => {
    setReaderMode((prev) => {
      const next = !prev
      try {
        if (next) {
          localStorage.setItem(STORAGE_KEY, 'true')
          document.cookie = `${STORAGE_KEY}=true; path=/; max-age=31536000` // 1 year
        } else {
          localStorage.removeItem(STORAGE_KEY)
          document.cookie = `${STORAGE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        }
      } catch {}
      return next
    })
  }, [])

  return (
    <ReaderModeContext.Provider
      value={{ readerMode, enableReaderMode, disableReaderMode, toggleReaderMode }}
    >
      {children}
    </ReaderModeContext.Provider>
  )
}

export function useReaderMode() {
  return useContext(ReaderModeContext)
}
