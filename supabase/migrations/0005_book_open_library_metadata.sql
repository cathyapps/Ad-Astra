-- Ad Astra — Library: Open Library metadata (Phase 8)
-- Adds fields populated when a book is added via the Open Library
-- search instead of typed in by hand. A manually-entered book simply
-- leaves all of these null. `external_metadata` is a catch-all jsonb
-- blob for whatever else Open Library returned that isn't one of the
-- named fields — kept in case it's useful later even though the app
-- doesn't surface all of it yet.

alter table books
  add column if not exists isbn text,
  add column if not exists cover_url text,
  add column if not exists publisher text,
  add column if not exists publish_year int,
  add column if not exists subjects text[],
  add column if not exists open_library_work_key text,
  add column if not exists external_metadata jsonb;
