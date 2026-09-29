import { useMemo, useRef, useState } from 'react'
import type { Book } from '@/types/library'
import {
  enrichBooks,
  fillBlanks,
  needsEnrichment,
  type EnrichCandidate,
  type EnrichPatch,
} from '@/lib/bookEnrichment'
import { BookCover } from './BookCover'

type BookPatch = { id: string; patch: Partial<Book> }

interface Props {
  books: Book[]
  /** Writes every patch, then reloads once. Resolves with how many writes failed. */
  onApplyPatches: (patches: BookPatch[]) => Promise<number>
}

interface ReviewItem {
  book: Book
  candidate: EnrichCandidate
}

interface Counts {
  filled: number
  review: number
  none: number
  error: number
}

const EMPTY_COUNTS: Counts = { filled: 0, review: 0, none: 0, error: 0 }
const FLUSH_EVERY = 15

/** "Fill in missing details" — looks up page counts and covers for books
 *  that are missing them. Confident matches are saved as they're found (in
 *  small batches, so closing the page mid-run loses very little); shaky
 *  title/author matches wait in a review list for a tap. */
export function EnrichBooksPanel({ books, onApplyPatches }: Props) {
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS)
  const [review, setReview] = useState<ReviewItem[]>([])
  const [saveFailures, setSaveFailures] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const missing = useMemo(() => books.filter(needsEnrichment), [books])

  async function start() {
    const targets = missing
    if (targets.length === 0) return
    const controller = new AbortController()
    abortRef.current = controller

    setPhase('running')
    setProgress({ done: 0, total: targets.length })
    setCounts(EMPTY_COUNTS)
    setReview([])
    setSaveFailures(0)

    let pending: BookPatch[] = []
    let failures = 0
    const flush = async () => {
      if (pending.length === 0) return
      const batch = pending
      pending = []
      try {
        failures += await onApplyPatches(batch)
      } catch {
        failures += batch.length
      }
      setSaveFailures(failures)
    }

    await enrichBooks(targets, {
      signal: controller.signal,
      onResult: (book, result, done, total) => {
        setProgress({ done, total })
        setCounts((c) => ({
          ...c,
          [result.kind]: c[result.kind] + 1,
        }))
        if (result.kind === 'filled') {
          pending.push({ id: book.id, patch: result.patch })
          if (pending.length >= FLUSH_EVERY) void flush()
        } else if (result.kind === 'review') {
          setReview((r) => [...r, { book, candidate: result.candidate }])
        }
      },
    })

    await flush()
    abortRef.current = null
    setPhase('done')
  }

  function stop() {
    abortRef.current?.abort()
  }

  async function accept(item: ReviewItem) {
    const patch: EnrichPatch = fillBlanks(item.book, item.candidate.patch)
    setReview((r) => r.filter((x) => x.book.id !== item.book.id))
    if (Object.keys(patch).length > 0) {
      const failed = await onApplyPatches([{ id: item.book.id, patch }])
      if (failed > 0) setSaveFailures((n) => n + failed)
    }
  }

  function skip(item: ReviewItem) {
    setReview((r) => r.filter((x) => x.book.id !== item.book.id))
  }

  // Nothing to do and nothing to show.
  if (phase === 'idle' && missing.length === 0) return null

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div className="border border-hairline rounded-xl p-4 bg-card space-y-3">
      <div>
        <h3 className="text-sm font-medium text-moon">Fill in missing book details</h3>
        <p className="text-xs text-moon-dim mt-0.5">
          Looks up page counts and covers by ISBN (falling back to title and author). Only blanks
          are filled — nothing you've entered gets overwritten.
        </p>
      </div>

      {phase === 'idle' && (
        <button
          className="bg-gold text-night font-medium rounded-full px-4 py-2 text-sm"
          onClick={() => void start()}
        >
          Look up {missing.length} {missing.length === 1 ? 'book' : 'books'}
        </button>
      )}

      {phase === 'running' && (
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-hairline overflow-hidden">
            <div className="h-full bg-gold transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs text-moon-dim">
            <span>
              {progress.done} / {progress.total} looked up · {counts.filled} filled
            </span>
            <button className="text-cosmic hover:text-moon transition-colors" onClick={stop}>
              Stop
            </button>
          </div>
          <p className="text-[11px] text-moon-dim">Keep this page open until it finishes.</p>
        </div>
      )}

      {phase === 'done' && (
        <div className="space-y-2">
          <p className="text-sm text-moon">
            {counts.filled} filled
            {counts.review > 0 && ` · ${counts.review} to review`}
            {counts.none > 0 && ` · ${counts.none} not found`}
            {counts.error > 0 && ` · ${counts.error} failed (network)`}
          </p>
          {saveFailures > 0 && (
            <p className="text-xs text-red-300">{saveFailures} updates couldn't be saved — try running again.</p>
          )}
          {missing.length > 0 && (
            <button
              className="border border-hairline rounded-full px-3 py-1.5 text-xs text-moon hover:bg-card-hover transition-colors"
              onClick={() => void start()}
            >
              Run again for the {missing.length} still missing
            </button>
          )}
        </div>
      )}

      {review.length > 0 && (
        <div className="space-y-2 pt-1">
          <h4 className="text-xs font-medium text-moon">Needs a look ({review.length})</h4>
          {review.map((item) => (
            <div
              key={item.book.id}
              className="flex items-center gap-2.5 border border-hairline rounded-lg px-3 py-2"
            >
              <BookCover
                title={item.candidate.matchedTitle ?? item.book.title}
                coverUrl={item.candidate.patch.coverUrl ?? item.book.coverUrl}
                seed={item.book.id}
                size="sm"
              />
              <div className="flex-1 min-w-0 text-xs">
                <p className="text-moon truncate">
                  {item.book.title}
                  {item.book.author ? ` — ${item.book.author}` : ''}
                </p>
                <p className="text-moon-dim truncate">
                  Match: {item.candidate.matchedTitle ?? '?'}
                  {item.candidate.matchedAuthor ? ` — ${item.candidate.matchedAuthor}` : ''}
                  {item.candidate.patch.totalPages ? ` · ${item.candidate.patch.totalPages} pages` : ''}
                </p>
              </div>
              <button
                className="text-[10px] rounded-full px-2.5 py-1 bg-gold text-night font-medium shrink-0"
                onClick={() => void accept(item)}
              >
                Use
              </button>
              <button
                className="text-[10px] rounded-full px-2.5 py-1 border border-hairline text-moon-dim hover:text-moon shrink-0"
                onClick={() => skip(item)}
              >
                Skip
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
