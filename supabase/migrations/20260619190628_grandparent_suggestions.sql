-- Let grandparents SUGGEST missions and rewards, but a parent must approve before
-- a child sees them. Suggestions land as pending_approval = true, is_active = false
-- (so they're excluded by the kid-facing is_active = true filters). Parents approve
-- by flipping is_active true / pending_approval false (a non-grandparent UPDATE,
-- already allowed), or reject by deleting.

alter table public.missions add column if not exists pending_approval boolean not null default false;
alter table public.rewards  add column if not exists pending_approval boolean not null default false;
-- rewards had no author column; add it for attribution (missions already has created_by).
alter table public.rewards  add column if not exists created_by uuid references public.profiles(id);

-- Allow grandparent INSERTs, but only as a pending, inactive suggestion.
alter policy missions_insert on public.missions
  with check (
    public.app_role() is distinct from 'grandparent'
    or (pending_approval = true and is_active = false)
  );

alter policy rewards_insert on public.rewards
  with check (
    public.app_role() is distinct from 'grandparent'
    or (pending_approval = true and is_active = false)
  );
