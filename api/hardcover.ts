// Server-side bridge to the Hardcover GraphQL API.
//
// Why this exists: the Hardcover token can act as your Hardcover account
// (Hardcover warns it must never reach a browser), so the app never holds
// it. The browser calls THIS function with your Ad Astra sign-in token; the
// function checks who you are, then talks to Hardcover with the secret
// HARDCOVER_API_TOKEN stored in Vercel.
//
// It deliberately exposes a short list of named operations instead of
// forwarding arbitrary GraphQL, so even a stolen sign-in token can't do
// anything beyond what the app itself does.
//
// Vercel env vars (Settings → Environment Variables, server-side only):
//   HARDCOVER_API_TOKEN     your Hardcover API token (from hardcover.app/settings)
//   HARDCOVER_ALLOWED_EMAIL the Ad Astra login email allowed to use this
//                           (comma-separate to allow more than one)
// It also reads the existing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY to
// verify sign-ins.

interface Req {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
}
interface Res {
  status(code: number): Res
  json(body: unknown): void
}

const HARDCOVER_URL = 'https://api.hardcover.app/v1/graphql'
const PAGE_SIZE = 250
const MAX_PAGES = 12 // up to 3,000 library entries

const LIBRARY_QUERY = `
query Library($limit: Int!, $offset: Int!) {
  me {
    id
    username
    user_books(limit: $limit, offset: $offset, order_by: { id: asc }) {
      id
      status_id
      rating
      edition_id
      book {
        id
        title
        pages
        cached_contributors
        cached_tags
      }
      edition {
        id
        isbn_10
        isbn_13
        asin
        pages
        audio_seconds
        edition_format
        physical_format
        reading_format { format }
      }
      user_book_reads(order_by: { id: asc }) {
        id
        started_at
        finished_at
        progress_pages
      }
    }
  }
}`

const EDITIONS_QUERY = `
query EditionsByCode($codes: [String!]) {
  editions(
    where: { _or: [{ isbn_13: { _in: $codes } }, { isbn_10: { _in: $codes } }, { asin: { _in: $codes } }] }
    limit: 500
  ) {
    id
    isbn_13
    isbn_10
    asin
    pages
    audio_seconds
    edition_format
    physical_format
    reading_format { format }
  }
}`

const BOOK_EDITIONS_QUERY = `
query BookEditions($bookId: Int!) {
  editions(where: { book_id: { _eq: $bookId } }, order_by: { users_count: desc }, limit: 100) {
    id
    isbn_13
    isbn_10
    asin
    pages
    audio_seconds
    edition_format
    physical_format
    reading_format { format }
    language { language }
    publisher { name }
    release_date
    users_count
  }
}`

function authHeader(token: string): string {
  const t = token.trim()
  return /^bearer\s/i.test(t) ? t : `Bearer ${t}`
}

async function hardcover(query: string, variables: Record<string, unknown>) {
  const res = await fetch(HARDCOVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(process.env.HARDCOVER_API_TOKEN ?? ''),
    },
    body: JSON.stringify({ query, variables }),
  })
  const text = await res.text()
  let json: { data?: unknown; errors?: { message?: string }[]; error?: string; message?: string } | undefined
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`Hardcover answered ${res.status} with something unreadable`)
  }
  if (!res.ok || json?.errors?.length || json?.error) {
    const msg = json?.errors?.map((e) => e.message).join('; ') || json?.error || json?.message || `HTTP ${res.status}`
    throw new Error(`Hardcover: ${msg}`)
  }
  return json?.data as Record<string, unknown>
}

/** Confirms the caller's Supabase sign-in token is real and returns their email. */
async function signedInEmail(authorization: string | undefined): Promise<string | undefined> {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL
  const anon = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY
  if (!url || !anon || !authorization) return undefined
  const res = await fetch(`${url}/auth/v1/user`, { headers: { Authorization: authorization, apikey: anon } })
  if (!res.ok) return undefined
  const user = (await res.json()) as { email?: string }
  return user.email?.toLowerCase()
}

