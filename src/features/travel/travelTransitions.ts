import type { TripStatus } from '@/types/travel'

const TRIP_ALLOWED: Record<TripStatus, TripStatus[]> = {
  idea: ['planning', 'archived'],
  planning: ['idea', 'booked', 'archived'],
  booked: ['planning', 'completed', 'archived'],
  completed: ['archived'],
  archived: ['idea'],
}

export function allowedTripTransitions(from: TripStatus): TripStatus[] {
  return TRIP_ALLOWED[from] ?? []
}
