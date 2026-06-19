-- Phase 4: Family Memory Book = a curated flag on existing feed posts.
-- Saving is a parent action (feed_posts UPDATE is already gated to non-grandparents
-- by the grandparent_role_aware_rls migration), so this needs no new policy.
alter table public.feed_posts
  add column if not exists saved boolean default false,
  add column if not exists saved_at timestamptz;

create index if not exists feed_posts_saved_idx on public.feed_posts (saved) where saved;
