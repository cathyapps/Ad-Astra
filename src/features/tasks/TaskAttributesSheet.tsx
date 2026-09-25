import { useState } from 'react'
import type { ActivityType, DeviceContext, EffortContext, EnergyContext, LocationContext } from '@/types'
import { BottomSheet } from '@/features/shared/BottomSheet'

const ACTIVITY_TYPES: ActivityType[] = ['read', 'watch', 'listen', 'learn', 'create', 'play', 'relax']
const LOCATIONS: LocationContext[] = ['anywhere', 'work', 'home', 'away_from_home']
const DEVICES: DeviceContext[] = ['phone', 'computer', 'tv', 'physical']
const EFFORTS: EffortContext[] = ['bed', 'seated', 'active']
const ENERGIES: EnergyContext[] = ['very_low', 'low', 'normal', 'high']

function display(v: string) {
  return v.replace(/_/g, ' ')
}

export interface TaskAttributes {
  activityType?: ActivityType
  suitableLocations: LocationContext[]
  suitableDevices: DeviceContext[]
  requiredEffort?: EffortContext
  requiredEnergy?: EnergyContext
}

interface Props {
  value: TaskAttributes
  onSave: (value: TaskAttributes) => void
  onClose: () => void
}

function SingleSelectRow<T extends string>({
  label,
  options,
  selected,
  onPick,
}: {
  label: string
  options: T[]
  selected: T | undefined
  onPick: (v: T | undefined) => void
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-moon-dim mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onPick(selected === o ? undefined : o)}
            className={`text-xs border rounded-full px-2.5 py-1 transition-colors capitalize ${
              selected === o
                ? 'bg-cosmic text-night border-cosmic font-medium'
                : 'border-hairline text-moon-dim hover:text-moon'
            }`}
          >
            {display(o)}
          </button>
        ))}
      </div>
    </div>
  )
}

function MultiSelectRow<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: T[]
  selected: T[]
  onToggle: (v: T) => void
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-moon-dim mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={`text-xs border rounded-full px-2.5 py-1 transition-colors capitalize ${
              selected.includes(o)
                ? 'bg-cosmic text-night border-cosmic font-medium'
                : 'border-hairline text-moon-dim hover:text-moon'
            }`}
          >
            {display(o)}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Everything the "what should I do right now" suggestion engine
 *  matches on, gathered into one sheet — same tap-to-toggle-then-Done
 *  pattern as tags, just grouped into the dimensions the engine
 *  actually uses instead of being freeform. */
export function TaskAttributesSheet({ value, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<TaskAttributes>(value)

  function toggleLocation(v: LocationContext) {
    setDraft((d) => ({
      ...d,
      suitableLocations: d.suitableLocations.includes(v)
        ? d.suitableLocations.filter((x) => x !== v)
        : [...d.suitableLocations, v],
    }))
  }
  function toggleDevice(v: DeviceContext) {
    setDraft((d) => ({
      ...d,
      suitableDevices: d.suitableDevices.includes(v) ? d.suitableDevices.filter((x) => x !== v) : [...d.suitableDevices, v],
    }))
  }

  return (
    <BottomSheet title="Add attributes" onClose={onClose}>
      <div className="space-y-4">
        <SingleSelectRow
          label="Activity"
          options={ACTIVITY_TYPES}
          selected={draft.activityType}
          onPick={(v) => setDraft((d) => ({ ...d, activityType: v }))}
        />
        <SingleSelectRow
          label="Energy needed"
          options={ENERGIES}
          selected={draft.requiredEnergy}
          onPick={(v) => setDraft((d) => ({ ...d, requiredEnergy: v }))}
        />
        <SingleSelectRow
          label="Effort"
          options={EFFORTS}
          selected={draft.requiredEffort}
          onPick={(v) => setDraft((d) => ({ ...d, requiredEffort: v }))}
        />
        <MultiSelectRow label="Location" options={LOCATIONS} selected={draft.suitableLocations} onToggle={toggleLocation} />
        <MultiSelectRow label="Device" options={DEVICES} selected={draft.suitableDevices} onToggle={toggleDevice} />

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            className="border border-hairline rounded-lg px-3 py-2 text-sm flex-1 text-moon hover:bg-card-hover transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm flex-1 bg-gold text-night font-medium"
            onClick={() => onSave(draft)}
          >
            Done
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
