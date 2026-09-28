-- Adds "paused" as a book read status, and converts books that were
-- tagged "paused" during the StoryGraph import into the real status.
alter table books drop constraint if exists books_read_status_check;
alter table books add constraint books_read_status_check
  check (read_status in ('want_to_read','reading','paused','read','dnf'));

update books
set read_status = 'paused',
    tags = array_remove(tags, 'paused')
where 'paused' = any(tags);
