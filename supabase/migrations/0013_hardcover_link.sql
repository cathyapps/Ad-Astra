-- Ad Astra — link each book to its Hardcover counterpart.
-- hardcover_*_id: the matching ids on Hardcover, saved once a book has been
--   reviewed/linked so the permanent sync knows which Hardcover entry to
--   update. hardcover_reviewed_at: when the one-time Ad Astra vs Hardcover
--   comparison was finished for this book (so it isn't shown again).
-- Purely additive: nullable columns, nothing existing is touched.
alter table books
  add column if not exists hardcover_book_id int,
  add column if not exists hardcover_edition_id int,
  add column if not exists hardcover_user_book_id int,
  add column if not exists hardcover_reviewed_at timestamptz;
