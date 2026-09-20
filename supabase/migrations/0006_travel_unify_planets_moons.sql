-- Ad Astra — Travel remodel: no more standalone destinations list.
-- Every travel aspiration is a Trip; a top-level trip_item (no parent) is
-- a Planet carrying the old TravelDestination fields, a nested trip_item
-- is a Moon. Run after 0001-0005.

-- Planets can now be a country or region, not just a city.
alter table trip_items drop constraint if exists trip_items_type_check;
alter table trip_items add constraint trip_items_type_check
  check (type in ('country','region','city','attraction','activity','restaurant','hotel','transportation'));

-- Bucket-list-style fields, formerly on travel_destinations, now live on
-- the Planet-tier trip_items (left null on Moons).
alter table trip_items add column if not exists why text;
alter table trip_items add column if not exists best_season text;
alter table trip_items add column if not exists desired_trip_length text;
alter table trip_items add column if not exists estimated_cost numeric;
alter table trip_items add column if not exists companions text[] not null default '{}';
alter table trip_items add column if not exists life_stage_tags text[] not null default '{}'
  check (life_stage_tags <@ array['before_kids','with_kids','while_young','anytime','retirement']::text[]);

-- A trip's places are now just its own top-level trip_items.
alter table trips drop column if exists destination_ids;

drop table if exists travel_destinations;
