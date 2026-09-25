// Bucket List domain types — Phase 6 redesign, Phase 9 travel/tag rework.
// A single list of "someday I'd like to..." ideas. Books to read moved
// entirely into the Library (it already owns want-to-read tracking) so
// "book" is no longer a Bucket List category. Travel destinations get
// their own 3-stage flow instead of the generic backlog/in-progress/
// completed one — see TravelStage below.

export type BucketListCategory = 'travel_destination' | 'show' | 'movie'

export const BUCKET_LIST_CATEGORIES: BucketListCategory[] = ['travel_destination', 'show', 'movie']

export const BUCKET_LIST_CATEGORY_LABELS: Record<BucketListCategory, string> = {
  travel_destination: 'Travel Destinations',
  show: 'Shows to Watch',
  movie: 'Movies to Watch',
}

// show/movie items use this generic flow.
export type BucketListStatus = 'backlog' | 'in_progress' | 'completed'
export const BUCKET_LIST_STATUS_ORDER: BucketListStatus[] = ['backlog', 'in_progress', 'completed']
export const BUCKET_LIST_STATUS_LABELS: Record<BucketListStatus, string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  completed: 'Completed',
}

// Travel destinations flow toward becoming a Star instead of toward
// "completed" — a destination isn't "done", it's promoted once you're
// ready to actually plan it (Planets/Moons, dates, etc. all live on the
// Star from that point on).
export type TravelStage = 'bucket_list' | 'on_the_radar' | 'progressing_to_star'
export const TRAVEL_STAGE_ORDER: TravelStage[] = ['bucket_list', 'on_the_radar', 'progressing_to_star']
export const TRAVEL_STAGE_LABELS: Record<TravelStage, string> = {
  bucket_list: 'Bucket List',
  on_the_radar: 'On the Radar',
  progressing_to_star: 'Progressing to Star',
}

export type BucketListItemStatus = BucketListStatus | TravelStage

// Starter tag suggestions per category — the actual available tags in
// the UI are this set plus whatever the user has already used in that
// category (derived from existing items, not stored separately).
// Travel tags describe *when in life* a trip fits rather than what kind
// of trip it is — the idea being some destinations only make sense pre-
// kids, or once you're retired, etc.
export const BUCKET_LIST_STARTER_TAGS: Record<BucketListCategory, string[]> = {
  travel_destination: [
    'pre-kids',
    'with young kids',
    'with teenagers',
    'empty nesters',
    'retired',
    'young & active',
    'milestone/anniversary',
    'solo trip',
    'big group',
  ],
  show: ['drama', 'comedy', 'documentary', 'sci-fi', 'reality', 'anime'],
  movie: ['drama', 'comedy', 'documentary', 'sci-fi', 'horror', 'animated'],
}

export interface BucketListItem {
  id: string
  category: BucketListCategory
  name: string
  notes?: string
  status: BucketListItemStatus
  tags: string[]

  // show/movie only — where you'd actually watch it.
  streamingSource?: string

  relatedStarIds: string[]
  watchableId?: string // set once a 'show'/'movie' item is promoted to a real Watchable

  createdAt: string
  updatedAt: string
  completedAt?: string
}
