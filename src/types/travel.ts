// Travel domain types — Phase 2 (spec §17), restructured per user request:
// every travel aspiration is a Trip. A lone "someday" idea is just a Trip
// with one Planet in it; a multi-country trip groups several Planets.
// There is no separate standalone "destinations" list anymore — a Planet
// (a trip_item with no parent) carries the rich bucket-list-style fields
// that used to live on TravelDestination, and a Moon (a trip_item nested
// under a Planet) is whatever's inside it — a city, an attraction, an
// activity, a meal, a transfer. Moons can themselves be cities; nesting
// depth isn't semantically fixed to "country > city > activity" — it's
// just "top-level item" vs "nested item" for a given trip.

export type LifeStageTag =
  | 'before_kids'
  | 'with_kids'
  | 'while_young'
  | 'anytime'
  | 'retirement'

export const LIFE_STAGE_TAGS: LifeStageTag[] = [
  'before_kids',
  'with_kids',
  'while_young',
  'anytime',
  'retirement',
]

export type TripStatus = 'idea' | 'planning' | 'booked' | 'completed' | 'archived'

export const TRIP_STATUS_ORDER: TripStatus[] = [
  'idea',
  'planning',
  'booked',
  'completed',
  'archived',
]

export interface Trip {
  id: string
  name: string
  status: TripStatus

  startDate?: string
  endDate?: string
  numDays?: number
  budget?: number
  notes?: string

  relatedStarIds: string[]
  // Auto-managed: set once this trip progresses past 'idea'. See
  // src/lib/autoStars.ts. Cleared (and the Star deleted) if the trip
  // regresses back to 'idea'.
  linkedStarId?: string

  createdAt: string
  updatedAt: string
}

export type TripItemType =
  | 'country'
  | 'region'
  | 'city'
  | 'attraction'
  | 'activity'
  | 'restaurant'
  | 'hotel'
  | 'transportation'

export const TRIP_ITEM_TYPES: TripItemType[] = [
  'country',
  'region',
  'city',
  'attraction',
  'activity',
  'restaurant',
  'hotel',
  'transportation',
]

export interface TripItem {
  id: string
  tripId: string
  parentItemId?: string // absent = a Planet (top-level); present = a Moon nested under that Planet
  type: TripItemType
  name: string
  date?: string
  notes?: string
  cost?: number
  sortIndex: number

  // Planet-only bucket-list-style fields (formerly on TravelDestination).
  // Left undefined on Moons, which stay minimal.
  why?: string
  bestSeason?: string
  desiredTripLength?: string
  estimatedCost?: number
  companions?: string[]
  lifeStageTags?: LifeStageTag[]

  createdAt: string
  updatedAt: string
}
