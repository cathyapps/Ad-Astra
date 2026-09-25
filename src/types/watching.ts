// Watching domain types — movies & TV. A tv_show's episodes are its
// Moons — see Episode below. Phase 6: dropped WatchList/WatchChallenge
// (a watch-related goal is just a Star now) and the auto-star column;
// added tags for the Bucket List's show/movie categories.

export type WatchableType = 'movie' | 'tv_show'

export type WatchStatus = 'want_to_watch' | 'watching' | 'watched' | 'dnf'

export const WATCH_STATUS_ORDER: WatchStatus[] = ['want_to_watch', 'watching', 'watched', 'dnf']

export type WatchFormat = 'streaming' | 'disc' | 'theater'

export interface Watchable {
  id: string
  title: string
  type: WatchableType
  genre?: string
  format?: WatchFormat
  status: WatchStatus
  rating?: number // 1-5, set on completion
  notes?: string
  tags: string[]
  streamingSource?: string // e.g. "Netflix", "Hulu" — where you'd actually watch it

  relatedStarIds: string[]

  createdAt: string
  updatedAt: string
  completedAt?: string
}

// A season/episode of a tv_show Watchable — its Moons. Not used for movies.
export interface Episode {
  id: string
  watchableId: string
  season?: number
  episodeNumber?: number
  name?: string
  watched: boolean
  notes?: string
  sortIndex: number
  createdAt: string
  updatedAt: string
}

export type ViewingCompletionStatus = 'in_progress' | 'completed' | 'dnf'

export interface ViewingSession {
  id: string
  watchableId: string
  date: string
  minutes?: number
  notes?: string
  rating?: number
  completionStatus?: ViewingCompletionStatus
  createdAt: string
  updatedAt: string
}