async function libraryOp() {
  let user: unknown
  const items: unknown[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await hardcover(LIBRARY_QUERY, { limit: PAGE_SIZE, offset: page * PAGE_SIZE })
    const me = Array.isArray(data.me) ? data.me[0] : data.me
    const batch = ((me as { user_books?: unknown[] } | undefined)?.user_books ?? []) as unknown[]
    if (page === 0) user = { id: (me as { id?: number })?.id, username: (me as { username?: string })?.username }
    items.push(...batch)
    if (batch.length < PAGE_SIZE) break
  }
  return { user, items }
}

/** Looks up editions by ISBN-10 / ISBN-13 / Kindle ASIN so the review screen can show
 *  each ISBN's format and page count. Read-only; at most 100 codes per call. */
async function editionsOp(codes: unknown) {
  const list = Array.isArray(codes)
    ? codes.filter((c): c is string => typeof c === 'string' && /^[0-9A-Za-z]{9,13}$/.test(c)).slice(0, 100)
    : []
  if (list.length === 0) return { editions: [] }
  const data = await hardcover(EDITIONS_QUERY, { codes: list })
  return { editions: (data.editions ?? []) as unknown[] }
}

// ---------------------------------------------------------------------------
// Add-book lookup
// ---------------------------------------------------------------------------

const SEARCH_QUERY = `
query Search($q: String!) {
  search(query: $q, query_type: "books", per_page: 10, page: 1, sort: "activities_count:desc") {
    results
  }
}`

/** Typesense hits for a title/author/ISBN search, trimmed to what the add-book picker shows. */
async function searchOp(q: unknown) {
  const query = typeof q === 'string' ? q.trim().slice(0, 200) : ''
  if (!query) return { hits: [] }
  const data = await hardcover(SEARCH_QUERY, { q: query })
  const search = (Array.isArray(data.search) ? data.search[0] : data.search) as { results?: unknown } | undefined
  let results = search?.results as unknown
  if (typeof results === 'string') {
    try {
      results = JSON.parse(results)
    } catch {
      results = undefined
    }
  }
  const hits = ((results as { hits?: { document?: unknown }[] } | undefined)?.hits ?? [])
    .map((h) => h.document)
    .filter(Boolean)
  return { hits }
}

const BOOK_DETAIL_QUERY = `
query BookDetail($id: Int!) {
  books(where: { id: { _eq: $id } }, limit: 1) {
    id
    title
    pages
    release_date
    description
    rating
    ratings_count
    cached_tags
    cached_contributors
    image { url }
  }
  editions(where: { book_id: { _eq: $id } }, order_by: { users_count: desc }, limit: 100) {
    id
    isbn_13
    isbn_10
    asin
    pages
    audio_seconds
    edition_format
    physical_format
    reading_format { format }
    language { language }
    users_count
  }
}`

/** Everything Hardcover knows about one book: pages, cover, every mood and genre, and its editions. */
async function bookDetailOp(bookId: unknown) {
  const id = typeof bookId === 'number' && Number.isInteger(bookId) && bookId > 0 ? bookId : undefined
  if (id === undefined) throw new Error('bookDetail needs a numeric bookId')
  const data = await hardcover(BOOK_DETAIL_QUERY, { id })
  const book = (Array.isArray(data.books) ? data.books[0] : undefined) ?? null
  return { book, editions: (data.editions ?? []) as unknown[] }
}

// ---------------------------------------------------------------------------
// Cover thumbnails: fetched here (the browser can't read other sites' images
// into a canvas), resized in the browser, then stored in Supabase Storage.
// ---------------------------------------------------------------------------

const COVER_HOSTS = [
  'assets.hardcover.app',
  'hardcover.app',
  'covers.openlibrary.org',
  'openlibrary.org',
  'archive.org',
  'books.google.com',
  'books.googleusercontent.com',
  'storage.googleapis.com',
  'm.media-amazon.com',
  'images-na.ssl-images-amazon.com',
]
const MAX_COVER_BYTES = 3 * 1024 * 1024

function coverHostAllowed(host: string): boolean {
  const h = host.toLowerCase()
  return COVER_HOSTS.some((allowed) => h === allowed || h.endsWith(`.${allowed}`))
}

