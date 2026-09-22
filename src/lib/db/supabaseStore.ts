import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppSettings, Constellation, Star, Task } from '@/types'
import type { Book, ReadingLog } from '@/types/library'
import type { BucketListItem } from '@/types/bucketList'
import type { ChartConfig } from '@/types/charts'
import { DEFAULT_VIEW_NAME } from '@/types/charts'
import type { Episode, ViewingSession, Watchable } from '@/types/watching'
import type { AdAstraStore } from './types'
import {
  bookFromRow,
  bookToRow,
  bucketListItemFromRow,
  bucketListItemToRow,
  chartConfigFromRow,
  chartConfigToRow,
  constellationFromRow,
  constellationToRow,
  episodeFromRow,
  episodeToRow,
  readingLogFromRow,
  readingLogToRow,
  settingsFromRow,
  starFromRow,
  starToRow,
  taskFromRow,
  taskToRow,
  viewingSessionFromRow,
  viewingSessionToRow,
  watchableFromRow,
  watchableToRow,
} from './supabaseMappers'

function must<T>(value: T | null | undefined, what: string): T {
  if (value == null) throw new Error(`${what} not found`)
  return value
}

export class SupabaseStore implements AdAstraStore {
  private client: SupabaseClient
  private userId: string

  constructor(client: SupabaseClient, userId: string) {
    this.client = client
    this.userId = userId
  }

  // --- Core Universe: Stars, Constellations, Tasks, Settings ---

  async listStars(): Promise<Star[]> {
    const { data, error } = await this.client
      .from('stars')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(starFromRow)
  }

  async getStar(id: string): Promise<Star | undefined> {
    const { data, error } = await this.client.from('stars').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? starFromRow(data) : undefined
  }

  async createStar(input: Partial<Star> & { name: string }): Promise<Star> {
    const { data, error } = await this.client
      .from('stars')
      .insert(starToRow(input, this.userId))
      .select()
      .single()
    if (error) throw error
    return starFromRow(must(data, 'Star'))
  }

  async updateStar(id: string, patch: Partial<Star>): Promise<Star> {
    const { data, error } = await this.client
      .from('stars')
      .update(starToRow(patch, this.userId))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return starFromRow(must(data, 'Star'))
  }

  async deleteStar(id: string): Promise<void> {
    const { error } = await this.client.from('stars').delete().eq('id', id)
    if (error) throw error
  }

  async listConstellations(): Promise<Constellation[]> {
    const { data, error } = await this.client
      .from('constellations')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(constellationFromRow)
  }

  async getConstellation(id: string): Promise<Constellation | undefined> {
    const { data, error } = await this.client
      .from('constellations')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data ? constellationFromRow(data) : undefined
  }

  async createConstellation(
    input: Partial<Constellation> & { name: string },
  ): Promise<Constellation> {
    const { data, error } = await this.client
      .from('constellations')
      .insert(constellationToRow(input, this.userId))
      .select()
      .single()
    if (error) throw error
    return constellationFromRow(must(data, 'Constellation'))
  }

  async updateConstellation(id: string, patch: Partial<Constellation>): Promise<Constellation> {
    const { data, error } = await this.client
      .from('constellations')
      .update(constellationToRow(patch, this.userId))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return constellationFromRow(must(data, 'Constellation'))
  }

  async deleteConstellation(id: string): Promise<void> {
    const { error } = await this.client.from('constellations').delete().eq('id', id)
    if (error) throw error
  }

  async listTasks(starId?: string): Promise<Task[]> {
    let query = this.client.from('tasks').select('*').order('created_at', { ascending: true })
    if (starId) query = query.eq('star_id', starId)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(taskFromRow)
  }

  async createTask(input: Partial<Task> & { starId: string; name: string }): Promise<Task> {
    const { data, error } = await this.client
      .from('tasks')
      .insert(taskToRow(input, this.userId))
      .select()
      .single()
    if (error) throw error
    return taskFromRow(must(data, 'Task'))
  }

  async updateTask(id: string, patch: Partial<Task>): Promise<Task> {
    const withCompletion =
      patch.status === 'done' && !patch.completedAt
        ? { ...patch, completedAt: new Date().toISOString() }
        : patch
    const { data, error } = await this.client
      .from('tasks')
      .update(taskToRow(withCompletion, this.userId))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return taskFromRow(must(data, 'Task'))
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await this.client.from('tasks').delete().eq('id', id)
    if (error) throw error
  }

