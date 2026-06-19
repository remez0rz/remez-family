-- Atomic, race-safe point mutation.
--
-- Replaces the client-side read-modify-write pattern (read total_points, add in
-- JS, write back) that was duplicated across 7 call sites. That pattern lost
-- updates under concurrency and could drift the denormalized total away from the
-- point_events ledger. This single function does the whole thing in one
-- transaction with a row-level lock, so concurrent awards serialize correctly.
--
-- p_points    : signed delta applied to profiles.total_points (floored at 0)
-- p_xp_delta  : signed delta applied to total_experience; defaults to p_points.
--               Pass 0 for spends (reward redemptions) that must not change XP/level.
-- p_log_event : when true, also writes the matching point_events ledger row.
--
-- Grandparents are blocked here too, mirroring the table RLS — SECURITY DEFINER
-- would otherwise bypass it.
create or replace function public.apply_points(
  p_member_id     uuid,
  p_points        integer,
  p_xp_delta      integer default null,
  p_reason        text    default null,
  p_assignment_id uuid    default null,
  p_log_event     boolean default true
)
returns table (total_points integer, total_experience integer, level integer, leveled_up boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_xp_delta integer := coalesce(p_xp_delta, p_points);
  v_old_level integer;
  v_total integer;
  v_xp integer;
  v_level integer;
begin
  if public.app_role() = 'grandparent' then
    raise exception 'grandparents cannot modify points';
  end if;

  select p.level into v_old_level from public.profiles p where p.id = p_member_id for update;
  if not found then
    raise exception 'profile % not found', p_member_id;
  end if;

  update public.profiles p
     set total_points     = greatest(coalesce(p.total_points, 0)     + p_points,   0),
         total_experience = greatest(coalesce(p.total_experience, 0) + v_xp_delta, 0)
   where p.id = p_member_id
   returning p.total_points, p.total_experience into v_total, v_xp;

  v_level := floor(v_xp / 500) + 1;
  update public.profiles p set level = v_level where p.id = p_member_id;

  if p_log_event then
    insert into public.point_events (member_id, points, reason, assignment_id)
    values (p_member_id, p_points, p_reason, p_assignment_id);
  end if;

  return query select v_total, v_xp, v_level, (v_level > coalesce(v_old_level, 1));
end;
$$;

grant execute on function public.apply_points(uuid, integer, integer, text, uuid, boolean) to authenticated;
