import type { BookStatus } from '@/types/reading'

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  want_to_read: 'Want to Read',
  reading: 'Reading',
  read: 'Read',
  dnf: 'Did Not Finish',
}

export function BookStatusBadge({ status }: { status: BookStatus }) {
  const dot = status === 'reading' ? 'bg-gold' : status === 'read' ? 'bg-moon-dim' : 'bg-cosmic'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs border border-hairline rounded-full px-2.5 py-1 text-moon-dim">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {BOOK_STATUS_LABELS[status]}
    </span>
  )
}

export function StarRating({ rating }: { rating?: number }) {
  if (rating == null) return null
  return (
    <span className="text-xs text-gold">
      {'★'.repeat(Math.round(rating))}
      <span className="text-moon-dim">{'★'.repeat(5 - Math.round(rating))}</span>
    </span>
  )
}
