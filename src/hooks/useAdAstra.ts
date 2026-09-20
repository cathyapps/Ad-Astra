import { useCallback, useEffect, useState } from 'react'
import { db } from '@/lib/db'
import { checkCapacity, resolveCapacityChoice, type CapacityChoice } from '@/lib/currentOrbit'
import { planTransition } from '@/lib/starLifecycle'
import { tripStatusToStarStage, bookStatusToStarStage, watchStatusToStarStage } from '@/lib/autoStars'
import type { AppSettings, Constellation, Star, StarStage, Task } from '@/types'
import type { Trip, TripItem } from '@/types/travel'
import type { Book, BookList, BookListItem, ReadingChallenge, ReadingSession } from '@/types/reading'
import type {
  Episode,
  ViewingSession,
  WatchChallenge,
  Watchable,
  WatchList,
  WatchListItem,
} from '@/types/watching'

export interface PendingCapacityPrompt {
  message: string
  overloaded: boolean
  orbit: Star[]
  incomingStarId: string
}

/** Creates, updates, or removes the auto-managed Star for a Trip/Book/
 *  Watchable as its status changes, or for a BookList/WatchList (which
 *  always gets one). desiredStage === null means "no Star should exist
 *  right now" (e.g. a Trip still at 'idea', a Book still 'want_to_read').
 *  Bypasses the interactive Current-Orbit capacity prompt on purpose —
 *  surfacing that modal as a side effect of, say, logging a reading
 *  session would be jarring; auto-linked stars just add to the orbit. */
async function syncLinkedStar(params: {
  linkedStarId?: string
  desiredStage: StarStage | null
  name: string
  category?: Star['category']
}): Promise<string | undefined> {
  const { linkedStarId, desiredStage, name, category } = params

  if (desiredStage === null) {
    if (linkedStarId) {
      await db.deleteStar(linkedStarId)
      return undefined
    }
    return undefined
  }

  if (linkedStarId) {
    const star = await db.getStar(linkedStarId)
    if (star && star.stage !== desiredStage) {
      await db.updateStar(linkedStarId, { stage: desiredStage })
    } else if (star && star.name !== name) {
      await db.updateStar(linkedStarId, { name })
    }
    return linkedStarId
  }

  const star = await db.createStar({ name, category, stage: desiredStage })
  return star.id
}

