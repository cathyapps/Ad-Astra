// Pushing Ad Astra's book state to Hardcover, and saving cover thumbnails to
// Supabase Storage. Pure helpers plus thin wrappers over the server function;
// the scheduling (what runs when) lives in hooks/useHardcoverSync.ts.

import type { Book, ReadingLog } from '@/types/library'
import { appDayKey } from '@/lib/appDate'
import { callHardcover } from '@/lib/hardcover'
import { supabase } from '@/lib/supabaseClient'

export type SyncStatus = 'pending' | 'synced' | 'failed' | 'needs_link'

export interface SyncRow {
  bookId: string
  status: SyncStatus
  attempts: number
  lastError?: string
  queuedAt: string
  syncedAt?: string
}

export function rowFromDb(r: Record<string, unknown>): SyncRow {
  return {
    bookId: r.book_id as string,
    status: r.status as SyncStatus,
    attempts: (r.attempts as number) ?? 0,
    lastError: (r.last_error as string) ?? undefined,
    queuedAt: r.queued_at as string,
    syncedAt: (r.synced_at as string) ?? undefined,
  }
}

// --- what gets sent ---------------------------------------------------------

export interface SyncPayload {
  hardcoverBookId?: number
  hardcoverEditionId?: number
  isbn?: string
  status: Book['readStatus']
  /** Overall rating rounded to the nearest half star (Hardcover has no quarter stars). */
  rating?: number
  notes?: string
  startedAt?: string
  completedAt?: string
  progressPages?: number
  progressSeconds?: number
}

export const roundToHalf = (n: number): number => Math.round(n * 2) / 2

/** Book-level notes plus every reading-log note as dated lines. Rebuilt from Ad Astra each time,
 *  so it is always the same text for the same data. */
export function composeNotes(book: Book, logs: ReadingLog[]): string | undefined {
  const lines = logs
    .filter((l) => l.notes?.trim())
    .sort((a, b) => (a.date === b.date ? (a.createdAt < b.createdAt ? -1 : 1) : a.date < b.date ? -1 : 1))
    .map((l) => `${l.date}: ${l.notes!.trim()}`)
  const parts = [book.notes?.trim(), lines.length > 0 ? ['Reading log notes:', ...lines].join('\n') : undefined].filter(
    (p): p is string => !!p,
  )
  return parts.length > 0 ? parts.join('\n\n') : undefined
}

/** Furthest progress on the latest log that has any, as pages and/or seconds. */
function latestProgress(book: Book, logs: ReadingLog[]): { pages?: number; seconds?: number } {
  const sorted = [...logs].sort((a, b) => (a.date === b.date ? (a.createdAt < b.createdAt ? 1 : -1) : a.date < b.date ? 1 : -1))
  for (const l of sorted) {
    if (l.currentPage && l.currentPage > 0) return { pages: Math.round(l.currentPage) }
    if (l.currentTimeMinutes && l.currentTimeMinutes > 0) {
      const pages = book.totalPages && l.percentComplete ? Math.round((l.percentComplete / 100) * book.totalPages) : undefined
      return { seconds: Math.round(l.currentTimeMinutes * 60), pages }
    }
    if (l.percentComplete && l.percentComplete > 0 && book.totalPages) {
      return { pages: Math.max(1, Math.round((l.percentComplete / 100) * book.totalPages)) }
    }
  }
  return {}
}

export function buildSyncPayload(book: Book, allLogs: ReadingLog[]): SyncPayload {
  const logs = allLogs.filter((l) => l.bookId === book.id)
  // A finished book's progress is "all of it"; only in-flight books send a position.
  const progress = book.readStatus === 'read' || book.readStatus === 'want_to_read' ? {} : latestProgress(book, logs)
  return {
    hardcoverBookId: book.hardcoverBookId,
    hardcoverEditionId: book.hardcoverEditionId,
    isbn: book.isbn,
    status: book.readStatus,
    rating: book.rating && book.rating > 0 ? Math.max(0.5, roundToHalf(book.rating)) : undefined,
    notes: composeNotes(book, logs),
    startedAt: book.startedAt ? appDayKey(book.startedAt) : undefined,
    completedAt: book.completedAt ? appDayKey(book.completedAt) : undefined,
    progressPages: progress.pages,
    progressSeconds: progress.seconds,
  }
}