async function coverImageOp(rawUrl: unknown) {
  let url: URL
  try {
    url = new URL(typeof rawUrl === 'string' ? rawUrl : '')
  } catch {
    throw new Error('That cover address is not a valid URL.')
  }
  if (url.protocol !== 'https:' || !coverHostAllowed(url.hostname)) {
    throw new Error(`Covers can't be fetched from ${url.hostname}.`)
  }
  const res = await fetch(url.toString(), { redirect: 'follow' })
  if (!res.ok) throw new Error(`The cover host answered ${res.status}.`)
  // Open Library redirects to archive.org, so the final host is checked too.
  if (!coverHostAllowed(new URL(res.url || url.toString()).hostname)) throw new Error('The cover redirected somewhere unexpected.')
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.startsWith('image/')) throw new Error('That address did not return an image.')
  const bytes = await res.arrayBuffer()
  if (bytes.byteLength > MAX_COVER_BYTES) throw new Error('That cover image is too large.')
  return { contentType, base64: Buffer.from(bytes).toString('base64') }
}

// ---------------------------------------------------------------------------
// Sync: push one book's state from Ad Astra to the Hardcover account.
//
// State-based, not event-based: the app sends the book's current status,
// rating, dates, progress and notes, and this makes Hardcover match. Running
// it twice changes nothing, so retries are always safe. It only ever writes
// to YOUR user_book / user_book_read rows. It never deletes anything, never
// clears a value Ad Astra doesn't have, and never creates Hardcover catalog
// entries: a book it can't identify is reported as "needs link".
// ---------------------------------------------------------------------------

interface SyncInput {
  hardcoverBookId?: number
  hardcoverEditionId?: number
  isbn?: string
  status?: string
  rating?: number
  notes?: string
  startedAt?: string
  completedAt?: string
  progressPages?: number
  progressSeconds?: number
}

const STATUS_IDS: Record<string, number> = { want_to_read: 1, reading: 2, read: 3, paused: 4, dnf: 5 }
const DAY = /^\d{4}-\d{2}-\d{2}$/

const posInt = (v: unknown): number | undefined => (typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : undefined)
const day = (v: unknown): string | undefined => (typeof v === 'string' && DAY.test(v) ? v : undefined)

const FIND_EDITION_QUERY = `
query FindEdition($codes: [String!]) {
  editions(
    where: { _or: [{ isbn_13: { _in: $codes } }, { isbn_10: { _in: $codes } }, { asin: { _in: $codes } }] }
    order_by: { users_count: desc }
    limit: 1
  ) { id book_id }
}`

const MY_USER_BOOK_QUERY = `
query MyUserBook($bookId: Int!) {
  me {
    user_books(where: { book_id: { _eq: $bookId } }, limit: 1) { id status_id rating edition_id }
  }
}`

const MY_NOTES_QUERY = `
query MyNotes($id: Int!) {
  me { user_books(where: { id: { _eq: $id } }, limit: 1) { private_notes } }
}`

const INSERT_USER_BOOK = `
mutation InsertUserBook($object: UserBookCreateInput!) {
  insert_user_book(object: $object) { id error user_book { id } }
}`

const UPDATE_USER_BOOK = `
mutation UpdateUserBook($id: Int!, $object: UserBookUpdateInput!) {
  update_user_book(id: $id, object: $object) { id error }
}`

const LATEST_READ_QUERY = `
query LatestRead($id: Int!) {
  user_book_reads(where: { user_book_id: { _eq: $id } }, order_by: { id: desc }, limit: 1) {
    id started_at finished_at progress_pages
  }
}`

const INSERT_READ = `
mutation InsertRead($id: Int!, $object: DatesReadInput!) {
  insert_user_book_read(user_book_id: $id, user_book_read: $object) { id error }
}`

const UPDATE_READ = `
mutation UpdateRead($id: Int!, $object: DatesReadInput!) {
  update_user_book_read(id: $id, object: $object) { id error }
}`

/** Mutations report problems in an `error` field instead of (or as well as) GraphQL errors. */
function mutationResult(data: Record<string, unknown>, key: string): { id?: number } {
  const r = (data[key] ?? {}) as { id?: number; error?: string; user_book?: { id?: number } }
  if (r.error) throw new Error(`Hardcover: ${r.error}`)
  return { id: r.id ?? r.user_book?.id }
}

