-- feed_posts mirrors the tahkir fields (best_moment, funny_moment, quote, rating)
-- for inline display, but was missing would_repeat — so the tahkir→feed insert in
-- app/tazkir/new sent a non-existent column, failed, and was swallowed
-- (console.warn), leaving saved tahkirim absent from the feed. Add the column.
alter table public.feed_posts add column if not exists would_repeat boolean;
