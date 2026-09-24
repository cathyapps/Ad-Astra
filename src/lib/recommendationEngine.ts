import type {
  Constellation,
  DashboardContext,
  Recommendation,
  Star,
  Task,
  TimeBudget,
} from '@/types'

const TIME_BUDGET_MINUTES: Record<TimeBudget, number> = {
  5: 5,
  15: 15,
  30: 30,
  60: 60,
  999: Infinity,
}

interface ScoredCandidate {
  task: Task
  star: Star
  score: number
  reasons: string[]
}

/** Constellation relevance boost from an approaching anchor-star deadline
 *  (spec §6). Ramps up over the 90 days before the deadline; 0 otherwise.
 *  Only ever nudges score — never assigns the deadline to member Stars. */
function constellationRelevanceBoost(
  star: Star,
  constellations: Constellation[],
  now: Date,
): { boost: number; constellation?: Constellation } {
  const memberOf = constellations.filter((c) => c.starIds.includes(star.id))
  let best = { boost: 0, constellation: undefined as Constellation | undefined }
  for (const c of memberOf) {
    const anchor = c.anchorStarId
    const anchorDeadline = anchor ? undefined : c.targetDate
    const deadline = c.targetDate ?? anchorDeadline
    if (!deadline) continue
    const daysOut = (new Date(deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    if (daysOut < 0 || daysOut > 90) continue
    const boost = 20 * (1 - daysOut / 90) // 0 -> 20 as the date approaches
    if (boost > best.boost) best = { boost, constellation: c }
  }
  return best
}

function scoreTask(
  task: Task,
  star: Star,
  context: DashboardContext,
  constellations: Constellation[],
  now: Date,
): ScoredCandidate {
  const reasons: string[] = []
  let score = 0

  // Hard-ish filters expressed as large penalties rather than exclusion,
  // so a context with nothing selected still returns something (§8: "no
  // mandatory sequence of questions").
  if (context.activityTypes.length > 0) {
    if (task.activityType && context.activityTypes.includes(task.activityType)) {
      score += 30
      reasons.push(`matches ${task.activityType}`)
    } else if (task.activityType) {
      score -= 40
    }
  }

  if (context.timeBudget) {
    const budget = TIME_BUDGET_MINUTES[context.timeBudget]
    if (task.estimatedMinutes != null) {
      if (task.estimatedMinutes <= budget) {
        score += 15
        reasons.push(`fits in ${context.timeBudget === 999 ? '1+ hour' : context.timeBudget + ' min'}`)
      } else {
        score -= 50 // realistically not doable right now — spec's core rule
      }
    }
  }

  if (context.location && task.suitableLocations?.length) {
    if (task.suitableLocations.includes(context.location)) {
      score += 10
    } else {
      score -= 30
    }
  }

  if (context.device && task.suitableDevices?.length) {
    if (task.suitableDevices.includes(context.device)) {
      score += 10
    } else {
      score -= 30
    }
  }

  if (context.effort && task.requiredEffort) {
    if (task.requiredEffort === context.effort) score += 8
    else if (context.effort === 'bed' && task.requiredEffort === 'active') score -= 30
  }

  if (context.energy && task.requiredEnergy) {
    const order = ['very_low', 'low', 'normal', 'high']
    const have = order.indexOf(context.energy)
    const need = order.indexOf(task.requiredEnergy)
    if (need <= have) score += 8
    else score -= 20
  }

  // Current relevance (§9, §10)
  if (star.stage === 'current_orbit') {
    score += 15
    reasons.push('in your Current Orbit')
  }
  if (star.deadline) {
    const daysOut = (new Date(star.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    if (daysOut >= 0 && daysOut <= 30) {
      score += 10
      reasons.push('deadline approaching')
    }
  }

  const { boost, constellation } = constellationRelevanceBoost(star, constellations, now)
  if (boost > 0 && constellation) {
    score += boost
    reasons.push(`${constellation.name} is coming up`)
  }

  // Tag overlap between a Planet/Moon and its own Star is a cheap signal
  // that the task is central to what the Star is actually about, not
  // incidental busywork — a small nudge, not a hard filter.
  const sharedTags = (task.tags ?? []).filter((t) => star.tags.includes(t))
  if (sharedTags.length > 0) {
    score += Math.min(12, sharedTags.length * 6)
    reasons.push(`tagged ${sharedTags[0]}`)
  }

  // Recency variety: nudge slightly toward tasks whose star hasn't been
  // touched very recently, without ever resurfacing dormant Someday Stars
  // (only current_orbit/planning tasks are candidates at all — see below).
  const daysSinceStarUpdate =
    (now.getTime() - new Date(star.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceStarUpdate > 3 && daysSinceStarUpdate < 21) {
    score += 5
  }

  // Small amount of randomness so the same context doesn't always return
  // the same answer (§9: "appropriate randomness").
  score += Math.random() * 6

  return { task, star, score, reasons }
}

/** Candidate pool: tasks belonging to Current Orbit Stars only.
 *  Someday / On the Horizon Stars never surface here — that's the
 *  anti-anxiety rule in §4, not an oversight. */
function candidateTasks(stars: Star[], tasks: Task[]): { task: Task; star: Star }[] {
  const eligibleStars = new Map(
    stars.filter((s) => s.stage === 'current_orbit').map((s) => [s.id, s]),
  )
  return tasks
    .filter((t) => t.status !== 'done' && eligibleStars.has(t.starId))
    .map((t) => ({ task: t, star: eligibleStars.get(t.starId)! }))
}

export function getRecommendations(
  context: DashboardContext,
  stars: Star[],
  tasks: Task[],
  constellations: Constellation[],
  limit = 5,
  now: Date = new Date(),
): Recommendation[] {
  const candidates = candidateTasks(stars, tasks)
  const scored = candidates
    .map(({ task, star }) => scoreTask(task, star, context, constellations, now))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return scored.map(({ task, star, score, reasons }) => ({
    id: task.id,
    starId: star.id,
    taskId: task.id,
    title: task.name,
    reason: reasons.length ? reasons.join(' · ') : `part of ${star.name}`,
    score: Math.round(Math.max(0, Math.min(100, score))),
    activityType: task.activityType,
  }))
}

/**
 * "Give me a small win" (§26): a short, doable-right-now task, preferring
 * Current Orbit over Planning, respecting whatever context was selected.
 */
export function getSmallWin(
  context: DashboardContext,
  stars: Star[],
  tasks: Task[],
  constellations: Constellation[],
  maxMinutes = 15,
  now: Date = new Date(),
): Recommendation | null {
  const shortContext: DashboardContext = { ...context, timeBudget: context.timeBudget ?? 15 }
  const candidates = candidateTasks(stars, tasks).filter(
    ({ task }) => task.estimatedMinutes != null && task.estimatedMinutes <= maxMinutes,
  )
  if (candidates.length === 0) return null

  const scored = candidates
    .map(({ task, star }) => scoreTask(task, star, shortContext, constellations, now))
    .sort((a, b) => b.score - a.score)

  const best = scored[0]
  return {
    id: best.task.id,
    starId: best.star.id,
    taskId: best.task.id,
    title: best.task.name,
    reason: `${best.task.estimatedMinutes}-minute task on ${best.star.name}`,
    score: Math.round(Math.max(0, Math.min(100, best.score))),
    activityType: best.task.activityType,
  }
}
