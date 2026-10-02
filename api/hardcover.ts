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
    edition_format
    physical_format
    reading_format { format }
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

  const body = (typeof req.body === 'string' ? safeParse(req.body) : req.body) as { op?: string; codes?: unknown } | undefined
  try {
    switch (body?.op) {
      case 'library':
        return res.status(200).json({ ok: true, ...(await libraryOp()) })
      case 'editions':
        return res.status(200).json({ ok: true, ...(await editionsOp(body.codes)) })
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
