// Core domain types for Ad Astra — Phase 1 (Core Universe)
// Mirrors the entities in "Suggested Initial Database Model" (spec §29),
// scoped to what Phase 1 needs. Later phases add travel/reading/learning/etc.
// tables that reference stars/constellations rather than changing these.

export type StarStage = 'someday' | 'on_the_horizon' | 'current_orbit' | 'completed'

export const STAR_STAGE_ORDER: StarStage[] = ['someday', 'on_the_horizon', 'current_orbit', 'completed']

export type StarCategory =
  | 'travel'
  | 'learning'
  | 'creative'
  | 'home'
  | 'business'
  | 'reading'
  | 'health'
  | 'relationship'
  | 'other'

export interface Star {
  id: string
  name: string
  description?: string
  category?: StarCategory
  stage: StarStage
  tags: string[]

  // Stage-appropriate optional detail. Nothing here is required until the
  // stage that introduces it (see starLifecycle.ts for what's expected where).
  desiredTimeframe?: string
  companions?: string[]
  roughRequirements?: string

  desiredOutcome?: string
  estimatedEffort?: string
  dependencies?: string[] // ids of other stars
  budget?: number

  deadline?: string // ISO date — "this specific thing must happen by this date" (§6)
  targetCompletionDate?: string

  progress: number // 0-100, manually adjustable or derived from tasks
  images: string[]
  notes?: string

  completionDate?: string
  reflection?: string

  relatedStarIds: string[]

  createdAt: string
  updatedAt: string
}

export interface Constellation {
  id: string
  name: string
  shortName?: string // shown on the Universe map next to the constellation's lines instead of the full name
  description?: string
  coverImage?: string
  starIds: string[]
  anchorStarId?: string
  targetDate?: string
  priority: number // 0-100, can be boosted by anchor star deadline proximity
  progress: number
  status: 'active' | 'dormant' | 'completed' | 'archived'
  createdAt: string
  updatedAt: string
}

export type TaskStatus = 'todo' | 'in_progress' | 'done'

// Planets & Moons (Tasks) come in three flavors (user-requested, Phase 7):
//  - habit: a target frequency to hit repeatedly (e.g. "workout 3x/week")
//  - recurring: done many times with no set cadence (e.g. "piano practice")
//  - one_off: a single, one-time action (e.g. "download the app")
// Undefined (legacy tasks created before this existed) behaves like one_off.
export type TaskType = 'habit' | 'recurring' | 'one_off'
export type HabitFrequencyKind = 'daily' | 'per_week' | 'per_month'

export interface HabitFrequency {
  kind: HabitFrequencyKind
  // Only meaningful for per_week / per_month — "3x/week", "1x/month" etc.
  // Daily habits don't need a count (it's implicitly 1x/day).
  count?: number
}

// Dashboard "what are you in the mood for" context (§8)
export type ActivityType = 'read' | 'watch' | 'listen' | 'learn' | 'create' | 'play' | 'relax'
export type LocationContext = 'anywhere' | 'work' | 'home' | 'away_from_home'
export type DeviceContext = 'phone' | 'computer' | 'tv' | 'physical'
export type EffortContext = 'bed' | 'seated' | 'active'
export type EnergyContext = 'very_low' | 'low' | 'normal' | 'high'
export type TimeBudget = 5 | 15 | 30 | 60 | 999 // 999 = "1+ hour"

export interface Task {
  id: string
  starId: string
  parentTaskId?: string // enables Task -> Subtask -> Sub-subtask (§7)
  name: string
  description?: string
  status: TaskStatus
  estimatedMinutes?: number
  actualMinutes?: number
  dueDate?: string
  dependencyTaskIds: string[]
  notes?: string
  createdAt: string
  updatedAt: string
  completedAt?: string

  // Not in the spec's §7 field list, added so the recommendation engine
  // (§9) can actually match "Watch + Home + Bed + 30 min" against real
  // tasks instead of guessing. All optional — an untagged task just
  // participates less precisely in recommendations rather than being
  // excluded, keeping task creation low-friction (§27).
  activityType?: ActivityType
  suitableLocations?: LocationContext[]
  suitableDevices?: DeviceContext[]
  requiredEffort?: EffortContext
  requiredEnergy?: EnergyContext

  // Fully-configurable metadata (Phase 7): freeform categorization the
  // suggestion engine can match on, and a type with optional target
  // frequency. Prerequisites reuse `dependencyTaskIds` above — "this
  // Planet/Moon can't start until these are done" is exactly what that
  // field was for, it just wasn't wired up to any UI until now.
  tags: string[]
  taskType?: TaskType
  habitFrequency?: HabitFrequency

  // A top-level goal (e.g. "exercise more") isn't itself a completable
  // action with a duration — its sub-tasks are (e.g. "30 min barre
  // workout, 3x/week"). Marking it as a goal clears/hides
  // estimatedMinutes and keeps it out of the suggestion engine entirely,
  // rather than it silently competing for a "what should I do right
  // now" slot with nothing to actually go do.
  isGoal?: boolean
}

export interface DashboardContext {
  activityTypes: ActivityType[]
  location?: LocationContext
  device?: DeviceContext
  effort?: EffortContext
  timeBudget?: TimeBudget
  energy?: EnergyContext
}

export interface Recommendation {
  id: string
  starId?: string
  taskId?: string
  title: string
  reason: string
  score: number
  activityType?: ActivityType
}

import type { MetricsTimeframe } from './charts'

export interface AppSettings {
  currentOrbitLimit: number // default 5, configurable (§4)
  readingMetricsTimeframe: MetricsTimeframe // last-used timeframe on the Metrics view, remembered across sessions
}
