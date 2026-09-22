import type { AppSettings, Constellation, Star, Task } from '@/types'
import type { Book, ReadingLog } from '@/types/library'
import type { BucketListItem } from '@/types/bucketList'
import type { ChartConfig } from '@/types/charts'
import type { Episode, ViewingSession, Watchable } from '@/types/watching'

// The whole app talks to storage through this interface — LocalStore
// (localStorage, no login) and SupabaseStore (multi-device, behind auth)
// both implement it identically, so every component and hook is
// storage-agnostic. Adding a table means adding it here and to both
// implementations, nothing else.
export interface AdAstraStore {
  // --- Core Universe: Stars, Constellations, Tasks (Planets & Moons), Settings ---
  listStars(): Promise<Star[]>
  getStar(id: string): Promise<Star | undefined>
  createStar(input: Partial<Star> & { name: string }): Promise<Star>
  updateStar(id: string, patch: Partial<Star>): Promise<Star>
  deleteStar(id: string): Promise<void>

  listConstellations(): Promise<Constellation[]>
  getConstellation(id: string): Promise<Constellation | undefined>
  createConstellation(input: Partial<Constellation> & { name: string }): Promise<Constellation>
  updateConstellation(id: string, patch: Partial<Constellation>): Promise<Constellation>
  deleteConstellation(id: string): Promise<void>

  listTasks(starId?: string): Promise<Task[]>
  createTask(input: Partial<Task> & { starId: string; name: string }): Promise<Task>
  updateTask(id: string, patch: Partial<Task>): Promise<Task>
  deleteTask(id: string): Promise<void>

  getSettings(): Promise<AppSettings>
  updateSettings(patch: Partial<AppSettings>): Promise<AppSettings>

  // --- Watching (movies & TV) ---
  listWatchables(): Promise<Watchable[]>
  getWatchable(id: string): Promise<Watchable | undefined>
  createWatchable(input: Partial<Watchable> & { title: string }): Promise<Watchable>
  updateWatchable(id: string, patch: Partial<Watchable>): Promise<Watchable>
  deleteWatchable(id: string): Promise<void>

  listEpisodes(watchableId?: string): Promise<Episode[]>
  createEpisode(input: Partial<Episode> & { watchableId: string }): Promise<Episode>
  updateEpisode(id: string, patch: Partial<Episode>): Promise<Episode>
  deleteEpisode(id: string): Promise<void>

  listViewingSessions(watchableId?: string): Promise<ViewingSession[]>
  createViewingSession(
    input: Partial<ViewingSession> & { watchableId: string },
  ): Promise<ViewingSession>
  updateViewingSession(id: string, patch: Partial<ViewingSession>): Promise<ViewingSession>
  deleteViewingSession(id: string): Promise<void>

  // --- Library (books you own, have read, or want to read) ---
  listBooks(): Promise<Book[]>
  getBook(id: string): Promise<Book | undefined>
  createBook(input: Partial<Book> & { title: string }): Promise<Book>
  updateBook(id: string, patch: Partial<Book>): Promise<Book>
  deleteBook(id: string): Promise<void>

  listReadingLogs(bookId?: string): Promise<ReadingLog[]>
  createReadingLog(input: Partial<ReadingLog> & { bookId: string }): Promise<ReadingLog>
  updateReadingLog(id: string, patch: Partial<ReadingLog>): Promise<ReadingLog>
  deleteReadingLog(id: string): Promise<void>

  // --- Bucket List (travel destinations / books / shows / movies) ---
  listBucketListItems(): Promise<BucketListItem[]>
  getBucketListItem(id: string): Promise<BucketListItem | undefined>
  createBucketListItem(
    input: Partial<BucketListItem> & { category: BucketListItem['category']; name: string },
  ): Promise<BucketListItem>
  updateBucketListItem(id: string, patch: Partial<BucketListItem>): Promise<BucketListItem>
  deleteBucketListItem(id: string): Promise<void>

  // --- Chart configs (dynamic reading-metrics KPI builder) ---
  listChartConfigs(viewName?: string): Promise<ChartConfig[]>
  createChartConfig(
    input: Partial<ChartConfig> & {
      title: string
      chartType: ChartConfig['chartType']
      xAxis: ChartConfig['xAxis']
      yAxis: ChartConfig['yAxis']
    },
  ): Promise<ChartConfig>
  updateChartConfig(id: string, patch: Partial<ChartConfig>): Promise<ChartConfig>
  deleteChartConfig(id: string): Promise<void>
}
