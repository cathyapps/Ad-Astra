import { useEffect, useState } from 'react'
import type { Book, BookFormat } from '@/types/library'
import { BottomSheet } from '@/features/shared/BottomSheet'
import { fetchBookEditions, type HcEditionOption } from '@/lib/hardcover'
import { matchesBookFormat, optionCode } from '@/lib/hardcoverCompare'
import type { RereadOptions } from '@/lib/readings'

export const FORMAT_LABELS: Record<BookFormat, string> = {
  kindle: 'Kindle',
  audio: 'Audiobook',
  print: 'Print',
  tbd: 'Not set',
}

interface Props {
  book: Book
  onStart: (opts: RereadOptions) => Promise<void> | void
  onClose: () => void
}

/** Starts another reading of a finished book: same format and edition, or a different format
 *  (read it on Kindle, now listening to the audiobook) with the matching Hardcover edition
 *  picked if the book is linked. The finished reading is kept in the book's history. */
export function RereadSheet({ book, onStart, onClose }: Props) {
  const [format, setFormat] = useState<BookFormat>(book.format)
  const [editions, setEditions] = useState<HcEditionOption[] | null>(null)
  const [editionError, setEditionError] = useState('')
  const [picked, setPicked] = useState<HcEditionOption | undefined>()
  const [starting, setStarting] = useState(false)

  const differs = format !== book.format
  const others = (['print', 'kindle', 'audio'] as BookFormat[]).filter((f) => f !== book.format)

  // A different format means a different edition: offer the ones Hardcover has in that format.
  useEffect(() => {
    setPicked(undefined)
    if (!differs || !book.hardcoverBookId) return
    let cancelled = false
    setEditions(null)
    setEditionError('')
    fetchBookEditions(book.hardcoverBookId)
      .then((list) => !cancelled && setEditions(list))
      .catch((err) => !cancelled && setEditionError(err instanceof Error ? err.message : 'Could not load editions'))
    return () => {
      cancelled = true
    }
  }, [differs, format, book.hardcoverBookId])

  const choice = (active: boolean) =>
    `w-full text-left rounded-lg border px-3 py-2.5 text-sm transition-colors ${
      active ? 'border-gold bg-gold/10 text-moon' : 'border-hairline text-moon-dim hover:bg-card-hover'
    }`

  const matching = (editions ?? []).filter((e) => matchesBookFormat(format, e.kind)).slice(0, 12)

  async function start() {
    setStarting(true)
    try {
      await onStart({
        format,
        ...(differs && picked ? { isbn: optionCode(picked), hardcoverEditionId: picked.id } : {}),
      })
      onClose()
    } finally {
      setStarting(false)
    }
  }

  return (
    <BottomSheet title={`Re-read — ${book.title}`} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-xs text-moon-dim">
          Your finished reading stays in the book's history with its dates, format and ratings. This starts a new one.
        </p>

        <div className="space-y-2">
          <button type="button" className={choice(!differs)} onClick={() => setFormat(book.format)}>
            Same format and edition
            <span className="block text-xs text-moon-dim">{FORMAT_LABELS[book.format]}</span>
          </button>
          {others.map((f) => (
            <button key={f} type="button" className={choice(format === f)} onClick={() => setFormat(f)}>
              Different format: {FORMAT_LABELS[f]}
            </button>
          ))}
        </div>

        {differs && (
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-wide text-moon-dim">Edition (optional)</p>
            {!book.hardcoverBookId && (
              <p className="text-xs text-moon-dim">This book isn't linked to Hardcover, so the edition will be left unset.</p>
            )}
            {book.hardcoverBookId && editions === null && !editionError && <p className="text-xs text-moon-dim">Looking up editions…</p>}
            {editionError && <p className="text-xs text-red-300">{editionError}</p>}
            {editions && matching.length === 0 && <p className="text-xs text-moon-dim">No {FORMAT_LABELS[format]} editions found on Hardcover.</p>}
            <div className="max-h-48 overflow-y-auto space-y-1">
              {matching.map((o) => (
                <button key={o.id} type="button" className={choice(picked?.id === o.id)} onClick={() => setPicked(picked?.id === o.id ? undefined : o)}>
                  <span className="text-moon">{optionCode(o) ?? 'no ISBN or ASIN'}</span> · {o.detail || 'format unknown'}
                  <span className="block text-[11px] text-moon-dim">
                    {[o.publisher, o.year, o.language, o.usersCount ? `${o.usersCount} readers` : undefined].filter(Boolean).join(' · ')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={starting}
          className="w-full rounded-lg px-3 py-2.5 text-sm bg-gold text-night font-medium disabled:opacity-60"
          onClick={() => void start()}
        >
          {starting ? 'Starting…' : 'Start re-read'}
        </button>
      </div>
    </BottomSheet>
  )
}
