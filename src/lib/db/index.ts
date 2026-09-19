import { LocalStore } from './localStore'
import type { AdAstraStore } from './types'

// The active store. Starts as LocalStore (localStorage, zero setup) and is
// swapped for a SupabaseStore by AuthGate once Supabase is configured and
// the user is signed in. `db` is re-exported as a live binding, so every
// module that does `import { db } from '@/lib/db'` and calls `db.xxx()`
// picks up the swap automatically — nothing else needs to change.
export let db: AdAstraStore = new LocalStore()

export function setStore(store: AdAstraStore) {
  db = store
}

export type { AdAstraStore }
