// Small, explicit mappers rather than a generic case-converter — keeps the
// exact column list visible and in sync with supabase/migrations/0001_*.sql
// and 0002_*.sql at a glance, and avoids silently forwarding an unexpected
// field to Postgres.
import type { AppSettings, Constellation, Star, Task } from '@/types'
import type { TravelDestination, Trip, TripItem } from '@/types/travel'
import type { Book, BookList, BookListItem, ReadingChallenge, ReadingSession } from '@/types/reading'
import type {
  Episode,
  ViewingSession,
  WatchChallenge,
  Watchable,
  WatchList,
  WatchListItem,
} from '@/types/watching'

export function starFromRow(row: Record<string, unknown>): Star {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    category: (row.category as Star['category']) ?? undefined,
    stage: row.stage as Star['stage'],
    tags: (row.tags as string[]) ?? [],
    desiredTimeframe: (row.desired_timeframe as string) ?? undefined,
    companions: (row.companions as string[]) ?? undefined,
    roughRequirements: (row.rough_requirements as string) ?? undefined,
    desiredOutcome: (row.desired_outcome as string) ?? undefined,
    estimatedEffort: (row.estimated_effort as string) ?? undefined,
    dependencies: (row.dependencies as string[]) ?? [],
    budget: (row.budget as number) ?? undefined,
    deadline: (row.deadline as string) ?? undefined,
    targetCompletionDate: (row.target_completion_date as string) ?? undefined,
    progress: (row.progress as number) ?? 0,
    images: (row.images as string[]) ?? [],
    notes: (row.notes as string) ?? undefined,
    completionDate: (row.completion_date as string) ?? undefined,
    reflection: (row.reflection as string) ?? undefined,
    relatedStarIds: (row.related_star_ids as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    archivedAt: (row.archived_at as string) ?? undefined,
  }
}

export function starToRow(input: Partial<Star>, userId: string): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId }
  if (input.name !== undefined) row.name = input.name
  if (input.description !== undefined) row.description = input.description
  if (input.category !== undefined) row.category = input.category
  if (input.stage !== undefined) row.stage = input.stage
  if (input.tags !== undefined) row.tags = input.tags
  if (input.desiredTimeframe !== undefined) row.desired_timeframe = input.desiredTimeframe
  if (input.companions !== undefined) row.companions = input.companions
  if (input.roughRequirements !== undefined) row.rough_requirements = input.roughRequirements
  if (input.desiredOutcome !== undefined) row.desired_outcome = input.desiredOutcome
  if (input.estimatedEffort !== undefined) row.estimated_effort = input.estimatedEffort
  if (input.dependencies !== undefined) row.dependencies = input.dependencies
  if (input.budget !== undefined) row.budget = input.budget
  if (input.deadline !== undefined) row.deadline = input.deadline
  if (input.targetCompletionDate !== undefined) row.target_completion_date = input.targetCompletionDate
  if (input.progress !== undefined) row.progress = input.progress
  if (input.images !== undefined) row.images = input.images
  if (input.notes !== undefined) row.notes = input.notes
  if (input.completionDate !== undefined) row.completion_date = input.completionDate
  if (input.reflection !== undefined) row.reflection = input.reflection
  if (input.relatedStarIds !== undefined) row.related_star_ids = input.relatedStarIds
  if (input.archivedAt !== undefined) row.archived_at = input.archivedAt
  return row
}

export function constellationFromRow(row: Record<string, unknown>): Constellation {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    coverImage: (row.cover_image as string) ?? undefined,
    starIds: (row.star_ids as string[]) ?? [],
    anchorStarId: (row.anchor_star_id as string) ?? undefined,
    targetDate: (row.target_date as string) ?? undefined,
    priority: (row.priority as number) ?? 0,
    progress: (row.progress as number) ?? 0,
    status: row.status as Constellation['status'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function constellationToRow(
  input: Partial<Constellation>,
  userId: string,
): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId }
  if (input.name !== undefined) row.name = input.name
  if (input.description !== undefined) row.description = input.description
  if (input.coverImage !== undefined) row.cover_image = input.coverImage
  if (input.starIds !== undefined) row.star_ids = input.starIds
  if (input.anchorStarId !== undefined) row.anchor_star_id = input.anchorStarId
  if (input.targetDate !== undefined) row.target_date = input.targetDate
  if (input.priority !== undefined) row.priority = input.priority
  if (input.progress !== undefined) row.progress = input.progress
  if (input.status !== undefined) row.status = input.status
  return row
}

