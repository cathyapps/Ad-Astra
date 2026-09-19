-- Ad Astra — Phase 2 (Travel) schema
-- Adds travel_destinations, trips, trip_items. Mirrors src/types/travel.ts.
-- Run after 0001_phase1_core_universe.sql.

create table if not exists travel_destinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  country text,
  region text,
  city text,
  name text not null,
  images text[] not null default '{}',
  why text,
  desired_trip_length text,
  best_season text,
  estimated_cost numeric,
  companions text[] not null default '{}',
  life_stage_tags text[] not null default '{}'
    check (life_stage_tags <@ array['before_kids','with_kids','while_young','anytime','retirement']::text[]),
  status text not null default 'bucket_list'
    check (status in ('bucket_list','planning','booked','visited','archived')),

  related_star_ids uuid[] not null default '{}',
  related_constellation_ids uuid[] not null default '{}',

  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  destination_ids uuid[] not null default '{}',
  status text not null default 'idea'
    check (status in ('idea','planning','booked','completed','archived')),

  start_date date,
  end_date date,
  num_days int,
  budget numeric,
  notes text,

  related_star_ids uuid[] not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists trip_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references trips(id) on delete cascade,

  type text not null default 'activity'
    check (type in ('city','attraction','activity','restaurant','hotel','transportation')),
  name text not null,
  date date,
  notes text,
  cost numeric,
  sort_index int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists destinations_user_status_idx on travel_destinations (user_id, status);
create index if not exists trips_user_status_idx on trips (user_id, status);
create index if not exists trip_items_trip_idx on trip_items (trip_id);

alter table travel_destinations enable row level security;
alter table trips enable row level security;
alter table trip_items enable row level security;

create policy "destinations_owner" on travel_destinations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "trips_owner" on trips for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "trip_items_owner" on trip_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
