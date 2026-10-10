import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { elapsedMs, ReadingTimerContext } from './ReadingTimerContext'
import type { RunningTimer, StoppedSession } from './ReadingTimerContext'

const STORAGE_KEY = 'adastra.readingTimer'

// The timer is stored as timestamps (not a ticking counter), so it keeps
// counting correctly across tab switches, screen locks and reloads. A pause
// is stored too, so a paused timer stays paused until you resume it.
function loadTimer(): RunningTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<RunningTimer>
    if (typeof parsed.bookId === 'string' && typeof parsed.startedAt === 'number') {
      return {
        bookId: parsed.bookId,
        startedAt: parsed.startedAt,
        // Timers saved before pausing existed have neither field.
        pausedMs: typeof parsed.pausedMs === 'number' ? parsed.pausedMs : 0,
        pausedAt: typeof parsed.pausedAt === 'number' ? parsed.pausedAt : undefined,
      }
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
    const next: RunningTimer = { bookId, startedAt: Date.now(), pausedMs: 0 }
    saveTimer(next)
    setTimer(next)
  }, [])

  const pause = useCallback(() => {
    if (!timer || timer.pausedAt != null) return
    const next: RunningTimer = { ...timer, pausedAt: Date.now() }
    saveTimer(next)
    setTimer(next)
  }, [timer])

  const resume = useCallback(() => {
    if (!timer || timer.pausedAt == null) return
    const next: RunningTimer = { bookId: timer.bookId, startedAt: timer.startedAt, pausedMs: timer.pausedMs + (Date.now() - timer.pausedAt) }
    saveTimer(next)
    setTimer(next)
  }, [timer])

  const stop = useCallback(() => {
    if (!timer) return
    // Paused time doesn't count, and stopping while paused ends the session at the moment of the pause.
    const minutes = Math.max(1, Math.round(elapsedMs(timer, Date.now()) / 60000))
    saveTimer(null)
    setTimer(null)
    setStoppedSession({ bookId: timer.bookId, minutes })
  }, [timer])

  const clearStoppedSession = useCallback(() => setStoppedSession(null), [])

  const value = useMemo(
    () => ({ timer, stoppedSession, start, pause, resume, stop, clearStoppedSession }),
    [timer, stoppedSession, start, pause, resume, stop, clearStoppedSession],
  )

  return <ReadingTimerContext.Provider value={value}>{children}</ReadingTimerContext.Provider>
}
