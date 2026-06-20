-- Per-user notification category preferences. Empty {} = everything on; a
-- category is suppressed only when explicitly set to false (fail-open, so new
-- categories default on). The push send route filters recipients by this.
alter table public.profiles add column if not exists notif_prefs jsonb not null default '{}'::jsonb;
