// Bucket List domain types — Phase 6 redesign. A single list of "someday
// I'd like to..." ideas across 4 categories. Travel destinations are
// pure ideas (no other table covers them); book/show/movie items can
// optionally link to a promoted Library book or Watchable once you
// actually start tracking it richly there.

export type BucketListCategory = 'travel_destination' | 'book' | 'show' | 'movie'

export const BUCKET_LIST_CATEGORIES: BucketListCategory[] = [
  'travel_destination',
  'book',
  'show',
  'movie',
]

export const BUCKET_LIST_CATEGORY_LABELS: Record<BucketListCategory, string> = {
  travel_destination: 'Travel Destinations',
  book: 'Books to Read',
  show: 'Shows to Watch',
  movie: 'Movies to Watch',
}

export type BucketListStatus = 'backlog' | 'in_progress' | 'completed'

export const BUCKET_LIST_STATUS_ORDER: BucketListStatus[] = ['backlog', 'in_progress', 'completed']

export const BUCKET_LIST_STATUS_LABELS: Record<BucketListStatus, string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  completed: 'Completed',
}

// Starter tag suggestions per category — the actual available tags in
// the UI are this set plus whatever the user has already used in that
// category (derived from existing items, not stored separately).
export const BUCKET_LIST_STARTER_TAGS: Record<BucketListCategory, string[]> = {
  travel_destination: ['international', 'domestic', 'beach', 'city', 'hiking', 'food', 'culture'],
  book: ['fiction', 'nonfiction', 'fantasy', 'sci-fi', 'memoir', 'mystery', 'classic'],
  show: ['drama', 'comedy', 'documentary', 'sci-fi', 'reality', 'anime'],
  movie: ['drama', 'comedy', 'documentary', 'sci-fi', 'horror', 'animated'],
}

export interface BucketListItem {
  id: string
  category: BucketListCategory
  name: string
  notes?: string
  status: BucketListStatus
  tags: string[]

  relatedStarIds: string[]
  bookId?: string // set once a 'book' item is promoted to a real Library record
  watchableId?: string // set once a 'show'/'movie' item is promoted to a real Watchable

  createdAt: string
  updatedAt: string
  completedAt?: string
}
