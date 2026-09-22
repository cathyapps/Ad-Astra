-- Ad Astra — Core Universe (Stars, Constellations, Tasks, Settings)
-- Mirrors src/types/index.ts. This is the foundation every other table
-- builds on. Consolidated as of the Phase 6 redesign: Someday -> On the
-- Horizon -> Current Orbit -> Completed is the whole lifecycle (no
-- separate Planning or Archived stage — see src/lib/starLifecycle.ts).

create extension if not exists "pgcrypto";

create table if not exists stars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  category text,
  stage text not null default 'someday'
    check (stage in ('someday','on_the_horizon','current_orbit','completed')),
  tags text[] not null default '{}',

  desired_timeframe text,
  companions text[],
  rough_requirements text,

  desired_outcome text,
  estimated_effort text,
  dependencies uuid[] default '{}',
  budget numeric,

  deadline date,
  target_completion_date date,

  progress int not null default 0 check (progress between 0 and 100),
  images text[] not null default '{}',
  notes text,

  completion_date date,
  reflection text,

  related_star_ids uuid[] not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists constellations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  cover_image text,
  star_ids uuid[] not null default '{}',
  anchor_star_id uuid references stars(id) on delete set null,
  target_date date,
  priority int not null default 0,
  progress int not null default 0 check (progress between 0 and 100),
  status text not null default 'active' check (status in ('active','dormant','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A Star's own free-form Planets & Moons: a top-level task (no
-- parent_task_id) is a Planet; anything nested under one is a Moon.
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  star_id uuid not null references stars(id) on delete cascade,
  parent_task_id uuid references tasks(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'todo' check (status in ('todo','in_progress','done')),
  estimated_minutes int,
  actual_minutes int,
  due_date date,
  dependency_task_ids uuid[] not null default '{}',
  notes text,

  -- Recommendation-engine context tags.
  activity_type text,
  suitable_locations text[],
  suitable_devices text[],
  required_effort text,
  required_energy text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists app_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_orbit_limit int not null default 5,
  -- Last-used timeframe on the Library > Metrics view, remembered across sessions.
  reading_metrics_timeframe text not null default '30d'
);

create index if not exists stars_user_stage_idx on stars (user_id, stage);
create index if not exists tasks_user_star_idx on tasks (user_id, star_id);
create index if not exists tasks_parent_idx on tasks (parent_task_id);

alter table stars enable row level security;
alter table constellations enable row level security;
alter table tasks enable row level security;
alter table app_settings enable row level security;

create policy "stars_owner" on stars for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "constellations_owner" on constellations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_owner" on tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "app_settings_owner" on app_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
