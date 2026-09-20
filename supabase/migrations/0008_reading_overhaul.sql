-- Ad Astra — Reading overhaul: source (owned/library/other) separate from
-- format (physical/ebook/audiobook), total length for stats conversions,
-- and a reading-session log that stores one progress marker (current
-- page, audiobook position, or percent) rather than a manually-typed
-- page count. "Pages read this session" is derived — see
-- src/lib/readingStats.ts.

alter table books drop column if exists owned;
alter table books add column if not exists source text not null default 'owned'
  check (source in ('owned','library','other'));
alter table books add column if not exists total_pages int;
alter table books add column if not exists total_minutes int;

alter table reading_sessions drop column if exists pages;
alter table reading_sessions drop column if exists minutes;
alter table reading_sessions add column if not exists current_page int;
alter table reading_sessions add column if not exists current_time_minutes int;
alter table reading_sessions add column if not exists percent_complete numeric check (percent_complete between 0 and 100);
alter table reading_sessions add column if not exists minutes_spent_reading int;
