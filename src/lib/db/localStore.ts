import { v4 as uuid } from 'uuid'
import type { AppSettings, Constellation, Star, Task } from '@/types'
import type { Book, ReadingLog } from '@/types/library'
import type { BucketListItem } from '@/types/bucketList'
import type { ChartConfig } from '@/types/charts'
import { DEFAULT_VIEW_NAME } from '@/types/charts'
import type { Episode, ViewingSession, Watchable } from '@/types/watching'
import type { AdAstraStore } from './types'

const KEYS = {
  stars: 'ad_astra_stars',
  constellations: 'ad_astra_constellations',
  tasks: 'ad_astra_tasks',
  settings: 'ad_astra_settings',
  watchables: 'ad_astra_watchables',
  episodes: 'ad_astra_episodes',
  viewingSessions: 'ad_astra_viewing_sessions',
  books: 'ad_astra_books',
  readingLogs: 'ad_astra_reading_logs',
  bucketListItems: 'ad_astra_bucket_list_items',
  chartConfigs: 'ad_astra_chart_configs',
}

function read<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

function now() {
  return new Date().toISOString()
}

const DEFAULT_SETTINGS: AppSettings = { currentOrbitLimit: 5, readingMetricsTimeframe: '30d' }

export class LocalStore implements AdAstraStore {
  // --- Phase 1: Core Universe ---

  async listStars(): Promise<Star[]> {
    return read<Star[]>(KEYS.stars, [])
  }

  async getStar(id: string): Promise<Star | undefined> {
    return (await this.listStars()).find((s) => s.id === id)
  }

  async createStar(input: Partial<Star> & { name: string }): Promise<Star> {
    const stars = await this.listStars()
    const star: Star = {
      id: uuid(),
      name: input.name,
      description: input.description,
      category: input.category,
      stage: input.stage ?? 'someday',
      tags: input.tags ?? [],
      desiredTimeframe: input.desiredTimeframe,
      companions: input.companions,
      roughRequirements: input.roughRequirements,
      desiredOutcome: input.desiredOutcome,
      estimatedEffort: input.estimatedEffort,
      dependencies: input.dependencies ?? [],
      budget: input.budget,
      deadline: input.deadline,
      targetCompletionDate: input.targetCompletionDate,
      progress: input.progress ?? 0,
      images: input.images ?? [],
      notes: input.notes,
      completionDate: input.completionDate,
      reflection: input.reflection,
      relatedStarIds: input.relatedStarIds ?? [],
      createdAt: now(),
      updatedAt: now(),
    }
    write(KEYS.stars, [...stars, star])
    return star
  }

  async updateStar(id: string, patch: Partial<Star>): Promise<Star> {
    const stars = await this.listStars()
    const idx = stars.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error(`Star ${id} not found`)
    const updated = { ...stars[idx], ...patch, updatedAt: now() }
    stars[idx] = updated
    write(KEYS.stars, stars)
    return updated
  }

  async deleteStar(id: string): Promise<void> {
    write(
      KEYS.stars,
      (await this.listStars()).filter((s) => s.id !== id),
    )
    write(
      KEYS.tasks,
      (await this.listTasks()).filter((t) => t.starId !== id),
    )
  }

  async listConstellations(): Promise<Constellation[]> {
    return read<Constellation[]>(KEYS.constellations, [])
  }

  async getConstellation(id: string): Promise<Constellation | undefined> {
    return (await this.listConstellations()).find((c) => c.id === id)
  }

  async createConstellation(
    input: Partial<Constellation> & { name: string },
  ): Promise<Constellation> {
    const constellations = await this.listConstellations()
    const constellation: Constellation = {
      id: uuid(),
      name: input.name,
      description: input.description,
      coverImage: input.coverImage,
      starIds: input.starIds ?? [],
      anchorStarId: input.anchorStarId,
      targetDate: input.targetDate,
      priority: input.priority ?? 0,
      progress: input.progress ?? 0,
      status: input.status ?? 'active',
      createdAt: now(),
      updatedAt: now(),
    }
    write(KEYS.constellations, [...constellations, constellation])
    return constellation
  }

  async updateConstellation(id: string, patch: Partial<Constellation>): Promise<Constellation> {
    const constellations = await this.listConstellations()
    const idx = constellations.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error(`Constellation ${id} not found`)
    const updated = { ...constellations[idx], ...patch, updatedAt: now() }
    constellations[idx] = updated
    write(KEYS.constellations, constellations)
    return updated
  }

  async deleteConstellation(id: string): Promise<void> {
    write(
      KEYS.constellations,
      (await this.listConstellations()).filter((c) => c.id !== id),
    )
  }

