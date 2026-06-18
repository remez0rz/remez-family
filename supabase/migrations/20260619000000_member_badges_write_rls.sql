-- member_badges write policies
--
-- The table had RLS enabled with only a SELECT policy ("Family can read badges"),
-- so every client-side insert from checkAndAwardBadges() (app/lib/badges.js) was
-- silently denied by RLS: member_badges stayed empty while 21 active badge
-- definitions existed. These policies let the family award/manage badges, gated on
-- the role model introduced in grandparent_role_aware_rls — grandparents stay
-- read-only, parents and kids can write. Naming + gate mirror the existing
-- <table>_insert/_update/_delete policies on profiles, assignments, point_events, etc.

create policy "member_badges_insert"
  on public.member_badges
  for insert
  to authenticated
  with check (app_role() is distinct from 'grandparent');

create policy "member_badges_update"
  on public.member_badges
  for update
  to authenticated
  using (app_role() is distinct from 'grandparent')
  with check (app_role() is distinct from 'grandparent');

create policy "member_badges_delete"
  on public.member_badges
  for delete
  to authenticated
  using (app_role() is distinct from 'grandparent');
