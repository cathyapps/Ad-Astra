import { useState } from 'react'
import { BottomSheet } from './BottomSheet'

interface Props {
  tags: string[]
  suggestions: string[]
  onChange: (tags: string[]) => void
  label?: string // e.g. "tags", "attributes" — used in the button/sheet title
  allowCustom?: boolean
}

/** The app-wide pattern for picking tags/attributes: only the tags
 *  actually applied show up as small badges under the item. Adding or
 *  changing them happens in a bottom sheet — a scrollable list of every
 *  available option, tap to toggle any number of them, "Done" commits
 *  the whole selection at once — rather than the options being listed
 *  inline in the main view.
 *
 *  This renders inside whatever form the caller (StarForm, TaskForm,
 *  etc.) already has open, so the custom-tag input below is NOT its own
 *  <form> — a nested <form> there caused its "Add" button to submit the
 *  outer form instead (see the same fix in BookSearch). */
export function TagsField({ tags, suggestions, onChange, label = 'tags', allowCustom = true }: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string[]>(tags)
  const [customTag, setCustomTag] = useState('')

  const allOptions = Array.from(new Set([...suggestions, ...tags]))

  function openSheet() {
    setDraft(tags)
    setCustomTag('')
    setOpen(true)
  }

  function toggle(tag: string) {
    setDraft((d) => (d.includes(tag) ? d.filter((t) => t !== tag) : [...d, tag]))
  }

  function addCustom() {
    const trimmed = customTag.trim()
    if (!trimmed || draft.includes(trimmed)) return
    setDraft((d) => [...d, trimmed])
    setCustomTag('')
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((t) => (
          <span key={t} className="text-xs border border-hairline rounded-full px-2.5 py-1 text-moon-dim">
            {t}
          </span>
        ))}
        <button type="button" className="text-xs text-cosmic hover:text-moon transition-colors" onClick={openSheet}>
          + Add {label}
        </button>
      </div>

      {open && (
        <BottomSheet title={`Add ${label}`} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5 max-h-72 overflow-y-auto">
              {allOptions.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => toggle(o)}
                  className={`text-xs border rounded-full px-2.5 py-1 transition-colors ${
                    draft.includes(o)
                      ? 'bg-cosmic text-night border-cosmic font-medium'
                      : 'border-hairline text-moon-dim hover:text-moon'
                  }`}
                >
                  {o}
                </button>
              ))}
              {allOptions.length === 0 && <p className="text-xs text-moon-dim">No options yet — add a custom one below.</p>}
            </div>

            {allowCustom && (
              <div className="flex gap-2">
                <input
                  className="flex-1 min-w-0 border border-hairline bg-night rounded-lg px-2.5 py-1.5 text-sm text-moon placeholder:text-moon-dim/60"
                  placeholder="Custom…"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustom()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addCustom}
                  className="border border-hairline rounded-lg px-3 py-1.5 text-sm text-moon-dim hover:text-moon hover:bg-card-hover transition-colors shrink-0"
                >
                  Add
                </button>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="border border-hairline rounded-lg px-3 py-2 text-sm flex-1 text-moon hover:bg-card-hover transition-colors"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm flex-1 bg-gold text-night font-medium"
                onClick={() => {
                  onChange(draft)
                  setOpen(false)
                }}
              >
                Done
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
