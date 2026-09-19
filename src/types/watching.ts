// Watching domain types — movies & TV, built on the same framework as
// reading.ts (spec §19 pattern, extended per user request).
// A tv_show's episodes are its Moons — see Episode below.

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

  relatedStarIds: string[]
  relatedConstellationIds: string[]

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

export type WatchListType = 'custom' | 'lifetime' | 'franchise' | 'challenge'

export const WATCH_LIST_TYPES: WatchListType[] = ['custom', 'lifetime', 'franchise', 'challenge']

export interface WatchList {
  id: string
  name: string
  description?: string
  type: WatchListType
  relatedStarIds: string[]
  createdAt: string
  updatedAt: string
}

export interface WatchListItem {
  id: string
  watchListId: string
  watchableId: string
  sortIndex: number
  createdAt: string
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

export interface WatchChallenge {
  id: string
  name: string
  target: number // count of movies/shows to finish in the period
  startDate: string
  endDate: string
  notes?: string
  relatedStarIds: string[]
  createdAt: string
  updatedAt: string
}
