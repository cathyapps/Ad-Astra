// Add-book lookup against Hardcover. Searching returns lightweight hits; picking
// one fetches everything Hardcover has (pages, cover, EVERY mood and genre, the
// edition that matches the format you're adding) and turns it into a Book draft.

import type { Book, BookFormat } from '@/types/library'
import { callHardcover, editionKind, type HcEditionOption } from '@/lib/hardcover'
import { matchesBookFormat, optionCode } from '@/lib/hardcoverCompare'

type Json = Record<string, unknown>

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined)
const num = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined
}
const strList = (v: unknown): string[] => (Array.isArray(v) ? v.map(str).filter((x): x is string => !!x) : [])

export interface HcSearchHit {
  bookId: number
  title: string
  author?: string
  coverUrl?: string
  pages?: number
  year?: number
}

export async function searchHardcoverBooks(query: string): Promise<HcSearchHit[]> {
  const { hits } = await callHardcover<{ hits: Json[] }>({ op: 'search', q: query })
  const out: HcSearchHit[] = []
  for (const doc of hits ?? []) {
    const bookId = num(doc.id)
    const title = str(doc.title)
    if (bookId == null || !title) continue
    out.push({
      bookId,
      title,
      author: strList(doc.author_names)[0],
      coverUrl: str((doc.image as Json | undefined)?.url),
      pages: num(doc.pages),
      year: num(doc.release_year),
    })
  }
  return out
}

function tagNames(cached: unknown, category: string): string[] {
  if (!cached || typeof cached !== 'object') return []
  const list = (cached as Json)[category]
  if (!Array.isArray(list)) return []
  return list.map((t) => str((t as Json)?.tag)).filter((t): t is string => !!t)
}

function authorNames(cached: unknown): string[] {
  if (!Array.isArray(cached)) return []
  return cached
    .filter((c) => {
      const role = str((c as Json)?.contribution)
      return !role || role.toLowerCase() === 'author'
    })
    .map((c) => str(((c as Json)?.author as Json | undefined)?.name))
    .filter((n): n is string => !!n)
}

function parseEditions(raw: Json[]): (HcEditionOption & { audioSeconds?: number; pages?: number })[] {
  const out: (HcEditionOption & { audioSeconds?: number; pages?: number })[] = []
  for (const ed of raw) {
    const id = num(ed.id)
    if (id == null) continue
    const audioSeconds = num(ed.audio_seconds)
    out.push({
      id,
      isbn13: str(ed.isbn_13),
      isbn10: str(ed.isbn_10),
      asin: str(ed.asin)?.toUpperCase(),
      kind: editionKind({
        audioSeconds,
        readingFormat: str((ed.reading_format as Json | null | undefined)?.format),
        physicalFormat: str(ed.physical_format),
        editionFormat: str(ed.edition_format),
      }),
      detail: '',
      language: str((ed.language as Json | null | undefined)?.language),
      usersCount: num(ed.users_count),
      audioSeconds,
      pages: num(ed.pages),
    })
  }
  return out
}

/** The edition to attach: the right kind for the format being added, English first, with a usable code. */
function chooseEdition(editions: ReturnType<typeof parseEditions>, format: BookFormat) {
  const score = (e: (typeof editions)[number]) =>
    (matchesBookFormat(format, e.kind) ? 4 : 0) + (e.language?.toLowerCase() === 'english' ? 2 : 0) + (optionCode(e) ? 1 : 0)
  // Array.prototype.sort is stable, so ties keep Hardcover's most-read-first order.
  return [...editions].sort((a, b) => score(b) - score(a))[0]
}

/** Pulls a full Book draft for one Hardcover book. `format` is the format being added in the form. */
export async function buildHardcoverDraft(bookId: number, format: BookFormat): Promise<Partial<Book> & { title: string }> {
  const { book, editions: rawEditions } = await callHardcover<{ book: Json | null; editions: Json[] }>({ op: 'bookDetail', bookId })
  if (!book) throw new Error('Hardcover returned no details for that book.')
  const title = str(book.title)
  if (!title) throw new Error('Hardcover returned a book without a title.')

  const editions = parseEditions(rawEditions ?? [])
  const edition = chooseEdition(editions, format)
  const tags = book.cached_tags
  const moods = Array.from(new Set(tagNames(tags, 'Mood').map((m) => m.toLowerCase())))
  const genres = tagNames(tags, 'Genre')
  const warnings = tagNames(tags, 'Content Warning')

  const printPages = editions.find((e) => e.kind === 'print' && e.pages)?.pages
  const releaseYear = str(book.release_date)?.slice(0, 4)
  const authors = authorNames(book.cached_contributors)

  return {
    title,
    author: authors.length > 0 ? authors.join(', ') : undefined,
    // totalPages is always the PRINT page count in Ad Astra, even for ebook/audio copies.
    totalPages: num(book.pages) ?? printPages,
    totalMinutes: edition?.audioSeconds ? Math.round(edition.audioSeconds / 60) : undefined,
    coverUrl: str((book.image as Json | undefined)?.url),
    isbn: edition ? optionCode(edition) : undefined,
    publishYear: releaseYear ? Number(releaseYear) : undefined,
    subjects: genres.length > 0 ? genres : undefined,
    tags: moods,
    hardcoverBookId: bookId,
    hardcoverEditionId: edition?.id,
    externalMetadata: {
      source: 'hardcover',
      description: str(book.description),
      hardcoverRating: num(book.rating),
      hardcoverRatingsCount: num(book.ratings_count),
      ...(warnings.length > 0 ? { contentWarnings: warnings } : {}),
    },
  }
}
