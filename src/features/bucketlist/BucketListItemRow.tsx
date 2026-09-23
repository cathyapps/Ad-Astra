import { useState } from 'react'
import type { BucketListItem } from '@/types/bucketList'
import { TagPicker } from '@/features/shared/TagPicker'
import { BucketListStatusBadge, nextBucketListStatus } from './bucketListLabels'

interface Props {
  item: BucketListItem
  tagSuggestions: string[]
  onUpdate: (id: string, patch: Partial<BucketListItem>) => void
  onDelete: (id: string) => void
}

export function BucketListItemRow({ item, tagSuggestions, onUpdate, onDelete }: Props) {
  const [notesOpen, setNotesOpen] = useState(false)

  function cycleStatus() {
    const status = nextBucketListStatus(item.status)
    onUpdate(item.id, {
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : undefined,
    })
  }

  return (
    <div className="border border-hairline rounded-lg px-3 py-2 bg-card space-y-2">
      <div className="flex items-center gap-2.5">
        <input
          className="flex-1 bg-transparent text-sm text-moon focus:outline-none"
          value={item.name}
          onChange={(e) => onUpdate(item.id, { name: e.target.value })}
        />
        <BucketListStatusBadge status={item.status} onClick={cycleStatus} />
        <button
          className="text-xs text-moon-dim hover:text-moon transition-colors"
          onClick={() => setNotesOpen((v) => !v)}
        >
          {notesOpen ? 'Hide' : 'Details'}
        </button>
        <button
          className="text-xs text-moon-dim hover:text-red-400 transition-colors"
          onClick={() => onDelete(item.id)}
        >
          ✕
        </button>
      </div>

      {item.tags.length > 0 && !notesOpen && (
        <div className="flex flex-wrap gap-1">
          {item.tags.map((t) => (
            <span key={t} className="text-xs text-moon-dim">
              #{t}
            </span>
          ))}
        </div>
      )}

      {notesOpen && (
        <div className="space-y-2 pt-1">
          <textarea
            className="w-full border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon placeholder:text-moon-dim/60"
            rows={2}
            placeholder="Notes…"
            value={item.notes ?? ''}
            onChange={(e) => onUpdate(item.id, { notes: e.target.value })}
          />
          <TagPicker
            tags={item.tags}
            suggestions={tagSuggestions}
            onChange={(tags) => onUpdate(item.id, { tags })}
          />
        </div>
      )}
    </div>
  )
}