export type SyncResult =
  | { status: 'synced'; bookId: number; editionId?: number; userBookId: number; did: string[]; warnings: string[] }
  | { status: 'needs_link'; reason: string }

export function syncBookToHardcover(payload: SyncPayload): Promise<SyncResult> {
  return callHardcover<SyncResult & { ok: boolean }>({ op: 'syncBook', book: payload })
}

// --- sync rows (the queue) ----------------------------------------------------

export async function loadSyncRows(): Promise<SyncRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('hardcover_sync').select('*').limit(5000)
  if (error) throw error
  return (data ?? []).map(rowFromDb)
}

export async function saveSyncRow(bookId: string, patch: { status: SyncStatus; attempts?: number; lastError?: string | null; syncedAt?: string | null }) {
  if (!supabase) return
  const row: Record<string, unknown> = { status: patch.status }
  if (patch.attempts !== undefined) row.attempts = patch.attempts
  if (patch.lastError !== undefined) row.last_error = patch.lastError
  if (patch.syncedAt !== undefined) row.synced_at = patch.syncedAt
  const { error } = await supabase.from('hardcover_sync').update(row).eq('book_id', bookId)
  if (error) throw error
}

/** Explicitly queues books (used by "queue all my reading books"). */
export async function queueBooks(bookIds: string[]) {
  if (!supabase || bookIds.length === 0) return
  const { data: u } = await supabase.auth.getUser()
  const userId = u.user?.id
  if (!userId) throw new Error('Not signed in.')
  const rows = bookIds.map((id) => ({ book_id: id, user_id: userId, status: 'pending', attempts: 0, last_error: null, queued_at: new Date().toISOString() }))
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from('hardcover_sync').upsert(rows.slice(i, i + 200), { onConflict: 'book_id' })
    if (error) throw error
  }
}

// --- cover thumbnails -------------------------------------------------------

const COVER_WIDTH = 300
const COVER_MAX_HEIGHT = 480

/** True when the cover is already the Supabase Storage copy. */
export function isStoredCover(url: string | undefined): boolean {
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined
  return !!url && !!base && url.startsWith(`${base}/storage/v1/object/public/covers/`)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('The cover image could not be read.'))
    img.src = src
  })
}

async function resizedJpeg(dataUrl: string): Promise<Blob> {
  const img = await loadImage(dataUrl)
  const scale = Math.min(1, COVER_WIDTH / img.naturalWidth, COVER_MAX_HEIGHT / img.naturalHeight)
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not resize the cover.')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode the cover.'))), 'image/jpeg', 0.82),
  )
}

/** Fetches a book's current cover through the server, shrinks it, saves it to Storage, and
 *  returns the new public URL. Does not touch the book row; the caller saves the URL. */
export async function saveCoverThumbnail(book: Book): Promise<string> {
  if (!supabase) throw new Error('Needs the Supabase version of the app.')
  if (!book.coverUrl) throw new Error('No cover to save.')
  const { data: u } = await supabase.auth.getUser()
  const userId = u.user?.id
  if (!userId) throw new Error('Not signed in.')

  const { contentType, base64 } = await callHardcover<{ contentType: string; base64: string }>({ op: 'coverImage', url: book.coverUrl })
  const blob = await resizedJpeg(`data:${contentType};base64,${base64}`)
  const path = `${userId}/${book.id}.jpg`
  const { error } = await supabase.storage.from('covers').upload(path, blob, { contentType: 'image/jpeg', upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('covers').getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}
