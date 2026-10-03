import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Book, ReadingLog } from '@/types/library'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import {
  buildSyncPayload,
  isStoredCover,
  loadSyncRows,
  queueBooks,
  saveCoverThumbnail,
  saveSyncRow,
  syncBookToHardcover,
  type SyncRow,
} from '@/lib/hardcoverSync'

type BookPatch = { id: string; patch: Partial<Book> }

/** Books pushed automatically per visit; anything beyond waits for the "Sync now" button. */
const AUTO_SYNC_LIMIT = 10
const AUTO_COVER_LIMIT = 5
/** Pause between books so a long run stays under Hardcover's 60-requests-a-minute limit. */
const SYNC_GAP_MS = 4500
const MAX_ATTEMPTS = 5

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Keeps Hardcover in step with Ad Astra and caches cover thumbnails.
 *
 *  Database triggers mark a book "pending" whenever its status, rating, dates, notes or ISBN
 *  change, or any of its reading logs change. This hook (1) loads that queue, (2) pushes a
 *  handful of pending books automatically after each change, and (3) exposes manual controls. */
export function useHardcoverSync(
  books: Book[],
  readingLogs: ReadingLog[],
  applyBookPatches: (patches: BookPatch[]) => Promise<number>,
) {
  const [rows, setRows] = useState<SyncRow[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [coverBusy, setCoverBusy] = useState(false)
  const [coverProgress, setCoverProgress] = useState('')

  // Latest data for long-running loops (they must not read stale closures).
  const booksRef = useRef(books)
  const logsRef = useRef(readingLogs)
  const applyRef = useRef(applyBookPatches)
  booksRef.current = books
  logsRef.current = readingLogs
  applyRef.current = applyBookPatches
  const running = useRef(false)
  const coverRunning = useRef(false)
  const coverFailed = useRef(new Set<string>())

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) return [] as SyncRow[]
    try {
      const next = await loadSyncRows()
      setRows(next)
      return next
    } catch {
      return [] as SyncRow[]
    }
  }, [])

  const syncPending = useCallback(
    async (limit: number, source?: SyncRow[]) => {
      if (running.current || !isSupabaseConfigured) return
      running.current = true
      setBusy(true)
      setMessage('')
      try {
        const queue = (source ?? (await refresh()))
          .filter((r) => r.status === 'pending' || (r.status === 'failed' && r.attempts < MAX_ATTEMPTS))
          .sort((a, b) => (a.queuedAt < b.queuedAt ? -1 : 1))
          .slice(0, limit)
        let synced = 0
        let problems = 0
        const patches: BookPatch[] = []
        for (let i = 0; i < queue.length; i++) {
          const row = queue[i]
          const book = booksRef.current.find((b) => b.id === row.bookId)
          if (!book) continue
          try {
            const result = await syncBookToHardcover(buildSyncPayload(book, logsRef.current))
            if (result.status === 'needs_link') {
              await saveSyncRow(row.bookId, { status: 'needs_link', lastError: result.reason })
              problems++
            } else {
              const changed =
                book.hardcoverBookId !== result.bookId ||
                book.hardcoverUserBookId !== result.userBookId ||
                (result.editionId != null && book.hardcoverEditionId !== result.editionId)
              if (changed) {
                patches.push({
                  id: book.id,
                  patch: {
                    hardcoverBookId: result.bookId,
                    hardcoverUserBookId: result.userBookId,
                    ...(result.editionId != null ? { hardcoverEditionId: result.editionId } : {}),
                  },
                })
              }
              await saveSyncRow(row.bookId, {
                status: 'synced',
                attempts: 0,
                lastError: result.warnings.length > 0 ? result.warnings.join('; ') : null,
                syncedAt: new Date().toISOString(),
              })
              synced++
            }
          } catch (err) {
            const text = err instanceof Error ? err.message : 'Sync failed'
            await saveSyncRow(row.bookId, { status: 'failed', attempts: row.attempts + 1, lastError: text }).catch(() => undefined)
            problems++
            // Out of requests or no connection: stop here and let the rest wait.
            if (/429|rate|throttl|Too Many|Not signed in|didn't answer/i.test(text)) break
          }
          if (i < queue.length - 1) await sleep(SYNC_GAP_MS)
        }
        if (patches.length > 0) await applyRef.current(patches)
        await refresh()
        setMessage(
          queue.length === 0
            ? 'Nothing waiting to sync.'
            : `Synced ${synced} book${synced === 1 ? '' : 's'}${problems > 0 ? `; ${problems} need attention` : ''}.`,
        )
      } finally {
        running.current = false
        setBusy(false)
      }
    },
    [refresh],
  )

  const queueAllReading = useCallback(async () => {
    const ids = booksRef.current.filter((b) => b.readStatus !== 'want_to_read').map((b) => b.id)
    await queueBooks(ids)
    await refresh()
    setMessage(`Queued ${ids.length} books.`)
  }, [refresh])

  const retryProblems = useCallback(async () => {
    const ids = rows.filter((r) => r.status === 'failed' || r.status === 'needs_link').map((r) => r.bookId)
    await queueBooks(ids)
    await refresh()
  }, [rows, refresh])

  // Covers still pointing at another site.
  const unsavedCovers = useMemo(
    () => books.filter((b) => b.coverUrl && !isStoredCover(b.coverUrl) && !coverFailed.current.has(b.id)),
    // coverProgress changes as the run goes, so the list is recomputed while it works
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [books, coverProgress],
  )

  const saveCovers = useCallback(async (limit: number) => {
    if (coverRunning.current || !isSupabaseConfigured) return
    coverRunning.current = true
    setCoverBusy(true)
    try {
      const todo = booksRef.current
        .filter((b) => b.coverUrl && !isStoredCover(b.coverUrl) && !coverFailed.current.has(b.id))
        .slice(0, limit)
      const patches: BookPatch[] = []
      let done = 0
      let saved = 0
      for (const book of todo) {
        setCoverProgress(`Saving covers… ${done}/${todo.length}`)
        try {
          const url = await saveCoverThumbnail(book)
          patches.push({ id: book.id, patch: { coverUrl: url, coverOriginalUrl: book.coverOriginalUrl ?? book.coverUrl } })
          saved++
        } catch {
          coverFailed.current.add(book.id)
        }
        done++
        // Apply in small batches so progress isn't lost if the page is closed mid-run.
        if (patches.length >= 10) await applyRef.current(patches.splice(0, patches.length))
      }
      if (patches.length > 0) await applyRef.current(patches)
      setCoverProgress(todo.length === 0 ? '' : `Saved ${saved} of ${todo.length} covers${saved < todo.length ? ` (${todo.length - saved} couldn't be fetched)` : ''}.`)
    } finally {
      coverRunning.current = false
      setCoverBusy(false)
    }
  }, [])

  // After any change to the data: reload the queue shortly after, push a few, and save a few covers.
  useEffect(() => {
    if (!isSupabaseConfigured) return
    const t = setTimeout(() => {
      void (async () => {
        const next = await refresh()
        const waiting = next.filter((r) => r.status === 'pending').length
        if (waiting > 0 && waiting <= AUTO_SYNC_LIMIT) await syncPending(AUTO_SYNC_LIMIT, next)
        await saveCovers(AUTO_COVER_LIMIT)
      })()
    }, 2500)
    return () => clearTimeout(t)
  }, [books, readingLogs, refresh, syncPending, saveCovers])

  const counts = useMemo(() => {
    const c = { pending: 0, synced: 0, failed: 0, needsLink: 0 }
    for (const r of rows) {
      if (r.status === 'pending') c.pending++
      else if (r.status === 'synced') c.synced++
      else if (r.status === 'failed') c.failed++
      else c.needsLink++
    }
    return c
  }, [rows])

  return {
    rows,
    counts,
    busy,
    message,
    coverBusy,
    coverProgress,
    unsavedCoverCount: unsavedCovers.length,
    refresh,
    syncNow: () => syncPending(10000),
    queueAllReading,
    retryProblems,
    saveAllCovers: () => saveCovers(10000),
  }
}
