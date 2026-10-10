import { createContext, useContext } from 'react'

export interface RunningTimer {
  bookId: string
  /** Epoch ms when the timer was started. */
  startedAt: number
  /** Total ms spent paused in earlier pauses (not counted as reading time). */
  pausedMs: number
  /** Epoch ms when the current pause began; undefined while the timer is running. */
  pausedAt?: number
}

/** Reading time so far, in ms: the clock stands still while paused. */
export function elapsedMs(timer: RunningTimer, now: number): number {
  return Math.max(0, (timer.pausedAt ?? now) - timer.startedAt - timer.pausedMs)
}

export interface StoppedSession {
  bookId: string
  /** Whole minutes read, never less than 1. */
  minutes: number
}

export interface ReadingTimerApi {
  timer: RunningTimer | null
  /** Set when Stop Reading was tapped; the quick log opens for this. */
  stoppedSession: StoppedSession | null
  start: (bookId: string) => void
  /** Stops the clock without ending the session; resume() carries on from the same time. */
  pause: () => void
  resume: () => void
  stop: () => void
  clearStoppedSession: () => void
}

export const ReadingTimerContext = createContext<ReadingTimerApi | null>(null)

export function useReadingTimer(): ReadingTimerApi {
  const ctx = useContext(ReadingTimerContext)
  if (!ctx) throw new Error('useReadingTimer must be used inside <ReadingTimerProvider>')
  return ctx
}
