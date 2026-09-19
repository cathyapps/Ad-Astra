import type { WatchStatus } from '@/types/watching'

export const WATCH_STATUS_LABELS: Record<WatchStatus, string> = {
  want_to_watch: 'Want to Watch',
  watching: 'Watching',
  watched: 'Watched',
  dnf: 'Did Not Finish',
}

export function WatchStatusBadge({ status }: { status: WatchStatus }) {
  const dot = status === 'watching' ? 'bg-gold' : status === 'watched' ? 'bg-moon-dim' : 'bg-cosmic'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs border border-hairline rounded-full px-2.5 py-1 text-moon-dim">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {WATCH_STATUS_LABELS[status]}
    </span>
  )
}

export function WatchStarRating({ rating }: { rating?: number }) {
  if (rating == null) return null
  return (
    <span className="text-xs text-gold">
      {'★'.repeat(Math.round(rating))}
      <span className="text-moon-dim">{'★'.repeat(5 - Math.round(rating))}</span>
    </span>
  )
}
