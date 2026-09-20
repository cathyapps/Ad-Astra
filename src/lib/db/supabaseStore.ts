import type { SupabaseClient } from '@supabase/supabase-js'
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
import type { AdAstraStore } from './types'
import {
  bookFromRow,
  bookListFromRow,
  bookListItemFromRow,
  bookListToRow,
  bookToRow,
  constellationFromRow,
  constellationToRow,
  episodeFromRow,
  episodeToRow,
  learningGoalFromRow,
  learningGoalToRow,
  learningItemFromRow,
  learningItemToRow,
  readingChallengeFromRow,
  readingChallengeToRow,
  readingSessionFromRow,
  readingSessionToRow,
  settingsFromRow,
  starFromRow,
  starToRow,
  taskFromRow,
  taskToRow,
  tripFromRow,
  tripItemFromRow,
  tripItemToRow,
  tripToRow,
  viewingSessionFromRow,
  viewingSessionToRow,
  watchChallengeFromRow,
  watchChallengeToRow,
  watchListFromRow,
  watchListItemFromRow,
  watchListToRow,
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
    const withCompletion = patch.status === 'done' && !patch.completedAt
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
    const { error } = await this.client
      .from('app_settings')
      .upsert({ user_id: this.userId, current_orbit_limit: merged.currentOrbitLimit })
    if (error) throw error
    return merged
  }

  // --- Phase 2: Travel (Trip -> Planets -> Moons) ---

  async listTrips(): Promise<Trip[]> {
    const { data, error } = await this.client
      .from('trips')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(tripFromRow)
  }

  async getTrip(id: string): Promise<Trip | undefined> {
    const { data, error } = await this.client.from('trips').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? tripFromRow(data) : undefined
  }

  async createTrip(input: Partial<Trip> & { name: string }): Promise<Trip> {
    const { data, error } = await this.client
      .from('trips')
      .insert(tripToRow(input, this.userId))
      .select()
      .single()
    if (error) throw error
    return tripFromRow(must(data, 'Trip'))
  }

  async updateTrip(id: string, patch: Partial<Trip>): Promise<Trip> {
    const { data, error } = await this.client
      .from('trips')
      .update(tripToRow(patch, this.userId))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return tripFromRow(must(data, 'Trip'))
  }

  async deleteTrip(id: string): Promise<void> {
    // trip_items has an ON DELETE CASCADE FK to trips, so no manual cleanup needed.
    const { error } = await this.client.from('trips').delete().eq('id', id)
    if (error) throw error
  }

  async listTripItems(tripId?: string): Promise<TripItem[]> {
    let query = this.client.from('trip_items').select('*').order('sort_index', { ascending: true })
    if (tripId) query = query.eq('trip_id', tripId)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(tripItemFromRow)
  }

  async createTripItem(
    input: Partial<TripItem> & { tripId: string; name: string },
  ): Promise<TripItem> {
    const { data, error } = await this.client
      .from('trip_items')
      .insert(tripItemToRow(input, this.userId))
      .select()
      .single()
    if (error) throw error
    return tripItemFromRow(must(data, 'Trip item'))
  }

  async updateTripItem(id: string, patch: Partial<TripItem>): Promise<TripItem> {
    const { data, error } = await this.client
      .from('trip_items')
      .update(tripItemToRow(patch, this.userId))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return tripItemFromRow(must(data, 'Trip item'))
  }

  async deleteTripItem(id: string): Promise<void> {
    const { error } = await this.client.from('trip_items').delete().eq('id', id)
    if (error) throw error
  }

  // --- Phase 3: Reading ---

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
    // book_list_items and reading_sessions cascade via FK.
    const { error } = await this.client.from('books').delete().eq('id', id)
    if (error) throw error
  }

  async listBookLists(): Promise<BookList[]> {
    const { data, error } = await this.client
      .from('book_lists')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(bookListFromRow)
  }

  async createBookList(input: Partial<BookList> & { name: string }): Promise<BookList> {
    const { data, error } = await this.client
      .from('book_lists')
      .insert(bookListToRow(input, this.userId))
      .select()
      .single()
    if (error) throw error
    return bookListFromRow(must(data, 'Book list'))
  }

  async updateBookList(id: string, patch: Partial<BookList>): Promise<BookList> {
    const { data, error } = await this.client
      .from('book_lists')
      .update(bookListToRow(patch, this.userId))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return bookListFromRow(must(data, 'Book list'))
  }

  async deleteBookList(id: string): Promise<void> {
    const { error } = await this.client.from('book_lists').delete().eq('id', id)
    if (error) throw error
  }

  async listBookListItems(bookListId?: string): Promise<BookListItem[]> {
    let query = this.client.from('book_list_items').select('*').order('sort_index', { ascending: true })
    if (bookListId) query = query.eq('book_list_id', bookListId)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(bookListItemFromRow)
  }

  async addBookToList(bookListId: string, bookId: string): Promise<BookListItem> {
    const existing = await this.listBookListItems(bookListId)
    const found = existing.find((i) => i.bookId === bookId)
    if (found) return found
    const { data, error } = await this.client
      .from('book_list_items')
      .insert({
        user_id: this.userId,
        book_list_id: bookListId,
        book_id: bookId,
        sort_index: existing.length,
      })
      .select()
      .single()
    if (error) throw error
    return bookListItemFromRow(must(data, 'Book list item'))
  }

  async removeBookFromList(bookListId: string, bookId: string): Promise<void> {
    const { error } = await this.client
      .from('book_list_items')
      .delete()
      .eq('book_list_id', bookListId)
      .eq('book_id', bookId)
    if (error) throw error
  }

  async listReadingSessions(bookId?: string): Promise<ReadingSession[]> {
    let query = this.client.from('reading_sessions').select('*').order('date', { ascending: false })
    if (bookId) query = query.eq('book_id', bookId)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(readingSessionFromRow)
  }

  async createReadingSession(
    input: Partial<ReadingSession> & { bookId: string },
  ): Promise<ReadingSession> {
    const { data, error } = await this.client
      .from('reading_sessions')
      .insert(readingSessionToRow(input, this.userId))
      .select()
      .single()
    if (error) throw error
    const session = readingSessionFromRow(must(data, 'Reading session'))

    if (session.completionStatus === 'completed' || session.completionStatus === 'dnf') {
      await this.updateBook(session.bookId, {
        status: session.completionStatus === 'completed' ? 'read' : 'dnf',
        rating: session.rating,
        completedAt: new Date().toISOString(),
      })
    }
    return session
  }

  async updateReadingSession(
    id: string,
    patch: Partial<ReadingSession>,
  ): Promise<ReadingSession> {
    const { data, error } = await this.client
      .from('reading_sessions')
      .update(readingSessionToRow(patch, this.userId))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return readingSessionFromRow(must(data, 'Reading session'))
  }

  async deleteReadingSession(id: string): Promise<void> {
    const { error } = await this.client.from('reading_sessions').delete().eq('id', id)
    if (error) throw error
  }

  async listReadingChallenges(): Promise<ReadingChallenge[]> {
    const { data, error } = await this.client
      .from('reading_challenges')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(readingChallengeFromRow)
  }

  async createReadingChallenge(
    input: Partial<ReadingChallenge> & { name: string },
  ): Promise<ReadingChallenge> {
    const { data, error } = await this.client
      .from('reading_challenges')
      .insert(readingChallengeToRow(input, this.userId))
      .select()
      .single()
    if (error) throw error
    return readingChallengeFromRow(must(data, 'Reading challenge'))
  }

  async updateReadingChallenge(
    id: string,
    patch: Partial<ReadingChallenge>,
  ): Promise<ReadingChallenge> {
    const { data, error } = await this.client
      .from('reading_challenges')
      .update(readingChallengeToRow(patch, this.userId))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return readingChallengeFromRow(must(data, 'Reading challenge'))
  }

  async deleteReadingChallenge(id: string): Promise<void> {
    const { error } = await this.client.from('reading_challenges').delete().eq('id', id)
    if (error) throw error
  }

  // --- Phase 3: Watching ---

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
    // episodes, watch_list_items, viewing_sessions cascade via FK.
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

  async listWatchLists(): Promise<WatchList[]> {
    const { data, error } = await this.client
      .from('watch_lists')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(watchListFromRow)
  }

  async createWatchList(input: Partial<WatchList> & { name: string }): Promise<WatchList> {
    const { data, error } = await this.client
      .from('watch_lists')
      .insert(watchListToRow(input, this.userId))
      .select()
      .single()
    if (error) throw error
    return watchListFromRow(must(data, 'Watch list'))
  }

  async updateWatchList(id: string, patch: Partial<WatchList>): Promise<WatchList> {
    const { data, error } = await this.client
      .from('watch_lists')
      .update(watchListToRow(patch, this.userId))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return watchListFromRow(must(data, 'Watch list'))
  }

  async deleteWatchList(id: string): Promise<void> {
    const { error } = await this.client.from('watch_lists').delete().eq('id', id)
    if (error) throw error
  }

  async listWatchListItems(watchListId?: string): Promise<WatchListItem[]> {
    let query = this.client
      .from('watch_list_items')
      .select('*')
      .order('sort_index', { ascending: true })
    if (watchListId) query = query.eq('watch_list_id', watchListId)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(watchListItemFromRow)
  }

  async addWatchableToList(watchListId: string, watchableId: string): Promise<WatchListItem> {
    const existing = await this.listWatchListItems(watchListId)
    const found = existing.find((i) => i.watchableId === watchableId)
    if (found) return found
    const { data, error } = await this.client
      .from('watch_list_items')
      .insert({
        user_id: this.userId,
        watch_list_id: watchListId,
        watchable_id: watchableId,
        sort_index: existing.length,
      })
      .select()
      .single()
    if (error) throw error
    return watchListItemFromRow(must(data, 'Watch list item'))
  }

  async removeWatchableFromList(watchListId: string, watchableId: string): Promise<void> {
    const { error } = await this.client
      .from('watch_list_items')
      .delete()
      .eq('watch_list_id', watchListId)
      .eq('watchable_id', watchableId)
    if (error) throw error
  }

  async listViewingSessions(watchableId?: string): Promise<ViewingSession[]> {
    let query = this.client
      .from('viewing_sessions')
      .select('*')
      .order('date', { ascending: false })
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
        rating: session.rating,
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

  async listWatchChallenges(): Promise<WatchChallenge[]> {
    const { data, error } = await this.client
      .from('watch_challenges')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(watchChallengeFromRow)
  }

  async createWatchChallenge(
    input: Partial<WatchChallenge> & { name: string },
  ): Promise<WatchChallenge> {
    const { data, error } = await this.client
      .from('watch_challenges')
      .insert(watchChallengeToRow(input, this.userId))
      .select()
      .single()
    if (error) throw error
    return watchChallengeFromRow(must(data, 'Watch challenge'))
  }

  async updateWatchChallenge(
    id: string,
    patch: Partial<WatchChallenge>,
  ): Promise<WatchChallenge> {
    const { data, error } = await this.client
      .from('watch_challenges')
      .update(watchChallengeToRow(patch, this.userId))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return watchChallengeFromRow(must(data, 'Watch challenge'))
  }

  async deleteWatchChallenge(id: string): Promise<void> {
    const { error } = await this.client.from('watch_challenges').delete().eq('id', id)
    if (error) throw error
  }

  // --- Phase 4: Learning (Goal -> Planets -> Moons) ---

  async listLearningGoals(): Promise<LearningGoal[]> {
    const { data, error } = await this.client
      .from('learning_goals')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(learningGoalFromRow)
  }

  async getLearningGoal(id: string): Promise<LearningGoal | undefined> {
    const { data, error } = await this.client
      .from('learning_goals')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data ? learningGoalFromRow(data) : undefined
  }

  async createLearningGoal(input: Partial<LearningGoal> & { name: string }): Promise<LearningGoal> {
    const { data, error } = await this.client
      .from('learning_goals')
      .insert(learningGoalToRow(input, this.userId))
      .select()
      .single()
    if (error) throw error
    return learningGoalFromRow(must(data, 'Learning goal'))
  }

  async updateLearningGoal(id: string, patch: Partial<LearningGoal>): Promise<LearningGoal> {
    const { data, error } = await this.client
      .from('learning_goals')
      .update(learningGoalToRow(patch, this.userId))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return learningGoalFromRow(must(data, 'Learning goal'))
  }

  async deleteLearningGoal(id: string): Promise<void> {
    // learning_items has an ON DELETE CASCADE FK to learning_goals, so no
    // manual cleanup needed.
    const { error } = await this.client.from('learning_goals').delete().eq('id', id)
    if (error) throw error
  }

  async listLearningItems(goalId?: string): Promise<LearningItem[]> {
    let query = this.client
      .from('learning_items')
      .select('*')
      .order('sort_index', { ascending: true })
    if (goalId) query = query.eq('goal_id', goalId)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(learningItemFromRow)
  }

  async createLearningItem(
    input: Partial<LearningItem> & { goalId: string; name: string },
  ): Promise<LearningItem> {
    const { data, error } = await this.client
      .from('learning_items')
      .insert(learningItemToRow(input, this.userId))
      .select()
      .single()
    if (error) throw error
    return learningItemFromRow(must(data, 'Learning item'))
  }

  async updateLearningItem(id: string, patch: Partial<LearningItem>): Promise<LearningItem> {
    const { data, error } = await this.client
      .from('learning_items')
      .update(learningItemToRow(patch, this.userId))
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return learningItemFromRow(must(data, 'Learning item'))
  }

  async deleteLearningItem(id: string): Promise<void> {
    const { error } = await this.client.from('learning_items').delete().eq('id', id)
    if (error) throw error
  }
}
