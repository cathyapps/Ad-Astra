-- Ad Astra — Phase 3 (Reading) schema
-- Mirrors src/types/reading.ts. Run after 0001-0003.

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  author text,
  series text,
  genre text,
  format text check (format in ('physical','ebook','audiobook')),
  edition text,
  owned boolean not null default false,
  location text,
  status text not null default 'want_to_read'
    check (status in ('want_to_read','reading','read','dnf')),
  rating numeric check (rating between 1 and 5),
  notes text,

  related_star_ids uuid[] not null default '{}',
  related_constellation_ids uuid[] not null default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists book_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  type text not null default 'custom'
    check (type in ('custom','lifetime','series','author','challenge')),
  related_star_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists book_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_list_id uuid not null references book_lists(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  sort_index int not null default 0,
  created_at timestamptz not null default now(),
  unique (book_list_id, book_id)
);

create table if not exists reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  date date not null default current_date,
  pages int,
  minutes int,
  notes text,
  rating numeric check (rating between 1 and 5),
  completion_status text check (completion_status in ('in_progress','completed','dnf')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists reading_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  goal_type text not null check (goal_type in ('book_count','page_count')),
  target numeric not null,
  start_date date not null,
  end_date date not null,
  notes text,
  related_star_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists books_user_status_idx on books (user_id, status);
create index if not exists book_list_items_list_idx on book_list_items (book_list_id);
create index if not exists book_list_items_book_idx on book_list_items (book_id);
create index if not exists reading_sessions_book_idx on reading_sessions (book_id);
create index if not exists reading_sessions_user_date_idx on reading_sessions (user_id, date);

alter table books enable row level security;
alter table book_lists enable row level security;
alter table book_list_items enable row level security;
alter table reading_sessions enable row level security;
alter table reading_challenges enable row level security;

create policy "books_owner" on books for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "book_lists_owner" on book_lists for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "book_list_items_owner" on book_list_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reading_sessions_owner" on reading_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reading_challenges_owner" on reading_challenges for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
