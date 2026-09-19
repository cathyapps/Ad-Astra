import type { DestinationStatus } from '@/types/travel'
import type { TripStatus } from '@/types/travel'

const ALLOWED: Record<DestinationStatus, DestinationStatus[]> = {
  bucket_list: ['planning', 'archived'],
  planning: ['bucket_list', 'booked', 'archived'],
  booked: ['planning', 'visited', 'archived'],
  visited: ['archived'],
  archived: ['bucket_list'],
}

export function allowedDestinationTransitions(from: DestinationStatus): DestinationStatus[] {
  return ALLOWED[from] ?? []
}

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
