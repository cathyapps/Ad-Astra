// Small, explicit mappers rather than a generic case-converter — keeps the
// exact column list visible and in sync with the migrations at a glance,
// and avoids silently forwarding an unexpected field to Postgres.
import type { AppSettings, Constellation, HabitFrequencyKind, Star, Task } from '@/types'
import type { Book, ReadingLog } from '@/types/library'
import type { BucketListItem } from '@/types/bucketList'
import type { ChartConfig } from '@/types/charts'
import type { Episode, ViewingSession, Watchable } from '@/types/watching'

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
    tags: (row.tags as string[]) ?? [],
    taskType: (row.task_type as Task['taskType']) ?? undefined,
    habitFrequency:
      row.habit_frequency_kind != null
        ? {
            kind: row.habit_frequency_kind as HabitFrequencyKind,
            count: (row.habit_frequency_count as number) ?? undefined,
          }
        : undefined,
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
  if (input.tags !== undefined) row.tags = input.tags
  if (input.taskType !== undefined) row.task_type = input.taskType
  if (input.habitFrequency !== undefined) {
    row.habit_frequency_kind = input.habitFrequency?.kind ?? null
    row.habit_frequency_count = input.habitFrequency?.count ?? null
  }
  return row
}

export function settingsFromRow(row: Record<string, unknown> | null): AppSettings {
  return {
    currentOrbitLimit: (row?.current_orbit_limit as number) ?? 5,
    readingMetricsTimeframe: (row?.reading_metrics_timeframe as AppSettings['readingMetricsTimeframe']) ?? '30d',
  }
}

// --- Watching (movies & TV) ---

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
    tags: (row.tags as string[]) ?? [],
    relatedStarIds: (row.related_star_ids as string[]) ?? [],
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
  if (input.tags !== undefined) row.tags = input.tags
  if (input.relatedStarIds !== undefined) row.related_star_ids = input.relatedStarIds
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

// --- Library (books) ---

export function bookFromRow(row: Record<string, unknown>): Book {
  return {
    id: row.id as string,
    title: row.title as string,
    author: (row.author as string) ?? undefined,
    series: (row.series as string) ?? undefined,
    genre: (row.genre as string) ?? undefined,
    ownership: row.ownership as Book['ownership'],
    format: row.format as Book['format'],
    readStatus: row.read_status as Book['readStatus'],
    totalPages: (row.total_pages as number) ?? undefined,
    totalMinutes: (row.total_minutes as number) ?? undefined,
    rating: (row.rating as number) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    tags: (row.tags as string[]) ?? [],
    isbn: (row.isbn as string) ?? undefined,
    coverUrl: (row.cover_url as string) ?? undefined,
    publisher: (row.publisher as string) ?? undefined,
    publishYear: (row.publish_year as number) ?? undefined,
    subjects: (row.subjects as string[]) ?? undefined,
    openLibraryWorkKey: (row.open_library_work_key as string) ?? undefined,
    externalMetadata: (row.external_metadata as Record<string, unknown>) ?? undefined,
    relatedStarIds: (row.related_star_ids as string[]) ?? [],
    startedAt: (row.started_at as string) ?? undefined,
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
  if (input.ownership !== undefined) row.ownership = input.ownership
  if (input.format !== undefined) row.format = input.format
  if (input.readStatus !== undefined) row.read_status = input.readStatus
  if (input.totalPages !== undefined) row.total_pages = input.totalPages
  if (input.totalMinutes !== undefined) row.total_minutes = input.totalMinutes
  if (input.rating !== undefined) row.rating = input.rating
  if (input.notes !== undefined) row.notes = input.notes
  if (input.tags !== undefined) row.tags = input.tags
  if (input.isbn !== undefined) row.isbn = input.isbn
  if (input.coverUrl !== undefined) row.cover_url = input.coverUrl
  if (input.publisher !== undefined) row.publisher = input.publisher
  if (input.publishYear !== undefined) row.publish_year = input.publishYear
  if (input.subjects !== undefined) row.subjects = input.subjects
  if (input.openLibraryWorkKey !== undefined) row.open_library_work_key = input.openLibraryWorkKey
  if (input.externalMetadata !== undefined) row.external_metadata = input.externalMetadata
  if (input.relatedStarIds !== undefined) row.related_star_ids = input.relatedStarIds
  if (input.startedAt !== undefined) row.started_at = input.startedAt
  if (input.completedAt !== undefined) row.completed_at = input.completedAt
  return row
}

export function readingLogFromRow(row: Record<string, unknown>): ReadingLog {
  return {
    id: row.id as string,
    bookId: row.book_id as string,
    date: row.date as string,
    currentPage: (row.current_page as number) ?? undefined,
    currentTimeMinutes: (row.current_time_minutes as number) ?? undefined,
    percentComplete: (row.percent_complete as number) ?? undefined,
    minutesSpentReading: (row.minutes_spent_reading as number) ?? undefined,
    notes: (row.notes as string) ?? undefined,
    createdAt: row.created_at as string,
  }
}

export function readingLogToRow(input: Partial<ReadingLog>, userId: string): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId }
  if (input.bookId !== undefined) row.book_id = input.bookId
  if (input.date !== undefined) row.date = input.date
  if (input.currentPage !== undefined) row.current_page = input.currentPage
  if (input.currentTimeMinutes !== undefined) row.current_time_minutes = input.currentTimeMinutes
  if (input.percentComplete !== undefined) row.percent_complete = input.percentComplete
  if (input.minutesSpentReading !== undefined) row.minutes_spent_reading = input.minutesSpentReading
  if (input.notes !== undefined) row.notes = input.notes
  return row
}

