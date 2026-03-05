'use client'

import { createContext, useContext, useState, useCallback } from 'react'

/* ─────────────────────────────────────────────────────────────────────────────
   ReaderMode Context
   ─────────────────────────────────────────────────────────────────────────────
   - Stores whether a privileged user (super_admin / admin / editor) has
     voluntarily switched to "reader mode" (browsing the reader homepage as
     a regular reader would see it).
   - Persisted to sessionStorage so it survives same-tab navigation but
     resets when the browser tab is closed or the user logs out.
   - Should NOT be confused with a user's actual role – the middleware still
     enforces role-based access for every route.
   ───────────────────────────────────────────────────────────────────────────── */

const SESSION_KEY = 'sathyadhare:readerMode'

interface ReaderModeContextValue {
  /** Whether the current privileged user has switched to reader mode */
  readerMode: boolean
  /** Activate reader mode (stores to sessionStorage & navigates to `/`) */
  enableReaderMode: () => void
  /** Deactivate reader mode (removes from sessionStorage) */
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
  // Lazy initializer — runs once on mount, reads from sessionStorage safely
  const [readerMode, setReaderMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      return sessionStorage.getItem(SESSION_KEY) === 'true'
    } catch {
      return false
    }
  })

  const enableReaderMode = useCallback(() => {
    try { sessionStorage.setItem(SESSION_KEY, 'true') } catch {}
    setReaderMode(true)
  }, [])

  const disableReaderMode = useCallback(() => {
    try { sessionStorage.removeItem(SESSION_KEY) } catch {}
    setReaderMode(false)
  }, [])

  const toggleReaderMode = useCallback(() => {
    setReaderMode((prev) => {
      const next = !prev
      try {
        if (next) sessionStorage.setItem(SESSION_KEY, 'true')
        else sessionStorage.removeItem(SESSION_KEY)
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
