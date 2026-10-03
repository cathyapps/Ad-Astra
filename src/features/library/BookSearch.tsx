import { useState, type KeyboardEvent } from 'react'
import type { Book, BookFormat } from '@/types/library'
import { buildBookDraft, searchOpenLibrary, type OpenLibraryHit } from '@/lib/openLibrary'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { buildHardcoverDraft, searchHardcoverBooks, type HcSearchHit } from '@/lib/hardcoverLookup'

interface Props {
  onPick: (draft: Partial<Book> & { title: string }) => void
  /** The format chosen in the form, so the matching Hardcover edition (e.g. the audiobook) is picked. */
  format?: BookFormat
}

/** Lets you search Open Library and prefill the Add Book form instead
 *  of typing everything by hand. Picking a result fetches the print
 *  edition's page count (search results only have a rougher
 *  cross-edition median) before handing the draft back.
 *
 *  Deliberately NOT a <form> — this renders inside BookForm's own
 *  <form>, and a nested <form> there caused the Search button to
 *  submit/reset the outer form instead of running a search. Enter-to-
 *  search is handled manually below instead. */
export function BookSearch({ onPick, format = 'tbd' }: Props) {
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<OpenLibraryHit[]>([])
  const [hcHits, setHcHits] = useState<HcSearchHit[]>([])
  const [source, setSource] = useState<'hardcover' | 'openlibrary'>(isSupabaseConfigured ? 'hardcover' : 'openlibrary')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'idle' | 'searching' | 'error'>('idle')
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  async function runSearch() {
    if (!query.trim()) return
    setStatus('searching')
    setNote('')
    setHits([])
    setHcHits([])
    // Hardcover first; if it is unreachable or finds nothing, fall back to Open Library.
    if (isSupabaseConfigured) {
      try {
        const found = await searchHardcoverBooks(query)
        if (found.length > 0) {
          setSource('hardcover')
          setHcHits(found)
          setStatus('idle')
          return
        }
        setNote('Hardcover had no match; showing Open Library results.')
      } catch (err) {
        setNote(`Hardcover lookup unavailable (${err instanceof Error ? err.message : 'error'}); showing Open Library results.`)
      }
    }
    setSource('openlibrary')
    try {
      setHits(await searchOpenLibrary(query))
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  async function pickHardcover(hit: HcSearchHit) {
    setLoadingKey(`hc-${hit.bookId}`)
    try {
      onPick(await buildHardcoverDraft(hit.bookId, format))
    } catch {
      // Detail lookup failed: still hand back what the search result had, and link the book.
      onPick({
        title: hit.title,
        author: hit.author,
        totalPages: hit.pages,
        coverUrl: hit.coverUrl,
        publishYear: hit.year,
        hardcoverBookId: hit.bookId,
      })
    } finally {
      setLoadingKey(null)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      runSearch()
    }
  }

  async function pick(hit: OpenLibraryHit) {
    setLoadingKey(hit.workKey)
    try {
      const draft = await buildBookDraft(hit)
      onPick(draft)
    } catch {
      // if the page-count lookup fails, still hand back what we have from the search hit
      onPick({
        title: hit.title,
        author: hit.authorName,
        genre: hit.subjects?.[0],
        totalPages: hit.numberOfPagesMedian,
        isbn: hit.isbn,
        publisher: hit.publisher,
        publishYear: hit.firstPublishYear,
        subjects: hit.subjects,
        openLibraryWorkKey: hit.workKey,
      })
    } finally {
      setLoadingKey(null)
    }
  }

  return (
    <div className="border border-hairline rounded-lg p-3 space-y-2.5 bg-night/40">
      <div className="flex gap-2">
        <input
          className="flex-1 border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60"
          placeholder="Search by title, author or ISBN…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          onClick={runSearch}
          className="border border-hairline rounded-lg px-3 py-2 text-sm text-moon hover:bg-card-hover transition-colors"
          disabled={status === 'searching'}
        >
          {status === 'searching' ? 'Searching…' : 'Search'}
        </button>
      </div>

      {status === 'error' && (
        <p className="text-xs text-red-400">Couldn't reach Open Library — you can still enter details below.</p>
      )}
      {note && <p className="text-xs text-moon-dim">{note}</p>}

      {source === 'hardcover' && hcHits.length > 0 && (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {hcHits.map((hit) => (
            <button
              key={hit.bookId}
              type="button"
              onClick={() => void pickHardcover(hit)}
              disabled={loadingKey === `hc-${hit.bookId}`}
              className="w-full flex items-center gap-2.5 border border-hairline rounded-lg px-2.5 py-2 text-left hover:bg-card-hover transition-colors disabled:opacity-60"
            >
              {hit.coverUrl ? (
                <img src={hit.coverUrl} alt="" className="w-8 h-11 object-cover rounded shrink-0 bg-night" />
              ) : (
                <div className="w-8 h-11 rounded shrink-0 bg-night border border-hairline" />
              )}
              <div className="min-w-0">
                <div className="text-sm text-moon truncate">{hit.title}</div>
                <div className="text-xs text-moon-dim truncate">
                  {hit.author ?? 'Unknown author'}
                  {hit.year ? ` · ${hit.year}` : ''}
                  {hit.pages ? ` · ${hit.pages} pp` : ''}
                </div>
              </div>
              {loadingKey === `hc-${hit.bookId}` && <span className="text-xs text-moon-dim ml-auto">Loading…</span>}
            </button>
          ))}
        </div>
      )}

      {source === 'openlibrary' && hits.length > 0 && (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {hits.map((hit) => (
            <button
              key={hit.workKey}
              type="button"
              onClick={() => pick(hit)}
              disabled={loadingKey === hit.workKey}
              className="w-full flex items-center gap-2.5 border border-hairline rounded-lg px-2.5 py-2 text-left hover:bg-card-hover transition-colors disabled:opacity-60"
            >
              {hit.coverId ? (
                <img
                  src={`https://covers.openlibrary.org/b/id/${hit.coverId}-S.jpg`}
                  alt=""
                  className="w-8 h-11 object-cover rounded shrink-0 bg-night"
                />
              ) : (
                <div className="w-8 h-11 rounded shrink-0 bg-night border border-hairline" />
              )}
              <div className="min-w-0">
                <div className="text-sm text-moon truncate">{hit.title}</div>
                <div className="text-xs text-moon-dim truncate">
                  {hit.authorName ?? 'Unknown author'}
                  {hit.firstPublishYear ? ` · ${hit.firstPublishYear}` : ''}
                </div>
              </div>
              {loadingKey === hit.workKey && <span className="text-xs text-moon-dim ml-auto">Loading…</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