// --- Bucket List ---

export function bucketListItemFromRow(row: Record<string, unknown>): BucketListItem {
  return {
    id: row.id as string,
    category: row.category as BucketListItem['category'],
    name: row.name as string,
    notes: (row.notes as string) ?? undefined,
    status: row.status as BucketListItem['status'],
    tags: (row.tags as string[]) ?? [],
    relatedStarIds: (row.related_star_ids as string[]) ?? [],
    bookId: (row.book_id as string) ?? undefined,
    watchableId: (row.watchable_id as string) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    completedAt: (row.completed_at as string) ?? undefined,
  }
}

export function bucketListItemToRow(
  input: Partial<BucketListItem>,
  userId: string,
): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId }
  if (input.category !== undefined) row.category = input.category
  if (input.name !== undefined) row.name = input.name
  if (input.notes !== undefined) row.notes = input.notes
  if (input.status !== undefined) row.status = input.status
  if (input.tags !== undefined) row.tags = input.tags
  if (input.relatedStarIds !== undefined) row.related_star_ids = input.relatedStarIds
  if (input.bookId !== undefined) row.book_id = input.bookId
  if (input.watchableId !== undefined) row.watchable_id = input.watchableId
  if (input.completedAt !== undefined) row.completed_at = input.completedAt
  return row
}

// --- Chart configs ---

export function chartConfigFromRow(row: Record<string, unknown>): ChartConfig {
  return {
    id: row.id as string,
    viewName: row.view_name as string,
    title: row.title as string,
    chartType: row.chart_type as ChartConfig['chartType'],
    xAxis: row.x_axis as ChartConfig['xAxis'],
    yAxis: row.y_axis as ChartConfig['yAxis'],
    sortIndex: (row.sort_index as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function chartConfigToRow(input: Partial<ChartConfig>, userId: string): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId }
  if (input.viewName !== undefined) row.view_name = input.viewName
  if (input.title !== undefined) row.title = input.title
  if (input.chartType !== undefined) row.chart_type = input.chartType
  if (input.xAxis !== undefined) row.x_axis = input.xAxis
  if (input.yAxis !== undefined) row.y_axis = input.yAxis
  if (input.sortIndex !== undefined) row.sort_index = input.sortIndex
  return row
}
