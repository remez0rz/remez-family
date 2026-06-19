-- Family Memory Book is now opt-out: every moment is kept by default; the 🔖
-- toggle removes one. Backfill existing moments so the archive is complete.
alter table public.feed_posts alter column saved set default true;

update public.feed_posts
  set saved = true,
      saved_at = coalesce(saved_at, created_at)
  where saved is distinct from true;
