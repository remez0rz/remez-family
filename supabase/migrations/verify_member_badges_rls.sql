-- Verification for 20260619000000_member_badges_write_rls.sql
-- Run AFTER applying the migration. Everything is wrapped in a rolled-back
-- transaction, so it leaves no data behind. Uses a real parent profile
-- (רונן) and the "כוכב מתחיל" badge.
--
-- Expected: app_role() returns 'parent', the INSERT succeeds (it was denied
-- before the policy existed), and the row is visible under the read policy.

begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"730941d8-b1f0-48de-845b-018b21ddf38b","role":"authenticated"}';

  -- 1) caller's role resolves correctly  -> expect: parent
  select public.app_role() as resolved_role;

  -- 2) the insert that checkAndAwardBadges() does now succeeds
  insert into public.member_badges (member_id, badge_id, awarded_at)
  values (
    '730941d8-b1f0-48de-845b-018b21ddf38b',
    '2c0c55ba-0973-48fc-aa7d-2d90503c40cb',
    now()
  );

  -- 3) the awarded row is visible under RLS
  select member_id, badge_id, awarded_at
  from public.member_badges
  where member_id = '730941d8-b1f0-48de-845b-018b21ddf38b';
rollback;
