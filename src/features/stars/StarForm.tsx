import { useState } from 'react'
import type { Star, StarCategory, StarStage } from '@/types'
import { suggestedFieldsForStage } from '@/lib/starLifecycle'
import { STAGE_LABELS } from './stageLabels'

const CATEGORIES: StarCategory[] = [
  'travel',
  'learning',
  'creative',
  'home',
  'business',
  'reading',
  'health',
  'relationship',
  'other',
]

const inputClass =
  'mt-1 w-full border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60'
const labelClass = 'text-sm block text-moon-dim'

interface Props {
  initial?: Partial<Star>
  defaultStage?: StarStage
  onSave: (input: Partial<Star> & { name: string }) => void
  onCancel: () => void
}

export function StarForm({ initial, defaultStage = 'someday', onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<StarCategory | ''>(initial?.category ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [stage] = useState<StarStage>(initial?.stage ?? defaultStage)
  const [desiredTimeframe, setDesiredTimeframe] = useState(initial?.desiredTimeframe ?? '')
  const [roughRequirements, setRoughRequirements] = useState(initial?.roughRequirements ?? '')
  const [desiredOutcome, setDesiredOutcome] = useState(initial?.desiredOutcome ?? '')
  const [estimatedEffort, setEstimatedEffort] = useState(initial?.estimatedEffort ?? '')
  const [deadline, setDeadline] = useState(initial?.deadline ?? '')

  const suggested = new Set(suggestedFieldsForStage(stage).map((f) => f.field))

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        onSave({
          ...initial,
          name: name.trim(),
          category: category || undefined,
          description: description || undefined,
          stage,
          desiredTimeframe: desiredTimeframe || undefined,
          roughRequirements: roughRequirements || undefined,
          desiredOutcome: desiredOutcome || undefined,
          estimatedEffort: estimatedEffort || undefined,
          deadline: deadline || undefined,
        })
      }}
    >
      <div>
        <label className={labelClass}>What's the star?</label>
        <input
          autoFocus
          className={inputClass}
          placeholder="e.g. Learn to sail"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <label className={`${labelClass} flex-1`}>
          Category
          <select
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value as StarCategory)}
          >
            <option value="">—</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <div className={`${labelClass} flex-1`}>
          <span>Stage</span>
          <span className="mt-1 block py-2 text-moon">{STAGE_LABELS[stage]}</span>
        </div>
      </div>

      <label className={labelClass}>
        Notes
        <textarea
          className={inputClass}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      {suggested.has('desiredTimeframe') && (
        <label className={labelClass}>
          Desired timeframe
          <input
            className={inputClass}
            placeholder="e.g. next summer"
            value={desiredTimeframe}
            onChange={(e) => setDesiredTimeframe(e.target.value)}
          />
        </label>
      )}
      {suggested.has('roughRequirements') && (
        <label className={labelClass}>
          Rough requirements
          <input
            className={inputClass}
            value={roughRequirements}
            onChange={(e) => setRoughRequirements(e.target.value)}
          />
        </label>
      )}
      {suggested.has('desiredOutcome') && (
        <label className={labelClass}>
          Desired outcome
          <input
            className={inputClass}
            value={desiredOutcome}
            onChange={(e) => setDesiredOutcome(e.target.value)}
          />
        </label>
      )}
      {suggested.has('desiredOutcome') && (
        <label className={labelClass}>
          Estimated effort
          <input
            className={inputClass}
            placeholder="e.g. ~10 hours over 3 weekends"
            value={estimatedEffort}
            onChange={(e) => setEstimatedEffort(e.target.value)}
          />
        </label>
      )}

      <label className={labelClass}>
        Deadline (optional — only if something external forces a date)
        <input
          type="date"
          className={inputClass}
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
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