export function taskFromRow(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    starId: row.star_id as string,
    parentTaskId: (row.parent_task_id as string) ?? undefined,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    status: row.status as Task['status'],
    estimatedMinutes: (row.estimated_minutes as number) ?? undefined,
    actualMinutes: (row.actual_minutes as number) ?? undefined,
    dueDate: (row.due_date as string) ?? undefined,
    dependencyTaskIds: (row.dependency_task_ids as string[]) ?? [],
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    completedAt: (row.completed_at as string) ?? undefined,
    activityType: (row.activity_type as Task['activityType']) ?? undefined,
    suitableLocations: (row.suitable_locations as Task['suitableLocations']) ?? undefined,
    suitableDevices: (row.suitable_devices as Task['suitableDevices']) ?? undefined,
    requiredEffort: (row.required_effort as Task['requiredEffort']) ?? undefined,
    requiredEnergy: (row.required_energy as Task['requiredEnergy']) ?? undefined,
  }
}

export function taskToRow(input: Partial<Task>, userId: string): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId }
  if (input.starId !== undefined) row.star_id = input.starId
  if (input.parentTaskId !== undefined) row.parent_task_id = input.parentTaskId
  if (input.name !== undefined) row.name = input.name
  if (input.description !== undefined) row.description = input.description
  if (input.status !== undefined) row.status = input.status
  if (input.estimatedMinutes !== undefined) row.estimated_minutes = input.estimatedMinutes
  if (input.actualMinutes !== undefined) row.actual_minutes = input.actualMinutes
  if (input.dueDate !== undefined) row.due_date = input.dueDate
  if (input.dependencyTaskIds !== undefined) row.dependency_task_ids = input.dependencyTaskIds
  if (input.notes !== undefined) row.notes = input.notes
  if (input.completedAt !== undefined) row.completed_at = input.completedAt
  if (input.activityType !== undefined) row.activity_type = input.activityType
  if (input.suitableLocations !== undefined) row.suitable_locations = input.suitableLocations
  if (input.suitableDevices !== undefined) row.suitable_devices = input.suitableDevices
  if (input.requiredEffort !== undefined) row.required_effort = input.requiredEffort
  if (input.requiredEnergy !== undefined) row.required_energy = input.requiredEnergy
  return row
}

export function settingsFromRow(row: Record<string, unknown> | null): AppSettings {
  return { currentOrbitLimit: (row?.current_orbit_limit as number) ?? 5 }
}

// --- Phase 2: Travel ---

export function destinationFromRow(row: Record<string, unknown>): TravelDestination {
  return {
    id: row.id as string,
    country: (row.country as string) ?? undefined,
    region: (row.region as string) ?? undefined,
    city: (row.city as string) ?? undefined,
    name: row.name as string,
    images: (row.images as string[]) ?? [],
    why: (row.why as string) ?? undefined,
    desiredTripLength: (row.desired_trip_length as string) ?? undefined,
    bestSeason: (row.best_season as string) ?? undefined,
    estimatedCost: (row.estimated_cost as number) ?? undefined,
    companions: (row.companions as string[]) ?? [],
    lifeStageTags: (row.life_stage_tags as TravelDestination['lifeStageTags']) ?? [],
    status: row.status as TravelDestination['status'],
    relatedStarIds: (row.related_star_ids as string[]) ?? [],
    relatedConstellationIds: (row.related_constellation_ids as string[]) ?? [],
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    archivedAt: (row.archived_at as string) ?? undefined,
  }
}

