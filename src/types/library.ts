// Library domain types — Phase 6 redesign. `books` is now the single
// source of truth for every book you own, have read, or want to read
// (no more separate BookList/ReadingChallenge tables — a reading goal or
// challenge is just a Star now, and a book links to it via
// relatedStarIds same as everything else). ReadingLog is a pure daily
// progress entry — rating and read status live on the Book itself, not
// per log entry.

export type BookOwnership = 'own' | 'library' | 'tbd'
export const BOOK_OWNERSHIP_OPTIONS: BookOwnership[] = ['own', 'library', 'tbd']

export type BookFormat = 'kindle' | 'audio' | 'print' | 'tbd'
export const BOOK_FORMAT_OPTIONS: BookFormat[] = ['kindle', 'audio', 'print', 'tbd']

export type BookReadStatus = 'want_to_read' | 'reading' | 'read' | 'dnf'
export const BOOK_READ_STATUS_ORDER: BookReadStatus[] = ['want_to_read', 'reading', 'read', 'dnf']

export interface Book {
  id: string
  title: string
  author?: string
  series?: string
  genre?: string

  ownership: BookOwnership
  format: BookFormat
  readStatus: BookReadStatus

  // For turning a logged current-page / percent / audiobook-position into
  // a common "pages read" unit for stats. Either or both may be unknown.
  // totalPages is always the PRINT edition's page count, even for
  // kindle/audio copies — progress on those formats is logged as a
  // percentage and converted to "pages" via this number, so everything
  // ends up comparable in one unit.
  totalPages?: number
  totalMinutes?: number // audiobook runtime

  rating?: number // 1-5, set on completion
  notes?: string
  tags: string[]

  // Populated when the book was added via the Open Library search
  // (see src/lib/openLibrary.ts). All optional — a manually-entered book
  // just won't have these. `externalMetadata` is a catch-all for
  // whatever else Open Library returned that isn't one of the fields
  // above/below — kept even though the app doesn't display all of it
  // yet, since pulling it once now is free and re-fetching later isn't.
  isbn?: string
  coverUrl?: string
  publisher?: string
  publishYear?: number
  subjects?: string[]
  openLibraryWorkKey?: string
  externalMetadata?: Record<string, unknown>

  relatedStarIds: string[]

  startedAt?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

// One entry in the Reading Log. You log ONE progress marker — whichever
// fits how you're tracking this book — plus optionally how long you
// spent reading (for speed stats). "Pages read this session" is a
// derived stat (see src/lib/readingStats.ts), not something you type in:
// it's computed from the delta against the previous log's progress,
// converted to pages via the book's totalPages/totalMinutes.
export interface ReadingLog {
  id: string
  bookId: string
  date: string
  currentPage?: number
  currentTimeMinutes?: number // position within an audiobook, in minutes
  percentComplete?: number // 0-100
  minutesSpentReading?: number // session duration/effort, for speed stats
  notes?: string
  createdAt: string
}
