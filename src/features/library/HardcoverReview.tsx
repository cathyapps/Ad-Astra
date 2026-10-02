import { useMemo, useState } from 'react'
import type { Book } from '@/types/library'
import { BottomSheet } from '@/features/shared/BottomSheet'
import { BookCover } from './BookCover'
import { fetchHardcoverLibrary, HC_STATUS_LABELS } from '@/lib/hardcover'
import {
  compareLibraries,
  FIELD_LABELS,
  linkPatch,
  type CompareResult,
  type CompareRow,
  type FieldKey,
} from '@/lib/hardcoverCompare'

type Pick = 'ad' | 'hc'
type Picks = Partial<Record<FieldKey, Pick>>
type BookPatch = { id: string; patch: Partial<Book> }

interface Props {
  books: Book[]
  /** Writes every patch, then reloads once. Resolves with how many writes failed. */
  onApplyPatches: (patches: BookPatch[]) => Promise<number>
  onClose: () => void
}

const FIELDS: FieldKey[] = ['dates', 'isbn', 'rating', 'moods']

/** One-time review: Ad Astra vs Hardcover, book by book. Nothing in Ad Astra
 *  changes until you tap "Save" on a book (or confirm a bulk save), and only
 *  the fields you picked Hardcover for are written. Books you've finished
 *  reviewing are remembered, so you can stop and come back. */
