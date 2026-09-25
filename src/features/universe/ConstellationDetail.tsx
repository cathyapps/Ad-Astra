import { useState } from 'react'
import type { Constellation, Star } from '@/types'
import { EditButton } from '@/features/shared/EditButton'
import { BottomSheet } from '@/features/shared/BottomSheet'

const inputClass =
  'mt-1 w-full border border-hairline bg-night rounded-lg px-3 py-2 text-sm text-moon placeholder:text-moon-dim/60'

interface FormProps {
  initial?: Partial<Constellation>
  onSave: (input: Partial<Constellation> & { name: string }) => void
  onCancel: () => void
}

export function ConstellationForm({ initial, onSave, onCancel }: FormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [shortName, setShortName] = useState(initial?.shortName ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        onSave({ name: name.trim(), shortName: shortName.trim() || undefined, description: description || undefined })
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
      <div>
        <label className="text-sm block text-moon-dim">Short name (shown on the Universe map)</label>
        <input
          className={inputClass}
          placeholder="e.g. Cooking"
          maxLength={16}
          value={shortName}
          onChange={(e) => setShortName(e.target.value)}
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

/** Connecting Stars together: a Constellation's membership is just
 *  `starIds` — a Star can belong to more than one. Only the current
 *  members show up in the main view as badges; picking members happens
 *  in the "+ Add stars" sheet instead of an always-visible toggle list. */
export function ConstellationDetail({
  constellation,
  stars,
  onUpdate,
  onDelete,
  onSelectStar,
  onClose,
}: DetailProps) {
  const [editing, setEditing] = useState(false)
  const [pickingStars, setPickingStars] = useState(false)
  const [draft, setDraft] = useState<string[]>([])
  const members = stars.filter((s) => constellation.starIds.includes(s.id))

  function openPicker() {
    setDraft(constellation.starIds)
    setPickingStars(true)
  }

  return (
    <div className="border border-hairline rounded-xl p-4 space-y-4 bg-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg text-moon">{constellation.name}</h2>
            <EditButton onClick={() => setEditing(true)} label="Edit constellation" />
          </div>
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
        <div className="flex flex-wrap items-center gap-1.5">
          {members.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectStar(s.id)}
              className="text-xs border border-hairline rounded-full px-2.5 py-1 text-moon-dim hover:text-moon transition-colors"
            >
              {s.name}
            </button>
          ))}
          <button
            type="button"
            className="text-xs text-cosmic hover:text-moon transition-colors"
            onClick={openPicker}
          >
            + Add stars
          </button>
        </div>
      </div>

      <button className="text-xs text-moon-dim hover:text-red-400 transition-colors" onClick={onDelete}>
        Delete constellation
      </button>

      {editing && (
        <BottomSheet title="Edit constellation" onClose={() => setEditing(false)}>
          <ConstellationForm
            initial={constellation}
            onSave={(patch) => {
              onUpdate(patch)
              setEditing(false)
            }}
            onCancel={() => setEditing(false)}
          />
        </BottomSheet>
      )}

      {pickingStars && (
        <BottomSheet title="Add stars" onClose={() => setPickingStars(false)}>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5 max-h-72 overflow-y-auto">
              {stars.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setDraft((d) => (d.includes(s.id) ? d.filter((id) => id !== s.id) : [...d, s.id]))}
                  className={`text-xs border rounded-full px-2.5 py-1 transition-colors ${
                    draft.includes(s.id)
                      ? 'bg-cosmic text-night border-cosmic font-medium'
                      : 'border-hairline text-moon-dim hover:text-moon'
                  }`}
                >
                  {s.name}
                </button>
              ))}
              {stars.length === 0 && <p className="text-xs text-moon-dim">No Stars yet.</p>}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="border border-hairline rounded-lg px-3 py-2 text-sm flex-1 text-moon hover:bg-card-hover transition-colors"
                onClick={() => setPickingStars(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm flex-1 bg-gold text-night font-medium"
                onClick={() => {
                  onUpdate({ starIds: draft })
                  setPickingStars(false)
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