  async listTasks(starId?: string): Promise<Task[]> {
    const tasks = read<Task[]>(KEYS.tasks, [])
    return starId ? tasks.filter((t) => t.starId === starId) : tasks
  }

  async createTask(input: Partial<Task> & { starId: string; name: string }): Promise<Task> {
    const tasks = await this.listTasks()
    const task: Task = {
      id: uuid(),
      starId: input.starId,
      parentTaskId: input.parentTaskId,
      name: input.name,
      description: input.description,
      status: input.status ?? 'todo',
      estimatedMinutes: input.estimatedMinutes,
      actualMinutes: input.actualMinutes,
      dueDate: input.dueDate,
      dependencyTaskIds: input.dependencyTaskIds ?? [],
      notes: input.notes,
      createdAt: now(),
      updatedAt: now(),
      activityType: input.activityType,
      suitableLocations: input.suitableLocations,
      suitableDevices: input.suitableDevices,
      requiredEffort: input.requiredEffort,
      requiredEnergy: input.requiredEnergy,
      tags: input.tags ?? [],
      taskType: input.taskType,
      habitFrequency: input.habitFrequency,
    }
    write(KEYS.tasks, [...tasks, task])
    return task
  }

  async updateTask(id: string, patch: Partial<Task>): Promise<Task> {
    const tasks = await this.listTasks()
    const idx = tasks.findIndex((t) => t.id === id)
    if (idx === -1) throw new Error(`Task ${id} not found`)
    const updated = {
      ...tasks[idx],
      ...patch,
      updatedAt: now(),
      completedAt: patch.status === 'done' ? now() : tasks[idx].completedAt,
    }
    tasks[idx] = updated
    write(KEYS.tasks, tasks)
    return updated
  }

  async deleteTask(id: string): Promise<void> {
    write(
      KEYS.tasks,
      (await this.listTasks()).filter((t) => t.id !== id),
    )
  }

  async getSettings(): Promise<AppSettings> {
    return read<AppSettings>(KEYS.settings, DEFAULT_SETTINGS)
  }