function meUserBooks(data: Record<string, unknown>): Record<string, unknown>[] {
  const me = (Array.isArray(data.me) ? data.me[0] : data.me) as { user_books?: Record<string, unknown>[] } | undefined
  return me?.user_books ?? []
}

async function syncBookOp(raw: unknown) {
  const input = (raw ?? {}) as SyncInput
  const statusId = STATUS_IDS[input.status ?? '']
  if (!statusId) throw new Error(`Unknown status: ${input.status ?? '(none)'}`)
  const did: string[] = []
  const warnings: string[] = []

  // 1. Which Hardcover book is this?
  let bookId = posInt(input.hardcoverBookId)
  let editionId = posInt(input.hardcoverEditionId)
  if (!bookId) {
    const code = (input.isbn ?? '').replace(/[\s-]/g, '').toUpperCase()
    if (!/^[0-9A-Z]{9,13}$/.test(code)) return { status: 'needs_link' as const, reason: 'No Hardcover link and no ISBN to find the book by.' }
    const found = await hardcover(FIND_EDITION_QUERY, { codes: [code] })
    const hit = ((found.editions ?? []) as { id?: number; book_id?: number }[])[0]
    if (!hit?.book_id) return { status: 'needs_link' as const, reason: 'Hardcover has no edition with this ISBN.' }
    bookId = hit.book_id
    editionId = editionId ?? hit.id
    did.push('linked by ISBN')
  }

  // 2. Your library entry for it (created if you don't have one yet).
  const existing = meUserBooks(await hardcover(MY_USER_BOOK_QUERY, { bookId }))[0] as
    | { id?: number; status_id?: number; rating?: number | null; edition_id?: number | null }
    | undefined
  let userBookId = existing?.id
  let current = { status_id: existing?.status_id, rating: existing?.rating ?? undefined, edition_id: existing?.edition_id ?? undefined }
  if (!userBookId) {
    const object: Record<string, unknown> = { book_id: bookId, status_id: statusId }
    if (editionId) object.edition_id = editionId
    userBookId = mutationResult(await hardcover(INSERT_USER_BOOK, { object }), 'insert_user_book').id
    if (!userBookId) throw new Error('Hardcover created the entry but did not say which one.')
    current = { status_id: statusId, rating: undefined, edition_id: editionId }
    did.push('added to library')
  }

  // 3. Status and rating, only when they differ.
  const patch: Record<string, unknown> = {}
  if (current.status_id !== statusId) patch.status_id = statusId
  if (typeof input.rating === 'number' && input.rating > 0 && input.rating <= 5 && current.rating !== input.rating) patch.rating = input.rating
  if (Object.keys(patch).length > 0) {
    mutationResult(await hardcover(UPDATE_USER_BOOK, { id: userBookId, object: patch }), 'update_user_book')
    did.push(...Object.keys(patch).map((k) => k.replace('_id', '')))
  }

  // 4. The edition you read, kept separate so a problem here doesn't undo the rest.
  if (editionId && current.edition_id !== editionId) {
    try {
      mutationResult(await hardcover(UPDATE_USER_BOOK, { id: userBookId, object: { edition_id: editionId } }), 'update_user_book')
      did.push('edition')
    } catch (err) {
      warnings.push(`edition: ${err instanceof Error ? err.message : 'failed'}`)
    }
  }

  // 5. Notes (Hardcover's private notes), also separate. Skipped when identical.
  if (typeof input.notes === 'string' && input.notes.trim()) {
    try {
      const have = meUserBooks(await hardcover(MY_NOTES_QUERY, { id: userBookId }))[0]?.private_notes
      if (have !== input.notes) {
        mutationResult(await hardcover(UPDATE_USER_BOOK, { id: userBookId, object: { private_notes: input.notes } }), 'update_user_book')
        did.push('notes')
      }
    } catch (err) {
      warnings.push(`notes: ${err instanceof Error ? err.message : 'failed'}`)
    }
  }

  // 6. Reading dates and progress on your current read-through (not for "want to read").
  if (statusId !== 1) {
    try {
      const startedAt = day(input.startedAt)
      const finishedAt = statusId === 3 ? day(input.completedAt) : undefined
      const pages = posInt(input.progressPages)
      const seconds = posInt(input.progressSeconds)
      const read = ((await hardcover(LATEST_READ_QUERY, { id: userBookId })).user_book_reads ?? []) as {
        id?: number
        started_at?: string | null
        finished_at?: string | null
        progress_pages?: number | null
      }[]
      const latest = read[0]
      const want: Record<string, unknown> = {}
      if (startedAt && latest?.started_at?.slice(0, 10) !== startedAt) want.started_at = startedAt
      if (finishedAt && latest?.finished_at?.slice(0, 10) !== finishedAt) want.finished_at = finishedAt
      if (pages && latest?.progress_pages !== pages) want.progress_pages = pages
      if (seconds && editionId) want.progress_seconds = seconds
      if (editionId && (want.progress_seconds || want.progress_pages)) want.edition_id = editionId
      if (!latest?.id) {
        if (startedAt || finishedAt || pages || seconds) {
          mutationResult(await hardcover(INSERT_READ, { id: userBookId, object: want }), 'insert_user_book_read')
          did.push('reading dates')
        }
      } else if (Object.keys(want).length > 0) {
        mutationResult(await hardcover(UPDATE_READ, { id: latest.id, object: want }), 'update_user_book_read')
        did.push('reading dates')
      }
    } catch (err) {
      warnings.push(`reading dates: ${err instanceof Error ? err.message : 'failed'}`)
    }
  }

  return { status: 'synced' as const, bookId, editionId, userBookId, did, warnings }
}

