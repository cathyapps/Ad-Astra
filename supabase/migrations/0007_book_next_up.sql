-- Ad Astra — Library "Next Up" manual override (Library build-out).
-- Lets a specific TBR book be pinned as a recommended "next read" instead
-- of always relying on the random pick from the TBR pool.

alter table books add column if not exists is_next_up boolean not null default false;

create index if not exists books_user_next_up_idx on books (user_id, is_next_up);
