import { v4 as uuid } from 'uuid'
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
import type { AdAstraStore } from './types'

const KEYS = {
  stars: 'ad_astra_stars',
  constellations: 'ad_astra_constellations',
  tasks: 'ad_astra_tasks',
  settings: 'ad_astra_settings',
  destinations: 'ad_astra_destinations',
  trips: 'ad_astra_trips',
  tripItems: 'ad_astra_trip_items',
  books: 'ad_astra_books',
  bookLists: 'ad_astra_book_lists',
  bookListItems: 'ad_astra_book_list_items',
  readingSessions: 'ad_astra_reading_sessions',
  readingChallenges: 'ad_astra_reading_challenges',
  watchables: 'ad_astra_watchables',
  episodes: 'ad_astra_episodes',
  watchLists: 'ad_astra_watch_lists',
  watchListItems: 'ad_astra_watch_list_items',
  viewingSessions: 'ad_astra_viewing_sessions',
  watchChallenges: 'ad_astra_watch_challenges',
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

const DEFAULT_SETTINGS: AppSettings = { currentOrbitLimit: 5 }

export class LocalStore implements AdAstraStore {
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

  // --- Phase 2: Travel ---

  async listDestinations(): Promise<TravelDestination[]> {
    return read<TravelDestination[]>(KEYS.destinations, [])
  }

  async getDestination(id: string): Promise<TravelDestination | undefined> {
    return (await this.listDestinations()).find((d) => d.id === id)
  }

  async createDestination(
    input: Partial<TravelDestination> & { name: string },
  ): Promise<TravelDestination> {
    const destinations = await this.listDestinations()
    const destination: TravelDestination = {
      id: uuid(),
      country: input.country,
      region: input.region,
      city: input.city,
      name: input.name,
      images: input.images ?? [],
      why: input.why,
      desiredTripLength: input.desiredTripLength,
      bestSeason: input.bestSeason,
      estimatedCost: input.estimatedCost,
      companions: input.companions ?? [],
      lifeStageTags: input.lifeStageTags ?? [],
      status: input.status ?? 'bucket_list',
      relatedStarIds: input.relatedStarIds ?? [],
      relatedConstellationIds: input.relatedConstellationIds ?? [],
      notes: input.notes,
      createdAt: now(),
      updatedAt: now(),
    }
    write(KEYS.destinations, [...destinations, destination])
    return destination
  }

  async updateDestination(
    id: string,
    patch: Partial<TravelDestination>,
  ): Promise<TravelDestination> {
    const destinations = await this.listDestinations()
    const idx = destinations.findIndex((d) => d.id === id)
    if (idx === -1) throw new Error(`Destination ${id} not found`)
    const updated = { ...destinations[idx], ...patch, updatedAt: now() }
    destinations[idx] = updated
    write(KEYS.destinations, destinations)
    return updated
  }

  async deleteDestination(id: string): Promise<void> {
    write(
      KEYS.destinations,
      (await this.listDestinations()).filter((d) => d.id !== id),
    )
  }

  async listTrips(): Promise<Trip[]> {
    return read<Trip[]>(KEYS.trips, [])
  }

  async getTrip(id: string): Promise<Trip | undefined> {
    return (await this.listTrips()).find((t) => t.id === id)
  }

  async createTrip(input: Partial<Trip> & { name: string }): Promise<Trip> {
    const trips = await this.listTrips()
    const trip: Trip = {
      id: uuid(),
      name: input.name,
      destinationIds: input.destinationIds ?? [],
      status: input.status ?? 'idea',
      startDate: input.startDate,
      endDate: input.endDate,
      numDays: input.numDays,
      budget: input.budget,
      notes: input.notes,
      relatedStarIds: input.relatedStarIds ?? [],
      createdAt: now(),
      updatedAt: now(),
    }
    write(KEYS.trips, [...trips, trip])
    return trip
  }

  async updateTrip(id: string, patch: Partial<Trip>): Promise<Trip> {
    const trips = await this.listTrips()
    const idx = trips.findIndex((t) => t.id === id)
    if (idx === -1) throw new Error(`Trip ${id} not found`)
    const updated = { ...trips[idx], ...patch, updatedAt: now() }
    trips[idx] = updated
    write(KEYS.trips, trips)
    return updated
  }

  async deleteTrip(id: string): Promise<void> {
    write(KEYS.trips, (await this.listTrips()).filter((t) => t.id !== id))
    write(
      KEYS.tripItems,
      (await this.listTripItems()).filter((i) => i.tripId !== id),
    )
  }

  async listTripItems(tripId?: string): Promise<TripItem[]> {
    const items = read<TripItem[]>(KEYS.tripItems, [])
    return tripId ? items.filter((i) => i.tripId === tripId) : items
  }

  async createTripItem(
    input: Partial<TripItem> & { tripId: string; name: string },
  ): Promise<TripItem> {
    const items = await this.listTripItems()
    const item: TripItem = {
      id: uuid(),
      tripId: input.tripId,
      parentItemId: input.parentItemId,
      type: input.type ?? 'activity',
      name: input.name,
      date: input.date,
      notes: input.notes,
      cost: input.cost,
      sortIndex: input.sortIndex ?? items.filter((i) => i.tripId === input.tripId).length,
      createdAt: now(),
      updatedAt: now(),
    }
    write(KEYS.tripItems, [...items, item])
    return item
  }

  async updateTripItem(id: string, patch: Partial<TripItem>): Promise<TripItem> {
    const items = await this.listTripItems()
    const idx = items.findIndex((i) => i.id === id)
    if (idx === -1) throw new Error(`Trip item ${id} not found`)
    const updated = { ...items[idx], ...patch, updatedAt: now() }
    items[idx] = updated
    write(KEYS.tripItems, items)
    return updated
  }

  async deleteTripItem(id: string): Promise<void> {
    write(
      KEYS.tripItems,
      (await this.listTripItems()).filter((i) => i.id !== id),
    )
  }

  // --- Phase 3: Reading ---

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
      format: input.format,
      edition: input.edition,
      owned: input.owned ?? false,
      location: input.location,
      status: input.status ?? 'want_to_read',
      rating: input.rating,
      notes: input.notes,
      relatedStarIds: input.relatedStarIds ?? [],
      relatedConstellationIds: input.relatedConstellationIds ?? [],
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
      KEYS.bookListItems,
      (await this.listBookListItems()).filter((i) => i.bookId !== id),
    )
    write(
      KEYS.readingSessions,
      (await this.listReadingSessions()).filter((s) => s.bookId !== id),
    )
  }

  async listBookLists(): Promise<BookList[]> {
    return read<BookList[]>(KEYS.bookLists, [])
  }

  async createBookList(input: Partial<BookList> & { name: string }): Promise<BookList> {
    const lists = await this.listBookLists()
    const list: BookList = {
      id: uuid(),
      name: input.name,
      description: input.description,
      type: input.type ?? 'custom',
      relatedStarIds: input.relatedStarIds ?? [],
      createdAt: now(),
      updatedAt: now(),
    }
    write(KEYS.bookLists, [...lists, list])
    return list
  }

  async updateBookList(id: string, patch: Partial<BookList>): Promise<BookList> {
    const lists = await this.listBookLists()
    const idx = lists.findIndex((l) => l.id === id)
    if (idx === -1) throw new Error(`Book list ${id} not found`)
    const updated = { ...lists[idx], ...patch, updatedAt: now() }
    lists[idx] = updated
    write(KEYS.bookLists, lists)
    return updated
  }

  async deleteBookList(id: string): Promise<void> {
    write(KEYS.bookLists, (await this.listBookLists()).filter((l) => l.id !== id))
    write(
      KEYS.bookListItems,
      (await this.listBookListItems()).filter((i) => i.bookListId !== id),
    )
  }

  async listBookListItems(bookListId?: string): Promise<BookListItem[]> {
    const items = read<BookListItem[]>(KEYS.bookListItems, [])
    return bookListId ? items.filter((i) => i.bookListId === bookListId) : items
  }

  async addBookToList(bookListId: string, bookId: string): Promise<BookListItem> {
    const items = await this.listBookListItems()
    const existing = items.find((i) => i.bookListId === bookListId && i.bookId === bookId)
    if (existing) return existing
    const item: BookListItem = {
      id: uuid(),
      bookListId,
      bookId,
      sortIndex: items.filter((i) => i.bookListId === bookListId).length,
      createdAt: now(),
    }
    write(KEYS.bookListItems, [...items, item])
    return item
  }

  async removeBookFromList(bookListId: string, bookId: string): Promise<void> {
    write(
      KEYS.bookListItems,
      (await this.listBookListItems()).filter(
        (i) => !(i.bookListId === bookListId && i.bookId === bookId),
      ),
    )
  }

  async listReadingSessions(bookId?: string): Promise<ReadingSession[]> {
    const sessions = read<ReadingSession[]>(KEYS.readingSessions, [])
    return bookId ? sessions.filter((s) => s.bookId === bookId) : sessions
  }

  async createReadingSession(
    input: Partial<ReadingSession> & { bookId: string },
  ): Promise<ReadingSession> {
    const sessions = await this.listReadingSessions()
    const session: ReadingSession = {
      id: uuid(),
      bookId: input.bookId,
      date: input.date ?? now().slice(0, 10),
      pages: input.pages,
      minutes: input.minutes,
      notes: input.notes,
      rating: input.rating,
      completionStatus: input.completionStatus,
      createdAt: now(),
      updatedAt: now(),
    }
    write(KEYS.readingSessions, [...sessions, session])

    if (session.completionStatus === 'completed' || session.completionStatus === 'dnf') {
      await this.updateBook(session.bookId, {
        status: session.completionStatus === 'completed' ? 'read' : 'dnf',
        rating: session.rating ?? (await this.getBook(session.bookId))?.rating,
        completedAt: now(),
      })
    }
    return session
  }

  async updateReadingSession(
    id: string,
    patch: Partial<ReadingSession>,
  ): Promise<ReadingSession> {
    const sessions = await this.listReadingSessions()
    const idx = sessions.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error(`Reading session ${id} not found`)
    const updated = { ...sessions[idx], ...patch, updatedAt: now() }
    sessions[idx] = updated
    write(KEYS.readingSessions, sessions)
    return updated
  }

  async deleteReadingSession(id: string): Promise<void> {
    write(
      KEYS.readingSessions,
      (await this.listReadingSessions()).filter((s) => s.id !== id),
    )
  }

  async listReadingChallenges(): Promise<ReadingChallenge[]> {
    return read<ReadingChallenge[]>(KEYS.readingChallenges, [])
  }

  async createReadingChallenge(
    input: Partial<ReadingChallenge> & { name: string },
  ): Promise<ReadingChallenge> {
    const challenges = await this.listReadingChallenges()
    const challenge: ReadingChallenge = {
      id: uuid(),
      name: input.name,
      goalType: input.goalType ?? 'book_count',
      target: input.target ?? 1,
      startDate: input.startDate ?? now().slice(0, 10),
      endDate: input.endDate ?? now().slice(0, 10),
      notes: input.notes,
      relatedStarIds: input.relatedStarIds ?? [],
      createdAt: now(),
      updatedAt: now(),
    }
    write(KEYS.readingChallenges, [...challenges, challenge])
    return challenge
  }

  async updateReadingChallenge(
    id: string,
    patch: Partial<ReadingChallenge>,
  ): Promise<ReadingChallenge> {
    const challenges = await this.listReadingChallenges()
    const idx = challenges.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error(`Reading challenge ${id} not found`)
    const updated = { ...challenges[idx], ...patch, updatedAt: now() }
    challenges[idx] = updated
    write(KEYS.readingChallenges, challenges)
    return updated
  }

  async deleteReadingChallenge(id: string): Promise<void> {
    write(
      KEYS.readingChallenges,
      (await this.listReadingChallenges()).filter((c) => c.id !== id),
    )
  }

  // --- Phase 3: Watching ---

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
      relatedStarIds: input.relatedStarIds ?? [],
      relatedConstellationIds: input.relatedConstellationIds ?? [],
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
      KEYS.watchListItems,
      (await this.listWatchListItems()).filter((i) => i.watchableId !== id),
    )
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

  async listWatchLists(): Promise<WatchList[]> {
    return read<WatchList[]>(KEYS.watchLists, [])
  }

  async createWatchList(input: Partial<WatchList> & { name: string }): Promise<WatchList> {
    const lists = await this.listWatchLists()
    const list: WatchList = {
      id: uuid(),
      name: input.name,
      description: input.description,
      type: input.type ?? 'custom',
      relatedStarIds: input.relatedStarIds ?? [],
      createdAt: now(),
      updatedAt: now(),
    }
    write(KEYS.watchLists, [...lists, list])
    return list
  }

  async updateWatchList(id: string, patch: Partial<WatchList>): Promise<WatchList> {
    const lists = await this.listWatchLists()
    const idx = lists.findIndex((l) => l.id === id)
    if (idx === -1) throw new Error(`Watch list ${id} not found`)
    const updated = { ...lists[idx], ...patch, updatedAt: now() }
    lists[idx] = updated
    write(KEYS.watchLists, lists)
    return updated
  }

  async deleteWatchList(id: string): Promise<void> {
    write(KEYS.watchLists, (await this.listWatchLists()).filter((l) => l.id !== id))
    write(
      KEYS.watchListItems,
      (await this.listWatchListItems()).filter((i) => i.watchListId !== id),
    )
  }

  async listWatchListItems(watchListId?: string): Promise<WatchListItem[]> {
    const items = read<WatchListItem[]>(KEYS.watchListItems, [])
    return watchListId ? items.filter((i) => i.watchListId === watchListId) : items
  }

  async addWatchableToList(watchListId: string, watchableId: string): Promise<WatchListItem> {
    const items = await this.listWatchListItems()
    const existing = items.find(
      (i) => i.watchListId === watchListId && i.watchableId === watchableId,
    )
    if (existing) return existing
    const item: WatchListItem = {
      id: uuid(),
      watchListId,
      watchableId,
      sortIndex: items.filter((i) => i.watchListId === watchListId).length,
      createdAt: now(),
    }
    write(KEYS.watchListItems, [...items, item])
    return item
  }

  async removeWatchableFromList(watchListId: string, watchableId: string): Promise<void> {
    write(
      KEYS.watchListItems,
      (await this.listWatchListItems()).filter(
        (i) => !(i.watchListId === watchListId && i.watchableId === watchableId),
      ),
    )
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

  async listWatchChallenges(): Promise<WatchChallenge[]> {
    return read<WatchChallenge[]>(KEYS.watchChallenges, [])
  }

  async createWatchChallenge(
    input: Partial<WatchChallenge> & { name: string },
  ): Promise<WatchChallenge> {
    const challenges = await this.listWatchChallenges()
    const challenge: WatchChallenge = {
      id: uuid(),
      name: input.name,
      target: input.target ?? 1,
      startDate: input.startDate ?? now().slice(0, 10),
      endDate: input.endDate ?? now().slice(0, 10),
      notes: input.notes,
      relatedStarIds: input.relatedStarIds ?? [],
      createdAt: now(),
      updatedAt: now(),
    }
    write(KEYS.watchChallenges, [...challenges, challenge])
    return challenge
  }

  async updateWatchChallenge(
    id: string,
    patch: Partial<WatchChallenge>,
  ): Promise<WatchChallenge> {
    const challenges = await this.listWatchChallenges()
    const idx = challenges.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error(`Watch challenge ${id} not found`)
    const updated = { ...challenges[idx], ...patch, updatedAt: now() }
    challenges[idx] = updated
    write(KEYS.watchChallenges, challenges)
    return updated
  }

  async deleteWatchChallenge(id: string): Promise<void> {
    write(
      KEYS.watchChallenges,
      (await this.listWatchChallenges()).filter((c) => c.id !== id),
    )
  }
}
