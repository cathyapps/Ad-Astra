import type { BookReadStatus as BookStatus } from '@/types/library'
import type { WatchStatus } from '@/types/watching'

const BOOK_ALLOWED: Record<BookStatus, BookStatus[]> = {
  want_to_read: ['reading'],
  reading: ['want_to_read', 'read', 'dnf'],
  read: ['reading'], // re-read
  dnf: ['want_to_read', 'reading'],
}

export function allowedBookTransitions(from: BookStatus): BookStatus[] {
  return BOOK_ALLOWED[from] ?? []
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
