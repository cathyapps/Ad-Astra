import type { AppSettings, Constellation, Star, Task } from '@/types'
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
import type { LearningGoal, LearningItem } from '@/types/learning'

// Every screen and hook talks to this interface, never to localStorage or
// Supabase directly. Phase 1 ships `LocalStore` (localStorage-backed, works
// offline, zero setup). When Supabase credentials are available, implement
// the same interface against supabase-js and swap the single export in
// `db/index.ts` — nothing else in the app changes.
export interface AdAstraStore {
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

  // Phase 2 — Travel (spec §17), restructured: no standalone destinations
  // list. A trip's places are its own top-level TripItems (Planets).
  listTrips(): Promise<Trip[]>
  getTrip(id: string): Promise<Trip | undefined>
  createTrip(input: Partial<Trip> & { name: string }): Promise<Trip>
  updateTrip(id: string, patch: Partial<Trip>): Promise<Trip>
  deleteTrip(id: string): Promise<void>

  listTripItems(tripId?: string): Promise<TripItem[]>
  createTripItem(input: Partial<TripItem> & { tripId: string; name: string }): Promise<TripItem>
  updateTripItem(id: string, patch: Partial<TripItem>): Promise<TripItem>
  deleteTripItem(id: string): Promise<void>

  // Phase 3 — Reading (spec §19)
  listBooks(): Promise<Book[]>
  getBook(id: string): Promise<Book | undefined>
  createBook(input: Partial<Book> & { title: string }): Promise<Book>
  updateBook(id: string, patch: Partial<Book>): Promise<Book>
  deleteBook(id: string): Promise<void>

  listBookLists(): Promise<BookList[]>
  createBookList(input: Partial<BookList> & { name: string }): Promise<BookList>
  updateBookList(id: string, patch: Partial<BookList>): Promise<BookList>
  deleteBookList(id: string): Promise<void>

  listBookListItems(bookListId?: string): Promise<BookListItem[]>
  addBookToList(bookListId: string, bookId: string): Promise<BookListItem>
  removeBookFromList(bookListId: string, bookId: string): Promise<void>

  listReadingSessions(bookId?: string): Promise<ReadingSession[]>
  createReadingSession(
    input: Partial<ReadingSession> & { bookId: string },
  ): Promise<ReadingSession>
  updateReadingSession(id: string, patch: Partial<ReadingSession>): Promise<ReadingSession>
  deleteReadingSession(id: string): Promise<void>

  listReadingChallenges(): Promise<ReadingChallenge[]>
  createReadingChallenge(
    input: Partial<ReadingChallenge> & { name: string },
  ): Promise<ReadingChallenge>
  updateReadingChallenge(id: string, patch: Partial<ReadingChallenge>): Promise<ReadingChallenge>
  deleteReadingChallenge(id: string): Promise<void>

  // Phase 3 — Watching (movies & TV, same framework as Reading)
  listWatchables(): Promise<Watchable[]>
  getWatchable(id: string): Promise<Watchable | undefined>
  createWatchable(input: Partial<Watchable> & { title: string }): Promise<Watchable>
  updateWatchable(id: string, patch: Partial<Watchable>): Promise<Watchable>
  deleteWatchable(id: string): Promise<void>

  listEpisodes(watchableId?: string): Promise<Episode[]>
  createEpisode(input: Partial<Episode> & { watchableId: string }): Promise<Episode>
  updateEpisode(id: string, patch: Partial<Episode>): Promise<Episode>
  deleteEpisode(id: string): Promise<void>

  listWatchLists(): Promise<WatchList[]>
  createWatchList(input: Partial<WatchList> & { name: string }): Promise<WatchList>
  updateWatchList(id: string, patch: Partial<WatchList>): Promise<WatchList>
  deleteWatchList(id: string): Promise<void>

  listWatchListItems(watchListId?: string): Promise<WatchListItem[]>
  addWatchableToList(watchListId: string, watchableId: string): Promise<WatchListItem>
  removeWatchableFromList(watchListId: string, watchableId: string): Promise<void>

  listViewingSessions(watchableId?: string): Promise<ViewingSession[]>
  createViewingSession(
    input: Partial<ViewingSession> & { watchableId: string },
  ): Promise<ViewingSession>
  updateViewingSession(id: string, patch: Partial<ViewingSession>): Promise<ViewingSession>
  deleteViewingSession(id: string): Promise<void>

  listWatchChallenges(): Promise<WatchChallenge[]>
  createWatchChallenge(input: Partial<WatchChallenge> & { name: string }): Promise<WatchChallenge>
  updateWatchChallenge(id: string, patch: Partial<WatchChallenge>): Promise<WatchChallenge>
  deleteWatchChallenge(id: string): Promise<void>

  // Phase 4 — Learning: free-form goals with free-entry sub-goals/tasks
  // (Planets & Moons) nested under them. No metrics, just status.
  listLearningGoals(): Promise<LearningGoal[]>
  getLearningGoal(id: string): Promise<LearningGoal | undefined>
  createLearningGoal(input: Partial<LearningGoal> & { name: string }): Promise<LearningGoal>
  updateLearningGoal(id: string, patch: Partial<LearningGoal>): Promise<LearningGoal>
  deleteLearningGoal(id: string): Promise<void>

  listLearningItems(goalId?: string): Promise<LearningItem[]>
  createLearningItem(
    input: Partial<LearningItem> & { goalId: string; name: string },
  ): Promise<LearningItem>
  updateLearningItem(id: string, patch: Partial<LearningItem>): Promise<LearningItem>
  deleteLearningItem(id: string): Promise<void>
}
