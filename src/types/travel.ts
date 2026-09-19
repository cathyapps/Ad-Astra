// Travel domain types — Phase 2 (spec §17).
// References stars/constellations by id rather than changing core types
// (see the note at the top of types/index.ts).

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

export type DestinationStatus = 'bucket_list' | 'planning' | 'booked' | 'visited' | 'archived'

export const DESTINATION_STATUS_ORDER: DestinationStatus[] = [
  'bucket_list',
  'planning',
  'booked',
  'visited',
  'archived',
]

// "Destination Bucket List" (§17)
export interface TravelDestination {
  id: string
  country?: string
  region?: string
  city?: string
  name: string // the destination itself, e.g. "Kyoto in cherry blossom season"
  images: string[]
  why?: string // "why I want to go"
  desiredTripLength?: string // free text, e.g. "10-14 days"
  bestSeason?: string
  estimatedCost?: number
  companions?: string[] // who — "Mike", "Sam", "college friends"...
  lifeStageTags: LifeStageTag[] // when — before kids, with kids, etc.
  status: DestinationStatus

  relatedStarIds: string[]
  relatedConstellationIds: string[]

  notes?: string
  createdAt: string
  updatedAt: string
  archivedAt?: string
}

export type TripStatus = 'idea' | 'planning' | 'booked' | 'completed' | 'archived'

export const TRIP_STATUS_ORDER: TripStatus[] = [
  'idea',
  'planning',
  'booked',
  'completed',
  'archived',
]

// A trip idea can grow into an actual trip just by advancing its status
// and filling in dates — no separate "trip_ideas" table needed (§17).
export interface Trip {
  id: string
  name: string
  destinationIds: string[]
  status: TripStatus

  startDate?: string
  endDate?: string
  numDays?: number
  budget?: number
  notes?: string

  relatedStarIds: string[]

  createdAt: string
  updatedAt: string
}

export type TripItemType =
  | 'city'
  | 'attraction'
  | 'activity'
  | 'restaurant'
  | 'hotel'
  | 'transportation'

export const TRIP_ITEM_TYPES: TripItemType[] = [
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
  parentItemId?: string // set for a Moon nested under a Planet-tier item (usually a city)
  type: TripItemType
  name: string
  date?: string
  notes?: string
  cost?: number
  sortIndex: number
  createdAt: string
  updatedAt: string
}
