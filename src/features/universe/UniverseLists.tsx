import type { ReactNode } from 'react'
import type { Star, StarStage } from '@/types'
import { STAGE_LABELS } from '@/features/stars/stageLabels'

// Most-active-first — the opposite of the lifecycle order used
// elsewhere (allowedStages, the Universe map's fade-in). Someday goals
// are the least likely thing you want to scan for here, so they sit
// near the bottom; Completed trails everything.
const DISPLAY_ORDER: StarStage[] = ['current_orbit', 'on_the_horizon', 'someday', 'completed']

interface Props {
  stars: Star[]
  onSelect: (id: string) => void
  selectedId?: string
  // Rendered inline right after the selected Star's row instead of
  // wherever the caller puts it — keeps the edit panel next to what you
  // clicked instead of jumping your scroll position to the top of the
  // Universe screen.
  inlineDetail?: ReactNode
}

export function UniverseLists({ stars, onSelect, selectedId, inlineDetail }: Props) {
  return (
    <div className="space-y-5">
      {DISPLAY_ORDER.map((stage) => {
        const group = stars.filter((s) => s.stage === stage)
        if (group.length === 0) return null
        return (
          <div key={stage}>
            <h3 className="text-xs uppercase tracking-wide text-moon-dim mb-2">
              {STAGE_LABELS[stage]} ({group.length})
            </h3>
            <div className="space-y-1.5">
              {group.map((s) => (
                <div key={s.id}>
                  <button
                    onClick={() => onSelect(s.id)}
                    className={`w-full text-left text-sm border rounded-lg px-3 py-2 transition-colors ${
                      s.id === selectedId
                        ? 'border-gold/40 bg-card-hover text-moon'
                        : 'border-hairline text-moon hover:bg-card-hover'
                    }`}
                  >
                    {s.name}
                    {stage === 'current_orbit' && (
                      <span className="text-xs text-gold ml-2">{s.progress}%</span>
                    )}
                  </button>
                  {s.id === selectedId && inlineDetail && <div className="mt-2">{inlineDetail}</div>}
                </div>
              ))}
            </div>
          </div>
        )
      })}
      {stars.length === 0 && (
        <p className="text-sm text-moon-dim">No Stars yet — add your first one below.</p>
      )}
    </div>
  )
}
