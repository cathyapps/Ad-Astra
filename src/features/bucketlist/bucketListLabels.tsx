import { BUCKET_LIST_STATUS_LABELS, BUCKET_LIST_STATUS_ORDER } from '@/types/bucketList'
import type { BucketListStatus } from '@/types/bucketList'

const STATUS_DOT: Record<BucketListStatus, string> = {
  backlog: 'bg-moon-dim',
  in_progress: 'bg-gold',
  completed: 'bg-cosmic',
}

export function nextBucketListStatus(status: BucketListStatus): BucketListStatus {
  const idx = BUCKET_LIST_STATUS_ORDER.indexOf(status)
  return BUCKET_LIST_STATUS_ORDER[(idx + 1) % BUCKET_LIST_STATUS_ORDER.length]
}

export function BucketListStatusBadge({
  status,
  onClick,
}: {
  status: BucketListStatus
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      title={onClick ? 'Click to cycle status' : undefined}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs border border-hairline rounded-full px-2.5 py-1 text-moon-dim hover:text-moon hover:bg-card-hover transition-colors shrink-0"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {BUCKET_LIST_STATUS_LABELS[status]}
    </button>
  )
}
