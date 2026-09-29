// Bulk "fill in missing details" for books already in the Library.
//
// Looks each book up by ISBN (Open Library first, Google Books as backup)
// and falls back to a title + author search when there's no usable ISBN
// (blank, or an Amazon-style B0... ID that Open Library doesn't know).
//
// Rules:
//  - Only ever FILLS BLANKS. Anything already on the book is never
//    overwritten.
//  - An ISBN hit is trusted. A title/author search hit is auto-applied only
//    when the title matches exactly and the author matches; weaker matches
//    come back as `review` so the person can confirm with a tap.
//  - totalPages is the PRINT edition's page count (see types/library.ts),
//    so audio editions never supply it directly — we look at the work's
//    print editions instead.
//  - Runs from the browser, politely: two lookups at a time, a short pause
//    between books, one retry on rate-limit/server errors.

import type { Book } from '@/types/library'
import { getPrintPageCount, searchOpenLibrary, type OpenLibraryHit } from '@/lib/openLibrary'

export type EnrichPatch = Partial<
  Pick<Book, 'totalPages' | 'coverUrl' | 'publisher' | 'publishYear' | 'openLibraryWorkKey' | 'isbn'>
>

export type EnrichSource = 'openlibrary-isbn' | 'google-isbn' | 'openlibrary-search'

export interface EnrichCandidate {
  patch: EnrichPatch
  source: EnrichSource
  matchedTitle?: string
  matchedAuthor?: string
}

export type EnrichResult =
  | { kind: 'filled'; patch: EnrichPatch; source: EnrichSource }
  | { kind: 'review'; candidate: EnrichCandidate }
  | { kind: 'none' }
  | { kind: 'error'; message: string }

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** A book is worth looking up if it has no page count or no cover. */
export function needsEnrichment(book: Book): boolean {
  return book.totalPages == null || !book.coverUrl
}

/** Returns a clean ISBN-10/13, or undefined for blanks and things like
 *  Amazon ASINs (B0B9Y6T6VM) that the ISBN endpoints can't resolve. */
export function normalizeIsbn(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const s = raw.replace(/[\s-]/g, '').toUpperCase()
  if (/^97[89]\d{10}$/.test(s)) return s
  if (/^\d{9}[\dX]$/.test(s)) return s
  return undefined
}

/** Keeps only the fields the book is actually missing. */
export function fillBlanks(book: Book, patch: EnrichPatch): EnrichPatch {
  const out: EnrichPatch = {}
  if (book.totalPages == null && patch.totalPages) out.totalPages = patch.totalPages
  if (!book.coverUrl && patch.coverUrl) out.coverUrl = patch.coverUrl
  if (!book.publisher && patch.publisher) out.publisher = patch.publisher
  if (book.publishYear == null && patch.publishYear) out.publishYear = patch.publishYear
  if (!book.openLibraryWorkKey && patch.openLibraryWorkKey) out.openLibraryWorkKey = patch.openLibraryWorkKey
  if (!book.isbn && patch.isbn) out.isbn = patch.isbn
  return out
}

// --- network helper -------------------------------------------------------

async function fetchJson<T>(url: string): Promise<T | undefined> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000)
    try {
      const res = await fetch(url, { signal: controller.signal })
      if (res.ok) return (await res.json()) as T
      if (res.status === 404) return undefined
      // 4xx other than rate-limiting won't get better on retry
      if (res.status !== 429 && res.status < 500) return undefined
    } catch {
      // timeout or network blip — fall through to the retry
    } finally {
      clearTimeout(timer)
    }
    await sleep(1500 * (attempt + 1))
  }
  throw new Error('Lookup failed (network or rate limit)')
}

const coverFromId = (id: number) => `https://covers.openlibrary.org/b/id/${id}-L.jpg`

// --- Open Library by ISBN -------------------------------------------------

interface OLEdition {
  works?: { key: string }[]
  number_of_pages?: number
  physical_format?: string
  publishers?: string[]
  covers?: number[]
}

async function lookupOpenLibraryIsbn(isbn: string): Promise<EnrichPatch | undefined> {
  const edition = await fetchJson<OLEdition>(`https://openlibrary.org/isbn/${isbn}.json`)
  if (!edition) return undefined

  const patch: EnrichPatch = {}
  const workKey = edition.works?.[0]?.key
  if (workKey) patch.openLibraryWorkKey = workKey
  const coverId = edition.covers?.find((id) => id > 0)
  if (coverId) patch.coverUrl = coverFromId(coverId)
  if (edition.publishers?.[0]) patch.publisher = edition.publishers[0]

  const isAudioEdition = /audio|cd|mp3/i.test(edition.physical_format ?? '')
  if (!isAudioEdition && edition.number_of_pages && edition.number_of_pages > 0) {
    patch.totalPages = edition.number_of_pages
  } else if (workKey) {
    // audio edition (or no page count on this one) — use the work's print editions
    const pages = await getPrintPageCount(workKey).catch(() => undefined)
    if (pages) patch.totalPages = pages
  }
  return patch
}

// --- Google Books by ISBN (backup) ---------------------------------------

interface GoogleVolume {
  items?: {
    volumeInfo?: {
      pageCount?: number
      publisher?: string
      imageLinks?: { thumbnail?: string; smallThumbnail?: string }
    }
  }[]
}

