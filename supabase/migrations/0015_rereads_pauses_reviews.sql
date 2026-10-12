-- Ad Astra — re-reads, pause history, written reviews.
--
-- books.readings : earlier completed readings of the same book (oldest first), each
--   a JSON snapshot {number, format, isbn, startedAt, completedAt, status, ratings, review, ...}.
--   The book row itself always holds the CURRENT (or latest) reading.
-- books.pauses   : pause periods of the current reading, [{from, to?}] as YYYY-MM-DD.
-- books.review   : written review for the current/latest reading.
-- reading_logs.reading_number : which reading of the book a log belongs to (1 = first).
-- Purely additive; nothing existing is changed except the Hardcover queue trigger,
-- which now also queues a book when its review changes.

alter table books
  add column if not exists readings jsonb not null default '[]'::jsonb,
  add column if not exists pauses jsonb not null default '[]'::jsonb,
  add column if not exists review text;

alter table reading_logs
  add column if not exists reading_number int not null default 1;

-- Books that are paused right now get an open pause that began after their last log
-- (or their start date), so the calendar timeline can show the break from today on.
update books b
set pauses = jsonb_build_array(jsonb_build_object(
  'from',
  to_char(
    coalesce(
      (select max(l.date::date) from reading_logs l where l.book_id = b.id),
      b.started_at::date,
      b.updated_at::date
    ),
    'YYYY-MM-DD'
  )
))
where b.read_status = 'paused' and b.pauses = '[]'::jsonb;

create or replace function hardcover_books_trg()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform hardcover_queue_book(new.id, new.user_id);
  elsif (old.read_status, old.rating, old.notes, old.review, old.started_at, old.completed_at, old.isbn)
        is distinct from
        (new.read_status, new.rating, new.notes, new.review, new.started_at, new.completed_at, new.isbn) then
    perform hardcover_queue_book(new.id, new.user_id);
  end if;
  return null;
end $$;
