// Re-reads and pause history.
//
// A Book row always describes its CURRENT (or latest) reading. When a finished
// book is read again, the finished reading is archived into `book.readings`
// and the row starts over (new start date, no finish date, no ratings). That
// keeps every existing feature working on the row while history is kept here.
//
// Charts and the calendar want one entry per reading, so `expandReadings`
// turns each archived reading into a stand-in Book (id "<bookId>~r<n>",
// `sourceBookId` pointing at the real book) next to the real one.

import type { Book, BookFormat, BookPause, BookReading, BookReadStatus } from '@/types/library'

/** 1 for a book read once (or being read for the first time), 2 once it has been re-read, … */
export const currentReadingNumber = (book: Book): number => (book.readings?.length ?? 0) + 1

/** Identifies one reading of a book: the real id for the current reading, "<id>~r<n>" for earlier ones. */
export function readingKey(bookId: string, readingNumber: number | undefined, currentNumber: number): string {
  return readingNumber != null && readingNumber < currentNumber ? `${bookId}~r${readingNumber}` : bookId
}

function readingAsBook(book: Book, r: BookReading): Book {
  return {
    ...book,
    id: `${book.id}~r${r.number}`,
    sourceBookId: book.id,
    format: r.format,
    isbn: r.isbn,
    hardcoverEditionId: r.hardcoverEditionId,
    readStatus: r.status,
    startedAt: r.startedAt,
    completedAt: r.completedAt,
    rating: r.rating,
    ratingPlot: r.ratingPlot,
    ratingCharacters: r.ratingCharacters,
    ratingWriting: r.ratingWriting,
    review: r.review,
    notes: r.notes,
    pauses: r.pauses ?? [],
    readings: [],
  }
}

/** Every reading of every book as its own Book: earlier readings first, then the real (current) one. */
export function expandReadings(books: Book[]): Book[] {
  return books.flatMap((b) => [...(b.readings ?? []).map((r) => readingAsBook(b, r)), b])
}

/** The real book behind a per-reading stand-in (or the book itself). */
export const realBookId = (b: Book): string => b.sourceBookId ?? b.id

/** "Reading 2" label for a stand-in or for the current reading of a re-read book; empty for a first read. */
export function readingLabel(book: Book): string {
  if (book.sourceBookId) {
    const m = /~r(\d+)$/.exec(book.id)
    return m ? `Read ${m[1]}` : ''
  }
  return (book.readings?.length ?? 0) > 0 ? `Read ${currentReadingNumber(book)}` : ''
}

// --- re-reading ---------------------------------------------------------------

export interface RereadOptions {
  format: BookFormat
  /** Set when a different edition was picked for a different format. */
  isbn?: string
  hardcoverEditionId?: number
}

/** The patch that archives the finished reading and starts the book over as a new reading. */
export function rereadPatch(book: Book, opts: RereadOptions, nowIso: string): Partial<Book> {
  const snapshot: BookReading = {
    number: currentReadingNumber(book),
    format: book.format,
    isbn: book.isbn,
    hardcoverEditionId: book.hardcoverEditionId,
    startedAt: book.startedAt,
    completedAt: book.completedAt,
    status: book.readStatus === 'dnf' ? 'dnf' : 'read',
    rating: book.rating,
    ratingPlot: book.ratingPlot,
    ratingCharacters: book.ratingCharacters,
    ratingWriting: book.ratingWriting,
    review: book.review,
    notes: book.notes,
    pauses: book.pauses ?? [],
  }
  const formatChanged = opts.format !== book.format
  return {
    readings: [...(book.readings ?? []), snapshot],
    pauses: [],
    readStatus: 'reading',
    startedAt: nowIso,
    completedAt: undefined,
    rating: undefined,
    ratingPlot: undefined,
    ratingCharacters: undefined,
    ratingWriting: undefined,
    review: undefined,
    notes: '', // '' clears it (the stores only clear a text field when given a value)
    format: opts.format,
    // A different format is a different edition: use the one picked, or clear the old one
    // ('' and 0 mean "none"; the stores only clear a field when it is given a value).
    ...(formatChanged ? { isbn: opts.isbn ?? '', hardcoverEditionId: opts.hardcoverEditionId ?? 0 } : {}),
  }
}

// --- pause history --------------------------------------------------------------

/** New pause list when a book's status changes: opens a pause when it is paused, closes it when it resumes or ends. */
export function pausesAfterStatusChange(book: Book, newStatus: BookReadStatus, today: string): BookPause[] | undefined {
  if (newStatus === book.readStatus) return undefined
  const pauses = book.pauses ?? []
  const open = pauses.some((p) => !p.to)
  if (newStatus === 'paused') return open ? undefined : [...pauses, { from: today }]
  if (open) return pauses.map((p) => (p.to ? p : { ...p, to: today }))
  return undefined
}
