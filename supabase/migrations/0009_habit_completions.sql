-- Ad Astra — habit check-offs
-- A habit Planet/Moon (task_type = 'habit') is never "done"; instead each
-- time it's checked off on the Dashboard the local calendar date
-- (YYYY-MM-DD) is appended here. Daily habits count today's entries,
-- weekly/monthly habits count entries inside the current week/month and
-- compare against habit_frequency_count. Duplicate dates are allowed so a
-- "3x/week" habit can be done more than once in a day.
-- Existing rows just get an empty list.

alter table tasks
  add column if not exists habit_completions text[] not null default '{}';