export function destinationToRow(
  input: Partial<TravelDestination>,
  userId: string,
): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId }
  if (input.country !== undefined) row.country = input.country
  if (input.region !== undefined) row.region = input.region
  if (input.city !== undefined) row.city = input.city
  if (input.name !== undefined) row.name = input.name
  if (input.images !== undefined) row.images = input.images
  if (input.why !== undefined) row.why = input.why
  if (input.desiredTripLength !== undefined) row.desired_trip_length = input.desiredTripLength
  if (input.bestSeason !== undefined) row.best_season = input.bestSeason
  if (input.estimatedCost !== undefined) row.estimated_cost = input.estimatedCost
  if (input.companions !== undefined) row.companions = input.companions
  if (input.lifeStageTags !== undefined) row.life_stage_tags = input.lifeStageTags
  if (input.status !== undefined) row.status = input.status
  if (input.relatedStarIds !== undefined) row.related_star_ids = input.relatedStarIds
  if (input.relatedConstellationIds !== undefined)
    row.related_constellation_ids = input.relatedConstellationIds
  if (input.notes !== undefined) row.notes = input.notes
  if (input.archivedAt !== undefined) row.archived_at = input.archivedAt
  return row
}

export function tripFromRow(row: Record<string, unknown>): Trip {
  return {
    id: row.id as string,
    name: row.name as string,
    destinationIds: (row.destination_ids as string[]) ?? [],
    status: row.status as Trip['status'],
    startDate: (row.start_date as string) ?? undefined,
    endDate: (row.end_date as string) ?? undefined,
    numDays: (row.num_days as number) ?? undefined,
    budget: (row.budget as number) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    relatedStarIds: (row.related_star_ids as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function tripToRow(input: Partial<Trip>, userId: string): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId }
  if (input.name !== undefined) row.name = input.name
  if (input.destinationIds !== undefined) row.destination_ids = input.destinationIds
  if (input.status !== undefined) row.status = input.status
  if (input.startDate !== undefined) row.start_date = input.startDate
  if (input.endDate !== undefined) row.end_date = input.endDate
  if (input.numDays !== undefined) row.num_days = input.numDays
  if (input.budget !== undefined) row.budget = input.budget
  if (input.notes !== undefined) row.notes = input.notes
  if (input.relatedStarIds !== undefined) row.related_star_ids = input.relatedStarIds
  return row
}

export function tripItemFromRow(row: Record<string, unknown>): TripItem {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    parentItemId: (row.parent_item_id as string) ?? undefined,
    type: row.type as TripItem['type'],
    name: row.name as string,
    date: (row.date as string) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    cost: (row.cost as number) ?? undefined,
    sortIndex: (row.sort_index as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function tripItemToRow(input: Partial<TripItem>, userId: string): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId }
  if (input.tripId !== undefined) row.trip_id = input.tripId
  if (input.parentItemId !== undefined) row.parent_item_id = input.parentItemId
  if (input.type !== undefined) row.type = input.type
  if (input.name !== undefined) row.name = input.name
  if (input.date !== undefined) row.date = input.date
  if (input.notes !== undefined) row.notes = input.notes
  if (input.cost !== undefined) row.cost = input.cost
  if (input.sortIndex !== undefined) row.sort_index = input.sortIndex
  return row
}

// --- Phase 3: Reading ---

export function bookFromRow(row: Record<string, unknown>): Book {
  return {
    id: row.id as string,
    title: row.title as string,
    author: (row.author as string) ?? undefined,
    series: (row.series as string) ?? undefined,
    genre: (row.genre as string) ?? undefined,
    format: (row.format as Book['format']) ?? undefined,
    edition: (row.edition as string) ?? undefined,
    owned: (row.owned as boolean) ?? false,
    location: (row.location as string) ?? undefined,
    status: row.status as Book['status'],
    rating: (row.rating as number) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    relatedStarIds: (row.related_star_ids as string[]) ?? [],
    relatedConstellationIds: (row.related_constellation_ids as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    completedAt: (row.completed_at as string) ?? undefined,
  }
}

export function bookToRow(input: Partial<Book>, userId: string): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId }
  if (input.title !== undefined) row.title = input.title
  if (input.author !== undefined) row.author = input.author
  if (input.series !== undefined) row.series = input.series
  if (input.genre !== undefined) row.genre = input.genre
  if (input.format !== undefined) row.format = input.format
  if (input.edition !== undefined) row.edition = input.edition
  if (input.owned !== undefined) row.owned = input.owned
  if (input.location !== undefined) row.location = input.location
  if (input.status !== undefined) row.status = input.status
  if (input.rating !== undefined) row.rating = input.rating
  if (input.notes !== undefined) row.notes = input.notes
  if (input.relatedStarIds !== undefined) row.related_star_ids = input.relatedStarIds
  if (input.relatedConstellationIds !== undefined)
    row.related_constellation_ids = input.relatedConstellationIds
  if (input.completedAt !== undefined) row.completed_at = input.completedAt
  return row
}

