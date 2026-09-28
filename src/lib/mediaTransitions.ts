import type { BookReadStatus as BookStatus } from '@/types/library'
import type { WatchStatus } from '@/types/watching'

const ALL_BOOK_STATUSES: BookStatus[] = ['want_to_read', 'reading', 'paused', 'read', 'dnf']

// Books can move between any two statuses (e.g. reading -> TBR, read ->
// reading for a re-read, paused -> DNF), so this is just "everything
// except where it already is".
export function allowedBookTransitions(from: BookStatus): BookStatus[] {
  return ALL_BOOK_STATUSES.filter((s) => s !== from)
}

const WATCH_ALLOWED: Record<WatchStatus, WatchStatus[]> = {
  want_to_watch: ['watching'],
  watching: ['want_to_watch', 'watched', 'dnf'],
  watched: ['watching'], // rewatch
  dnf: ['want_to_watch', 'watching'],
}

export function allowedWatchTransitions(from: WatchStatus): WatchStatus[] {
  return WATCH_ALLOWED[from] ?? []
}
