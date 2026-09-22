import { useState } from 'react'
import type { Constellation, Star } from '@/types'

const inputClass =
  'mt-1 w-full border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60'

interface FormProps {
  onSave: (input: Partial<Constellation> & { name: string }) => void
  onCancel: () => void
}

export function ConstellationForm({ onSave, onCancel }: FormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        onSave({ name: name.trim(), description: description || undefined })
      }}
    >
      <div>
        <label className="text-sm block text-moon-dim">Constellation name</label>
        <input
          autoFocus
          className={inputClass}
          placeholder="e.g. Becoming a better cook"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <label className="text-sm block text-moon-dim">
        Description
        <textarea
          className={inputClass}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          className="border border-hairline rounded-lg px-3 py-2 text-sm flex-1 text-moon hover:bg-card-hover transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg px-3 py-2 text-sm flex-1 bg-gold text-night font-medium"
        >
          Save
        </button>
      </div>
    </form>
  )
}

interface DetailProps {
  constellation: Constellation
  stars: Star[]
  onUpdate: (patch: Partial<Constellation>) => void
  onDelete: () => void
  onSelectStar: (id: string) => void
  onClose: () => void
}

/** Connecting Stars together: toggle any Star's membership in this
 *  Constellation. Membership is just `starIds` on the Constellation —
 *  a Star can belong to more than one. */
export function ConstellationDetail({
  constellation,
  stars,
  onUpdate,
  onDelete,
  onSelectStar,
  onClose,
}: DetailProps) {
  const memberIds = new Set(constellation.starIds)

  function toggle(starId: string) {
    const next = memberIds.has(starId)
      ? constellation.starIds.filter((id) => id !== starId)
      : [...constellation.starIds, starId]
    onUpdate({ starIds: next })
  }

  return (
    <div className="border border-hairline rounded-xl p-4 space-y-4 bg-card">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-lg text-moon">{constellation.name}</h2>
          {constellation.description && (
            <p className="text-sm text-moon-dim mt-1">{constellation.description}</p>
          )}
        </div>
        <button className="text-sm text-moon-dim hover:text-moon" onClick={onClose}>
          Close
        </button>
      </div>

      <div>
        <h3 className="text-sm font-medium text-moon mb-2">Member Stars</h3>
        <div className="flex flex-wrap gap-1.5">
          {stars.map((s) => (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              className={`text-xs border rounded-full px-2.5 py-1 transition-colors ${
                memberIds.has(s.id)
                  ? 'bg-cosmic text-night border-cosmic font-medium'
                  : 'border-hairline text-moon-dim hover:text-moon'
              }`}
            >
              {s.name}
            </button>
          ))}
          {stars.length === 0 && <span className="text-xs text-moon-dim">No Stars yet</span>}
        </div>
      </div>

      {constellation.starIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {constellation.starIds.map((id) => {
            const s = stars.find((x) => x.id === id)
            if (!s) return null
            return (
              <button
                key={id}
                className="text-xs text-cosmic hover:text-moon transition-colors underline"
                onClick={() => onSelectStar(id)}
              >
                Open {s.name}
              </button>
            )
          })}
        </div>
      )}

      <button className="text-xs text-moon-dim hover:text-red-400 transition-colors" onClick={onDelete}>
        Delete constellation
      </button>
    </div>
  )
}
