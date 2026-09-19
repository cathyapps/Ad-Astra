-- Ad Astra — Phase 2 addendum: Planets & Moons for Travel
-- A trip_item with no parent (typically type='city') is a "Planet"; a
-- trip_item nested under one via parent_item_id is a "Moon" (an attraction,
-- activity, restaurant, etc. within that city). Purely additive — existing
-- flat itineraries keep working with parent_item_id left null.

alter table trip_items add column if not exists parent_item_id uuid references trip_items(id) on delete cascade;

create index if not exists trip_items_parent_idx on trip_items (parent_item_id);
