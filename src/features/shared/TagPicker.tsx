import { useState } from 'react'

interface Props {
  tags: string[]
  suggestions: string[]
  onChange: (tags: string[]) => void
}

/** A small multi-select for free-form tags. `suggestions` should be the
 *  starter set for the current category/context plus every tag already
 *  in use there — callers compute that union, this component just
 *  renders it and lets the user pick an existing one or type a new one. */
export function TagPicker({ tags, suggestions, onChange }: Props) {
  const [adding, setAdding] = useState(false)
  const [customTag, setCustomTag] = useState('')

  const available = suggestions.filter((s) => !tags.includes(s))

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (!trimmed || tags.includes(trimmed)) return
    onChange([...tags, trimmed])
    setCustomTag('')
    setAdding(false)
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <button
            key={t}
            className="text-xs border border-hairline rounded-full px-2.5 py-1 text-moon hover:text-red-400 transition-colors"
            onClick={() => removeTag(t)}
            title="Click to remove"
          >
            {t} ✕
          </button>
        ))}
        <button
          className="text-xs text-cosmic hover:text-moon transition-colors"
          onClick={() => setAdding((v) => !v)}
        >
          + Tag
        </button>
      </div>
      {adding && (
        <div className="space-y-1.5">
          {available.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {available.map((s) => (
                <button
                  key={s}
                  className="text-xs border border-hairline rounded-full px-2.5 py-1 text-moon-dim hover:text-moon hover:bg-card-hover transition-colors"
                  onClick={() => addTag(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              addTag(customTag)
            }}
          >
            <input
              autoFocus
              className="flex-1 border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon placeholder:text-moon-dim/60"
              placeholder="Custom tag…"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
            />
            <button
              type="submit"
              className="border border-hairline rounded-lg px-3 py-1.5 text-sm text-moon-dim hover:text-moon hover:bg-card-hover transition-colors"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
