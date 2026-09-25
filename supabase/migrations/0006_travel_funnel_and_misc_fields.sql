-- Ad Astra — Phase 9: travel funnel, tag rework, misc fields
--
-- 1. Bucket List: "book" is no longer a category (books to read live
--    entirely in the Library now). Travel destinations get their own
--    3-stage flow (bucket_list -> on_the_radar -> progressing_to_star)
--    instead of the generic backlog/in_progress/completed one used by
--    show/movie — both sets of values are allowed in the same `status`
--    column since which set applies depends on `category`.
-- 2. Constellations get an optional short_name for the Universe map.
-- 3. Tasks get is_goal — a top-level goal with no completion time of
--    its own (its sub-tasks carry the real time estimates).
-- 4. Watchables and bucket_list_items (show/movie) get streaming_source.

alter table bucket_list_items drop constraint if exists bucket_list_items_category_check;
alter table bucket_list_items
  add constraint bucket_list_items_category_check
  check (category in ('travel_destination','show','movie'));

alter table bucket_list_items drop constraint if exists bucket_list_items_status_check;
alter table bucket_list_items
  add constraint bucket_list_items_status_check
  check (status in ('backlog','in_progress','completed','bucket_list','on_the_radar','progressing_to_star'));

alter table bucket_list_items add column if not exists streaming_source text;

-- Any existing travel_destination rows were created under the old
-- generic backlog/in_progress/completed status set — remap them to
-- the new travel-specific stages so they render correctly.
update bucket_list_items set status = 'bucket_list' where category = 'travel_destination' and status = 'backlog';
update bucket_list_items set status = 'on_the_radar' where category = 'travel_destination' and status = 'in_progress';
update bucket_list_items set status = 'progressing_to_star' where category = 'travel_destination' and status = 'completed';

alter table watchables add column if not exists streaming_source text;

alter table constellations add column if not exists short_name text;

alter table tasks add column if not exists is_goal boolean not null default false;