export function useAdAstra() {
  const [stars, setStars] = useState<Star[]>([])
  const [constellations, setConstellations] = useState<Constellation[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [settings, setSettings] = useState<AppSettings>({ currentOrbitLimit: 5 })
  const [trips, setTrips] = useState<Trip[]>([])
  const [tripItems, setTripItems] = useState<TripItem[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [bookLists, setBookLists] = useState<BookList[]>([])
  const [bookListItems, setBookListItems] = useState<BookListItem[]>([])
  const [readingSessions, setReadingSessions] = useState<ReadingSession[]>([])
  const [readingChallenges, setReadingChallenges] = useState<ReadingChallenge[]>([])
  const [watchables, setWatchables] = useState<Watchable[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [watchLists, setWatchLists] = useState<WatchList[]>([])
  const [watchListItems, setWatchListItems] = useState<WatchListItem[]>([])
  const [viewingSessions, setViewingSessions] = useState<ViewingSession[]>([])
  const [watchChallenges, setWatchChallenges] = useState<WatchChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [capacityPrompt, setCapacityPrompt] = useState<PendingCapacityPrompt | null>(null)

  const reload = useCallback(async () => {
    const [
      s,
      c,
      t,
      set,
      tr,
      items,
      bks,
      bkLists,
      bkListItems,
      rSessions,
      rChallenges,
      watch,
      eps,
      wLists,
      wListItems,
      vSessions,
      wChallenges,
    ] = await Promise.all([
      db.listStars(),
      db.listConstellations(),
      db.listTasks(),
      db.getSettings(),
      db.listTrips(),
      db.listTripItems(),
      db.listBooks(),
      db.listBookLists(),
      db.listBookListItems(),
      db.listReadingSessions(),
      db.listReadingChallenges(),
      db.listWatchables(),
      db.listEpisodes(),
      db.listWatchLists(),
      db.listWatchListItems(),
      db.listViewingSessions(),
      db.listWatchChallenges(),
    ])
    setStars(s)
    setConstellations(c)
    setTasks(t)
    setSettings(set)
    setTrips(tr)
    setTripItems(items)
    setBooks(bks)
    setBookLists(bkLists)
    setBookListItems(bkListItems)
    setReadingSessions(rSessions)
    setReadingChallenges(rChallenges)
    setWatchables(watch)
    setEpisodes(eps)
    setWatchLists(wLists)
    setWatchListItems(wListItems)
    setViewingSessions(vSessions)
    setWatchChallenges(wChallenges)
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  /** Moves a Star to a new stage. If the move enters Current Orbit and
   *  capacity is at/over the limit, this stops short and populates
   *  `capacityPrompt` instead of committing — call `resolveCapacityPrompt`
   *  with the user's choice to finish. */
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

  const updateSettings = useCallback(
    async (patch: Partial<AppSettings>) => {
      const s = await db.updateSettings(patch)
      setSettings(s)
    },
    [],
  )

  // --- Phase 2: Travel (Trip -> Planets -> Moons) ---

  const createTrip = useCallback(
    async (input: Partial<Trip> & { name: string }) => {
      const trip = await db.createTrip(input)
      const linkedStarId = await syncLinkedStar({
        linkedStarId: trip.linkedStarId,
        desiredStage: tripStatusToStarStage(trip.status),
        name: trip.name,
        category: 'travel',
      })
      if (linkedStarId !== trip.linkedStarId) {
        await db.updateTrip(trip.id, { linkedStarId })
      }
      await reload()
      return trip
    },
    [reload],
  )

  const updateTrip = useCallback(
    async (id: string, patch: Partial<Trip>) => {
      const trip = await db.updateTrip(id, patch)
      if (patch.status !== undefined || patch.name !== undefined) {
        const linkedStarId = await syncLinkedStar({
          linkedStarId: trip.linkedStarId,
          desiredStage: tripStatusToStarStage(trip.status),
          name: trip.name,
          category: 'travel',
        })
        if (linkedStarId !== trip.linkedStarId) {
          await db.updateTrip(trip.id, { linkedStarId })
        }
      }
      await reload()
    },
    [reload],
  )

  const deleteTrip = useCallback(
    async (id: string) => {
      await db.deleteTrip(id)
      await reload()
    },
    [reload],
  )

  const createTripItem = useCallback(
    async (input: Partial<TripItem> & { tripId: string; name: string }) => {
      const item = await db.createTripItem(input)
      await reload()
      return item
    },
    [reload],
  )

  const updateTripItem = useCallback(
    async (id: string, patch: Partial<TripItem>) => {
      await db.updateTripItem(id, patch)
      await reload()
    },
    [reload],
  )

  const deleteTripItem = useCallback(
    async (id: string) => {
      await db.deleteTripItem(id)
      await reload()
    },
    [reload],
  )

  // --- Phase 3: Reading ---

  const createBook = useCallback(
    async (input: Partial<Book> & { title: string }) => {
      const b = await db.createBook(input)
      const linkedStarId = await syncLinkedStar({
        linkedStarId: b.linkedStarId,
        desiredStage: bookStatusToStarStage(b.status),
        name: b.title,
        category: 'reading',
      })
      if (linkedStarId !== b.linkedStarId) {
        await db.updateBook(b.id, { linkedStarId })
      }
      await reload()
      return b
    },
    [reload],
  )

  const updateBook = useCallback(
    async (id: string, patch: Partial<Book>) => {
      const book = await db.updateBook(id, patch)
      if (patch.status !== undefined || patch.title !== undefined) {
        const linkedStarId = await syncLinkedStar({
          linkedStarId: book.linkedStarId,
          desiredStage: bookStatusToStarStage(book.status),
          name: book.title,
          category: 'reading',
        })
        if (linkedStarId !== book.linkedStarId) {
          await db.updateBook(book.id, { linkedStarId })
        }
      }
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

  const createBookList = useCallback(
    async (input: Partial<BookList> & { name: string }) => {
      const l = await db.createBookList(input)
      const star = await db.createStar({ name: l.name, category: 'reading', stage: 'on_the_horizon' })
      await db.updateBookList(l.id, { linkedStarId: star.id })
      await reload()
      return l
    },
    [reload],
  )

  const deleteBookList = useCallback(
    async (id: string) => {
      await db.deleteBookList(id)
      await reload()
    },
    [reload],
  )

  const toggleBookInList = useCallback(
    async (bookListId: string, bookId: string, isMember: boolean) => {
      if (isMember) await db.removeBookFromList(bookListId, bookId)
      else await db.addBookToList(bookListId, bookId)
      await reload()
    },
    [reload],
  )

  const createReadingSession = useCallback(
    async (input: Partial<ReadingSession> & { bookId: string }) => {
      const s = await db.createReadingSession(input)
      if (s.completionStatus === 'completed' || s.completionStatus === 'dnf') {
        const book = await db.getBook(s.bookId)
        if (book) {
          const linkedStarId = await syncLinkedStar({
            linkedStarId: book.linkedStarId,
            desiredStage: bookStatusToStarStage(book.status),
            name: book.title,
            category: 'reading',
          })
          if (linkedStarId !== book.linkedStarId) {
            await db.updateBook(book.id, { linkedStarId })
          }
        }
      }
      await reload()
      return s
    },
    [reload],
  )

  const deleteReadingSession = useCallback(
    async (id: string) => {
      await db.deleteReadingSession(id)
      await reload()
    },
    [reload],
  )

  const createReadingChallenge = useCallback(
    async (input: Partial<ReadingChallenge> & { name: string }) => {
      const c = await db.createReadingChallenge(input)
      await reload()
      return c
    },
    [reload],
  )

  const deleteReadingChallenge = useCallback(
    async (id: string) => {
      await db.deleteReadingChallenge(id)
      await reload()
    },
    [reload],
  )

  // --- Phase 3: Watching ---

  const createWatchable = useCallback(
    async (input: Partial<Watchable> & { title: string }) => {
      const w = await db.createWatchable(input)
      const linkedStarId = await syncLinkedStar({
        linkedStarId: w.linkedStarId,
        desiredStage: watchStatusToStarStage(w.status),
        name: w.title,
        category: 'other',
      })
      if (linkedStarId !== w.linkedStarId) {
        await db.updateWatchable(w.id, { linkedStarId })
      }
      await reload()
      return w
    },
    [reload],
  )

  const updateWatchable = useCallback(
    async (id: string, patch: Partial<Watchable>) => {
      const watchable = await db.updateWatchable(id, patch)
      if (patch.status !== undefined || patch.title !== undefined) {
        const linkedStarId = await syncLinkedStar({
          linkedStarId: watchable.linkedStarId,
          desiredStage: watchStatusToStarStage(watchable.status),
          name: watchable.title,
          category: 'other',
        })
        if (linkedStarId !== watchable.linkedStarId) {
          await db.updateWatchable(watchable.id, { linkedStarId })
        }
      }
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

  const createWatchList = useCallback(
    async (input: Partial<WatchList> & { name: string }) => {
      const l = await db.createWatchList(input)
      const star = await db.createStar({ name: l.name, category: 'other', stage: 'on_the_horizon' })
      await db.updateWatchList(l.id, { linkedStarId: star.id })
      await reload()
      return l
    },
    [reload],
  )

  const deleteWatchList = useCallback(
    async (id: string) => {
      await db.deleteWatchList(id)
      await reload()
    },
    [reload],
  )

  const toggleWatchableInList = useCallback(
    async (watchListId: string, watchableId: string, isMember: boolean) => {
      if (isMember) await db.removeWatchableFromList(watchListId, watchableId)
      else await db.addWatchableToList(watchListId, watchableId)
      await reload()
    },
    [reload],
  )

  const createViewingSession = useCallback(
    async (input: Partial<ViewingSession> & { watchableId: string }) => {
      const s = await db.createViewingSession(input)
      if (s.completionStatus === 'completed' || s.completionStatus === 'dnf') {
        const watchable = await db.getWatchable(s.watchableId)
        if (watchable) {
          const linkedStarId = await syncLinkedStar({
            linkedStarId: watchable.linkedStarId,
            desiredStage: watchStatusToStarStage(watchable.status),
            name: watchable.title,
            category: 'other',
          })
          if (linkedStarId !== watchable.linkedStarId) {
            await db.updateWatchable(watchable.id, { linkedStarId })
          }
        }
      }
      await reload()
      return s
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

  const createWatchChallenge = useCallback(
    async (input: Partial<WatchChallenge> & { name: string }) => {
      const c = await db.createWatchChallenge(input)
      await reload()
      return c
    },
    [reload],
  )

  const deleteWatchChallenge = useCallback(
    async (id: string) => {
      await db.deleteWatchChallenge(id)
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
    trips,
    tripItems,
    books,
    bookLists,
    bookListItems,
    readingSessions,
    readingChallenges,
    watchables,
    episodes,
    watchLists,
    watchListItems,
    viewingSessions,
    watchChallenges,
    capacityPrompt,
    reload,
    moveStar,
    resolveCapacityPrompt,
    createStar,
    updateStar,
    createConstellation,
    updateConstellation,
    createTask,
    updateTask,
    updateSettings,
    createTrip,
    updateTrip,
    deleteTrip,
    createTripItem,
    updateTripItem,
    deleteTripItem,
    createBook,
    updateBook,
    deleteBook,
    createBookList,
    deleteBookList,
    toggleBookInList,
    createReadingSession,
    deleteReadingSession,
    createReadingChallenge,
    deleteReadingChallenge,
    createWatchable,
    updateWatchable,
    deleteWatchable,
    createEpisode,
    updateEpisode,
    deleteEpisode,
    createWatchList,
    deleteWatchList,
    toggleWatchableInList,
    createViewingSession,
    deleteViewingSession,
    createWatchChallenge,
    deleteWatchChallenge,
  }
}
