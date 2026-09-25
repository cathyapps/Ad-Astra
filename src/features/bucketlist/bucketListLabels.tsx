import {
  BUCKET_LIST_STATUS_LABELS,
  BUCKET_LIST_STATUS_ORDER,
  TRAVEL_STAGE_LABELS,
  TRAVEL_STAGE_ORDER,
} from '@/types/bucketList'
import type { BucketListCategory, BucketListItemStatus } from '@/types/bucketList'

const STATUS_DOT: Record<string, string> = {
  backlog: 'bg-moon-dim',
  in_progress: 'bg-gold',
  completed: 'bg-cosmic',
  bucket_list: 'bg-moon-dim',
  on_the_radar: 'bg-gold',
  progressing_to_star: 'bg-cosmic',
}

function orderFor(category: BucketListCategory): readonly string[] {
  return category === 'travel_destination' ? TRAVEL_STAGE_ORDER : BUCKET_LIST_STATUS_ORDER
}

function labelFor(category: BucketListCategory, status: BucketListItemStatus): string {
  return category === 'travel_destination'
    ? TRAVEL_STAGE_LABELS[status as keyof typeof TRAVEL_STAGE_LABELS]
    : BUCKET_LIST_STATUS_LABELS[status as keyof typeof BUCKET_LIST_STATUS_LABELS]
}

export function nextBucketListStatus(
  category: BucketListCategory,
  status: BucketListItemStatus,
): BucketListItemStatus {
  const order = orderFor(category)
  const idx = order.indexOf(status)
  return order[(idx + 1) % order.length] as BucketListItemStatus
}

export function BucketListStatusBadge({
  category,
  status,
  onClick,
}: {
  category: BucketListCategory
  status: BucketListItemStatus
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      title={onClick ? 'Click to advance' : undefined}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs border border-hairline rounded-full px-2.5 py-1 text-moon-dim hover:text-moon hover:bg-card-hover transition-colors shrink-0"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {labelFor(category, status)}
    </button>
  )
}
