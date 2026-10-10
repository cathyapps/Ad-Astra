import { useEffect, useState } from 'react'
import type { Book } from '@/types/library'
import { elapsedMs, useReadingTimer } from './ReadingTimerContext'

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`
}

/** Shown at the top of the Library "In Progress" page and the Dashboard
 *  while a reading timer is running: counting-up clock, the book's name,
 *  a Pause / Resume button, and a Stop Reading button (which opens the
 *  quick log pre-filled with the elapsed minutes, not counting paused time).
 *  Renders nothing when no timer is running. */
export function ReadingTimerBanner({ books }: { books: Book[] }) {
  const { timer, pause, resume, stop } = useReadingTimer()
  const [now, setNow] = useState(() => Date.now())

  const paused = timer?.pausedAt != null

  // The clock only ticks while running; a paused clock just shows its frozen time.
  useEffect(() => {
    if (!timer || paused) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [timer, paused])

  if (!timer) return null
  const book = books.find((b) => b.id === timer.bookId)

  return (
    <div className="border border-gold/40 rounded-xl px-3 py-2.5 bg-gold/10 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className={`font-display text-2xl tabular-nums leading-none ${paused ? 'text-moon-dim' : 'text-gold'}`}>
          {formatElapsed(elapsedMs(timer, now))}
        </div>
        <div className="text-xs text-moon-dim truncate mt-1">
          {paused ? 'Paused · ' : 'Reading '}
          <span className="text-moon">{book?.title ?? 'a book'}</span>
        </div>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-lg px-3 py-2 text-sm border border-gold/40 text-gold hover:bg-gold/10 transition-colors"
        onClick={paused ? resume : pause}
      >
        {paused ? 'Resume' : 'Pause'}
      </button>
      <button
        type="button"
        className="shrink-0 rounded-lg px-3 py-2 text-sm bg-gold text-night font-medium hover:bg-gold-soft transition-colors"
        onClick={stop}
      >
        Stop Reading
      </button>
    </div>
  )
}
