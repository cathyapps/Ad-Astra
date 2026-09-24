-- Ad Astra — Planets & Moons: tags, type/frequency (Phase 7)
-- Adds freeform tags (for the suggestion engine) and a task type
-- (habit / recurring / one_off) with optional target frequency for
-- habits. Prerequisites reuse the existing `dependency_task_ids`
-- column — it was already there but never wired up to any UI.
-- Nothing here is backfilled or required — existing rows just get the
-- defaults below and behave exactly as before (task_type null == one_off).

alter table tasks
  add column if not exists tags text[] not null default '{}',
  add column if not exists task_type text
    check (task_type in ('habit','recurring','one_off')),
  add column if not exists habit_frequency_kind text
    check (habit_frequency_kind in ('daily','per_week','per_month')),
  add column if not exists habit_frequency_count int;

create index if not exists tasks_tags_idx on tasks using gin (tags);
