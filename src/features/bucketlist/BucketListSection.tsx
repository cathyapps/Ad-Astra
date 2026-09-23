import { useMemo, useState } from 'react'
import type { BucketListCategory, BucketListItem } from '@/types/bucketList'
import { BUCKET_LIST_CATEGORY_LABELS, BUCKET_LIST_STARTER_TAGS } from '@/types/bucketList'
import { BucketListItemRow } from './BucketListItemRow'

type SortKey = 'name' | 'status' | 'newest'

const SORTERS: Record<SortKey, (a: BucketListItem, b: BucketListItem) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  status: (a, b) => a.status.localeCompare(b.status),
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
}

interface Props {
  category: BucketListCategory
  items: BucketListItem[]
  onUpdate: (id: string, patch: Partial<BucketListItem>) => void
  onDelete: (id: string) => void
}

export function BucketListSection({ category, items, onUpdate, onDelete }: Props) {
  const [open, setOpen] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const [activeTags, setActiveTags] = useState<string[]>([])

  const allTags = useMemo(() => {
    const used = new Set(items.flatMap((i) => i.tags))
    return Array.from(new Set([...BUCKET_LIST_STARTER_TAGS[category], ...used]))
  }, [items, category])

  const visible = useMemo(() => {
    const filtered =
      activeTags.length === 0 ? items : items.filter((i) => i.tags.some((t) => activeTags.includes(t)))
    return [...filtered].sort(SORTERS[sortKey])
  }, [items, activeTags, sortKey])

  function toggleTag(tag: string) {
    setActiveTags((cur) => (cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag]))
  }

  return (
    <div className="border border-hairline rounded-xl bg-card">
      <button
        className="w-full flex items-center justify-between px-4 py-3"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-medium text-moon">
          {BUCKET_LIST_CATEGORY_LABELS[category]} ({items.length})
        </span>
        <span className="text-moon-dim text-xs">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className={`text-xs border rounded-full px-2.5 py-1 transition-colors ${
                    activeTags.includes(t)
                      ? 'bg-cosmic text-night border-cosmic font-medium'
                      : 'border-hairline text-moon-dim hover:text-moon'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <select
              className="border border-hairline bg-night rounded-lg px-2 py-1 text-xs text-moon"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              <option value="newest">Newest first</option>
              <option value="name">Name (A–Z)</option>
              <option value="status">Status</option>
            </select>
          </div>

          {visible.length === 0 ? (
            <p className="text-sm text-moon-dim">
              {items.length === 0 ? 'Nothing here yet.' : 'No items match the selected tags.'}
            </p>
          ) : (
            <div className="space-y-1.5">
              {visible.map((item) => (
                <BucketListItemRow
                  key={item.id}
                  item={item}
                  tagSuggestions={allTags}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
