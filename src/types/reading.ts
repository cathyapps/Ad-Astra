// Reading domain types — Phase 3 (spec §19).
// A Book, when linked to a Star via relatedStarIds, displays as one of
// that Star's Planets (see the Planets & Moons note in TaskList/StarDetail).
// linkedStarId (separate from relatedStarIds) is the auto-managed Star
// this book/list gets by itself — see src/lib/autoStars.ts.

export type BookStatus = 'want_to_read' | 'reading' | 'read' | 'dnf'

export const BOOK_STATUS_ORDER: BookStatus[] = ['want_to_read', 'reading', 'read', 'dnf']

export type BookFormat = 'physical' | 'ebook' | 'audiobook'

// How you have access to it, independent of format (an ebook can be
// owned or borrowed from the library same as a physical copy).
export type BookSource = 'owned' | 'library' | 'other'

export const BOOK_SOURCES: BookSource[] = ['owned', 'library', 'other']

export interface Book {
  id: string
  title: string
  author?: string
  series?: string
  genre?: string
  format?: BookFormat
  source: BookSource
  edition?: string
  location?: string
  status: BookStatus
  rating?: number // 1-5, set on completion

  // For turning a logged current-page / percent / audiobook-position into
  // a common "pages read" unit for stats. Either or both may be unknown.
  totalPages?: number
  totalMinutes?: number // audiobook runtime

  notes?: string

  relatedStarIds: string[]
  relatedConstellationIds: string[]
  linkedStarId?: string

  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type BookListType = 'custom' | 'lifetime' | 'series' | 'author' | 'challenge'

export const BOOK_LIST_TYPES: BookListType[] = ['custom', 'lifetime', 'series', 'author', 'challenge']

export interface BookList {
  id: string
  name: string
  description?: string
  type: BookListType
  relatedStarIds: string[]
  linkedStarId?: string
  createdAt: string
  updatedAt: string
}

export interface BookListItem {
  id: string
  bookListId: string
  bookId: string
  sortIndex: number
  createdAt: string
}

export type ReadingCompletionStatus = 'in_progress' | 'completed' | 'dnf'

// One entry in the Reading Log (spec §19). You log ONE progress marker —
// whichever fits how you're tracking this book — plus optionally how long
// you spent reading (for speed stats). "Pages read this session" is a
// derived stat (see src/lib/readingStats.ts), not something you type in:
// it's computed from the delta against the previous session's progress,
// converted to pages via the book's totalPages/totalMinutes.
export interface ReadingSession {
  id: string
  bookId: string
  date: string
  currentPage?: number
  currentTimeMinutes?: number // position within an audiobook, in minutes
  percentComplete?: number // 0-100
  minutesSpentReading?: number // session duration/effort, for speed stats
  notes?: string
  rating?: number
  completionStatus?: ReadingCompletionStatus
  createdAt: string
  updatedAt: string
}

export type ReadingGoalType = 'book_count' | 'page_count'

export interface ReadingChallenge {
  id: string
  name: string
  goalType: ReadingGoalType
  target: number
  startDate: string
  endDate: string
  notes?: string
  relatedStarIds: string[]
  createdAt: string
  updatedAt: string
}
