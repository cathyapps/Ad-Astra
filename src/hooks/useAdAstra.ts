import { useCallback, useEffect, useState } from 'react'
import { db } from '@/lib/db'
import { checkCapacity, resolveCapacityChoice, type CapacityChoice } from '@/lib/currentOrbit'
import { planTransition } from '@/lib/starLifecycle'
import type { AppSettings, Constellation, Star, StarStage, Task } from '@/types'
import type { Book, ReadingLog } from '@/types/library'
import type { BucketListItem } from '@/types/bucketList'
import type { ChartConfig } from '@/types/charts'
import { DEFAULT_VIEW_NAME } from '@/types/charts'
import type { Episode, ViewingSession, Watchable } from '@/types/watching'

export interface PendingCapacityPrompt {
  message: string
  overloaded: boolean
  orbit: Star[]
  incomingStarId: string
}

export function useAdAstra() {
  // --- Core Universe ---
  const [stars, setStars] = useState<Star[]>([])
  const [constellations, setConstellations] = useState<Constellation[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [settings, setSettings] = useState<AppSettings>({
    currentOrbitLimit: 5,
    readingMetricsTimeframe: '30d',
  })

  // --- Watching ---
  const [watchables, setWatchables] = useState<Watchable[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [viewingSessions, setViewingSessions] = useState<ViewingSession[]>([])

  // --- Library ---
  const [books, setBooks] = useState<Book[]>([])
  const [readingLogs, setReadingLogs] = useState<ReadingLog[]>([])

  // --- Bucket List ---
  const [bucketListItems, setBucketListItems] = useState<BucketListItem[]>([])

  // --- Chart configs (default view only — the metrics builder only has one view for now) ---
  const [chartConfigs, setChartConfigs] = useState<ChartConfig[]>([])

  const [loading, setLoading] = useState(true)
  const [capacityPrompt, setCapacityPrompt] = useState<PendingCapacityPrompt | null>(null)

  const reload = useCallback(async () => {
    const [s, c, t, set, watch, eps, vSessions, bks, logs, bucket, charts] = await Promise.all([
      db.listStars(),
      db.listConstellations(),
      db.listTasks(),
      db.getSettings(),
      db.listWatchables(),
      db.listEpisodes(),
      db.listViewingSessions(),
      db.listBooks(),
      db.listReadingLogs(),
      db.listBucketListItems(),
      db.listChartConfigs(DEFAULT_VIEW_NAME),
    ])
    setStars(s)
    setConstellations(c)
    setTasks(t)
    setSettings(set)
    setWatchables(watch)
    setEpisodes(eps)
    setViewingSessions(vSessions)
    setBooks(bks)
    setReadingLogs(logs)
    setBucketListItems(bucket)
    setChartConfigs(charts)
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  // --- Star lifecycle (Someday -> On the Horizon -> Current Orbit -> Completed) ---

  /** Moves a Star to a new stage. If the move enters Current Orbit and
   *  capacity is at/over the limit, this stops short and populates
   *  `capacityPrompt` instead of committing — call `resolveCapacityPrompt`
   *  with the user's choice to finish. Moving backward (to any earlier
   *  stage) never needs the capacity check. */
  const moveStar = useCallback(
    async (starId: string, to: StarStage, opts?: { skipCapacityCheck?: boolean }) => {
      const star = stars.find((s) => s.id === starId)
      if (!star) return
      const { entersCurrentOrbit } = planTransition(star, to)

      if (entersCurrentOrbit && !opts?.skipCapacityCheck) {
        const result = checkCapacity(stars, settings)
        if (result.needsWarning) {
          setCapacityPrompt({
            message: result.message,
            overloaded: result.overloaded,
            orbit: result.orbit,
            incomingStarId: starId,
          })
          return
        }
      }

      const { star: updated } = planTransition(star, to)
      await db.updateStar(starId, updated)
      await reload()
    },
    [stars, settings, reload],
  )

  const resolveCapacityPrompt = useCallback(
    async (choice: CapacityChoice, outgoingStarId?: string) => {
      if (!capacityPrompt) return
      const patches = resolveCapacityChoice(choice, capacityPrompt.incomingStarId, outgoingStarId)
      for (const p of patches) {
        const star = stars.find((s) => s.id === p.starId)
        if (!star) continue
        const { star: updated } = planTransition(star, p.stage)
        await db.updateStar(p.starId, updated)
      }
      setCapacityPrompt(null)
      await reload()
    },
    [capacityPrompt, stars, reload],
  )

  const createStar = useCallback(
    async (input: Partial<Star> & { name: string }) => {
      const star = await db.createStar(input)
      await reload()
      return star
    },
    [reload],
  )

  const updateStar = useCallback(
    async (id: string, patch: Partial<Star>) => {
      await db.updateStar(id, patch)
      await reload()
    },
    [reload],
  )

  const deleteStar = useCallback(
    async (id: string) => {
      await db.deleteStar(id)
      await reload()
    },
    [reload],
  )

  const createConstellation = useCallback(
    async (input: Partial<Constellation> & { name: string }) => {
      const c = await db.createConstellation(input)
      await reload()
      return c
    },
    [reload],
  )

  const updateConstellation = useCallback(
    async (id: string, patch: Partial<Constellation>) => {
      await db.updateConstellation(id, patch)
      await reload()
    },
    [reload],
  )

  const deleteConstellation = useCallback(
    async (id: string) => {
      await db.deleteConstellation(id)
      await reload()
    },
    [reload],
  )

  // A Star's own free-form Planets & Moons (top-level task = Planet,
  // nested via parentTaskId = Moon).
  const createTask = useCallback(
    async (input: Partial<Task> & { starId: string; name: string }) => {
      const t = await db.createTask(input)
      await reload()
      return t
    },
    [reload],
  )

  const updateTask = useCallback(
    async (id: string, patch: Partial<Task>) => {
      await db.updateTask(id, patch)
      await reload()
    },
    [reload],
  )

  const deleteTask = useCallback(
    async (id: string) => {
      await db.deleteTask(id)
      await reload()
    },
    [reload],
  )

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const s = await db.updateSettings(patch)
    setSettings(s)
  }, [])

  // --- Watching (movies & TV) ---

  const createWatchable = useCallback(
    async (input: Partial<Watchable> & { title: string }) => {
      const w = await db.createWatchable(input)
      await reload()
      return w
    },
    [reload],
  )

  const updateWatchable = useCallback(
    async (id: string, patch: Partial<Watchable>) => {
      await db.updateWatchable(id, patch)
      await reload()
    },
    [reload],
  )

  const deleteWatchable = useCallback(
    async (id: string) => {
      await db.deleteWatchable(id)
      await reload()
    },
    [reload],
  )

  const createEpisode = useCallback(
    async (input: Partial<Episode> & { watchableId: string }) => {
      const e = await db.createEpisode(input)
      await reload()
      return e
    },
    [reload],
  )

  const updateEpisode = useCallback(
    async (id: string, patch: Partial<Episode>) => {
      await db.updateEpisode(id, patch)
      await reload()
    },
    [reload],
  )

  const deleteEpisode = useCallback(
    async (id: string) => {
      await db.deleteEpisode(id)
      await reload()
    },
    [reload],
  )

  // Completing/DNF-ing a session also updates the Watchable's own status —
  // handled inside the store (see createViewingSession in localStore.ts /
  // supabaseStore.ts) so every caller gets it for free.
  const createViewingSession = useCallback(
    async (input: Partial<ViewingSession> & { watchableId: string }) => {
      const s = await db.createViewingSession(input)
      await reload()
      return s
    },
    [reload],
  )

  const updateViewingSession = useCallback(
    async (id: string, patch: Partial<ViewingSession>) => {
      await db.updateViewingSession(id, patch)
      await reload()
    },
    [reload],
  )

  const deleteViewingSession = useCallback(
    async (id: string) => {
      await db.deleteViewingSession(id)
      await reload()
    },
    [reload],
  )

  // --- Library (books) ---

  const createBook = useCallback(
    async (input: Partial<Book> & { title: string }) => {
      const b = await db.createBook(input)
      await reload()
      return b
    },
    [reload],
  )

  const updateBook = useCallback(
    async (id: string, patch: Partial<Book>) => {
      await db.updateBook(id, patch)
      await reload()
    },
    [reload],
  )

  const deleteBook = useCallback(
    async (id: string) => {
      await db.deleteBook(id)
      await reload()
    },
    [reload],
  )

  const createReadingLog = useCallback(
    async (input: Partial<ReadingLog> & { bookId: string }) => {
      const l = await db.createReadingLog(input)
      await reload()
      return l
    },
    [reload],
  )

  const updateReadingLog = useCallback(
    async (id: string, patch: Partial<ReadingLog>) => {
      await db.updateReadingLog(id, patch)
      await reload()
    },
    [reload],
  )

  const deleteReadingLog = useCallback(
    async (id: string) => {
      await db.deleteReadingLog(id)
      await reload()
    },
    [reload],
  )

  // --- Bucket List ---

  const createBucketListItem = useCallback(
    async (input: Partial<BucketListItem> & { category: BucketListItem['category']; name: string }) => {
      const item = await db.createBucketListItem(input)
      await reload()
      return item
    },
    [reload],
  )

  const updateBucketListItem = useCallback(
    async (id: string, patch: Partial<BucketListItem>) => {
      await db.updateBucketListItem(id, patch)
      await reload()
    },
    [reload],
  )

  const deleteBucketListItem = useCallback(
    async (id: string) => {
      await db.deleteBucketListItem(id)
      await reload()
    },
    [reload],
  )

  // --- Chart configs (dynamic metrics/KPI builder) ---

  const createChartConfig = useCallback(
    async (
      input: Partial<ChartConfig> & {
        title: string
        chartType: ChartConfig['chartType']
        xAxis: ChartConfig['xAxis']
        yAxis: ChartConfig['yAxis']
      },
    ) => {
      const c = await db.createChartConfig({ viewName: DEFAULT_VIEW_NAME, ...input })
      await reload()
      return c
    },
    [reload],
  )

  const updateChartConfig = useCallback(
    async (id: string, patch: Partial<ChartConfig>) => {
      await db.updateChartConfig(id, patch)
      await reload()
    },
    [reload],
  )

  const deleteChartConfig = useCallback(
    async (id: string) => {
      await db.deleteChartConfig(id)
      await reload()
    },
    [reload],
  )

  return {
    loading,
    stars,
    constellations,
    tasks,
    settings,
    watchables,
    episodes,
    viewingSessions,
    books,
    readingLogs,
    bucketListItems,
    chartConfigs,
    capacityPrompt,
    reload,
    moveStar,
    resolveCapacityPrompt,
    createStar,
    updateStar,
    deleteStar,
    createConstellation,
    updateConstellation,
    deleteConstellation,
    createTask,
    updateTask,
    deleteTask,
    updateSettings,
    createWatchable,
    updateWatchable,
    deleteWatchable,
    createEpisode,
    updateEpisode,
    deleteEpisode,
    createViewingSession,
    updateViewingSession,
    deleteViewingSession,
    createBook,
    updateBook,
    deleteBook,
    createReadingLog,
    updateReadingLog,
    deleteReadingLog,
    createBucketListItem,
    updateBucketListItem,
    deleteBucketListItem,
    createChartConfig,
    updateChartConfig,
    deleteChartConfig,
  }
}
