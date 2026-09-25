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
  onPromoteToStar?: (item: BucketListItem) => void
}

export function BucketListSection({ category, items, onUpdate, onDelete, onPromoteToStar }: Props) {
  const [open, setOpen] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [filterOpen, setFilterOpen] = useState(false)

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
        <div className="px-4 pb-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className={`flex items-center gap-1.5 text-xs border rounded-full px-2.5 py-1.5 transition-colors shrink-0 ${
                activeTags.length > 0
                  ? 'border-cosmic text-cosmic'
                  : 'border-hairline text-moon-dim hover:text-moon'
              }`}
              title="Filter by tag"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filter{activeTags.length > 0 ? ` (${activeTags.length})` : ''}
            </button>
            <select
              className="border border-hairline bg-night rounded-lg px-2 py-1 text-xs text-moon shrink-0"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              <option value="newest">Newest first</option>
              <option value="name">Name (A–Z)</option>
              <option value="status">Status</option>
            </select>
          </div>

          {filterOpen && (
            <div className="border border-hairline rounded-lg p-2.5 bg-night/40 space-y-2">
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
                {allTags.length === 0 && <p className="text-xs text-moon-dim">No tags yet.</p>}
              </div>
              {activeTags.length > 0 && (
                <button
                  type="button"
                  className="text-xs text-moon-dim hover:text-moon transition-colors"
                  onClick={() => setActiveTags([])}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

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
                  onPromoteToStar={onPromoteToStar}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
