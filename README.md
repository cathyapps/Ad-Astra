# Ad Astra

A personal goals/life-tracking app built around **Stars** — every goal,
project, trip, or reading/learning ambition you have, moving through one
lifecycle: **Someday → On the Horizon → Current Orbit → Completed**, with
free movement back to any earlier stage whenever you want.

## The 4 tabs

1. **Dashboard** — the mood/context-based suggestion engine, your Current
   Orbit Stars, everything currently "in progress" across the Library and
   Bucket List (with inline mark-complete / log-progress actions), and
   "Give me a small win."
2. **Universe** — a map of your Constellations and Current Orbit Stars,
   a list of exactly what's on that map, and a "See all Stars" link to
   the full list across every stage. Opening a Star shows its Planets &
   Moons, its linked Library/Bucket-List items, and lets you move it
   through the lifecycle or delete it.
3. **Bucket List** — everything you'd like to do someday, in 4
   categories: Travel Destinations, Books to Read, Shows to Watch, Movies
   to Watch. Each item has a status (Backlog → In Progress → Completed)
   and free-form, category-specific tags.
4. **Library** — three sub-tabs: **Currently Reading**, **My Library**
   (a bookshelf view of everything you own, with a link to books you
   want but don't own yet), and **Metrics** (a dynamic chart builder over
   your reading logs).

## Stars, Planets & Moons

A Star is the single "goal" concept in the app — a trip, a reading
project, a piece of learning, a creative project, anything. There's no
separate Trip/Learning-goal/Project table anymore: they're all just
Stars, distinguished by `category` (`travel`, `learning`, `creative`,
`home`, `business`, `reading`, `health`, `relationship`, `other`).

Every Star has its own free-form **Planets & Moons** — arbitrarily
nested sub-goals and tasks (`tasks` table, self-referencing via
`parent_task_id`; a top-level task is a Planet, anything nested under
one is a Moon). No type field, no required structure — just a name,
optional notes/estimate, and a todo/in_progress/done status.

Stars connect to each other two ways:
- **Constellations** — group related Stars together (`constellations.star_ids`).
- **Linked items** — a Library book or Bucket List item can be attached
  to a Star via its own `related_star_ids` (see `StarLinkedItems.tsx`).
  The relationship lives on the item, not the Star, so an item can link
  to more than one Star.

## Library

`books` is the single source of truth for every book you own, have
read, or want to read — `ownership` (own/library/tbd), `format`
(kindle/audio/print/tbd), `genre`, `totalPages`/`totalMinutes`,
`readStatus` (want_to_read/reading/read/dnf), rating, notes, tags.

`reading_logs` is a pure daily-progress log — you log **one** raw
progress marker per entry (current page, % complete, or audiobook
position in minutes) plus optionally how long you spent reading. Rating
and read status live on the book itself, not per log entry.
`src/lib/readingStats.ts` derives everything else — pages read, reading
speed, streaks, breakdowns — from that log; nothing is typed in as a
precomputed stat.

## Bucket List

`bucket_list_items` covers all 4 categories. Travel destinations are
pure ideas (no other table covers them). A book/show/movie idea can
optionally link to a promoted `books`/`watchables` row (`book_id` /
`watchable_id`) once you actually start tracking it richly there — until
then it's just a lightweight idea with a status and tags.

## Watching

`watchables` + `episodes` (a tv_show's episodes are its Moons) +
`viewing_sessions` — unchanged in spirit from before, just trimmed of
the old auto-Star column and WatchList/WatchChallenge tables (a
watch-related goal is just a Star now).

## Dynamic chart builder

`chart_configs` stores one row per saved chart on a named view (chart
type, x-axis, y-axis, title). The Metrics sub-tab of Library lets you
pick a chart type (bar/line/scatter/pie) and an x/y axis from your
reading data and save it to your default view; `app_settings.
reading_metrics_timeframe` remembers your last-picked timeframe across
sessions.

## Running it

```bash
npm install
npm run dev
```

Data is stored in `localStorage` by default — zero setup, nothing to
configure. Set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (see
DEPLOY.md) to switch to Supabase and sync across devices; `AuthGate`
swaps the store in after sign-in.

## Data layer

Every screen goes through `src/lib/db/index.ts`, which exports a single
`db: AdAstraStore` (`src/lib/db/types.ts`). Two implementations exist —
`LocalStore` (`localStorage`) and `SupabaseStore`
(`@supabase/supabase-js`) — and every component/hook is storage-agnostic.
Adding a table means adding it to `AdAstraStore` and both
implementations, nothing else.

Run migrations `0001` through `0003`, in order, against a fresh Supabase
project (`supabase/migrations/`):
- `0001_core_universe.sql` — Stars, Constellations, Tasks, Settings
- `0002_watching.sql` — Watchables, Episodes, Viewing Sessions
- `0003_library_bucketlist_charts.sql` — Books, Reading Logs, Bucket List, Chart Configs

## History

This is a from-scratch redesign (internally "Phase 6") that replaced an
earlier version with separate Travel/Reading/Watching/Learning/Goals
tabs and an auto-managed "linked Star" system. That system is gone
entirely — every domain goal collapsed into Stars directly, which is why
the migration numbering restarts at a clean `0001`.

## Known gaps / choices worth knowing about

- **Task context tags** (`activityType`, `suitableLocations`, etc. on
  `tasks`) power the Dashboard's recommendation engine; they're all
  optional, so an untagged task just participates less precisely.
- **Overload detection** (`isOverloaded` in `currentOrbit.ts`) is a
  coarse heuristic — a Star counts as stalled if it's been in Current
  Orbit >14 days with <10% progress, approximated from `updated_at`
  since there's no stage-history table.
- Bucket List and Library UIs (collapsible category sections, bookshelf
  view, dynamic chart builder) are still placeholders as of this
  writing — Dashboard and Universe are fully built; Bucket List/Library
  are the next stage of this redesign.