  async updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    const updated = { ...(await this.getSettings()), ...patch }
    write(KEYS.settings, updated)
    return updated
  }

  // --- Watching (movies & TV) ---

  async listWatchables(): Promise<Watchable[]> {
    return read<Watchable[]>(KEYS.watchables, [])
  }

  async getWatchable(id: string): Promise<Watchable | undefined> {
    return (await this.listWatchables()).find((w) => w.id === id)
  }

  async createWatchable(input: Partial<Watchable> & { title: string }): Promise<Watchable> {
    const watchables = await this.listWatchables()
    const watchable: Watchable = {
      id: uuid(),
      title: input.title,
      type: input.type ?? 'movie',
      genre: input.genre,
      format: input.format,
      status: input.status ?? 'want_to_watch',
      rating: input.rating,
      notes: input.notes,
      tags: input.tags ?? [],
      relatedStarIds: input.relatedStarIds ?? [],
      createdAt: now(),
      updatedAt: now(),
      completedAt: input.completedAt,
    }
    write(KEYS.watchables, [...watchables, watchable])
    return watchable
  }

  async updateWatchable(id: string, patch: Partial<Watchable>): Promise<Watchable> {
    const watchables = await this.listWatchables()
    const idx = watchables.findIndex((w) => w.id === id)
    if (idx === -1) throw new Error(`Watchable ${id} not found`)
    const updated = { ...watchables[idx], ...patch, updatedAt: now() }
    watchables[idx] = updated
    write(KEYS.watchables, watchables)
    return updated
  }

  async deleteWatchable(id: string): Promise<void> {
    write(KEYS.watchables, (await this.listWatchables()).filter((w) => w.id !== id))
    write(KEYS.episodes, (await this.listEpisodes()).filter((e) => e.watchableId !== id))
    write(
      KEYS.viewingSessions,
      (await this.listViewingSessions()).filter((s) => s.watchableId !== id),
    )
  }

  async listEpisodes(watchableId?: string): Promise<Episode[]> {
    const episodes = read<Episode[]>(KEYS.episodes, [])
    return watchableId ? episodes.filter((e) => e.watchableId === watchableId) : episodes
  }

  async createEpisode(input: Partial<Episode> & { watchableId: string }): Promise<Episode> {
    const episodes = await this.listEpisodes()
    const episode: Episode = {
      id: uuid(),
      watchableId: input.watchableId,
      season: input.season,
      episodeNumber: input.episodeNumber,
      name: input.name,
      watched: input.watched ?? false,
      notes: input.notes,
      sortIndex:
        input.sortIndex ?? episodes.filter((e) => e.watchableId === input.watchableId).length,
      createdAt: now(),
      updatedAt: now(),
    }
    write(KEYS.episodes, [...episodes, episode])
    return episode
  }

  async updateEpisode(id: string, patch: Partial<Episode>): Promise<Episode> {
    const episodes = await this.listEpisodes()
    const idx = episodes.findIndex((e) => e.id === id)
    if (idx === -1) throw new Error(`Episode ${id} not found`)
    const updated = { ...episodes[idx], ...patch, updatedAt: now() }
    episodes[idx] = updated
    write(KEYS.episodes, episodes)
    return updated
  }

  async deleteEpisode(id: string): Promise<void> {
    write(KEYS.episodes, (await this.listEpisodes()).filter((e) => e.id !== id))
  }

  async listViewingSessions(watchableId?: string): Promise<ViewingSession[]> {
    const sessions = read<ViewingSession[]>(KEYS.viewingSessions, [])
    return watchableId ? sessions.filter((s) => s.watchableId === watchableId) : sessions
  }

  async createViewingSession(
    input: Partial<ViewingSession> & { watchableId: string },
  ): Promise<ViewingSession> {
    const sessions = await this.listViewingSessions()
    const session: ViewingSession = {
      id: uuid(),
      watchableId: input.watchableId,
      date: input.date ?? now().slice(0, 10),
      minutes: input.minutes,
      notes: input.notes,
      rating: input.rating,
      completionStatus: input.completionStatus,
      createdAt: now(),
      updatedAt: now(),
    }
    write(KEYS.viewingSessions, [...sessions, session])

    if (session.completionStatus === 'completed' || session.completionStatus === 'dnf') {
      await this.updateWatchable(session.watchableId, {
        status: session.completionStatus === 'completed' ? 'watched' : 'dnf',
        rating: session.rating ?? (await this.getWatchable(session.watchableId))?.rating,
        completedAt: now(),
      })
    }
    return session
  }

  async updateViewingSession(
    id: string,
    patch: Partial<ViewingSession>,
  ): Promise<ViewingSession> {
    const sessions = await this.listViewingSessions()
    const idx = sessions.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error(`Viewing session ${id} not found`)
    const updated = { ...sessions[idx], ...patch, updatedAt: now() }
    sessions[idx] = updated
    write(KEYS.viewingSessions, sessions)
    return updated
  }

  async deleteViewingSession(id: string): Promise<void> {
    write(
      KEYS.viewingSessions,
      (await this.listViewingSessions()).filter((s) => s.id !== id),
    )
  }

  // --- Library (books) ---

  async listBooks(): Promise<Book[]> {
    return read<Book[]>(KEYS.books, [])
  }

  async getBook(id: string): Promise<Book | undefined> {
    return (await this.listBooks()).find((b) => b.id === id)
  }

  async createBook(input: Partial<Book> & { title: string }): Promise<Book> {
    const books = await this.listBooks()
    const book: Book = {
      id: uuid(),
      title: input.title,
      author: input.author,
      series: input.series,
      genre: input.genre,
      ownership: input.ownership ?? 'tbd',
      format: input.format ?? 'tbd',
      readStatus: input.readStatus ?? 'want_to_read',
      totalPages: input.totalPages,
      totalMinutes: input.totalMinutes,
      rating: input.rating,
      notes: input.notes,
      tags: input.tags ?? [],
      relatedStarIds: input.relatedStarIds ?? [],
      startedAt: input.startedAt,
      createdAt: now(),
      updatedAt: now(),
      completedAt: input.completedAt,
    }
    write(KEYS.books, [...books, book])
    return book
  }

  async updateBook(id: string, patch: Partial<Book>): Promise<Book> {
    const books = await this.listBooks()
    const idx = books.findIndex((b) => b.id === id)
    if (idx === -1) throw new Error(`Book ${id} not found`)
    const updated = { ...books[idx], ...patch, updatedAt: now() }
    books[idx] = updated
    write(KEYS.books, books)
    return updated
  }

  async deleteBook(id: string): Promise<void> {
    write(KEYS.books, (await this.listBooks()).filter((b) => b.id !== id))
    write(
      KEYS.readingLogs,
      (await this.listReadingLogs()).filter((l) => l.bookId !== id),
    )
  }

  async listReadingLogs(bookId?: string): Promise<ReadingLog[]> {
    const logs = read<ReadingLog[]>(KEYS.readingLogs, [])
    return bookId ? logs.filter((l) => l.bookId === bookId) : logs
  }

  async createReadingLog(input: Partial<ReadingLog> & { bookId: string }): Promise<ReadingLog> {
    const logs = await this.listReadingLogs()
    const log: ReadingLog = {
      id: uuid(),
      bookId: input.bookId,
      date: input.date ?? now().slice(0, 10),
      currentPage: input.currentPage,
      currentTimeMinutes: input.currentTimeMinutes,
      percentComplete: input.percentComplete,
      minutesSpentReading: input.minutesSpentReading,
      notes: input.notes,
      createdAt: now(),
    }
    write(KEYS.readingLogs, [...logs, log])
    return log
  }

  async updateReadingLog(id: string, patch: Partial<ReadingLog>): Promise<ReadingLog> {
    const logs = await this.listReadingLogs()
    const idx = logs.findIndex((l) => l.id === id)
    if (idx === -1) throw new Error(`Reading log ${id} not found`)
    const updated = { ...logs[idx], ...patch }
    logs[idx] = updated
    write(KEYS.readingLogs, logs)
    return updated
  }

  async deleteReadingLog(id: string): Promise<void> {
    write(
      KEYS.readingLogs,
      (await this.listReadingLogs()).filter((l) => l.id !== id),
    )
  }

  // --- Bucket List ---

  async listBucketListItems(): Promise<BucketListItem[]> {
    return read<BucketListItem[]>(KEYS.bucketListItems, [])
  }

  async getBucketListItem(id: string): Promise<BucketListItem | undefined> {
    return (await this.listBucketListItems()).find((i) => i.id === id)
  }

  async createBucketListItem(
    input: Partial<BucketListItem> & { category: BucketListItem['category']; name: string },
  ): Promise<BucketListItem> {
    const items = await this.listBucketListItems()
    const item: BucketListItem = {
      id: uuid(),
      category: input.category,
      name: input.name,
      notes: input.notes,
      status: input.status ?? 'backlog',
      tags: input.tags ?? [],
      relatedStarIds: input.relatedStarIds ?? [],
      bookId: input.bookId,
      watchableId: input.watchableId,
      createdAt: now(),
      updatedAt: now(),
      completedAt: input.completedAt,
    }
    write(KEYS.bucketListItems, [...items, item])
    return item
  }

  async updateBucketListItem(
    id: string,
    patch: Partial<BucketListItem>,
  ): Promise<BucketListItem> {
    const items = await this.listBucketListItems()
    const idx = items.findIndex((i) => i.id === id)
    if (idx === -1) throw new Error(`Bucket list item ${id} not found`)
    const updated = { ...items[idx], ...patch, updatedAt: now() }
    items[idx] = updated
    write(KEYS.bucketListItems, items)
    return updated
  }

  async deleteBucketListItem(id: string): Promise<void> {
    write(
      KEYS.bucketListItems,
      (await this.listBucketListItems()).filter((i) => i.id !== id),
    )
  }

  // --- Chart configs (dynamic metrics builder) ---

  async listChartConfigs(viewName = DEFAULT_VIEW_NAME): Promise<ChartConfig[]> {
    return read<ChartConfig[]>(KEYS.chartConfigs, []).filter((c) => c.viewName === viewName)
  }

  async createChartConfig(
    input: Partial<ChartConfig> & { title: string; chartType: ChartConfig['chartType']; xAxis: ChartConfig['xAxis']; yAxis: ChartConfig['yAxis'] },
  ): Promise<ChartConfig> {
    const all = read<ChartConfig[]>(KEYS.chartConfigs, [])
    const viewName = input.viewName ?? DEFAULT_VIEW_NAME
    const config: ChartConfig = {
      id: uuid(),
      viewName,
      title: input.title,
      chartType: input.chartType,
      xAxis: input.xAxis,
      yAxis: input.yAxis,
      sortIndex: input.sortIndex ?? all.filter((c) => c.viewName === viewName).length,
      createdAt: now(),
      updatedAt: now(),
    }
    write(KEYS.chartConfigs, [...all, config])
    return config
  }

  async updateChartConfig(id: string, patch: Partial<ChartConfig>): Promise<ChartConfig> {
    const all = read<ChartConfig[]>(KEYS.chartConfigs, [])
    const idx = all.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error(`Chart config ${id} not found`)
    const updated = { ...all[idx], ...patch, updatedAt: now() }
    all[idx] = updated
    write(KEYS.chartConfigs, all)
    return updated
  }

  async deleteChartConfig(id: string): Promise<void> {
    write(
      KEYS.chartConfigs,
      read<ChartConfig[]>(KEYS.chartConfigs, []).filter((c) => c.id !== id),
    )
  }
}