async function lookupGoogleIsbn(isbn: string): Promise<EnrichPatch | undefined> {
  const data = await fetchJson<GoogleVolume>(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`,
  )
  const info = data?.items?.[0]?.volumeInfo
  if (!info) return undefined
  const patch: EnrichPatch = {}
  if (info.pageCount && info.pageCount > 0) patch.totalPages = info.pageCount
  if (info.publisher) patch.publisher = info.publisher
  const thumb = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail
  if (thumb) patch.coverUrl = thumb.replace(/^http:/, 'https:')
  return patch
}

// --- Open Library title + author search (no usable ISBN) -----------------

function norm(s: string | undefined): string {
  return (s ?? '')
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, ' ') // "(Part 1 of 2)", "[Dramatized Adaptation]"
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/^(the|a|an)\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function lastName(author: string | undefined): string {
  const parts = norm(author).split(' ').filter(Boolean)
  return parts[parts.length - 1] ?? ''
}

interface ScoredHit {
  hit: OpenLibraryHit
  titleScore: 0 | 1 | 2 // 2 = exact, 1 = one contains the other
  authorMatch: boolean
}

function scoreHits(book: Book, hits: OpenLibraryHit[]): ScoredHit | undefined {
  const wantTitle = norm(book.title)
  const wantLast = lastName(book.author)
  let best: ScoredHit | undefined
  for (const hit of hits) {
    const gotTitle = norm(hit.title)
    let titleScore: 0 | 1 | 2 = 0
    if (gotTitle && gotTitle === wantTitle) titleScore = 2
    else if (gotTitle && wantTitle && (gotTitle.startsWith(wantTitle) || wantTitle.startsWith(gotTitle))) titleScore = 1
    if (titleScore === 0) continue
    const authorMatch = wantLast !== '' && norm(hit.authorName).includes(wantLast)
    const candidate = { hit, titleScore, authorMatch }
    const rank = (s: ScoredHit) => s.titleScore * 2 + (s.authorMatch ? 3 : 0)
    if (!best || rank(candidate) > rank(best)) best = candidate
  }
  return best
}

async function lookupBySearch(book: Book): Promise<EnrichResult> {
  const cleanTitle = book.title.replace(/\(.*?\)|\[.*?\]/g, ' ').replace(/\s+/g, ' ').trim()
  const hits = await searchOpenLibrary(`${cleanTitle} ${book.author ?? ''}`)
  const scored = scoreHits(book, hits)
  if (!scored) return { kind: 'none' }

  const { hit, titleScore, authorMatch } = scored
  const patch: EnrichPatch = { openLibraryWorkKey: hit.workKey }
  if (hit.coverId) patch.coverUrl = coverFromId(hit.coverId)
  if (hit.publisher) patch.publisher = hit.publisher
  if (hit.firstPublishYear) patch.publishYear = hit.firstPublishYear
  if (hit.isbn) patch.isbn = hit.isbn
  const pages = (await getPrintPageCount(hit.workKey).catch(() => undefined)) ?? hit.numberOfPagesMedian
  if (pages) patch.totalPages = pages

  const candidate: EnrichCandidate = {
    patch,
    source: 'openlibrary-search',
    matchedTitle: hit.title,
    matchedAuthor: hit.authorName,
  }
  // Exact title + matching author is safe to apply on its own.
  if (titleScore === 2 && authorMatch) {
    const useful = fillBlanks(book, patch)
    return Object.keys(useful).length > 0 ? { kind: 'filled', patch: useful, source: 'openlibrary-search' } : { kind: 'none' }
  }
  return { kind: 'review', candidate }
}

// --- one book -------------------------------------------------------------

export async function enrichBook(book: Book): Promise<EnrichResult> {
  const isbn = normalizeIsbn(book.isbn)

  if (isbn) {
    const fromOpenLibrary = await lookupOpenLibraryIsbn(isbn)
    let merged: EnrichPatch = { ...(fromOpenLibrary ?? {}) }
    let source: EnrichSource = 'openlibrary-isbn'

    // Google Books only if Open Library left a gap we care about.
    const stillMissingPages = book.totalPages == null && !merged.totalPages
    const stillMissingCover = !book.coverUrl && !merged.coverUrl
    if (stillMissingPages || stillMissingCover) {
      const fromGoogle = await lookupGoogleIsbn(isbn)
      if (fromGoogle) {
        merged = {
          ...fromGoogle,
          ...merged, // Open Library wins wherever it had something
          totalPages: merged.totalPages ?? fromGoogle.totalPages,
          coverUrl: merged.coverUrl ?? fromGoogle.coverUrl,
        }
        if (!fromOpenLibrary || Object.keys(fromOpenLibrary).length === 0) source = 'google-isbn'
      }
    }

    const useful = fillBlanks(book, merged)
    if (Object.keys(useful).length > 0) return { kind: 'filled', patch: useful, source }
  }

  // No usable ISBN, or the ISBN lookups had nothing new: try title + author.
  return lookupBySearch(book)
}

// --- many books -----------------------------------------------------------

export interface EnrichRunOptions {
  signal?: AbortSignal
  concurrency?: number
  onResult: (book: Book, result: EnrichResult, done: number, total: number) => void
}

export async function enrichBooks(books: Book[], opts: EnrichRunOptions): Promise<void> {
  const queue = [...books]
  let done = 0

  async function worker() {
    while (queue.length > 0 && !opts.signal?.aborted) {
      const book = queue.shift()!
      let result: EnrichResult
      try {
        result = await enrichBook(book)
      } catch (err) {
        result = { kind: 'error', message: err instanceof Error ? err.message : 'Lookup failed' }
      }
      done++
      opts.onResult(book, result, done, books.length)
      await sleep(250)
    }
  }

  await Promise.all(Array.from({ length: opts.concurrency ?? 2 }, worker))
}
