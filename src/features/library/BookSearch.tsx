import { useState, type FormEvent } from 'react'
import type { Book } from '@/types/library'
import { buildBookDraft, searchOpenLibrary, type OpenLibraryHit } from '@/lib/openLibrary'

interface Props {
  onPick: (draft: Partial<Book> & { title: string }) => void
}

/** Lets you search Open Library and prefill the Add Book form instead
 *  of typing everything by hand. Picking a result fetches the print
 *  edition's page count (search results only have a rougher
 *  cross-edition median) before handing the draft back. */
export function BookSearch({ onPick }: Props) {
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<OpenLibraryHit[]>([])
  const [status, setStatus] = useState<'idle' | 'searching' | 'error'>('idle')
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  async function runSearch(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setStatus('searching')
    try {
      const results = await searchOpenLibrary(query)
      setHits(results)
      setStatus('idle')
    } catch {
      setStatus('error')
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
      <form className="flex gap-2" onSubmit={runSearch}>
        <input
          className="flex-1 border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60"
          placeholder="Search by title or author…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="border border-hairline rounded-lg px-3 py-2 text-sm text-moon hover:bg-card-hover transition-colors"
          disabled={status === 'searching'}
        >
          {status === 'searching' ? 'Searching…' : 'Search'}
        </button>
      </form>

      {status === 'error' && (
        <p className="text-xs text-red-400">Couldn't reach Open Library — you can still enter details below.</p>
      )}

      {hits.length > 0 && (
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
