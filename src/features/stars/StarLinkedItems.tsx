import { useState } from 'react'
import type { Star } from '@/types'
import type { Book } from '@/types/library'
import type { BucketListItem } from '@/types/bucketList'
import { BUCKET_LIST_CATEGORY_LABELS } from '@/types/bucketList'

interface Props {
  star: Star
  books: Book[]
  bucketListItems: BucketListItem[]
  onUpdateBook: (id: string, patch: Partial<Book>) => void
  onUpdateBucketListItem: (id: string, patch: Partial<BucketListItem>) => void
}

function toggleStarId(ids: string[], starId: string): string[] {
  return ids.includes(starId) ? ids.filter((id) => id !== starId) : [...ids, starId]
}

/** A Star can have Library books and Bucket List items attached to it —
 *  the relationship lives on the item's own relatedStarIds, same
 *  convention used everywhere else in the app. */
export function StarLinkedItems({
  star,
  books,
  bucketListItems,
  onUpdateBook,
  onUpdateBucketListItem,
}: Props) {
  const [attaching, setAttaching] = useState<'book' | 'bucket' | null>(null)

  const linkedBooks = books.filter((b) => b.relatedStarIds.includes(star.id))
  const linkedItems = bucketListItems.filter((i) => i.relatedStarIds.includes(star.id))
  const availableBooks = books.filter((b) => !b.relatedStarIds.includes(star.id))
  const availableItems = bucketListItems.filter((i) => !i.relatedStarIds.includes(star.id))

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-xs uppercase tracking-wide text-moon-dim">Library Books</h4>
          <button
            className="text-xs text-cosmic hover:text-moon transition-colors"
            onClick={() => setAttaching(attaching === 'book' ? null : 'book')}
          >
            + Attach
          </button>
        </div>
        {linkedBooks.length === 0 && <p className="text-xs text-moon-dim">None attached</p>}
        <div className="flex flex-wrap gap-1.5">
          {linkedBooks.map((b) => (
            <button
              key={b.id}
              className="text-xs border border-hairline rounded-full px-2.5 py-1 text-moon hover:text-red-400 transition-colors"
              onClick={() => onUpdateBook(b.id, { relatedStarIds: toggleStarId(b.relatedStarIds, star.id) })}
              title="Click to detach"
            >
              {b.title} ✕
            </button>
          ))}
        </div>
        {attaching === 'book' && (
          <select
            className="mt-2 w-full border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon"
            value=""
            onChange={(e) => {
              if (!e.target.value) return
              onUpdateBook(e.target.value, {
                relatedStarIds: toggleStarId(
                  books.find((b) => b.id === e.target.value)?.relatedStarIds ?? [],
                  star.id,
                ),
              })
              setAttaching(null)
            }}
          >
            <option value="">Choose a book…</option>
            {availableBooks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="text-xs uppercase tracking-wide text-moon-dim">Bucket List Items</h4>
          <button
            className="text-xs text-cosmic hover:text-moon transition-colors"
            onClick={() => setAttaching(attaching === 'bucket' ? null : 'bucket')}
          >
            + Attach
          </button>
        </div>
        {linkedItems.length === 0 && <p className="text-xs text-moon-dim">None attached</p>}
        <div className="flex flex-wrap gap-1.5">
          {linkedItems.map((i) => (
            <button
              key={i.id}
              className="text-xs border border-hairline rounded-full px-2.5 py-1 text-moon hover:text-red-400 transition-colors"
              onClick={() =>
                onUpdateBucketListItem(i.id, {
                  relatedStarIds: toggleStarId(i.relatedStarIds, star.id),
                })
              }
              title="Click to detach"
            >
              {i.name} ✕
            </button>
          ))}
        </div>
        {attaching === 'bucket' && (
          <select
            className="mt-2 w-full border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon"
            value=""
            onChange={(e) => {
              if (!e.target.value) return
              onUpdateBucketListItem(e.target.value, {
                relatedStarIds: toggleStarId(
                  bucketListItems.find((i) => i.id === e.target.value)?.relatedStarIds ?? [],
                  star.id,
                ),
              })
              setAttaching(null)
            }}
          >
            <option value="">Choose a bucket list item…</option>
            {availableItems.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({BUCKET_LIST_CATEGORY_LABELS[i.category]})
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}