/** Every edition Hardcover lists for one book, most-used first, so the review screen can
 *  offer the edition that matches the format you actually read. Read-only. */
async function bookEditionsOp(bookId: unknown) {
  const id = typeof bookId === 'number' && Number.isInteger(bookId) && bookId > 0 ? bookId : undefined
  if (id === undefined) throw new Error('bookEditions needs a numeric bookId')
  const data = await hardcover(BOOK_EDITIONS_QUERY, { bookId: id })
  return { editions: (data.editions ?? []) as unknown[] }
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' })

  if (!process.env.HARDCOVER_API_TOKEN) {
    return res.status(500).json({ ok: false, error: 'HARDCOVER_API_TOKEN is not set in Vercel (or the project needs a redeploy).' })
  }
  const allowed = (process.env.HARDCOVER_ALLOWED_EMAIL ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  if (allowed.length === 0) {
    return res.status(500).json({ ok: false, error: 'HARDCOVER_ALLOWED_EMAIL is not set in Vercel (your Ad Astra login email).' })
  }

  const header = req.headers.authorization
  const email = await signedInEmail(Array.isArray(header) ? header[0] : header).catch(() => undefined)
  if (!email) return res.status(401).json({ ok: false, error: 'Not signed in.' })
  if (!allowed.includes(email)) return res.status(403).json({ ok: false, error: 'This account is not allowed to use the Hardcover link.' })

  const body = (typeof req.body === 'string' ? safeParse(req.body) : req.body) as { op?: string; codes?: unknown; bookId?: unknown; q?: unknown; url?: unknown; book?: unknown } | undefined
  try {
    switch (body?.op) {
      case 'library':
        return res.status(200).json({ ok: true, ...(await libraryOp()) })
      case 'editions':
        return res.status(200).json({ ok: true, ...(await editionsOp(body.codes)) })
      case 'bookEditions':
        return res.status(200).json({ ok: true, ...(await bookEditionsOp(body.bookId)) })
      case 'search':
        return res.status(200).json({ ok: true, ...(await searchOp(body.q)) })
      case 'bookDetail':
        return res.status(200).json({ ok: true, ...(await bookDetailOp(body.bookId)) })
      case 'coverImage':
        return res.status(200).json({ ok: true, ...(await coverImageOp(body.url)) })
      case 'syncBook':
        return res.status(200).json({ ok: true, ...(await syncBookOp(body.book)) })
      default:
        return res.status(400).json({ ok: false, error: `Unknown operation: ${body?.op ?? '(none)'}` })
    }
  } catch (err) {
    return res.status(502).json({ ok: false, error: err instanceof Error ? err.message : 'Hardcover request failed' })
  }
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s)
  } catch {
    return undefined
  }
}
