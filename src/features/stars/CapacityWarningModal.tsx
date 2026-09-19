import { useState } from 'react'
import type { Star } from '@/types'

interface Props {
  message: string
  orbit: Star[]
  onAbort: () => void
  onOverride: () => void
  onReplace: (outgoingStarId: string) => void
}

export function CapacityWarningModal({ message, orbit, onAbort, onOverride, onReplace }: Props) {
  const [replacing, setReplacing] = useState(false)
  const [chosen, setChosen] = useState<string>(orbit[0]?.id ?? '')

  return (
    <div className="fixed inset-0 bg-night-deep/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-hairline rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4">
        <p className="text-sm text-moon">{message}</p>

        {!replacing ? (
          <div className="flex flex-col gap-2">
            <button
              className="border border-hairline rounded-lg px-3 py-2.5 text-sm text-left text-moon hover:bg-card-hover transition-colors"
              onClick={onAbort}
            >
              Abort — don't change anything
            </button>
            <button
              className="border border-hairline rounded-lg px-3 py-2.5 text-sm text-left text-moon hover:bg-card-hover transition-colors"
              onClick={onOverride}
            >
              Override — add it anyway, keep everyone in orbit
            </button>
            <button
              className="border border-hairline rounded-lg px-3 py-2.5 text-sm text-left text-moon hover:bg-card-hover transition-colors"
              onClick={() => setReplacing(true)}
            >
              Replace — move one existing Star back to Planning
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="text-sm block text-moon">
              Move which Star back to Planning?
              <select
                className="mt-1 w-full border border-hairline bg-night rounded-lg px-2 py-1.5 text-sm text-moon"
                value={chosen}
                onChange={(e) => setChosen(e.target.value)}
              >
                {orbit.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-moon-dim">
              Its tasks, progress, and notes are kept — it just moves back a stage.
            </p>
            <div className="flex gap-2">
              <button
                className="border border-hairline rounded-lg px-3 py-2 text-sm flex-1 text-moon hover:bg-card-hover transition-colors"
                onClick={() => setReplacing(false)}
              >
                Back
              </button>
              <button
                className="rounded-lg px-3 py-2 text-sm flex-1 bg-gold text-night font-medium disabled:opacity-40"
                onClick={() => onReplace(chosen)}
                disabled={!chosen}
              >
                Replace
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