export function bookListFromRow(row: Record<string, unknown>): BookList {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    type: row.type as BookList['type'],
    relatedStarIds: (row.related_star_ids as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function bookListToRow(input: Partial<BookList>, userId: string): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId }
  if (input.name !== undefined) row.name = input.name
  if (input.description !== undefined) row.description = input.description
  if (input.type !== undefined) row.type = input.type
  if (input.relatedStarIds !== undefined) row.related_star_ids = input.relatedStarIds
  return row
}

export function bookListItemFromRow(row: Record<string, unknown>): BookListItem {
  return {
    id: row.id as string,
    bookListId: row.book_list_id as string,
    bookId: row.book_id as string,
    sortIndex: (row.sort_index as number) ?? 0,
    createdAt: row.created_at as string,
  }
}

export function readingSessionFromRow(row: Record<string, unknown>): ReadingSession {
  return {
    id: row.id as string,
    bookId: row.book_id as string,
    date: row.date as string,
    pages: (row.pages as number) ?? undefined,
    minutes: (row.minutes as number) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    rating: (row.rating as number) ?? undefined,
    completionStatus: (row.completion_status as ReadingSession['completionStatus']) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function readingSessionToRow(
  input: Partial<ReadingSession>,
  userId: string,
): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId }
  if (input.bookId !== undefined) row.book_id = input.bookId
  if (input.date !== undefined) row.date = input.date
  if (input.pages !== undefined) row.pages = input.pages
  if (input.minutes !== undefined) row.minutes = input.minutes
  if (input.notes !== undefined) row.notes = input.notes
  if (input.rating !== undefined) row.rating = input.rating
  if (input.completionStatus !== undefined) row.completion_status = input.completionStatus
  return row
}

export function readingChallengeFromRow(row: Record<string, unknown>): ReadingChallenge {
  return {
    id: row.id as string,
    name: row.name as string,
    goalType: row.goal_type as ReadingChallenge['goalType'],
    target: row.target as number,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    notes: (row.notes as string) ?? undefined,
    relatedStarIds: (row.related_star_ids as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function readingChallengeToRow(
  input: Partial<ReadingChallenge>,
  userId: string,
): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId }
  if (input.name !== undefined) row.name = input.name
  if (input.goalType !== undefined) row.goal_type = input.goalType
  if (input.target !== undefined) row.target = input.target
  if (input.startDate !== undefined) row.start_date = input.startDate
  if (input.endDate !== undefined) row.end_date = input.endDate
  if (input.notes !== undefined) row.notes = input.notes
  if (input.relatedStarIds !== undefined) row.related_star_ids = input.relatedStarIds
  return row
}

// --- Phase 3: Watching ---

export function watchableFromRow(row: Record<string, unknown>): Watchable {
  return {
    id: row.id as string,
    title: row.title as string,
    type: row.type as Watchable['type'],
    genre: (row.genre as string) ?? undefined,
    format: (row.format as Watchable['format']) ?? undefined,
    status: row.status as Watchable['status'],
    rating: (row.rating as number) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    relatedStarIds: (row.related_star_ids as string[]) ?? [],
    relatedConstellationIds: (row.related_constellation_ids as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    completedAt: (row.completed_at as string) ?? undefined,
  }
}

export function watchableToRow(input: Partial<Watchable>, userId: string): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId }
  if (input.title !== undefined) row.title = input.title
  if (input.type !== undefined) row.type = input.type
  if (input.genre !== undefined) row.genre = input.genre
  if (input.format !== undefined) row.format = input.format
  if (input.status !== undefined) row.status = input.status
  if (input.rating !== undefined) row.rating = input.rating
  if (input.notes !== undefined) row.notes = input.notes
  if (input.relatedStarIds !== undefined) row.related_star_ids = input.relatedStarIds
  if (input.relatedConstellationIds !== undefined)
    row.related_constellation_ids = input.relatedConstellationIds
  if (input.completedAt !== undefined) row.completed_at = input.completedAt
  return row
}

