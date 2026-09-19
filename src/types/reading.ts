// Reading domain types — Phase 3 (spec §19).
// A Book, when linked to a Star via relatedStarIds, displays as one of
// that Star's Planets (see the Planets & Moons note in TaskList/StarDetail).

export type BookStatus = 'want_to_read' | 'reading' | 'read' | 'dnf'

export const BOOK_STATUS_ORDER: BookStatus[] = ['want_to_read', 'reading', 'read', 'dnf']

export type BookFormat = 'physical' | 'ebook' | 'audiobook'

export interface Book {
  id: string
  title: string
  author?: string
  series?: string
  genre?: string
  format?: BookFormat
  edition?: string
  owned: boolean
  location?: string
  status: BookStatus
  rating?: number // 1-5, set on completion
  notes?: string

  relatedStarIds: string[]
  relatedConstellationIds: string[]

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

// One entry in the Reading Log (spec §19). Logging a session with
// completionStatus 'completed' or 'dnf' updates the linked Book's status
// and rating — no separate "finish this book" action needed.
export interface ReadingSession {
  id: string
  bookId: string
  date: string
  pages?: number
  minutes?: number
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
