import { useMemo, useState } from 'react'
import type { Book } from '@/types/library'
import { BottomSheet } from '@/features/shared/BottomSheet'
import { BookCover } from './BookCover'
import {
  fetchBookEditions,
  fetchEditionsByCode,
  fetchHardcoverLibrary,
  HC_STATUS_LABELS,
  type HcEdition,
  type HcEditionOption,
} from '@/lib/hardcover'
import {
  altPatch,
  compareLibraries,
  FIELD_LABELS,
  linkPatch,
  matchesBookFormat,
  optionCode,
  type CompareResult,
  type CompareRow,
  type FieldKey,
} from '@/lib/hardcoverCompare'

type Pick = 'ad' | 'hc' | 'alt'
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
  const [editions, setEditions] = useState<Map<string, HcEdition>>(new Map())
  const [alts, setAlts] = useState<Record<string, HcEditionOption>>({})

  async function load() {
    setPhase('loading')
    setError('')
    setMessage('')
    try {
      const { username: name, entries } = await fetchHardcoverLibrary()
      const compared = compareLibraries(books, entries)
      setUsername(name)
      setResult(compared)
      setPicks({})
      setAlts({})

      // Ad Astra has no moods for these books, so Hardcover's are taken as-is
      // (nothing is overwritten). Books you've already reviewed are left alone.
      const fills: BookPatch[] = []
      for (const row of compared.rows) {
        if (row.book.hardcoverReviewedAt) continue
        const mood = row.diffs.find((d) => d.field === 'moods' && d.auto)
        if (mood) fills.push({ id: row.book.id, patch: mood.patch })
      }
      if (fills.length > 0) {
        const failed = await onApplyPatches(fills)
        setMessage(
          failed > 0
            ? `Filled moods for ${fills.length - failed} books from Hardcover; ${failed} couldn't be saved.`
            : `Filled in moods from Hardcover for ${fills.length} books that had none.`,
        )
      }

      // Format + page count of the ISBN currently on each Ad Astra book (best effort).
      try {
        const codes = compared.rows.flatMap((r) => r.diffs.filter((d) => d.field === 'isbn' && d.adCode).map((d) => d.adCode!))
        setEditions(await fetchEditionsByCode(codes))
      } catch {
        setEditions(new Map())
      }
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
  // Mood fills for empty books were already applied on load, so only real choices are shown.
  const choices = (r: CompareRow) => r.diffs.filter((d) => !d.auto)
  const withDiffs = pending.filter((r) => choices(r).length > 0)
  const inSync = pending.filter((r) => choices(r).length === 0)
  const shown = filter === 'all' ? withDiffs : withDiffs.filter((r) => choices(r).some((d) => d.field === filter))
  const fieldCounts = Object.fromEntries(
    FIELDS.map((f) => [f, withDiffs.filter((r) => choices(r).some((d) => d.field === f)).length]),
  ) as Record<FieldKey, number>

  const picksFor = (row: CompareRow): Picks => picks[row.book.id] ?? {}
  const fullyPicked = (row: CompareRow) => choices(row).every((d) => picksFor(row)[d.field])
  const readyToSave = shown.filter(fullyPicked)

  function setPick(row: CompareRow, field: FieldKey, value: Pick) {
    setPicks((p) => ({ ...p, [row.book.id]: { ...p[row.book.id], [field]: value } }))
  }

  function setAll(row: CompareRow, value: Pick) {
    setPicks((p) => ({ ...p, [row.book.id]: Object.fromEntries(choices(row).map((d) => [d.field, value])) }))
  }

  /** Bulk helper: choose Hardcover (or Ad Astra) for one field across every book shown. Saves nothing. */
  function pickFieldForShown(field: FieldKey, value: Pick) {
    setPicks((p) => {
      const next = { ...p }
      for (const row of shown) {
        if (choices(row).some((d) => d.field === field)) next[row.book.id] = { ...next[row.book.id], [field]: value }
      }
      return next
    })
  }

  function patchFor(row: CompareRow): BookPatch {
    const chosen = picksFor(row)
    let patch: Partial<Book> = { ...linkPatch(row, chosen), hardcoverReviewedAt: new Date().toISOString() }
    for (const d of choices(row)) {
      if (chosen[d.field] === 'hc') patch = { ...patch, ...d.patch }
      else if (chosen[d.field] === 'alt' && d.field === 'isbn' && alts[row.book.id]) patch = { ...patch, ...altPatch(alts[row.book.id]) }
    }
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
    const hcCount = readyToSave.reduce((n, r) => n + choices(r).filter((d) => picksFor(r)[d.field] === 'hc').length, 0)
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
                  diffs={choices(row)}
                  editions={editions}
                  alt={alts[row.book.id]}
                  onChooseEdition={(opt) => {
                    setAlts((a) => ({ ...a, [row.book.id]: opt }))
                    setPick(row, 'isbn', 'alt')
                  }}
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

/** What the ISBN currently on the Ad Astra book is: its edition's format and length from
 *  Hardcover when known, otherwise the book's own format and page total as a stand-in. */
function adIsbnDetail(row: CompareRow, code: string | undefined, editions: Map<string, HcEdition>): string {
  if (!code) return ''
  const ed = editions.get(code.toUpperCase())
  if (ed?.detail) return ed.detail
  const own = [row.book.format !== 'tbd' ? row.book.format : undefined, row.book.totalPages ? `${row.book.totalPages} pp` : undefined]
    .filter(Boolean)
    .join(' · ')
  return own ? `not on Hardcover · book record: ${own}` : 'not on Hardcover'
}

function ReviewCard({
  row,
  picks,
  diffs,
  editions,
  alt,
  onChooseEdition,
  saving,
  onPick,
  onPickAll,
  onSave,
}: {
  row: CompareRow
  picks: Picks
  diffs: CompareRow['diffs']
  editions: Map<string, HcEdition>
  alt?: HcEditionOption
  onChooseEdition: (opt: HcEditionOption) => void
  saving: boolean
  onPick: (field: FieldKey, v: Pick) => void
  onPickAll: (v: Pick) => void
  onSave: () => void
}) {
  const complete = diffs.every((d) => picks[d.field])
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

      {diffs.map((d) => (
        <div key={d.field} className="space-y-1">
          <p className="text-[11px] uppercase tracking-wide text-moon-dim">{FIELD_LABELS[d.field]}</p>
          <div className="flex gap-1.5">
            <button type="button" className={toggle(picks[d.field] === 'ad')} onClick={() => onPick(d.field, 'ad')}>
              <span className="block text-[10px] text-moon-dim">Ad Astra</span>
              {d.adLabel}
              {d.field === 'isbn' && <span className="block text-moon-dim">{adIsbnDetail(row, d.adCode, editions)}</span>}
            </button>
            <button type="button" className={toggle(picks[d.field] === 'hc')} onClick={() => onPick(d.field, 'hc')}>
              <span className="block text-[10px] text-moon-dim">Hardcover</span>
              {d.hcLabel}
            </button>
          </div>
          {d.field === 'isbn' && alt && (
            <button type="button" className={`w-full ${toggle(picks.isbn === 'alt')}`} onClick={() => onPick('isbn', 'alt')}>
              <span className="block text-[10px] text-moon-dim">Other Hardcover edition</span>
              {optionCode(alt) ?? 'no ISBN or ASIN on Hardcover (links the edition only)'} · {alt.detail || 'format unknown'}
            </button>
          )}
          {d.field === 'isbn' && d.formatWarning && <p className="text-[11px] text-gold">{d.formatWarning}</p>}
          {d.field === 'isbn' && <EditionFinder row={row} onChoose={onChooseEdition} />}
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

/** Lists the other editions Hardcover has for this book, those matching the Ad Astra format
 *  first, so you can pick the one you actually read when neither side is right. */
function EditionFinder({ row, onChoose }: { row: CompareRow; onChoose: (opt: HcEditionOption) => void }) {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState('')
  const [options, setOptions] = useState<HcEditionOption[]>([])
  const [showAll, setShowAll] = useState(false)

  async function find() {
    setPhase('loading')
    setError('')
    try {
      setOptions(await fetchBookEditions(row.entry.bookId))
      setPhase('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setPhase('error')
    }
  }

  const wanted = row.book.format
  const matching = options.filter((o) => matchesBookFormat(wanted, o.kind))
  const list = showAll ? options : matching
  const label = wanted === 'tbd' ? 'any format' : wanted === 'kindle' ? 'ebook' : wanted

  return (
    <div className="space-y-1">
      {phase === 'idle' && (
        <button type="button" className="text-[11px] text-cosmic hover:text-moon" onClick={() => void find()}>
          Find other editions ({label})
        </button>
      )}
      {phase === 'loading' && <p className="text-[11px] text-moon-dim">Looking up editions…</p>}
      {phase === 'error' && (
        <p className="text-[11px] text-red-300">
          {error}{' '}
          <button type="button" className="underline" onClick={() => void find()}>
            retry
          </button>
        </p>
      )}
      {phase === 'ready' && (
        <div className="space-y-1">
          <p className="text-[11px] text-moon-dim">
            {showAll ? `All ${options.length} editions` : `${matching.length} ${label} editions`} on Hardcover, most-used first
          </p>
          {list.length === 0 && <p className="text-[11px] text-moon-dim">None found in this format.</p>}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {list.slice(0, showAll ? 100 : 12).map((o) => (
              <button
                key={o.id}
                type="button"
                className="w-full text-left rounded-lg border border-hairline px-2.5 py-1.5 text-xs text-moon-dim hover:bg-card-hover transition-colors"
                onClick={() => onChoose(o)}
              >
                <span className="text-moon">{optionCode(o) ?? 'no ISBN or ASIN'}</span> · {o.detail || 'format unknown'}
                <span className="block text-[10px]">
                  {[o.publisher, o.year, o.language, o.usersCount ? `${o.usersCount} readers` : undefined].filter(Boolean).join(' · ')}
                </span>
              </button>
            ))}
          </div>
          <button type="button" className="text-[11px] text-cosmic hover:text-moon" onClick={() => setShowAll((v) => !v)}>
            {showAll ? `Only ${label}` : 'Show all formats'}
          </button>
        </div>
      )}
    </div>
  )
}