  async getSettings(): Promise<AppSettings> {
    const { data, error } = await this.client
      .from('app_settings')
      .select('*')
      .eq('user_id', this.userId)
      .maybeSingle()
    if (error) throw error
    return settingsFromRow(data)
  }

  async updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings()
    const merged = { ...current, ...patch }
    const { error } = await this.client.from('app_settings').upsert({
      user_id: this.userId,
      current_orbit_limit: merged.currentOrbitLimit,
      reading_metrics_timeframe: merged.readingMetricsTimeframe,
    })
    if (error) throw error
    return merged
  }

  // --- Watching (movies & TV) ---

  async listWatchables(): Promise<Watchable[]> {
    const { data, error } = await this.client
      .from('watchables')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(watchableFromRow)
  }

  async getWatchable(id: string): Promise<Watchable | undefined> {
    const { data, error } = await this.client
      .from('watchables')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data ? watchableFromRow(data) : undefined
  }

  async createWatchable(input: Partial<Watchable> & { title: string }): Promise<Watchable> {
    const { data, error } = await this.client
      .from('watchables')
      .insert(watchableToRow(input, this.userId))
      .select()
      .single()
    if (error) throw error
    return watchableFromRow(must(data, 'Watchable'))
  }

  async updateWatchable(id: string, patch: Partial<Watchable>): Promise<Watchable> {
    const { data, error } = await this.client
      .from('watchables')
      .update(watchableToRow(patch, this.userId))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return watchableFromRow(must(data, 'Watchable'))
  }

  async deleteWatchable(id: string): Promise<void> {
    const { error } = await this.client.from('watchables').delete().eq('id', id)
    if (error) throw error
  }

  async listEpisodes(watchableId?: string): Promise<Episode[]> {
    let query = this.client.from('episodes').select('*').order('sort_index', { ascending: true })
    if (watchableId) query = query.eq('watchable_id', watchableId)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(episodeFromRow)
  }

  async createEpisode(input: Partial<Episode> & { watchableId: string }): Promise<Episode> {
    const { data, error } = await this.client
      .from('episodes')
      .insert(episodeToRow(input, this.userId))
      .select()
      .single()
    if (error) throw error
    return episodeFromRow(must(data, 'Episode'))
  }

  async updateEpisode(id: string, patch: Partial<Episode>): Promise<Episode> {
    const { data, error } = await this.client
      .from('episodes')
      .update(episodeToRow(patch, this.userId))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return episodeFromRow(must(data, 'Episode'))
  }

  async deleteEpisode(id: string): Promise<void> {
    const { error } = await this.client.from('episodes').delete().eq('id', id)
    if (error) throw error
  }

  async listViewingSessions(watchableId?: string): Promise<ViewingSession[]> {
    let query = this.client.from('viewing_sessions').select('*').order('date', { ascending: true })
    if (watchableId) query = query.eq('watchable_id', watchableId)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(viewingSessionFromRow)
  }

  async createViewingSession(
    input: Partial<ViewingSession> & { watchableId: string },
  ): Promise<ViewingSession> {
    const { data, error } = await this.client
      .from('viewing_sessions')
      .insert(viewingSessionToRow(input, this.userId))
      .select()
      .single()
    if (error) throw error
    const session = viewingSessionFromRow(must(data, 'Viewing session'))

    if (session.completionStatus === 'completed' || session.completionStatus === 'dnf') {
      await this.updateWatchable(session.watchableId, {
        status: session.completionStatus === 'completed' ? 'watched' : 'dnf',
        rating: session.rating ?? (await this.getWatchable(session.watchableId))?.rating,
        completedAt: new Date().toISOString(),
      })
    }
    return session
  }

  async updateViewingSession(
    id: string,
    patch: Partial<ViewingSession>,
  ): Promise<ViewingSession> {
    const { data, error } = await this.client
      .from('viewing_sessions')
      .update(viewingSessionToRow(patch, this.userId))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return viewingSessionFromRow(must(data, 'Viewing session'))
  }

  async deleteViewingSession(id: string): Promise<void> {
    const { error } = await this.client.from('viewing_sessions').delete().eq('id', id)
    if (error) throw error
  }

  // --- Library (books) ---

  async listBooks(): Promise<Book[]> {
    const { data, error } = await this.client
      .from('books')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(bookFromRow)
  }

  async getBook(id: string): Promise<Book | undefined> {
    const { data, error } = await this.client.from('books').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? bookFromRow(data) : undefined
  }

  async createBook(input: Partial<Book> & { title: string }): Promise<Book> {
    const { data, error } = await this.client
      .from('books')
      .insert(bookToRow(input, this.userId))
      .select()
      .single()
    if (error) throw error
    return bookFromRow(must(data, 'Book'))
  }

  async updateBook(id: string, patch: Partial<Book>): Promise<Book> {
    const { data, error } = await this.client
      .from('books')
      .update(bookToRow(patch, this.userId))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return bookFromRow(must(data, 'Book'))
  }

  async deleteBook(id: string): Promise<void> {
    // reading_logs has an ON DELETE CASCADE FK to books, so no manual
    // cleanup needed.
    const { error } = await this.client.from('books').delete().eq('id', id)
    if (error) throw error
  }

  async listReadingLogs(bookId?: string): Promise<ReadingLog[]> {
    let query = this.client.from('reading_logs').select('*').order('date', { ascending: true })
    if (bookId) query = query.eq('book_id', bookId)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(readingLogFromRow)
  }

  async createReadingLog(input: Partial<ReadingLog> & { bookId: string }): Promise<ReadingLog> {
    const { data, error } = await this.client
      .from('reading_logs')
      .insert(readingLogToRow(input, this.userId))
      .select()
      .single()
    if (error) throw error
    return readingLogFromRow(must(data, 'Reading log'))
  }

  async updateReadingLog(id: string, patch: Partial<ReadingLog>): Promise<ReadingLog> {
    const { data, error } = await this.client
      .from('reading_logs')
      .update(readingLogToRow(patch, this.userId))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return readingLogFromRow(must(data, 'Reading log'))
  }

  async deleteReadingLog(id: string): Promise<void> {
    const { error } = await this.client.from('reading_logs').delete().eq('id', id)
    if (error) throw error
  }

  // --- Bucket List ---

  async listBucketListItems(): Promise<BucketListItem[]> {
    const { data, error } = await this.client
      .from('bucket_list_items')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(bucketListItemFromRow)
  }

  async getBucketListItem(id: string): Promise<BucketListItem | undefined> {
    const { data, error } = await this.client
      .from('bucket_list_items')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data ? bucketListItemFromRow(data) : undefined
  }

  async createBucketListItem(
    input: Partial<BucketListItem> & { category: BucketListItem['category']; name: string },
  ): Promise<BucketListItem> {
    const { data, error } = await this.client
      .from('bucket_list_items')
      .insert(bucketListItemToRow(input, this.userId))
      .select()
      .single()
    if (error) throw error
    return bucketListItemFromRow(must(data, 'Bucket list item'))
  }

  async updateBucketListItem(
    id: string,
    patch: Partial<BucketListItem>,
  ): Promise<BucketListItem> {
    const { data, error } = await this.client
      .from('bucket_list_items')
      .update(bucketListItemToRow(patch, this.userId))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return bucketListItemFromRow(must(data, 'Bucket list item'))
  }

  async deleteBucketListItem(id: string): Promise<void> {
    const { error } = await this.client.from('bucket_list_items').delete().eq('id', id)
    if (error) throw error
  }

  // --- Chart configs ---

  async listChartConfigs(viewName: string = DEFAULT_VIEW_NAME): Promise<ChartConfig[]> {
    const { data, error } = await this.client
      .from('chart_configs')
      .select('*')
      .eq('view_name', viewName)
      .order('sort_index', { ascending: true })
    if (error) throw error
    return (data ?? []).map(chartConfigFromRow)
  }

  async createChartConfig(
    input: Partial<ChartConfig> & {
      title: string
      chartType: ChartConfig['chartType']
      xAxis: ChartConfig['xAxis']
      yAxis: ChartConfig['yAxis']
    },
  ): Promise<ChartConfig> {
    const { data, error } = await this.client
      .from('chart_configs')
      .insert(chartConfigToRow({ viewName: DEFAULT_VIEW_NAME, ...input }, this.userId))
      .select()
      .single()
    if (error) throw error
    return chartConfigFromRow(must(data, 'Chart config'))
  }

  async updateChartConfig(id: string, patch: Partial<ChartConfig>): Promise<ChartConfig> {
    const { data, error } = await this.client
      .from('chart_configs')
      .update(chartConfigToRow(patch, this.userId))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return chartConfigFromRow(must(data, 'Chart config'))
  }

  async deleteChartConfig(id: string): Promise<void> {
    const { error } = await this.client.from('chart_configs').delete().eq('id', id)
    if (error) throw error
  }
}
