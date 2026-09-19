-- Ad Astra — Phase 3 addendum (Watching: movies & TV)
-- Mirrors src/types/watching.ts, same shape as 0004_phase3_reading.sql.
-- An episodes row is a Moon of its tv_show Watchable (the Planet).

create table if not exists watchables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  type text not null check (type in ('movie','tv_show')),
  genre text,
  format text check (format in ('streaming','disc','theater')),
  status text not null default 'want_to_watch'
    check (status in ('want_to_watch','watching','watched','dnf')),
  rating numeric check (rating between 1 and 5),
  notes text,

  related_star_ids uuid[] not null default '{}',
  related_constellation_ids uuid[] not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists episodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  watchable_id uuid not null references watchables(id) on delete cascade,
  season int,
  episode_number int,
  name text,
  watched boolean not null default false,
  notes text,
  sort_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists watch_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  type text not null default 'custom'
    check (type in ('custom','lifetime','franchise','challenge')),
  related_star_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists watch_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  watch_list_id uuid not null references watch_lists(id) on delete cascade,
  watchable_id uuid not null references watchables(id) on delete cascade,
  sort_index int not null default 0,
  created_at timestamptz not null default now(),
  unique (watch_list_id, watchable_id)
);

create table if not exists viewing_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  watchable_id uuid not null references watchables(id) on delete cascade,
  date date not null default current_date,
  minutes int,
  notes text,
  rating numeric check (rating between 1 and 5),
  completion_status text check (completion_status in ('in_progress','completed','dnf')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists watch_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target numeric not null,
  start_date date not null,
  end_date date not null,
  notes text,
  related_star_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists watchables_user_status_idx on watchables (user_id, status);
create index if not exists episodes_watchable_idx on episodes (watchable_id);
create index if not exists watch_list_items_list_idx on watch_list_items (watch_list_id);
create index if not exists watch_list_items_watchable_idx on watch_list_items (watchable_id);
create index if not exists viewing_sessions_watchable_idx on viewing_sessions (watchable_id);
create index if not exists viewing_sessions_user_date_idx on viewing_sessions (user_id, date);

alter table watchables enable row level security;
alter table episodes enable row level security;
alter table watch_lists enable row level security;
alter table watch_list_items enable row level security;
alter table viewing_sessions enable row level security;
alter table watch_challenges enable row level security;

create policy "watchables_owner" on watchables for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "episodes_owner" on episodes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "watch_lists_owner" on watch_lists for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "watch_list_items_owner" on watch_list_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "viewing_sessions_owner" on viewing_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "watch_challenges_owner" on watch_challenges for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
