-- Phase 2: a comment/voice-note channel on feed posts.
-- This is the grandparents' primary way to participate (text, voice, video),
-- but it benefits everyone. Everything lives in the family feed (parent-visible)
-- so there is no private child<->grandparent channel.

create table if not exists public.feed_comments (
  id           uuid primary key default gen_random_uuid(),
  feed_post_id uuid not null references public.feed_posts(id) on delete cascade,
  author_id    uuid references public.profiles(id),
  kind         text not null default 'text',   -- 'text' | 'voice' | 'video' | 'sticker'
  body         text,                            -- text content, or sticker id
  media_url    text,                            -- for voice / video
  created_at   timestamptz default now()
);

create index if not exists feed_comments_post_idx on public.feed_comments (feed_post_id, created_at);

alter table public.feed_comments enable row level security;

-- Everyone in the family may read all comments (same as feed_posts).
create policy feed_comments_read on public.feed_comments
  for select using (true);

-- Any authenticated family member (incl. grandparents) may post, but only as
-- themselves — author_id must resolve to the caller's own profile.
create policy feed_comments_insert on public.feed_comments
  for insert with check (
    author_id = (select id from public.profiles where email = (auth.jwt() ->> 'email') limit 1)
  );

-- A member may edit only their own comment.
create policy feed_comments_update on public.feed_comments
  for update using (
    author_id = (select id from public.profiles where email = (auth.jwt() ->> 'email') limit 1)
  ) with check (
    author_id = (select id from public.profiles where email = (auth.jwt() ->> 'email') limit 1)
  );

-- The author may delete their own comment; parents may moderate any comment.
create policy feed_comments_delete on public.feed_comments
  for delete using (
    author_id = (select id from public.profiles where email = (auth.jwt() ->> 'email') limit 1)
    or public.app_role() = 'parent'
  );
