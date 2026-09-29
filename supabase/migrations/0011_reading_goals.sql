-- Ad Astra — yearly reading goals
-- Optional books-per-year and pages-per-year targets, shown at the top of
-- the Library > Metrics view. Null means "no goal set".

alter table app_settings
  add column if not exists reading_goal_books int check (reading_goal_books > 0),
  add column if not exists reading_goal_pages int check (reading_goal_pages > 0);
