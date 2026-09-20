# Ad Astra

**Phase 1: Core Universe** — the Star lifecycle, Current Orbit capacity
guardrail, Constellations, hierarchical Tasks, the Dashboard context
selector + recommendation engine, and Small Wins.

**Phase 2: Travel** (spec §17, restructured) — every travel aspiration is
a Trip; there's no separate destinations list. A lone someday idea is
just a Trip with one Planet (a country/region/city, carrying why/season/
cost/companions/life-stage tags); a multi-place trip groups several
Planets, each with its own Moons (whatever's inside it — another city, an
attraction, a meal, a transfer).

**Phase 3: Reading & Watching** (spec §19, extended) — a personal library
(books) and a parallel movies/TV framework (watchables), each with
multi-membership lists, a log that updates status/rating on completion,
and time-boxed challenges with live progress bars. TV shows get
episode-level tracking. Reading also has a StoryGraph-style Insights tab
— see "Reading stats" below.

**Phase 4: Learning** — free-form goals ("Learn French," "Learn piano,"
"Refinery details for work") with free-entry sub-goals and tasks nested
under them (Planets & Moons). No type enum and no metrics, unlike Travel/
Reading — just a planned/in_progress/completed status at both the goal
and item level.

## Planets & Moons

A cross-domain vocabulary for how a Star's goal decomposes:

- **Tasks** (Phase 1) — a top-level task is a "Planet," anything nested
  under it a "Moon" (`StarDetail.tsx`, `TaskList.tsx`); the data model is
  unchanged (still arbitrary-depth `parentTaskId` nesting).
- **Travel** (Phase 2) — a trip's own top-level `trip_items` (no
  `parent_item_id`) are its Planets; anything nested under one is a Moon.
  Either tier can be any type (`country`/`region`/`city`/`attraction`/
  `activity`/`restaurant`/`hotel`/`transportation`) — nesting depth, not
  the type value, is what makes something a Planet vs. a Moon. See
  `src/features/travel/TripItemList.tsx`.
- **Reading & Watching** (Phase 3) — a Book or Watchable linked to a Star
  via `relatedStarIds` is that Star's Planet. TV shows go one level
  deeper: `episodes` are a tv_show's Moons, each with its own
  watched/unwatched state (`src/features/watching/EpisodeList.tsx`).
  Books don't have an equivalent Moon tier — chapters weren't worth
  tracking.
- **Learning** (Phase 4) — a goal's own top-level `learning_items` (no
  `parent_item_id`) are its Planets (sub-goals); anything nested under
  one is a Moon (a specific task or session). Completely free-form — no
  type field, just a name, optional notes, and status. See
  `src/features/learning/LearningItemList.tsx`.

## Auto-managed Stars

Beyond the manual `relatedStarIds` linking above, some things get a Star
automatically as they progress, via `src/lib/autoStars.ts` and the sync
logic in `useAdAstra.ts` (`linked_star_id` on trips/books/book_lists/
watchables/watch_lists/learning_goals — separate from `related_star_ids`,
which is still free for manual links):

- **Trips**: `idea` → no Star; `planning` → Star at `planning`; `booked`
  → Star in `current_orbit`; `completed`/`archived` follow suit. Moving
  back to `idea` deletes the auto-created Star.
- **Books / Watchables**: `want_to_read`/`want_to_watch` → no Star;
  `reading`/`watching` → Star in `current_orbit`; finishing (or DNF-ing)
  → Star at `completed`.
- **Book lists / Watch lists**: always get a Star at `on_the_horizon` the
  moment the list is created — a standing goal, not tied to a status.
- **Learning goals**: `planned` → no Star; `in_progress` → Star in
  `current_orbit`; `completed` → Star at `completed`. Moving back to
  `planned` deletes the auto-created Star.

This bypasses the interactive Current-Orbit capacity prompt on purpose —
popping that modal as a side effect of logging a reading session would be
jarring. Auto-linked Stars just add to the orbit silently, so the 5-star
default cap can end up exceeded without a warning if you're mid-book on
several things and mid-trip at once. Worth knowing.

## Reading stats

