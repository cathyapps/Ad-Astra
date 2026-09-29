import { createContext, useContext } from 'react'

export interface RunningTimer {
  bookId: string
  /** Epoch ms when the timer was started. */
  startedAt: number
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
  stop: () => void
  clearStoppedSession: () => void
}

export const ReadingTimerContext = createContext<ReadingTimerApi | null>(null)

export function useReadingTimer(): ReadingTimerApi {
  const ctx = useContext(ReadingTimerContext)
  if (!ctx) throw new Error('useReadingTimer must be used inside <ReadingTimerProvider>')
  return ctx
}
