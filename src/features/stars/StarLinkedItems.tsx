import { useState } from 'react'
import type { Star } from '@/types'
import type { Book } from '@/types/library'
import type { BucketListItem } from '@/types/bucketList'
import { BUCKET_LIST_CATEGORY_LABELS } from '@/types/bucketList'
import { BottomSheet } from '@/features/shared/BottomSheet'
import { BookForm } from '@/features/library/BookForm'
import { AttachPicker } from './AttachPicker'
import type { FacetDef, PickerItem } from './AttachPicker'

interface Props {
  star: Star
  books: Book[]
  bucketListItems: BucketListItem[]
  onUpdateBook: (id: string, patch: Partial<Book>) => void
  onUpdateBucketListItem: (id: string, patch: Partial<BucketListItem>) => void
  onCreateBook: (input: Partial<Book> & { title: string }) => void
}

const READ_STATUS_LABELS: Record<Book['readStatus'], string> = {
  want_to_read: 'Unread',
  reading: 'Reading',
  paused: 'Paused',
  read: 'Read',
  dnf: 'Did not finish',
}
const FORMAT_LABELS: Record<Book['format'], string> = {
  print: 'Physical',
  kindle: 'Kindle',
  audio: 'Audio',
  tbd: 'Not sure yet',
}

const uniqueSorted = (values: (string | undefined)[]) =>
  Array.from(new Set(values.filter((v): v is string => !!v))).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  )

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
  onCreateBook,
}: Props) {
  const [attaching, setAttaching] = useState<'book' | 'bucket' | null>(null)
  const [creatingBook, setCreatingBook] = useState(false)

  const linkedBooks = books.filter((b) => b.relatedStarIds.includes(star.id))
  const linkedItems = bucketListItems.filter((i) => i.relatedStarIds.includes(star.id))
  const availableBooks = books.filter((b) => !b.relatedStarIds.includes(star.id))
  const availableItems = bucketListItems.filter((i) => !i.relatedStarIds.includes(star.id))

  const bookPickerItems: PickerItem[] = availableBooks.map((b) => ({
    id: b.id,
    label: b.title,
    sub: [b.author, READ_STATUS_LABELS[b.readStatus]].filter(Boolean).join(' · '),
    facets: {
      status: b.readStatus,
      ownership: b.ownership === 'own' ? 'owned' : 'unowned',
      genre: b.genre,
      format: b.format,
      tag: b.tags,
    },
  }))
  const bookFacets: FacetDef[] = [
    {
      key: 'status',
      label: 'Read status',
      options: (Object.keys(READ_STATUS_LABELS) as Book['readStatus'][])
        .filter((v) => availableBooks.some((b) => b.readStatus === v))
        .map((v) => ({ value: v, label: READ_STATUS_LABELS[v] })),
    },
    {
      key: 'ownership',
      label: 'Ownership',
      options: [
        { value: 'owned', label: 'Owned' },
        { value: 'unowned', label: 'Unowned' },
      ],
    },
    {
      key: 'genre',
      label: 'Genre',
      options: uniqueSorted(availableBooks.map((b) => b.genre)).map((g) => ({ value: g, label: g })),
    },
    {
      key: 'format',
      label: 'Format',
      options: (Object.keys(FORMAT_LABELS) as Book['format'][])
        .filter((v) => availableBooks.some((b) => b.format === v))
        .map((v) => ({ value: v, label: FORMAT_LABELS[v] })),
    },
    {
      key: 'tag',
      label: 'Tag',
      options: uniqueSorted(availableBooks.flatMap((b) => b.tags)).map((t) => ({ value: t, label: t })),
    },
  ].filter((f) => f.options.length > 0)

  const bucketPickerItems: PickerItem[] = availableItems.map((i) => ({
    id: i.id,
    label: i.name,
    sub: BUCKET_LIST_CATEGORY_LABELS[i.category],
    facets: { category: i.category, tag: i.tags },
  }))
  const bucketFacets: FacetDef[] = [
    {
      key: 'category',
      label: 'Type',
      options: Array.from(new Set(availableItems.map((i) => i.category))).map((c) => ({
        value: c,
        label: BUCKET_LIST_CATEGORY_LABELS[c],
      })),
    },
    {
      key: 'tag',
      label: 'Tag',
      options: uniqueSorted(availableItems.flatMap((i) => i.tags)).map((t) => ({ value: t, label: t })),
    },
  ].filter((f) => f.options.length > 0)

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
      </div>

      {attaching === 'book' && (
        <AttachPicker
          title="Attach a book"
          items={bookPickerItems}
          facets={bookFacets}
          searchPlaceholder="Search title or author…"
          emptyText="No books match those filters."
          onClose={() => setAttaching(null)}
          onPick={(id) => {
            const book = books.find((b) => b.id === id)
            if (book) onUpdateBook(id, { relatedStarIds: toggleStarId(book.relatedStarIds, star.id) })
            setAttaching(null)
          }}
          addNew={{
            label: '+ Add a new book to the library',
            onClick: () => {
              setAttaching(null)
              setCreatingBook(true)
            },
          }}
        />
      )}

      {attaching === 'bucket' && (
        <AttachPicker
          title="Attach a bucket list item"
          items={bucketPickerItems}
          facets={bucketFacets}
          searchPlaceholder="Search bucket list…"
          emptyText="No items match those filters."
          onClose={() => setAttaching(null)}
          onPick={(id) => {
            const item = bucketListItems.find((i) => i.id === id)
            if (item) {
              onUpdateBucketListItem(id, { relatedStarIds: toggleStarId(item.relatedStarIds, star.id) })
            }
            setAttaching(null)
          }}
        />
      )}

      {creatingBook && (
        <BottomSheet title="Add a book" onClose={() => setCreatingBook(false)}>
          <BookForm
            onCancel={() => setCreatingBook(false)}
            onSave={(input) => {
              // Created already linked to this Star.
              onCreateBook({ ...input, relatedStarIds: [star.id] })
              setCreatingBook(false)
            }}
          />
        </BottomSheet>
      )}
    </div>
  )
}
