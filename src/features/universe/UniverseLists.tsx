import { STAR_STAGE_ORDER } from '@/types'
import type { Star } from '@/types'
import { STAGE_LABELS } from '@/features/stars/stageLabels'

interface Props {
  stars: Star[]
  onSelect: (id: string) => void
  selectedId?: string
}

export function UniverseLists({ stars, onSelect, selectedId }: Props) {
  return (
    <div className="space-y-5">
      {STAR_STAGE_ORDER.map((stage) => {
        const group = stars.filter((s) => s.stage === stage)
        if (group.length === 0) return null
        return (
          <div key={stage}>
            <h3 className="text-xs uppercase tracking-wide text-moon-dim mb-2">
              {STAGE_LABELS[stage]} ({group.length})
            </h3>
            <div className="space-y-1.5">
              {group.map((s) => (
                <button
                  key={s.id}
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
