import { STAR_STAGE_ORDER, type StarStage } from '@/types'
import { canTransition } from '@/lib/starLifecycle'

export const ALLOWED_STAGES: Record<StarStage, StarStage[]> = Object.fromEntries(
  STAR_STAGE_ORDER.map((from) => [
    from,
    STAR_STAGE_ORDER.filter((to) => to !== from && canTransition(from, to)),
  ]),
) as Record<StarStage, StarStage[]>