`src/lib/readingStats.ts` derives everything from the log — you never
type in "pages read this session." Logging a session records one raw
progress marker (current page, % complete, or audiobook position in
minutes) plus optionally how long you spent reading; `deriveSessions()`
converts that into pages via the book's `totalPages`/`totalMinutes` and
diffs against the book's previous session to get pages-read-this-session
and reading speed (pages/hour). The Insights tab
(`src/features/reading/ReadingInsights.tsx`) charts pages/books per day,
month, and day-of-week, plus format/source/genre breakdowns — all with
plain bar-style visuals (no charting library, to avoid an unverified new
dependency in an environment where `npm install` can't be run).

Deliberately **not** styled — you said you'd bring an icon and color
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
  it only changes its stage. Auto-linked Stars (see above) bypass this.
- **Constellations** — group Stars, with a target-date deadline that
  boosts the relevance of member Stars' tasks as the date approaches
  (spec §6).
- **Tasks** (`src/features/tasks/TaskList.tsx`) — arbitrarily nested
  subtasks ("Planets"/"Moons" in the UI), inline add, status toggle.
- **Dashboard** (`src/features/dashboard/Dashboard.tsx`) — the mood/context
  selector (activity type, time, energy, location, device, effort) feeding
  `src/lib/recommendationEngine.ts`, plus "Give me a small win" (≤15 min
  tasks).
- **Universe** (`src/features/universe/`) — list view grouped by stage, and
  a simple SVG "map" view (ring = stage, click a star to open it).
- **Travel** (`src/features/travel/`) — a single Trips list (idea →
  planning → booked → completed), each with an inline Planets/Moons
  itinerary editor. Creating a trip can optionally seed its first Planet
  in the same step, for a lone someday idea.
- **Reading** (`src/features/reading/`) — Library (want to read → reading
  → read/DNF, with format/source/total-length fields), Lists, Challenges,
  and an Insights tab (see "Reading stats" above). Logging a session as
  "finished" or "DNF" updates the book's status and rating automatically.
- **Watching** (`src/features/watching/`) — the same structure as Reading,
  for movies and TV shows, plus per-episode tracking for TV (a show's
  Moons).
- **Learning** (`src/features/learning/`) — free-form Goals, each with an
  inline Planets/Moons editor for sub-goals and tasks (no type field, no
  metrics — just planned/in_progress/completed). Creating a goal can
  optionally seed its first Planet in the same step.

## Known gaps / choices worth knowing about

- **Task context tags** (`activityType`, `suitableLocations`, etc.) aren't
  in the spec's §7 field list — I added them so the recommendation engine
  has something real to match against instead of guessing. They're all
  optional; an untagged task just participates less precisely.
- **Overload detection** (`isOverloaded` in `currentOrbit.ts`) is a coarse
  heuristic for now — a Star counts as stalled if it's been in Current
  Orbit >14 days with <10% progress, approximated from `updated_at` since
  there's no stage-history table yet. Worth revisiting if the heuristic
  feels off in practice, especially now that auto-linked Stars add to
  Current Orbit more often.
- Celebration on task completion is a one-line toast — the spec wants a
  proper positive-reinforcement moment, which I'd rather build once we
  have the real visual language.
- A Planet doesn't carry its own `relatedStarIds`/`relatedConstellationIds`
  (only the Trip itself does) — simpler, and no request has needed
  per-Planet linking yet. Easy to add later if that changes.

## Data layer

Every screen goes through `src/lib/db/index.ts`, which exports a single
`db: AdAstraStore` (`src/lib/db/types.ts`). Two implementations exist:

- `LocalStore` (`localStorage`) — the default, zero-setup mode.
- `SupabaseStore` (`@supabase/supabase-js`) — used automatically once
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are set (see DEPLOY.md);
  `AuthGate` swaps the store in after sign-in.

Run migrations `0001` through `0009`, in order, against a fresh Supabase
project (`supabase/migrations/`). Components, hooks, and the lifecycle/
recommendation logic are all storage-agnostic — adding a table means
adding it to `AdAstraStore` and both implementations, nothing else.

## Next up (Phase 5+)

Relax & Woo-Woo — adds tables that reference `stars`/`constellations`
rather than touching this schema, same pattern as Travel/Reading/
Watching/Learning above.
