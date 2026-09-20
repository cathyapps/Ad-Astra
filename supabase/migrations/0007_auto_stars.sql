-- Ad Astra — auto-managed Stars for Trips/Books/BookLists/Watchables/WatchLists.
-- linked_star_id is separate from each table's existing related_star_ids
-- (manual links): this column is exclusively for the Star the app itself
-- creates/updates/removes as the item's own status changes — see
-- src/lib/autoStars.ts and the sync logic in useAdAstra.ts.

alter table trips add column if not exists linked_star_id uuid references stars(id) on delete set null;
alter table books add column if not exists linked_star_id uuid references stars(id) on delete set null;
alter table book_lists add column if not exists linked_star_id uuid references stars(id) on delete set null;
alter table watchables add column if not exists linked_star_id uuid references stars(id) on delete set null;
alter table watch_lists add column if not exists linked_star_id uuid references stars(id) on delete set null;
