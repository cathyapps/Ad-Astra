// Open Library integration — lets the Library "Add book" flow pull in
// title/author/cover/page count/etc. instead of the person typing it
// all in by hand. No API key required; Open Library's endpoints allow
// browser CORS requests directly, so this hits them straight from the
// client with no proxy needed.
//
// Deliberately over-fetches: anything Open Library returns that isn't
// one of Book's named fields gets kept in `externalMetadata` rather
// than thrown away, per the "pull in whatever's available, even if we
// don't track it yet" ask.

import type { Book } from '@/types/library'

const SEARCH_FIELDS = [
  'key',
  'title',
  'author_name',
  'first_publish_year',
  'edition_key',
  'cover_i',
  'cover_edition_key',
  'subject',
  'isbn',
  'publisher',
  'language',
  'number_of_pages_median',
  'ratings_average',
  'ratings_count',
  'ebook_access',
  'first_sentence',
].join(',')

// Physical formats that count as "print" for page-count purposes.
// Audio/ebook editions either have no page count or one that doesn't
// mean the same thing, so they're excluded even if they carry a
// `number_of_pages` value.
const PRINT_FORMATS = new Set([
  'paperback',
  'hardcover',
  'hardback',
  'mass market paperback',
  'trade paperback',
  'library binding',
  'board book',
])

export interface OpenLibraryHit {
  workKey: string // e.g. "/works/OL45804W"
  title: string
  authorName?: string
  firstPublishYear?: number
  coverId?: number
  isbn?: string
  subjects?: string[]
  publisher?: string
  numberOfPagesMedian?: number
  raw: Record<string, unknown>
}

function coverUrl(coverId: number | undefined, size: 'S' | 'M' | 'L' = 'M'): string | undefined {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : undefined
}

export async function searchOpenLibrary(query: string): Promise<OpenLibraryHit[]> {
  const trimmed = query.trim()
  if (!trimmed) return []
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(trimmed)}&limit=10&fields=${SEARCH_FIELDS}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open Library search failed (${res.status})`)
  const data = (await res.json()) as { docs?: Record<string, unknown>[] }
  const docs = data.docs ?? []
  return docs.map((doc) => ({
    workKey: doc.key as string,
    title: doc.title as string,
    authorName: Array.isArray(doc.author_name) ? (doc.author_name as string[])[0] : undefined,
    firstPublishYear: doc.first_publish_year as number | undefined,
    coverId: doc.cover_i as number | undefined,
    isbn: Array.isArray(doc.isbn) ? (doc.isbn as string[])[0] : undefined,
    subjects: Array.isArray(doc.subject) ? (doc.subject as string[]).slice(0, 8) : undefined,
    publisher: Array.isArray(doc.publisher) ? (doc.publisher as string[])[0] : undefined,
    numberOfPagesMedian: doc.number_of_pages_median as number | undefined,
    raw: doc,
  }))
}

/** Looks at every edition of a work and returns the page count from the
 *  first print (paperback/hardcover/etc.) edition that has one. Falls
 *  back to undefined if the work has no print editions with a page
 *  count on file — callers should fall back to `numberOfPagesMedian`
 *  from the search hit in that case. */
export async function getPrintPageCount(workKey: string): Promise<number | undefined> {
  const res = await fetch(`https://openlibrary.org${workKey}/editions.json?limit=50`)
  if (!res.ok) return undefined
  const data = (await res.json()) as { entries?: Record<string, unknown>[] }
  const entries = data.entries ?? []
  for (const edition of entries) {
    const format = (edition.physical_format as string | undefined)?.toLowerCase()
    const pages = edition.number_of_pages as number | undefined
    if (format && PRINT_FORMATS.has(format) && typeof pages === 'number' && pages > 0) {
      return pages
    }
  }
  return undefined
}

/** Turns a chosen search hit into a ready-to-save Book draft. Fetches
 *  the print page count separately (the search endpoint only has a
 *  cross-edition median, which can include audio/ebook editions). */
export async function buildBookDraft(hit: OpenLibraryHit): Promise<Partial<Book> & { title: string }> {
  let totalPages: number | undefined
  try {
    totalPages = await getPrintPageCount(hit.workKey)
  } catch {
    // network hiccup — fall through to the median below rather than fail the whole lookup
  }
  if (totalPages == null) totalPages = hit.numberOfPagesMedian

  // Named fields we already map above get pulled out of `raw` so they
  // aren't duplicated inside externalMetadata.
  const {
    key: _key,
    title: _title,
    author_name: _authorName,
    first_publish_year: _firstPublishYear,
    cover_i: _coverI,
    isbn: _isbn,
    subject: _subject,
    publisher: _publisher,
    number_of_pages_median: _numberOfPagesMedian,
    ...restRaw
  } = hit.raw

  return {
    title: hit.title,
    author: hit.authorName,
    genre: hit.subjects?.[0],
    totalPages,
    isbn: hit.isbn,
    coverUrl: coverUrl(hit.coverId, 'L'),
    publisher: hit.publisher,
    publishYear: hit.firstPublishYear,
    subjects: hit.subjects,
    openLibraryWorkKey: hit.workKey,
    externalMetadata: restRaw,
  }
}