export function episodeFromRow(row: Record<string, unknown>): Episode {
  return {
    id: row.id as string,
    watchableId: row.watchable_id as string,
    season: (row.season as number) ?? undefined,
    episodeNumber: (row.episode_number as number) ?? undefined,
    name: (row.name as string) ?? undefined,
    watched: (row.watched as boolean) ?? false,
    notes: (row.notes as string) ?? undefined,
    sortIndex: (row.sort_index as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function episodeToRow(input: Partial<Episode>, userId: string): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId }
  if (input.watchableId !== undefined) row.watchable_id = input.watchableId
  if (input.season !== undefined) row.season = input.season
  if (input.episodeNumber !== undefined) row.episode_number = input.episodeNumber
  if (input.name !== undefined) row.name = input.name
  if (input.watched !== undefined) row.watched = input.watched
  if (input.notes !== undefined) row.notes = input.notes
  if (input.sortIndex !== undefined) row.sort_index = input.sortIndex
  return row
}

export function watchListFromRow(row: Record<string, unknown>): WatchList {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    type: row.type as WatchList['type'],
    relatedStarIds: (row.related_star_ids as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function watchListToRow(input: Partial<WatchList>, userId: string): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId }
  if (input.name !== undefined) row.name = input.name
  if (input.description !== undefined) row.description = input.description
  if (input.type !== undefined) row.type = input.type
  if (input.relatedStarIds !== undefined) row.related_star_ids = input.relatedStarIds
  return row
}

export function watchListItemFromRow(row: Record<string, unknown>): WatchListItem {
  return {
    id: row.id as string,
    watchListId: row.watch_list_id as string,
    watchableId: row.watchable_id as string,
    sortIndex: (row.sort_index as number) ?? 0,
    createdAt: row.created_at as string,
  }
}

export function viewingSessionFromRow(row: Record<string, unknown>): ViewingSession {
  return {
    id: row.id as string,
    watchableId: row.watchable_id as string,
    date: row.date as string,
    minutes: (row.minutes as number) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    rating: (row.rating as number) ?? undefined,
    completionStatus: (row.completion_status as ViewingSession['completionStatus']) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function viewingSessionToRow(
  input: Partial<ViewingSession>,
  userId: string,
): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId }
  if (input.watchableId !== undefined) row.watchable_id = input.watchableId
  if (input.date !== undefined) row.date = input.date
  if (input.minutes !== undefined) row.minutes = input.minutes
  if (input.notes !== undefined) row.notes = input.notes
  if (input.rating !== undefined) row.rating = input.rating
  if (input.completionStatus !== undefined) row.completion_status = input.completionStatus
  return row
}

export function watchChallengeFromRow(row: Record<string, unknown>): WatchChallenge {
  return {
    id: row.id as string,
    name: row.name as string,
    target: row.target as number,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    notes: (row.notes as string) ?? undefined,
    relatedStarIds: (row.related_star_ids as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function watchChallengeToRow(
  input: Partial<WatchChallenge>,
  userId: string,
): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId }
  if (input.name !== undefined) row.name = input.name
  if (input.target !== undefined) row.target = input.target
  if (input.startDate !== undefined) row.start_date = input.startDate
  if (input.endDate !== undefined) row.end_date = input.endDate
  if (input.notes !== undefined) row.notes = input.notes
  if (input.relatedStarIds !== undefined) row.related_star_ids = input.relatedStarIds
  return row
}
