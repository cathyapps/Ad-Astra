-- Ad Astra — Library, Bucket List, and Chart configs (Phase 6 redesign)
-- Mirrors src/types/library.ts, src/types/bucketList.ts, src/types/charts.ts.
-- A reading/learning/project goal or a trip is just a Star now (see
-- 0001_core_universe.sql + src/lib/starLifecycle.ts) — there's no
-- separate "reading challenge" or "trip" table anymore.

-- Library: every book you own, have read, or want to read.
create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  author text,
  series text,
  genre text,

  ownership text not null default 'tbd' check (ownership in ('own','library','tbd')),
  format text not null default 'tbd' check (format in ('kindle','audio','print','tbd')),
  read_status text not null default 'want_to_read'
    check (read_status in ('want_to_read','reading','read','dnf')),

  total_pages int,
  total_minutes int,
  rating numeric check (rating >= 1 and rating <= 5),
  notes text,
  tags text[] not null default '{}',
  related_star_ids uuid[] not null default '{}',

  started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists books_user_status_idx on books (user_id, read_status);

alter table books enable row level security;
create policy "books_owner" on books for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Reading Log: daily progress updates. A pure log — rating and status
-- live on the book itself, not per entry. "Pages read" for a given
-- entry is derived (see src/lib/readingStats.ts), not stored.
create table if not exists reading_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,

  date date not null default current_date,
  current_page int,
  current_time_minutes int,
  percent_complete numeric check (percent_complete >= 0 and percent_complete <= 100),
  minutes_spent_reading int,
  notes text,

  created_at timestamptz not null default now()
);

create index if not exists reading_logs_book_idx on reading_logs (book_id);
create index if not exists reading_logs_user_date_idx on reading_logs (user_id, date);

alter table reading_logs enable row level security;
create policy "reading_logs_owner" on reading_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bucket List: travel destinations / books / shows / movies. Travel
-- destinations are pure ideas (no other table covers them); book/show/
-- movie items can optionally link to a promoted Library book or
-- Watchable once you actually start tracking it richly there.
create table if not exists bucket_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  category text not null check (category in ('travel_destination','book','show','movie')),
  name text not null,
  notes text,
  status text not null default 'backlog' check (status in ('backlog','in_progress','completed')),
  tags text[] not null default '{}',
  related_star_ids uuid[] not null default '{}',

  book_id uuid references books(id) on delete set null,
  watchable_id uuid references watchables(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists bucket_list_items_user_category_idx on bucket_list_items (user_id, category, status);

alter table bucket_list_items enable row level security;
create policy "bucket_list_items_owner" on bucket_list_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Chart configs: the dynamic reading-metrics KPI builder. Each row is
-- one saved chart on a named view (default: 'default').
create table if not exists chart_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  view_name text not null default 'default',
  title text not null,
  chart_type text not null check (chart_type in ('bar','line','scatter','pie')),
  x_axis text not null,
  y_axis text not null,
  sort_index int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chart_configs_user_view_idx on chart_configs (user_id, view_name);

alter table chart_configs enable row level security;
create policy "chart_configs_owner" on chart_configs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
