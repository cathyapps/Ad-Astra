-- Ad Astra — permanent Hardcover sync + cover thumbnails.
--
-- 1. cover_original_url: where a cover came from, kept when the thumbnail is
--    re-saved into Supabase Storage (cover_url then points at the Storage copy).
-- 2. hardcover_sync: one row per book that needs (or has had) a push to
--    Hardcover. Database triggers queue a book whenever something Hardcover
--    cares about changes, so every way of editing data is covered, including
--    edits made straight in Supabase.
-- 3. covers: a public Storage bucket for resized cover thumbnails, writable
--    only inside your own folder.
-- Purely additive: nothing existing is changed or removed.

alter table books add column if not exists cover_original_url text;

create table if not exists hardcover_sync (
  book_id uuid primary key references books(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','synced','failed','needs_link')),
  attempts int not null default 0,
  last_error text,
  queued_at timestamptz not null default now(),
  synced_at timestamptz
);

alter table hardcover_sync enable row level security;
drop policy if exists "hardcover_sync_owner" on hardcover_sync;
create policy "hardcover_sync_owner" on hardcover_sync for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Queues (or re-queues) one book. The EXISTS guard matters: when a book is
-- deleted its reading logs cascade-delete and would otherwise try to queue a
-- book that no longer exists.
create or replace function hardcover_queue_book(p_book uuid, p_user uuid)
returns void language sql security definer set search_path = public as $$
  insert into hardcover_sync (book_id, user_id, status, attempts, last_error, queued_at)
  select p_book, p_user, 'pending', 0, null, now()
  where exists (select 1 from books where id = p_book)
  on conflict (book_id) do update
    set status = 'pending', attempts = 0, last_error = null, queued_at = now();
$$;

create or replace function hardcover_books_trg()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform hardcover_queue_book(new.id, new.user_id);
  elsif (old.read_status, old.rating, old.notes, old.started_at, old.completed_at, old.isbn)
        is distinct from
        (new.read_status, new.rating, new.notes, new.started_at, new.completed_at, new.isbn) then
    perform hardcover_queue_book(new.id, new.user_id);
  end if;
  return null;
end $$;

drop trigger if exists hardcover_books_sync on books;
create trigger hardcover_books_sync
  after insert or update on books
  for each row execute function hardcover_books_trg();

create or replace function hardcover_logs_trg()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform hardcover_queue_book(old.book_id, old.user_id);
  else
    perform hardcover_queue_book(new.book_id, new.user_id);
  end if;
  return null;
end $$;

drop trigger if exists hardcover_logs_sync on reading_logs;
create trigger hardcover_logs_sync
  after insert or update or delete on reading_logs
  for each row execute function hardcover_logs_trg();

-- Cover thumbnails.
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

drop policy if exists "covers_owner_select" on storage.objects;
drop policy if exists "covers_owner_insert" on storage.objects;
drop policy if exists "covers_owner_update" on storage.objects;
drop policy if exists "covers_owner_delete" on storage.objects;
create policy "covers_owner_select" on storage.objects for select to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "covers_owner_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "covers_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "covers_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
