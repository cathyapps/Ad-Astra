import { useState } from 'react'
import { BOOK_LIST_TYPES, type Book, type BookList, type BookListType } from '@/types/reading'

const inputClass =
  'mt-1 w-full border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60'
const labelClass = 'text-sm block text-moon-dim'

interface FormProps {
  onSave: (input: Partial<BookList> & { name: string }) => void
  onCancel: () => void
}

export function BookListForm({ onSave, onCancel }: FormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<BookListType>('custom')

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        onSave({ name: name.trim(), description: description || undefined, type })
      }}
    >
      <label className={labelClass}>
        List name
        <input
          autoFocus
          className={inputClass}
          placeholder="e.g. Read all of Tolkien"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label className={labelClass}>
        Type
        <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as BookListType)}>
          {BOOK_LIST_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Description
        <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          className="border border-hairline rounded-lg px-3 py-2 text-sm flex-1 text-moon hover:bg-card-hover transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button type="submit" className="rounded-lg px-3 py-2 text-sm flex-1 bg-gold text-night font-medium">
          Save
        </button>
      </div>
    </form>
  )
}

interface PanelProps {
  lists: BookList[]
  books: Book[]
  listIdsByBook: Map<string, string[]>
  onSelectBook: (id: string) => void
}

export function BookListsPanel({ lists, books, listIdsByBook, onSelectBook }: PanelProps) {
  return (
    <div className="space-y-4">
      {lists.map((list) => {
        const members = books.filter((b) => listIdsByBook.get(b.id)?.includes(list.id))
        return (
          <div key={list.id} className="border border-hairline rounded-xl p-3 bg-card">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-moon">{list.name}</h3>
              <span className="text-xs text-moon-dim">{list.type}</span>
            </div>
            {list.description && <p className="text-xs text-moon-dim mt-1">{list.description}</p>}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {members.length === 0 && (
                <span className="text-xs text-moon-dim">No books yet — add from a book's detail view.</span>
              )}
              {members.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onSelectBook(b.id)}
                  className="text-xs border border-hairline rounded-full px-2.5 py-1 text-moon-dim hover:text-moon transition-colors"
                >
                  {b.title}
                </button>
              ))}
            </div>
          </div>
        )
      })}
      {lists.length === 0 && (
        <p className="text-sm text-moon-dim">No lists yet — create one below.</p>
      )}
    </div>
  )
}
