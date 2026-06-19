-- Phase 1: role-aware RLS for the Grandparents Circle feature.
-- Goal: an authenticated grandparent can READ everything (unchanged) and write
-- reactions, but cannot touch the points economy or author content.
-- Design is fail-safe: writes are allowed for anyone whose app role is NOT
-- 'grandparent' (parents, and any null/unknown edge case), so existing parent
-- sessions are never locked out. Only an explicit grandparent is blocked.

-- Resolve the caller's app role from their JWT email. SECURITY DEFINER so it can
-- read profiles regardless of the caller's own row-level access.
create or replace function public.app_role() returns text
  language sql stable security definer set search_path = public as $$
  select role from public.profiles where email = (auth.jwt() ->> 'email') limit 1
$$;
grant execute on function public.app_role() to authenticated, anon;

-- profiles
alter policy profiles_insert on public.profiles
  with check (public.app_role() is distinct from 'grandparent');
alter policy profiles_update on public.profiles
  using (public.app_role() is distinct from 'grandparent')
  with check (public.app_role() is distinct from 'grandparent');
alter policy profiles_delete on public.profiles
  using (public.app_role() is distinct from 'grandparent');

-- point_events
alter policy point_events_insert on public.point_events
  with check (public.app_role() is distinct from 'grandparent');
alter policy point_events_update on public.point_events
  using (public.app_role() is distinct from 'grandparent')
  with check (public.app_role() is distinct from 'grandparent');
alter policy point_events_delete on public.point_events
  using (public.app_role() is distinct from 'grandparent');

-- assignments
alter policy assignments_insert on public.assignments
  with check (public.app_role() is distinct from 'grandparent');
alter policy assignments_update on public.assignments
  using (public.app_role() is distinct from 'grandparent')
  with check (public.app_role() is distinct from 'grandparent');
alter policy assignments_delete on public.assignments
  using (public.app_role() is distinct from 'grandparent');

-- missions
alter policy missions_insert on public.missions
  with check (public.app_role() is distinct from 'grandparent');
alter policy missions_update on public.missions
  using (public.app_role() is distinct from 'grandparent')
  with check (public.app_role() is distinct from 'grandparent');
alter policy missions_delete on public.missions
  using (public.app_role() is distinct from 'grandparent');

-- rewards
alter policy rewards_insert on public.rewards
  with check (public.app_role() is distinct from 'grandparent');
alter policy rewards_update on public.rewards
  using (public.app_role() is distinct from 'grandparent')
  with check (public.app_role() is distinct from 'grandparent');
alter policy rewards_delete on public.rewards
  using (public.app_role() is distinct from 'grandparent');

-- reward_claims
alter policy reward_claims_insert on public.reward_claims
  with check (public.app_role() is distinct from 'grandparent');
alter policy reward_claims_update on public.reward_claims
  using (public.app_role() is distinct from 'grandparent')
  with check (public.app_role() is distinct from 'grandparent');
alter policy reward_claims_delete on public.reward_claims
  using (public.app_role() is distinct from 'grandparent');

-- feed_posts (grandparents react, they do not author posts in v1)
alter policy feed_posts_insert on public.feed_posts
  with check (public.app_role() is distinct from 'grandparent');
alter policy feed_posts_update on public.feed_posts
  using (public.app_role() is distinct from 'grandparent')
  with check (public.app_role() is distinct from 'grandparent');
alter policy feed_posts_delete on public.feed_posts
  using (public.app_role() is distinct from 'grandparent');

-- tahkirim
alter policy tahkirim_insert on public.tahkirim
  with check (public.app_role() is distinct from 'grandparent');
alter policy tahkirim_update on public.tahkirim
  using (public.app_role() is distinct from 'grandparent')
  with check (public.app_role() is distinct from 'grandparent');
alter policy tahkirim_delete on public.tahkirim
  using (public.app_role() is distinct from 'grandparent');
