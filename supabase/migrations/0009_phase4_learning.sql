-- Ad Astra — Phase 4 (Learning) schema
-- Adds learning_goals, learning_items. Free-form goals ("Learn French",
-- "Learn piano") with free-entry sub-goals/tasks nested under them
-- (Planets & Moons, arbitrary depth via parent_item_id). No metrics —
-- just a planned/in_progress/completed status at both levels.
-- Mirrors src/types/learning.ts. Run after 0001-0008.
-- NOTE: already applied directly to the live Supabase project via the
-- Supabase MCP connector. This file is here so it's tracked in git and
-- so a fresh Supabase project can be brought up to date by running
-- migrations 0001 through 0009 in order.

create table if not exists learning_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  description text,
  status text not null default 'planned'
    check (status in ('planned','in_progress','completed')),
  notes text,

  related_star_ids uuid[] not null default '{}',
  linked_star_id uuid references stars(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists learning_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references learning_goals(id) on delete cascade,
  parent_item_id uuid references learning_items(id) on delete cascade,

  name text not null,
  notes text,
  status text not null default 'planned'
    check (status in ('planned','in_progress','completed')),
  sort_index int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists learning_goals_user_status_idx on learning_goals (user_id, status);
create index if not exists learning_items_goal_idx on learning_items (goal_id);
create index if not exists learning_items_parent_idx on learning_items (parent_item_id);

alter table learning_goals enable row level security;
alter table learning_items enable row level security;

create policy "learning_goals_owner" on learning_goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "learning_items_owner" on learning_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
