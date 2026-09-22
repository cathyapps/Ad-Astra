import type { StarStage } from '@/types'

export const STAGE_LABELS: Record<StarStage, string> = {
  someday: 'Someday',
  on_the_horizon: 'On the Horizon',
  current_orbit: 'Current Orbit',
  completed: 'Completed',
}

const STAGE_DOT: Record<StarStage, string> = {
  someday: 'bg-moon-dim',
  on_the_horizon: 'bg-cosmic',
  current_orbit: 'bg-gold',
  completed: 'bg-moon-dim',
}

export function StageBadge({ stage }: { stage: StarStage }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs border border-hairline rounded-full px-2.5 py-1 text-moon-dim">
      <span className={`w-1.5 h-1.5 rounded-full ${STAGE_DOT[stage]}`} />
      {STAGE_LABELS[stage]}
    </span>
  )
}
