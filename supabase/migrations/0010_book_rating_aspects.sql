-- Ad Astra — book ratings in quarter-star steps, four aspects
-- 1. Ratings may now be any multiple of 0.25 from 0.25 to 5.
-- 2. Books get three new aspect ratings (plot, characters, writing) on the
--    same scale. The existing `rating` column becomes the "overall"
--    rating, so every current rating is already in the right place — no
--    data has to move.

alter table books drop constraint if exists books_rating_check;
alter table books
  add constraint books_rating_check
  check (rating >= 0.25 and rating <= 5 and rating * 4 = round(rating * 4));

alter table books
  add column if not exists rating_plot numeric
    check (rating_plot >= 0.25 and rating_plot <= 5 and rating_plot * 4 = round(rating_plot * 4)),
  add column if not exists rating_characters numeric
    check (rating_characters >= 0.25 and rating_characters <= 5 and rating_characters * 4 = round(rating_characters * 4)),
  add column if not exists rating_writing numeric
    check (rating_writing >= 0.25 and rating_writing <= 5 and rating_writing * 4 = round(rating_writing * 4));
