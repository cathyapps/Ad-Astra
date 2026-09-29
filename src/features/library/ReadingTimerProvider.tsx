import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ReadingTimerContext } from './ReadingTimerContext'
import type { RunningTimer, StoppedSession } from './ReadingTimerContext'

const STORAGE_KEY = 'adastra.readingTimer'

// The timer is stored as a start timestamp (not a ticking counter), so it
// keeps counting correctly across tab switches, screen locks and reloads.
function loadTimer(): RunningTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<RunningTimer>
    if (typeof parsed.bookId === 'string' && typeof parsed.startedAt === 'number') {
      return { bookId: parsed.bookId, startedAt: parsed.startedAt }
    }
  } catch {
    // ignore — treat as no timer
  }
  return null
}

function saveTimer(timer: RunningTimer | null) {
  try {
    if (timer) localStorage.setItem(STORAGE_KEY, JSON.stringify(timer))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage unavailable — timer still works for this session
  }
}

export function ReadingTimerProvider({ children }: { children: ReactNode }) {
  const [timer, setTimer] = useState<RunningTimer | null>(loadTimer)
  const [stoppedSession, setStoppedSession] = useState<StoppedSession | null>(null)

  const start = useCallback((bookId: string) => {
    const next = { bookId, startedAt: Date.now() }
    saveTimer(next)
    setTimer(next)
  }, [])

  const stop = useCallback(() => {
    if (!timer) return
    const minutes = Math.max(1, Math.round((Date.now() - timer.startedAt) / 60000))
    saveTimer(null)
    setTimer(null)
    setStoppedSession({ bookId: timer.bookId, minutes })
  }, [timer])

  const clearStoppedSession = useCallback(() => setStoppedSession(null), [])

  const value = useMemo(
    () => ({ timer, stoppedSession, start, stop, clearStoppedSession }),
    [timer, stoppedSession, start, stop, clearStoppedSession],
  )

  return <ReadingTimerContext.Provider value={value}>{children}</ReadingTimerContext.Provider>
}
