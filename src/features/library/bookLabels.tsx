import type { BookReadStatus } from '@/types/library'
import { allowedBookTransitions } from '@/lib/mediaTransitions'

export const READ_STATUS_LABELS: Record<BookReadStatus, string> = {
  want_to_read: 'Want to Read',
  reading: 'Reading',
  read: 'Read',
  dnf: 'DNF',
}

const STATUS_DOT: Record<BookReadStatus, string> = {
  want_to_read: 'bg-moon-dim',
  reading: 'bg-gold',
  read: 'bg-cosmic',
  dnf: 'bg-moon-dim',
}

export function ReadStatusBadge({ status }: { status: BookReadStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs border border-hairline rounded-full px-2.5 py-1 text-moon-dim">
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {READ_STATUS_LABELS[status]}
    </span>
  )
}

export { allowedBookTransitions }
