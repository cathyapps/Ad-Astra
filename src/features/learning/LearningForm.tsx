import { useState } from 'react'
import type { LearningGoal } from '@/types/learning'

const inputClass =
  'mt-1 w-full border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60'
const labelClass = 'text-sm block text-moon-dim'

interface Props {
  initial?: Partial<LearningGoal>
  // Only offered when creating a brand new goal — lets a free-form goal
  // start with its first sub-goal/task in one step.
  offerFirstItem?: boolean
  onSave: (input: Partial<LearningGoal> & { name: string }, firstItemName?: string) => void
  onCancel: () => void
}

export function LearningForm({ initial, offerFirstItem, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [firstItemName, setFirstItemName] = useState('')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        onSave(
          {
            ...initial,
            name: name.trim(),
            description: description || undefined,
            notes: notes || undefined,
          },
          firstItemName.trim() || undefined,
        )
      }}
    >
      <div>
        <label className={labelClass}>Goal</label>
        <input
          autoFocus
          className={inputClass}
          placeholder="e.g. Learn French, Learn piano, Refinery details for work"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {offerFirstItem && (
        <label className={labelClass}>
          First sub-goal or task (optional)
          <input
            className={inputClass}
            placeholder="e.g. Finish beginner course"
            value={firstItemName}
            onChange={(e) => setFirstItemName(e.target.value)}
          />
        </label>
      )}

      <label className={labelClass}>
        Description
        <textarea
          className={inputClass}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <label className={labelClass}>
        Notes
        <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          className="border border-hairline rounded-lg px-3 py-2.5 text-sm flex-1 text-moon hover:bg-card-hover transition-colors"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg px-3 py-2.5 text-sm flex-1 bg-gold text-night font-medium"
        >
          Save
        </button>
      </div>
    </form>
  )
}