export function HardcoverReview({ books, onApplyPatches, onClose }: Props) {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState('')
  const [username, setUsername] = useState<string | undefined>()
  const [result, setResult] = useState<CompareResult | null>(null)
  const [picks, setPicks] = useState<Record<string, Picks>>({})
  const [filter, setFilter] = useState<'all' | FieldKey>('all')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showUnmatched, setShowUnmatched] = useState(false)

  async function load() {
    setPhase('loading')
    setError('')
    setMessage('')
    try {
      const { username: name, entries } = await fetchHardcoverLibrary()
      setUsername(name)
      setResult(compareLibraries(books, entries))
      setPicks({})
      setPhase('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setPhase('error')
    }
  }

  // Books already reviewed (saved earlier) drop out of the list. Re-derived
  // from live `books` so a saved row disappears right after the reload.
  const reviewedIds = useMemo(
    () => new Set(books.filter((b) => b.hardcoverReviewedAt).map((b) => b.id)),
    [books],
  )
  const pending = useMemo(() => (result?.rows ?? []).filter((r) => !reviewedIds.has(r.book.id)), [result, reviewedIds])
  const withDiffs = pending.filter((r) => r.diffs.length > 0)
  const inSync = pending.filter((r) => r.diffs.length === 0)
  const shown = filter === 'all' ? withDiffs : withDiffs.filter((r) => r.diffs.some((d) => d.field === filter))
  const fieldCounts = Object.fromEntries(
    FIELDS.map((f) => [f, withDiffs.filter((r) => r.diffs.some((d) => d.field === f)).length]),
  ) as Record<FieldKey, number>

  const picksFor = (row: CompareRow): Picks => picks[row.book.id] ?? {}
  const fullyPicked = (row: CompareRow) => row.diffs.every((d) => picksFor(row)[d.field])
  const readyToSave = shown.filter(fullyPicked)

  function setPick(row: CompareRow, field: FieldKey, value: Pick) {
    setPicks((p) => ({ ...p, [row.book.id]: { ...p[row.book.id], [field]: value } }))
  }

  function setAll(row: CompareRow, value: Pick) {
    setPicks((p) => ({ ...p, [row.book.id]: Object.fromEntries(row.diffs.map((d) => [d.field, value])) }))
  }

  /** Bulk helper: choose Hardcover (or Ad Astra) for one field across every book shown. Saves nothing. */
  function pickFieldForShown(field: FieldKey, value: Pick) {
    setPicks((p) => {
      const next = { ...p }
      for (const row of shown) {
        if (row.diffs.some((d) => d.field === field)) next[row.book.id] = { ...next[row.book.id], [field]: value }
      }
      return next
    })
  }

  function patchFor(row: CompareRow): BookPatch {
    const chosen = picksFor(row)
    let patch: Partial<Book> = { ...linkPatch(row, chosen), hardcoverReviewedAt: new Date().toISOString() }
    for (const d of row.diffs) if (chosen[d.field] === 'hc') patch = { ...patch, ...d.patch }
    return { id: row.book.id, patch }
  }

  async function save(rows: CompareRow[]) {
    if (rows.length === 0) return
    setSaving(true)
    setMessage('')
    const failed = await onApplyPatches(rows.map(patchFor))
    setSaving(false)
    setMessage(failed > 0 ? `${failed} of ${rows.length} couldn't be saved — try again.` : `Saved ${rows.length}.`)
  }

  async function linkInSync() {
    if (inSync.length === 0) return
    if (!window.confirm(`Link ${inSync.length} books that already agree with Hardcover? This only records which Hardcover entry each one is; none of your data changes.`)) return
    setSaving(true)
    const failed = await onApplyPatches(
      inSync.map((row) => ({ id: row.book.id, patch: { ...linkPatch(row, {}), hardcoverReviewedAt: new Date().toISOString() } })),
    )
    setSaving(false)
    setMessage(failed > 0 ? `${failed} couldn't be saved — try again.` : `Linked ${inSync.length}.`)
  }

  async function saveAllReady() {
    const hcCount = readyToSave.reduce((n, r) => n + r.diffs.filter((d) => picksFor(r)[d.field] === 'hc').length, 0)
    if (!window.confirm(`Save ${readyToSave.length} books? ${hcCount} fields will switch to Hardcover's value; the rest stay as they are in Ad Astra.`)) return
    await save(readyToSave)
  }

  return (
    <BottomSheet title="Compare with Hardcover" onClose={onClose}>
      <div className="space-y-3">
        {phase === 'idle' && (
          <>
            <p className="text-xs text-moon-dim">
              Fetches your Hardcover library and lines each Reading, Paused, Read and DNF book up against Ad Astra. For
              every difference you choose which side is right. Nothing changes until you tap Save.
            </p>
            <button className="bg-gold text-night font-medium rounded-full px-4 py-2 text-sm" onClick={() => void load()}>
              Fetch from Hardcover
            </button>
          </>
        )}

        {phase === 'loading' && <p className="text-sm text-moon-dim">Fetching your Hardcover library…</p>}

        {phase === 'error' && (
          <div className="space-y-2">
            <p className="text-sm text-red-300">{error}</p>
            <button className="border border-hairline rounded-full px-3 py-1.5 text-xs text-moon" onClick={() => void load()}>
              Try again
            </button>
          </div>
        )}

        {phase === 'ready' && result && (
          <>
            <p className="text-xs text-moon-dim">
              {username ? `Hardcover: ${username}. ` : ''}
              {withDiffs.length} to review · {inSync.length} already agree · {result.unmatched.length} not found on Hardcover
              {reviewedIds.size > 0 ? ` · ${reviewedIds.size} reviewed` : ''}
            </p>
            {message && <p className="text-xs text-gold">{message}</p>}

            {inSync.length > 0 && (
              <button
                disabled={saving}
                className="border border-hairline rounded-full px-3 py-1.5 text-xs text-moon hover:bg-card-hover transition-colors disabled:opacity-50"
                onClick={() => void linkInSync()}
              >
                Link the {inSync.length} books that already agree
              </button>
            )}

            {withDiffs.length > 0 && (
              <div className="flex gap-1 overflow-x-auto text-xs">
                {(['all', ...FIELDS] as const).map((f) => {
                  const count = f === 'all' ? withDiffs.length : fieldCounts[f]
                  return (
                    <button
                      key={f}
                      className={`px-2.5 py-1 rounded-full whitespace-nowrap ${
                        filter === f ? 'bg-gold text-night font-medium' : 'border border-hairline text-moon-dim'
                      }`}
                      onClick={() => setFilter(f)}
                    >
                      {f === 'all' ? 'All' : FIELD_LABELS[f]} ({count})
                    </button>
                  )
                })}
              </div>
            )}

            {filter !== 'all' && shown.length > 0 && (
              <div className="flex gap-2 text-xs">
                <button className="border border-hairline rounded-full px-2.5 py-1 text-moon" onClick={() => pickFieldForShown(filter, 'hc')}>
                  Pick Hardcover for all {shown.length}
                </button>
                <button className="border border-hairline rounded-full px-2.5 py-1 text-moon" onClick={() => pickFieldForShown(filter, 'ad')}>
                  Keep Ad Astra for all
                </button>
              </div>
            )}

            {readyToSave.length > 0 && (
              <button
                disabled={saving}
                className="w-full bg-gold text-night font-medium rounded-full px-4 py-2 text-sm disabled:opacity-50"
                onClick={() => void saveAllReady()}
              >
                {saving ? 'Saving…' : `Save the ${readyToSave.length} fully-picked books`}
              </button>
            )}

            <div className="space-y-2">
              {shown.map((row) => (
                <ReviewCard
                  key={row.book.id}
                  row={row}
                  picks={picksFor(row)}
                  saving={saving}
                  onPick={(field, v) => setPick(row, field, v)}
                  onPickAll={(v) => setAll(row, v)}
                  onSave={() => void save([row])}
                />
              ))}
              {withDiffs.length === 0 && <p className="text-sm text-moon-dim">Nothing left to review.</p>}
            </div>

            {result.unmatched.length > 0 && (
              <div>
                <button className="text-xs text-cosmic hover:text-moon transition-colors" onClick={() => setShowUnmatched((v) => !v)}>
                  {showUnmatched ? 'Hide' : 'Show'} the {result.unmatched.length} books not found on Hardcover
                </button>
                {showUnmatched && (
                  <ul className="mt-1.5 space-y-0.5 text-xs text-moon-dim">
                    {result.unmatched.map((b) => (
                      <li key={b.id}>
                        {b.title}
                        {b.author ? ` — ${b.author}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  )
}

function ReviewCard({
  row,
  picks,
  saving,
  onPick,
  onPickAll,
  onSave,
}: {
  row: CompareRow
  picks: Picks
  saving: boolean
  onPick: (field: FieldKey, v: Pick) => void
  onPickAll: (v: Pick) => void
  onSave: () => void
}) {
  const complete = row.diffs.every((d) => picks[d.field])
  const toggle = (active: boolean) =>
    `flex-1 text-left rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
      active ? 'border-gold bg-gold/10 text-moon' : 'border-hairline text-moon-dim hover:bg-card-hover'
    }`
  return (
    <div className="border border-hairline rounded-lg p-2.5 space-y-2">
      <div className="flex items-center gap-2.5">
        <BookCover title={row.book.title} coverUrl={row.book.coverUrl} seed={row.book.id} size="xs" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-moon truncate">{row.book.title}</p>
          <p className="text-[11px] text-moon-dim truncate">
            {row.book.author ?? 'Unknown author'} · Hardcover: {HC_STATUS_LABELS[row.entry.statusId] ?? `status ${row.entry.statusId}`}
            {row.how === 'title' ? ' · matched by title' : ''}
          </p>
        </div>
      </div>

      {row.diffs.map((d) => (
        <div key={d.field} className="space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-moon-dim">{FIELD_LABELS[d.field]}</p>
          <div className="flex gap-1.5">
            <button type="button" className={toggle(picks[d.field] === 'ad')} onClick={() => onPick(d.field, 'ad')}>
              <span className="block text-[10px] text-moon-dim">Ad Astra</span>
              {d.adLabel}
            </button>
            <button type="button" className={toggle(picks[d.field] === 'hc')} onClick={() => onPick(d.field, 'hc')}>
              <span className="block text-[10px] text-moon-dim">Hardcover</span>
              {d.hcLabel}
            </button>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-2 pt-0.5">
        <button type="button" className="text-[11px] text-cosmic hover:text-moon" onClick={() => onPickAll('ad')}>
          All Ad Astra
        </button>
        <button type="button" className="text-[11px] text-cosmic hover:text-moon" onClick={() => onPickAll('hc')}>
          All Hardcover
        </button>
        <button
          type="button"
          disabled={!complete || saving}
          className="ml-auto bg-gold text-night font-medium rounded-full px-3 py-1 text-xs disabled:opacity-40"
          onClick={onSave}
        >
          Save
        </button>
      </div>
    </div>
  )
}
