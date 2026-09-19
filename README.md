# Ad Astra

**Phase 1: Core Universe** — the Star lifecycle, Current Orbit capacity
guardrail, Constellations, hierarchical Tasks, the Dashboard context
selector + recommendation engine, and Small Wins.

**Phase 2: Travel** (spec §17) — a destination bucket list (why/season/
cost/companions/life-stage tags), trips that either grow out of a
destination or start from scratch, and per-trip itineraries. Destinations
and trips can both link to Stars/Constellations via `relatedStarIds` /
`relatedConstellationIds`, per the "Travel-related constellation
integration" line in the Phase 2 scope.

**Phase 3: Reading & Watching** (spec §19, extended) — a personal library
(books) and a parallel movies/TV framework (watchables), each with
multi-membership lists, a log (reading sessions / viewing sessions) that
updates status and rating on completion, and time-boxed challenges (50
books in 2027, etc.) with live progress bars. TV shows get episode-level
tracking. See "Planets & Moons" below for how these connect to Stars.

## Planets & Moons

A cross-domain vocabulary for how a Star's goal decomposes, layered onto
existing structures rather than one new mega-table:

- **Tasks** (Phase 1) — unchanged data model (still arbitrary-depth
  `parentTaskId` nesting); the UI now calls a top-level task a "Planet"
  and anything nested under it a "Moon" (`StarDetail.tsx`, `TaskList.tsx`).
- **Travel** (Phase 2) — `trip_items.parent_item_id` (migration
  `0003_travel_planets_moons.sql`) lets a city item (a Planet) contain
  nested attractions/activities/etc. (Moons). Purely additive; flat
  itineraries with no parent still work.
  See `src/features/travel/TripItemList.tsx`.
- **Reading & Watching** (Phase 3) — a Book or Watchable linked to a Star
  via `relatedStarIds` is that Star's Planet. TV shows go one level
  deeper: `episodes` (migration `0005_phase3_watching.sql`) are a
  tv_show's Moons, each with its own watched/unwatched state
  (`src/features/watching/EpisodeList.tsx`). Books don't have an
  equivalent Moon tier — chapters weren't worth tracking.

Deliberately **not** styled — you said you'd bring an icon and color
scheme later, so this uses plain neutral Tailwind utilities purely for
layout. Swapping in a real look later means editing classes/tokens, not
restructuring components.
scheme later, so this uses plain neutral Tailwind utilities purely for
layout. Swapping in a real look later means editing classes/tokens, not
restructuring components.

## Running it

```bash
npm install
npm run dev
```

Data is stored in `localStorage` for now (see "Data layer" below), so it
runs with zero setup and nothing to configure.

## What's implemented

- **Star lifecycle** (`src/lib/starLifecycle.ts`) — the six-stage state
  machine (Someday → On the Horizon → Planning → Current Orbit →
  Completed → Archived), which moves are allowed, and which fields are
  *suggested* (never required) at each stage.
- **Current Orbit guardrail** (`src/lib/currentOrbit.ts`) — warns at the
  configured limit (default 5), with Abort / Override / Replace, exactly
  as in spec §4. Replace preserves the outgoing Star's tasks/progress/notes;
  it only changes its stage.
- **Constellations** — group Stars, with a target-date deadline that
  boosts the relevance of member Stars' tasks as the date approaches
  (spec §6).
- **Tasks** (`src/features/tasks/TaskList.tsx`) — arbitrarily nested
  subtasks, inline add, status toggle.
- **Dashboard** (`src/features/dashboard/Dashboard.tsx`) — the mood/context
  selector (activity type, time, energy, location, device, effort) feeding
  `src/lib/recommendationEngine.ts`, plus "Give me a small win" (≤15 min
  tasks).
- **Universe** (`src/features/universe/`) — list view grouped by stage, and
  a simple SVG "map" view (ring = stage, click a star to open it).
- **Travel** (`src/features/travel/`) — Destinations tab (bucket list →
  planning → booked → visited, grouped list + detail view) and Trips tab
  (idea → planning → booked → completed, with a per-trip itinerary of
  typed items: city/attraction/activity/restaurant/hotel/transportation,
  nested as Planets/Moons — see below). "Start a trip from this" on a
  destination creates a trip pre-linked to it — no separate "trip ideas"
  table; a trip's own status covers that.
- **Reading** (`src/features/reading/`) — Library (want to read → reading
  → read/DNF), Lists (custom/lifetime/series/author/challenge groupings),
  and Challenges (book-count or page-count goals over a date range,
  computed live from the log). Logging a session as "finished" or "DNF"
  updates the book's status and rating automatically.
- **Watching** (`src/features/watching/`) — the same structure as Reading,
  for movies and TV shows, plus per-episode tracking for TV (a show's
  Moons).

## Known gaps / choices worth knowing about

- **Task context tags** (`activityType`, `suitableLocations`, etc.) aren't
  in the spec's §7 field list — I added them so the recommendation engine
  has something real to match against instead of guessing. They're all
  optional; an untagged task just participates less precisely.
- **Overload detection** (`isOverloaded` in `currentOrbit.ts`) is a coarse
  heuristic for now — a Star counts as stalled if it's been in Current
  Orbit >14 days with <10% progress, approximated from `updated_at` since
  there's no stage-history table yet. Worth revisiting in Phase 2 if the
  heuristic feels off in practice.
- Celebration on task completion is a one-line toast — the spec wants a
  proper positive-reinforcement moment, which I'd rather build once we
  have the real visual language.

## Data layer

Every screen goes through `src/lib/db/index.ts`, which exports a single
`db: AdAstraStore` (`src/lib/db/types.ts`). Two implementations exist:

- `LocalStore` (`localStorage`) — the default, zero-setup mode.
- `SupabaseStore` (`@supabase/supabase-js`) — used automatically once
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are set (see DEPLOY.md);
  `AuthGate` swaps the store in after sign-in.

Run migrations `0001` through `0005`, in order, against a fresh Supabase
project (`supabase/migrations/`). Components, hooks, and the lifecycle/
recommendation logic are all storage-agnostic — adding a table means
adding it to `AdAstraStore` and both implementations, nothing else.

## Next up (Phase 4+)

Learning, Relax & Woo-Woo — each adds tables that reference
`stars`/`constellations` rather than touching this schema, same pattern
as Travel/Reading/Watching above.
